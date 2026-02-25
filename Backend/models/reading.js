// backend/models/reading.js
const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  location: String,
  metrics: {
    pm1: Number,      // PM1.0 particulate matter
    pm25: Number,
    pm10: Number,
    co: Number,
    co2: Number,      // CO2 from MH-Z19C sensor
    o3: Number,
    no2: Number,
    temperature: Number,
    humidity: Number,
    pressure: Number,
    light: Number,
    voc_index: Number,
    nox_index: Number,
  },
});

module.exports = mongoose.model('Reading', readingSchema);
