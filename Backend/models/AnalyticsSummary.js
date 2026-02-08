const mongoose = require('mongoose');

const AnalyticsSummarySchema = new mongoose.Schema({
  generated_at: Date,
  count: Number,
  min: Number,
  max: Number,
  avg: Number
}, { collection: 'analytics_summary' });

module.exports = mongoose.model('AnalyticsSummary', AnalyticsSummarySchema);