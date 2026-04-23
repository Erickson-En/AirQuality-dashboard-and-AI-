# 🔄 HTTP Fallback System - Complete Setup Guide

## Overview

Your system now has **redundancy** for Arduino data when Railway HTTPS proxy fails:

```
Arduino GSM (HTTP) → Railway (HTTPS) → Render Backend
                  ↘ (if Railway fails)
                    Local HTTP Fallback → Backend
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start All Backend Services

**Windows:**
```bash
cd Backend
start-all.bat
```

This opens 3 terminal windows for:
1. Main Backend (port 5000)
2. HTTP Fallback Server (port 8080)
3. Railway Health Monitor

**Mac/Linux:**
```bash
cd Backend
# Terminal 1
node server.js

# Terminal 2
node http-fallback-server.js

# Terminal 3
node railway-monitor.js
```

### Step 2: Get Your Computer IP Address

**Windows:**
```powershell
ipconfig
```

Look for **IPv4 Address** under your WiFi adapter. Example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

### Step 3: Configure Arduino

Edit your Arduino sketch and update:

```cpp
const LOCAL_FALLBACK = "http://192.168.1.100:8080/api/sensor-data";
```

Replace `192.168.1.100` with your actual IP from Step 2.

### Step 4: Start Frontend

```bash
cd ..  # Back to root
npm start
```

Opens dashboard at `http://localhost:3000`

---

## 📊 Monitoring

### Health Check Endpoints

**Main Backend:**
```bash
curl http://localhost:5000/health
```

**Fallback Server:**
```bash
curl http://localhost:8080/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "http-fallback-server",
  "uptime": 234.5,
  "requestsReceived": 12,
  "requestsForwarded": 12
}
```

### Real-Time Monitor

When services are running, you'll see logs like:

**Backend:**
```
[12:34:56] 🚀 Server listening on port 5000
✅ MongoDB Connected
```

**Fallback Server:**
```
[12:34:57] 📨 Received from Arduino
   Location: Nairobi Lab | PM2.5: 35.2 µg/m³
   ✅ Forwarded to backend (Total: 5)
```

**Railway Monitor:**
```
✅ [12:34:58] Railway proxy is HEALTHY
   Status: Connected to Render backend via Railway
```

---

## 🎯 Arduino Data Flow Examples

### Scenario 1: Railway Working ✅

Arduino → Railway (HTTPS) → Render ✅

**Log Output:**
```
Arduino: Sending to Railway...
Fallback Server: ✓ Received and forwarded
Dashboard: Shows real-time data
```

### Scenario 2: Railway Down ❌

Arduino fails Railway → Falls back to local HTTP

**Log Output:**
```
Railway Monitor: 🚨 RAILWAY OFFLINE DETECTED
Arduino: Tries Railway... fails
Arduino: Falls back to local HTTP
Fallback Server: ✓ Received (local)
Backend: ✓ Stored in database
Dashboard: Shows real-time data
```

### Scenario 3: Both Working (Recommended)

Arduino tries Railway first → If Railway works, uses it
If Railway slow/unavailable → Falls back to local

---

## 🔧 Configuration Files

### 1. `http-fallback-server.js`
- Listens on `http://localhost:8080`
- Accepts HTTP POST from Arduino
- Validates JSON structure
- Forwards to main backend at `http://localhost:5000`
- Includes health check endpoint

**Key Features:**
- CORS enabled for Arduino
- Timeout protection (5 seconds)
- Error handling and logging
- Request counting

### 2. `railway-monitor.js`
- Checks Railway every 5 minutes (configurable)
- Alerts on consecutive failures
- Recommends fallback activation
- Tracks uptime and status history

**Configuration via env vars:**
```bash
RAILWAY_PROXY_URL=https://your-railway-url
CHECK_INTERVAL=300000  # milliseconds
```

### 3. `start-all.bat`
- Batch script for Windows
- Starts all 3 services in separate windows
- Validates Node.js installation
- Easy one-click startup

---

## 🌐 Arduino Implementation

### Full Example

```cpp
#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// TRY THESE IN ORDER
const char* RAILWAY_URL = "https://your-railway-url/api/sensor-data";
const char* FALLBACK_URL = "http://192.168.1.100:8080/api/sensor-data";

struct SensorData {
  float pm1, pm25, pm10;
  float co, co2, o3, no2;
  float temperature, humidity;
  int voc_index, nox_index;
};

SensorData sensor;

// Read your sensors here
void readSensors() {
  sensor.pm1 = readPM1();
  sensor.pm25 = readPM25();
  sensor.pm10 = readPM10();
  sensor.co = readCO();
  sensor.co2 = readCO2();
  sensor.temperature = readTemp();
  sensor.humidity = readHumidity();
  sensor.voc_index = readVOC();
  sensor.nox_index = readNOx();
}

// Send with automatic fallback
void sendData() {
  readSensors();
  
  // Build JSON
  DynamicJsonDocument doc(512);
  doc["location"] = "Nairobi";
  doc["metrics"]["pm1"] = sensor.pm1;
  doc["metrics"]["pm25"] = sensor.pm25;
  doc["metrics"]["pm10"] = sensor.pm10;
  doc["metrics"]["co"] = sensor.co;
  doc["metrics"]["co2"] = sensor.co2;
  doc["metrics"]["temperature"] = sensor.temperature;
  doc["metrics"]["humidity"] = sensor.humidity;
  doc["metrics"]["voc_index"] = sensor.voc_index;
  doc["metrics"]["nox_index"] = sensor.nox_index;
  
  String json;
  serializeJson(doc, json);
  
  Serial.println("[Sensor] Sending data...");
  
  // Try Railway first (HTTPS)
  if (tryEndpoint(RAILWAY_URL, json)) {
    Serial.println("✅ Sent via Railway");
    return;
  }
  
  Serial.println("⚠️  Railway failed, trying local fallback...");
  
  // Try local fallback (HTTP)
  if (tryEndpoint(FALLBACK_URL, json)) {
    Serial.println("✅ Sent via local fallback");
    return;
  }
  
  Serial.println("❌ Both endpoints failed!");
}

bool tryEndpoint(const char* url, const String& json) {
  HTTPClient http;
  http.setTimeout(15000);
  
  if (!http.begin(url)) {
    return false;
  }
  
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(json);
  http.end();
  
  return (code == 200 || code == 201);
}

void setup() {
  Serial.begin(115200);
}

void loop() {
  static unsigned long lastSend = 0;
  
  if (millis() - lastSend >= 30000) {  // Send every 30 seconds
    sendData();
    lastSend = millis();
  }
  
  delay(1000);
}
```

---

## ✅ Checklist

Before deploying Arduino:

- [ ] Backend services running (`node server.js`)
- [ ] Fallback server running (`node http-fallback-server.js`)
- [ ] Monitor running (`node railway-monitor.js`)
- [ ] Arduino configured with correct IP: `http://YOUR_IP:8080/api/sensor-data`
- [ ] Arduino sketch includes fallback logic
- [ ] Dashboard shows "Connected" in green
- [ ] Test data appearing in real-time on dashboard
- [ ] Serial monitor shows "✅ Sent via Railway" or "✅ Sent via local fallback"

---

## 🔍 Troubleshooting

### Arduino can't reach fallback server

**Check:**
1. Is fallback server running? (`node http-fallback-server.js`)
2. Is IP address correct? Run `ipconfig` again
3. Is Arduino on same WiFi network as computer?

**Solution:**
```
Windows Firewall:
  Settings → Firewall → Allow app through firewall
  Add Node.js and port 8080
```

### Backend says "unreachable"

**Check:**
1. Is main backend running? (`node server.js`)
2. Is MongoDB connected? (check terminal output)

**Solution:**
```bash
# Make sure .env has MONGO_URI
# Then restart:
node server.js
```

### Fallback server receives data but doesn't forward

**Check:**
1. Is main backend running on localhost:5000?
2. Check fallback server terminal for errors

**Solution:**
- Start backend first
- Then start fallback server
- Restart Arduino/resend data

### Dashboard shows "Disconnected"

**Check:**
1. Is backend running?
2. Is frontend running? (`npm start`)
3. Check browser console (F12) for errors

**Solution:**
- Refresh page (F5)
- Check Console tab for WebSocket errors
- Make sure backend URL is correct in [src/config/api.js](../src/config/api.js)

---

## 📈 Monitoring Dashboard

Once running, check:

1. **Backend Health:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Fallback Health:**
   ```bash
   curl http://localhost:8080/health
   ```

3. **Live Monitor:**
   ```bash
   node Backend/monitor_live.js
   ```

4. **Frontend Dashboard:**
   Open `http://localhost:3000` in browser

---

## 🚀 Production Deployment

When deploying:

1. **On Render:**
   - Deploy main backend
   - Set `MONGO_URI` in environment
   - Ensure Railway proxies traffic

2. **Arduino Configuration:**
   - Primary: `https://your-render-url/api/sensor-data` (via Railway)
   - Fallback: Can keep local IP for testing, or omit in production

3. **Monitoring:**
   - Keep `railway-monitor.js` running
   - Set up alerts if Railway fails
   - Have backup deployment plan

---

## 📞 Support

For issues:

1. Check logs in each terminal window
2. Review error messages
3. Test endpoints with `curl`:
   ```bash
   curl -X POST http://localhost:8080/health
   ```
4. Check browser console (F12)
5. Verify network connectivity (Arduino on same WiFi)

---

## Summary

✅ **With this setup:**
- Arduino has primary + fallback endpoints
- Automatic failover when Railway is down
- Real-time monitoring of proxy health
- Complete redundancy for your air quality data
- Easy restart with `start-all.bat`

🎯 **Next Steps:**
1. Run `start-all.bat` in Backend folder
2. Update Arduino IP address
3. Upload Arduino sketch
4. Monitor data flow in terminals + dashboard
5. Deploy when confident in local testing
