// HTTP to HTTPS Proxy for SIM800L
// Accepts HTTP from Arduino, forwards to HTTPS Render backend

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Backend URL from environment variable or default
const BACKEND_URL = process.env.TARGET_URL || 
                   process.env.BACKEND_URL || 
                   'https://backend-air-quality-production.up.railway.app';

console.log('🎯 Target backend:', BACKEND_URL);

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
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] Received from Arduino:`);
  console.log(JSON.stringify(req.body, null, 2));
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/sensor-data`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000  // 30s - handles Railway free tier cold starts
    });
    
    console.log(`✅ [${timestamp}] Forwarded successfully. Backend response:`, response.status);
    res.json({ success: true, forwarded: true, backendStatus: response.status });
  } catch (error) {
    console.error(`❌ [${timestamp}] Forward failed:`, error.message);
    if (error.response) {
      console.error(`   Backend returned: ${error.response.status} - ${error.response.statusText}`);
      res.status(error.response.status).json({ 
        success: false, 
        error: error.message,
        backendStatus: error.response.status
      });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Catch-all for debugging
app.all('*', (req, res) => {
  console.log(`⚠️  Unhandled ${req.method} request to: ${req.path}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: ['POST /api/sensor-data', 'GET /'],
    yourRequest: `${req.method} ${req.path}`
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 HTTP to HTTPS Proxy Server Running');
  console.log('='.repeat(60));
  console.log(`📍 Listening on port: ${PORT}`);
  console.log(`🎯 Forwarding to: ${BACKEND_URL}`);
  console.log(`💡 Use this URL in Arduino: http://[your-proxy-url]/api/sensor-data`);
  console.log('='.repeat(60) + '\n');
});
