# Backend Configuration for Arduino/GSM Sensor Data

## 🎯 Overview

Your backend is **already configured** to receive sensor data from Arduino/GSM! The endpoint `/api/sensor-data` is ready to accept POST requests with sensor readings.

## ✅ Current Backend Features

### 1. Data Reception Endpoint
- **URL**: `POST /api/sensor-data`
- **Format**: JSON
- **Authentication**: None (add if needed for security)

### 2. Real-time WebSocket Updates
- Broadcasts new readings to connected dashboard clients
- Event: `sensorData`

### 3. Alert System
- Automatically checks readings against thresholds
- Emits alerts via WebSocket
- Saves alerts to database

### 4. Data Storage
- All readings saved to MongoDB
- Historical data accessible via `/api/historical`
- Latest reading via `/api/sensor-data/latest`

## 🔧 Required Configuration Steps

### Step 1: Update Environment Variables

Create or update `.env` file in the `Backend` folder:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/airquality
# OR use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/airquality

# Server Port
PORT=5000

# History Limit (how many readings to keep in memory)
HISTORY_LIMIT=2000

# CORS Origins (add your deployed frontend URL)
# Modify in server.js if needed
```

### Step 2: Install Backend Dependencies

```bash
cd Backend
npm install
```

Required packages (should already be in package.json):
- express
- mongoose
- socket.io
- cors
- dotenv

### Step 3: Deploy Backend to Public Server

Your Arduino needs to reach the backend over the internet. Options:

#### Option A: Use ngrok (Testing)
```bash
# Install ngrok from https://ngrok.com
ngrok http 5000
```
This gives you a public URL like: `https://abc123.ngrok.io`

#### Option B: Deploy to Cloud (Production)

**Heroku:**
```bash
heroku create your-air-quality-api
git push heroku main
```

**DigitalOcean/AWS/Azure:**
1. Set up a VPS
2. Install Node.js and MongoDB
3. Clone your repo
4. Run with PM2:
```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

**Railway/Render:**
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically

### Step 4: Configure Firewall

If using your own server, open the port:

```bash
# Allow port 5000 (or your chosen port)
sudo ufw allow 5000
```

### Step 5: Update Arduino Code

In `arduino/air_quality_gsm.ino`, update line 22:

```cpp
const char* SERVER = "your-actual-domain.com";  // or IP address
const int PORT = 5000;  // or 80 for HTTP, 443 for HTTPS
```

## 🔒 Security Enhancements (Recommended)

### Add API Key Authentication

Update `server.js` to add authentication:

```javascript
// Add this middleware before the /api/sensor-data route
const API_KEY = process.env.API_KEY || "your-secret-key-change-this";

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Apply to sensor data endpoint
app.post("/api/sensor-data", authenticateApiKey, async (req, res) => {
  // ... existing code
});
```

Update Arduino code to include API key:

```cpp
// In sendDataToServer function, add header:
sendATCommand("AT+HTTPPARA=\"USERDATA\",\"x-api-key: your-secret-key\"", 2000);
```

### Enable HTTPS (Production)

Use a reverse proxy like Nginx with Let's Encrypt:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 📡 Testing the API

### Test with curl (from your computer)

```bash
curl -X POST http://localhost:5000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Test Site",
    "metrics": {
      "pm25": 35.5,
      "pm10": 82.3,
      "co": 4.2,
      "temperature": 25.5,
      "humidity": 60.2
    }
  }'
```

Expected response:
```json
{"success": true}
```

### Test with Postman

1. Open Postman
2. Create new POST request
3. URL: `http://your-server:5000/api/sensor-data`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "location": "Nairobi",
  "metrics": {
    "pm25": 45.2,
    "pm10": 95.8,
    "co": 3.5
  }
}
```
6. Send request

### Verify Data in Dashboard

1. Start your frontend: `cd .. && npm start`
2. Open browser: `http://localhost:3000`
3. Check if the test data appears
4. Watch for WebSocket updates in browser console

## 📊 Monitoring Backend

### Check Logs

```bash
# If using PM2
pm2 logs

# If running directly
node server.js
```

### MongoDB Data Verification

```bash
# Connect to MongoDB
mongosh

# Switch to database
use airquality

# View recent readings
db.readings.find().sort({timestamp: -1}).limit(5)

# Count total readings
db.readings.countDocuments()
```

## 🐛 Troubleshooting

### Arduino Can't Connect to Server

1. **Check server is running**: `curl http://your-server:5000/health`
2. **Verify port is open**: Use online port checker tools
3. **Check firewall**: Ensure port 5000 is allowed
4. **Test with public IP**: Use `curl http://YOUR_PUBLIC_IP:5000/health`

### Data Not Appearing in Dashboard

1. Check WebSocket connection in browser console
2. Verify MongoDB is running and connected
3. Check CORS settings in `server.js`
4. Look at backend console for errors

### High Latency

1. Reduce data sending frequency in Arduino (e.g., every 5 minutes)
2. Use a closer server region
3. Optimize GSM connection quality
4. Add data compression

## 📈 Scaling Considerations

### Multiple Arduino Devices

Your backend already handles multiple locations! Just set different location names in each Arduino:

```cpp
const char* LOCATION = "Site A";  // Device 1
const char* LOCATION = "Site B";  // Device 2
```

### Database Indexing

Add indexes for better performance:

```javascript
// In models/reading.js
readingSchema.index({ timestamp: -1 });
readingSchema.index({ location: 1, timestamp: -1 });
```

### Data Retention

Automatically delete old data:

```javascript
// Add to server.js
async function cleanOldData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Reading.deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
}

// Run daily
setInterval(cleanOldData, 24 * 60 * 60 * 1000);
```

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB secured with authentication
- [ ] Backend deployed to public server
- [ ] Port open and accessible
- [ ] HTTPS enabled (recommended)
- [ ] API key authentication added (recommended)
- [ ] Monitoring/logging set up
- [ ] Backup strategy for database
- [ ] CORS configured for your frontend domain
- [ ] Arduino code updated with production server URL

## 📞 Support Resources

- Arduino GSM Library: https://github.com/vshymanskyy/TinyGSM
- MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas
- Express.js docs: https://expressjs.com
- Socket.IO docs: https://socket.io/docs
