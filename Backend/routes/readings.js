// backend/routes/readings.js
const express = require('express');
const Reading = require('../models/reading');
const router = express.Router();

// Get historical readings by timeframe (24h, 7d, 30d)
router.get('/', async (req, res) => {
  try {
    const { timeframe } = req.query; // e.g., 24h, 7d, 30d
    let startDate = new Date();
    if (timeframe === '24h') startDate.setHours(startDate.getHours() - 24);
    else if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);

    const readings = await Reading.find({ timestamp: { $gte: startDate } }).sort({ timestamp: 1 });
    res.json(readings);
  } catch (err) {
    res.status(500).send("Error fetching data");
  }
});

module.exports = router;
