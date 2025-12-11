const express = require('express');
const Anomaly = require('../models/AnalyticsAnomaly');
const Summary = require('../models/AnalyticsSummary');
const Forecast = require('../models/AnalyticsForecast');
const Reading = require('../models/reading');

const router = express.Router();

router.get('/anomalies', async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const docs = await Anomaly.find().sort({ detected_at: -1 }).limit(limit).lean();
  res.json(docs);
});

router.get('/summary/latest', async (req, res) => {
  const doc = await Summary.findOne().sort({ generated_at: -1 }).lean();
  res.json(doc || {});
});

router.get('/forecast/latest', async (req, res) => {
  const doc = await Forecast.findOne().sort({ generated_at: -1 }).lean();
  res.json(doc || {});
});

// Get all summaries
router.get('/summary/all', async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const docs = await Summary.find().sort({ generated_at: -1 }).limit(limit).lean();
  res.json(docs);
});

// Get all forecasts
router.get('/forecast/all', async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const docs = await Forecast.find().sort({ generated_at: -1 }).limit(limit).lean();
  res.json(docs);
});

// Real-time AI health score
router.get('/health-score', async (req, res) => {
  try {
    const latest = await Reading.findOne().sort({ timestamp: -1 }).lean();
    if (!latest) return res.json({ score: 0, status: 'No data' });
    
    const metrics = latest.metrics || {};
    const thresholds = { pm25: 35, pm10: 150, co: 9, o3: 100, no2: 100 };
    
    let score = 100;
    let violations = [];
    
    Object.keys(thresholds).forEach(key => {
      const value = metrics[key] || 0;
      const threshold = thresholds[key];
      if (value > threshold) {
        const penalty = Math.min(30, ((value - threshold) / threshold) * 20);
        score -= penalty;
        violations.push({ metric: key, value, threshold, exceeded: (value - threshold).toFixed(2) });
      }
    });
    
    score = Math.max(0, Math.round(score));
    const status = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : score >= 20 ? 'Poor' : 'Hazardous';
    
    res.json({ score, status, violations, timestamp: latest.timestamp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Correlation analysis
router.get('/correlations', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    let startDate = new Date();
    if (timeframe === '24h') startDate.setHours(startDate.getHours() - 24);
    else if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
    
    const readings = await Reading.find({ timestamp: { $gte: startDate } }).lean();
    
    const metrics = ['pm25', 'pm10', 'co', 'o3', 'no2'];
    const correlations = {};
    
    // Calculate Pearson correlation
    const pearson = (x, y) => {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      return denominator === 0 ? 0 : numerator / denominator;
    };
    
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const m1 = metrics[i];
        const m2 = metrics[j];
        const vals1 = readings.map(r => Number(r.metrics[m1] || 0));
        const vals2 = readings.map(r => Number(r.metrics[m2] || 0));
        const corr = pearson(vals1, vals2);
        correlations[`${m1}-${m2}`] = Number(corr.toFixed(3));
      }
    }
    
    res.json(correlations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trend analysis
router.get('/trends', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    let startDate = new Date();
    if (timeframe === '24h') startDate.setHours(startDate.getHours() - 24);
    else if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
    
    const readings = await Reading.find({ timestamp: { $gte: startDate } }).sort({ timestamp: 1 }).lean();
    
    const metrics = ['pm25', 'pm10', 'co', 'o3', 'no2'];
    const trends = {};
    
    metrics.forEach(metric => {
      const vals = readings.map(r => Number(r.metrics[metric] || 0)).filter(v => v > 0);
      if (vals.length > 1) {
        const n = vals.length;
        const sumX = vals.reduce((s, v, i) => s + i, 0);
        const sumY = vals.reduce((s, v) => s + v, 0);
        const sumXY = vals.reduce((s, v, i) => s + i * v, 0);
        const sumX2 = vals.reduce((s, v, i) => s + i * i, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const avg = sumY / n;
        const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
        const changePercent = ((slope / avg) * 100).toFixed(2);
        
        trends[metric] = {
          slope: slope.toFixed(4),
          direction,
          changePercent,
          current: vals[vals.length - 1].toFixed(2),
          average: avg.toFixed(2)
        };
      }
    });
    
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;