// backend/models/reading.js
const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  location: String,
  metrics: {
    pm25: Number,
    pm10: Number,
    co: Number,
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
