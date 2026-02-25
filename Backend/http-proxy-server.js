// HTTP to HTTPS Proxy for SIM800L
// Accepts HTTP from Arduino, forwards to HTTPS Render backend

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BACKEND_URL = 'https://backend-air-quality.onrender.com';

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'HTTP Proxy Running', 
    forwards_to: BACKEND_URL,
    note: 'SIM800L sends HTTP here, proxy forwards to HTTPS backend'
  });
});

// Proxy endpoint - forwards HTTP to HTTPS
app.post('/api/sensor-data', async (req, res) => {
  console.log('📥 Received from Arduino:', JSON.stringify(req.body));
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/sensor-data`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ Forwarded to backend successfully');
    res.json({ success: true, forwarded: true });
  } catch (error) {
    console.error('❌ Forward failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 HTTP Proxy running on port ${PORT}`);
  console.log(`   Forwards to: ${BACKEND_URL}`);
});
