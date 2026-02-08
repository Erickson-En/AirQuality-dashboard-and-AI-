const mongoose = require('mongoose');

const AnalyticsAnomalySchema = new mongoose.Schema({
  detected_at: Date,
  value: Number,
  zscore: Number,
  mean: Number,
  std: Number,
  sensor: String,
  raw_id: mongoose.Schema.Types.ObjectId
}, { collection: 'analytics_anomalies' });

module.exports = mongoose.model('AnalyticsAnomaly', AnalyticsAnomalySchema);