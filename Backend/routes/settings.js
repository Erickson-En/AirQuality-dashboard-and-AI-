// backend/routes/settings.js
const express = require('express');
const Setting = require('../models/settings');
const router = express.Router();

// Save user settings (thresholds)
router.post('/', async (req, res) => {
  const { userId, thresholds } = req.body;
  try {
    const updated = await Setting.findOneAndUpdate(
      { userId },
      { thresholds, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).send("Error saving settings");
  }
});

// Get user settings
router.get('/:userId', async (req, res) => {
  try {
    const settings = await Setting.findOne({ userId: req.params.userId });
    res.json(settings);
  } catch (err) {
    res.status(500).send("Error fetching settings");
  }
});

module.exports = router;
