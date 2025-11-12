// backend/models/settings.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: String,
  thresholds: {
    pm25: Number,
    pm10: Number,
    co: Number,
    o3: Number,
    no2: Number,
    temperature: Number,
    humidity: Number,
    pressure: Number,
    light: Number,
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Setting', settingsSchema);
