// backend/models/alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  readingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reading' },
  metric: String,
  value: Number,
  threshold: Number,
  severity: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alert', alertSchema);
