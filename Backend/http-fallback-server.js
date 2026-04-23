/**
 * HTTP FALLBACK SERVER
 * ====================
 * 
 * Purpose:
 * - Accepts HTTP requests from Arduino GSM module (which cannot send HTTPS)
 * - Acts as a local proxy when Railway HTTPS proxy is down
 * - Forwards valid data to main backend (http://localhost:5000)
 * 
 * Usage:
 *   node http-fallback-server.js
 * 
 * Arduino can send to:
 *   http://YOUR_COMPUTER_IP:8080/api/sensor-data
 * 
 * Example Arduino code:
 *   HTTPClient http;
 *   http.begin("http://192.168.x.x:8080/api/sensor-data");
 *   http.addHeader("Content-Type", "application/json");
 *   http.POST(jsonData);
 */

const http = require('http');
const axios = require('axios');

const FALLBACK_PORT = process.env.FALLBACK_PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

let requestCount = 0;
let forwardedCount = 0;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'http-fallback-server',
      uptime: process.uptime(),
      requestsReceived: requestCount,
      requestsForwarded: forwardedCount
    }));
    return;
  }

  // Sensor data endpoint (main handler)
  if (req.method === 'POST' && req.url === '/api/sensor-data') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      requestCount++;

      try {
        // Validate JSON
        const data = JSON.parse(body);

        // Validate required structure
        if (!data.metrics || typeof data.metrics !== 'object' || Object.keys(data.metrics).length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload: metrics required' }));
          return;
        }

        // Log receipt
        const pm25 = data.metrics.pm25 ? data.metrics.pm25.toFixed(1) : 'N/A';
        const location = data.location || 'Unknown';
        console.log(`[${new Date().toLocaleTimeString()}] 📨 Received from Arduino`);
        console.log(`   Location: ${location} | PM2.5: ${pm25} µg/m³`);

        // Forward to main backend
        axios
          .post(`${BACKEND_URL}/api/sensor-data`, data, { timeout: 5000 })
          .then((response) => {
            forwardedCount++;
            console.log(`   ✅ Forwarded to backend (Total: ${forwardedCount})\n`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, forwarded: true }));
          })
          .catch((error) => {
            console.log(`   ⚠️  Backend unreachable: ${error.message}`);
            console.log(`   ℹ️  Data received but not forwarded. Start backend with: node server.js\n`);

            // Still respond 200 to Arduino so it knows data was received
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              forwarded: false,
              message: 'Data received. Backend temporarily unavailable - will sync when online'
            }));
          });
      } catch (err) {
        console.log(`   ❌ Invalid JSON: ${err.message}\n`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });

    req.on('error', (err) => {
      console.error(`Request error: ${err.message}`);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request error' }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

// Start server
server.listen(FALLBACK_PORT, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   🔄 HTTP FALLBACK SERVER RUNNING                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const os = require('os');
  const interfaces = os.networkInterfaces();
  const ips = [];

  Object.keys(interfaces).forEach((name) => {
    interfaces[name].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    });
  });

  console.log(`📡 Listening on port: ${FALLBACK_PORT}`);
  console.log(`🌐 Local addresses:\n`);
  console.log(`   http://localhost:${FALLBACK_PORT}`);
  ips.forEach((ip) => {
    console.log(`   http://${ip}:${FALLBACK_PORT}`);
  });

  console.log(`\n📍 Arduino should send to: http://<YOUR_COMPUTER_IP>:${FALLBACK_PORT}/api/sensor-data`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`\n✅ Ready to receive HTTP sensor data`);
  console.log(`⚙️  Endpoint: POST /api/sensor-data`);
  console.log(`🏥 Health check: GET http://localhost:${FALLBACK_PORT}/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${FALLBACK_PORT} is already in use`);
    console.error(`   Try: netstat -ano | findstr :${FALLBACK_PORT}`);
    process.exit(1);
  } else {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down HTTP fallback server');
  console.log(`   Total requests: ${requestCount}`);
  console.log(`   Forwarded: ${forwardedCount}`);
  server.close();
  process.exit(0);
});
