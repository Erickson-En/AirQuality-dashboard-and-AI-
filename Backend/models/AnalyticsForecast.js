const mongoose = require('mongoose');

const AnalyticsForecastSchema = new mongoose.Schema({
  generated_at: Date,
  horizon: Number,
  points: [{ step: Number, forecast_value: Number }]
}, { collection: 'analytics_forecast' });

module.exports = mongoose.model('AnalyticsForecast', AnalyticsForecastSchema);