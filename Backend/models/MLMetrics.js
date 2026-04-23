const mongoose = require('mongoose');

const MLMetricsSchema = new mongoose.Schema({
  model_name: String,
  model_type: String, // 'anomaly_detection', 'forecasting', 'summary'
  accuracy: Number, // 0-1 or 0-100
  precision: Number,
  recall: Number,
  f1_score: Number,
  mae: Number, // Mean Absolute Error (for regression)
  rmse: Number, // Root Mean Squared Error
  confusion_matrix: {
    true_positives: Number,
    true_negatives: Number,
    false_positives: Number,
    false_negatives: Number
  },
  training_samples: Number,
  test_samples: Number,
  last_trained: Date,
  status: { type: String, default: 'active' }, // 'active', 'training', 'failed'
  performance_trend: [Number], // rolling accuracy scores
  data_quality_score: Number, // 0-100
  request_count: { type: Number, default: 0 },
  error_count: { type: Number, default: 0 },
  avg_inference_time: Number, // ms
  last_updated: { type: Date, default: Date.now }
}, { collection: 'ml_metrics' });

module.exports = mongoose.model('MLMetrics', MLMetricsSchema);
