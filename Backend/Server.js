const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// MongoDB connection setupcd 
mongoose.connect(process.env.MONGO_URI,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB Connected');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

// Models
const Reading = require('./models/reading');
const Alert = require('./models/alert');
const Setting = require('./models/settings');

// App Setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// ---------------- API Routes ----------------

// POST sensor data to backend and store in DB
app.post('/api/sensor-data', async (req, res) => {
  try {
    const data = req.body;
    const newReading = new Reading({
      location: data.location,
      metrics: data.metrics,
    });
    await newReading.save();
    io.emit('sensorData', newReading); // Emit new data to frontend
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Error saving data');
  }
});

// Get historical readings based on timeframe
app.get('/api/historical', async (req, res) => {
  const { timeframe } = req.query; // e.g., 24h, 7d
  let startDate = new Date();
  if (timeframe === '24h') startDate.setHours(startDate.getHours() - 24);
  else if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
  else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);

  try {
    const readings = await Reading.find({ timestamp: { $gte: startDate } }).sort({ timestamp: 1 });
    res.json(readings);
  } catch (err) {
    res.status(500).send('Error fetching data');
  }
});

// Save user settings (thresholds for alerts)
app.post('/api/settings', async (req, res) => {
  const { userId, thresholds } = req.body;
  try {
    const updatedSettings = await Setting.findOneAndUpdate(
      { userId },
      { thresholds, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(updatedSettings);
  } catch (err) {
    res.status(500).send('Error saving settings');
  }
});

// Get user settings
app.get('/api/settings/:userId', async (req, res) => {
  try {
    const settings = await Setting.findOne({ userId: req.params.userId });
    res.json(settings);
  } catch (err) {
    res.status(500).send('Error fetching settings');
  }
});

// ---------------- WebSocket for Real-Time Data ----------------
io.on('connection', (socket) => {
  console.log('Frontend connected via WebSocket');
  
  socket.on('disconnect', () => {
    console.log('Frontend disconnected');
  });
});

// ---------------- Simulate Sensor Data ----------------
setInterval(async () => {
  const newReading = new Reading({
    location: 'Nairobi',
    metrics: {
      pm25: faker.number.int({ min: 5, max: 150 }),
      pm10: faker.number.int({ min: 10, max: 200 }),
      co: faker.number.int({ min: 0, max: 15 }),
      o3: faker.number.int({ min: 0, max: 120 }),
      no2: faker.number.int({ min: 0, max: 100 }),
      temperature: faker.number.int({ min: 18, max: 35 }),
      humidity: faker.number.int({ min: 20, max: 90 }),
      pressure: faker.number.int({ min: 980, max: 1050 }),
      light: faker.number.int({ min: 50, max: 1000 }),
    },
  });

  await newReading.save();
  io.emit('sensorData', newReading);

  // Check thresholds and create alerts if necessary
  const thresholds = { pm25: 150, pm10: 150, co: 10, o3: 100, no2: 100 }; // Default thresholds for demo
  for (const metric of Object.keys(thresholds)) {
    if (newReading.metrics[metric] > thresholds[metric]) {
      const newAlert = new Alert({
        readingId: newReading._id,
        metric,
        value: newReading.metrics[metric],
        threshold: thresholds[metric],
        severity: 'unhealthy',
      });
      await newAlert.save();
      io.emit('alert', newAlert); // Emit alert to frontend
    }
  }

  console.log('New sensor data emitted:', newReading);
}, 5000);

// ---------------- Start the Server ----------------
server.listen(5000, () => {
  console.log('Backend server running on port 5000');
});
