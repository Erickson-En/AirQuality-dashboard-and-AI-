const express = require('express');
const app = express();
const analyticsRouter = require('./routes/analytics');
app.use('/api/analytics', analyticsRouter);

module.exports = app;