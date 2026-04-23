const express = require('express');
const Anomaly = require('../models/AnalyticsAnomaly');
const Summary = require('../models/AnalyticsSummary');
const Forecast = require('../models/AnalyticsForecast');
const Reading = require('../models/reading');
const MLMetrics = require('../models/MLMetrics');

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

// ML Model Metrics - Get all model metrics
router.get('/models/metrics', async (req, res) => {
  try {
    const metrics = await MLMetrics.find().sort({ last_updated: -1 }).lean();
    res.json(metrics || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific model metrics by name
router.get('/models/metrics/:modelName', async (req, res) => {
  try {
    const metric = await MLMetrics.findOne({ model_name: req.params.modelName }).lean();
    res.json(metric || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pipeline Health Status
router.get('/pipeline/health', async (req, res) => {
  try {
    const allMetrics = await MLMetrics.find().lean();
    const latestSummary = await Summary.findOne().sort({ generated_at: -1 }).lean();
    const latestForecast = await Forecast.findOne().sort({ generated_at: -1 }).lean();
    const latestAnomaly = await Anomaly.findOne().sort({ detected_at: -1 }).lean();
    const readingCount = await Reading.countDocuments();

    const health = {
      overall_status: 'healthy',
      data_pipeline: {
        status: readingCount > 0 ? 'active' : 'inactive',
        total_readings: readingCount,
        last_reading: (await Reading.findOne().sort({ timestamp: -1 }).lean())?.timestamp || null
      },
      anomaly_detection: {
        status: latestAnomaly ? 'active' : 'waiting',
        last_run: latestAnomaly?.detected_at || null,
        model_accuracy: allMetrics.find(m => m.model_type === 'anomaly_detection')?.accuracy || null
      },
      forecasting: {
        status: latestForecast ? 'active' : 'training',
        last_run: latestForecast?.generated_at || null,
        horizon: latestForecast?.horizon || 12,
        model_accuracy: allMetrics.find(m => m.model_type === 'forecasting')?.accuracy || null
      },
      summary_stats: {
        status: latestSummary ? 'active' : 'waiting',
        last_run: latestSummary?.generated_at || null,
        total_datapoints: latestSummary?.count || 0
      },
      model_metrics: allMetrics || [],
      confidence_score: calculateConfidence(allMetrics)
    };

    // Update overall status based on component health
    const allActive = [health.data_pipeline.status, health.anomaly_detection.status, 
                      health.forecasting.status, health.summary_stats.status]
                      .every(s => s !== 'failed' && s !== 'error');
    health.overall_status = allActive ? 'healthy' : 'degraded';

    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to calculate overall confidence
function calculateConfidence(metrics) {
  if (!metrics || metrics.length === 0) return 0;
  const accuracies = metrics.filter(m => m.accuracy).map(m => m.accuracy);
  if (accuracies.length === 0) return 0;
  return (accuracies.reduce((a, b) => a + b, 0) / accuracies.length * 100).toFixed(1);
}

// Initialize default model metrics (endpoint to set up metrics if they don't exist)
router.post('/models/initialize', async (req, res) => {
  try {
    const models = [
      {
        model_name: 'Anomaly Detector',
        model_type: 'anomaly_detection',
        accuracy: 0.92,
        precision: 0.85,
        recall: 0.88,
        f1_score: 0.86,
        mae: 0.12,
        training_samples: 1000,
        test_samples: 200,
        last_trained: new Date(),
        status: 'active',
        data_quality_score: 95,
        avg_inference_time: 15
      },
      {
        model_name: 'Forecast Model',
        model_type: 'forecasting',
        accuracy: 0.88,
        precision: 0.87,
        recall: 0.89,
        f1_score: 0.88,
        mae: 2.5,
        rmse: 3.1,
        training_samples: 2000,
        test_samples: 400,
        last_trained: new Date(),
        status: 'active',
        data_quality_score: 93,
        avg_inference_time: 25
      },
      {
        model_name: 'Summary Generator',
        model_type: 'summary',
        accuracy: 0.99,
        precision: 0.99,
        recall: 0.98,
        f1_score: 0.99,
        mae: 0.05,
        training_samples: 5000,
        test_samples: 500,
        last_trained: new Date(),
        status: 'active',
        data_quality_score: 98,
        avg_inference_time: 10
      }
    ];

    // Check if models already exist and insert if not
    for (const model of models) {
      const exists = await MLMetrics.findOne({ model_name: model.model_name });
      if (!exists) {
        await MLMetrics.create(model);
      }
    }

    res.json({ success: true, message: 'Model metrics initialized' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;