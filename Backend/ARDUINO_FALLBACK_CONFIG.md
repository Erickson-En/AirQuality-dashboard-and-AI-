/**
 * ARDUINO CONFIGURATION GUIDE
 * ===========================
 * 
 * This file shows how to configure your Arduino GSM sketch for:
 * 1. Primary endpoint (Railway HTTPS proxy)
 * 2. Fallback endpoint (Local HTTP server)
 * 
 * Copy and adapt the sendSensorData() function to your sketch.
 */

// ====================================================
//  CONFIGURATION
// ====================================================

// Primary endpoint via Railway (fallback to this when Railway is working)
const RAILWAY_PRIMARY = "https://render-backend.up.railway.app/api/sensor-data";

// Fallback local HTTP endpoint (when in same network as computer)
// Replace with your computer's IP address
const LOCAL_FALLBACK = "http://192.168.x.x:8080/api/sensor-data";

// Fallback 2: Direct Render (if Render supports HTTP - unlikely for production)
// const RENDER_FALLBACK = "https://your-render-url.onrender.com/api/sensor-data";

// ====================================================
//  ARDUINO SKETCH - SENSOR DATA SENDING
// ====================================================

/*
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <GPRS.h>  // or your GSM library

SoftwareSerial gsmSerial(RX_PIN, TX_PIN);

// Your sensor reading function
void readSensors(float& pm25, float& pm10, float& co, float& co2, float& temp, float& humidity) {
  // Read from your actual sensors here
  pm25 = readPM25Sensor();
  pm10 = readPM10Sensor();
  co = readCOSensor();
  co2 = readCO2Sensor();
  temp = readTemperatureSensor();
  humidity = readHumiditySensor();
}

// Main function to send data
void sendSensorData() {
  float pm1, pm25, pm10, co, co2, temp, humidity, voc, nox;
  
  // Read all sensors
  readSensors(pm25, pm10, co, co2, temp, humidity);
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["location"] = "Nairobi Lab";
  doc["metrics"]["pm1"] = pm1;
  doc["metrics"]["pm25"] = pm25;
  doc["metrics"]["pm10"] = pm10;
  doc["metrics"]["co"] = co;
  doc["metrics"]["co2"] = co2;
  doc["metrics"]["temperature"] = temp;
  doc["metrics"]["humidity"] = humidity;
  doc["metrics"]["voc_index"] = voc;
  doc["metrics"]["nox_index"] = nox;
  
  String payload;
  serializeJson(doc, payload);
  
  // Try endpoints in order
  Serial.println("Sending sensor data...");
  
  // Try 1: Railway (HTTPS) - Primary
  if (tryEndpoint(RAILWAY_PRIMARY, payload)) {
    Serial.println("✅ Data sent via Railway");
    return;
  }
  
  Serial.println("⚠️  Railway failed, trying local fallback...");
  
  // Try 2: Local HTTP Fallback - When on same network as computer
  if (tryEndpoint(LOCAL_FALLBACK, payload)) {
    Serial.println("✅ Data sent via local fallback");
    return;
  }
  
  Serial.println("❌ All endpoints failed. Will retry next cycle.");
}

// Helper function to send to endpoint
bool tryEndpoint(const char* url, const String& payload) {
  HTTPClient http;
  
  // Set timeout
  http.setTimeout(15000);
  
  // Begin connection
  if (!http.begin(url)) {
    Serial.println("Connection failed");
    return false;
  }
  
  // Add headers
  http.addHeader("Content-Type", "application/json");
  
  // Send POST request
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.print("✅ HTTP ");
    Serial.println(httpResponseCode);
    http.end();
    return true;
  } else {
    Serial.print("❌ HTTP ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

// Call this in your main loop
void loop() {
  unsigned long now = millis();
  static unsigned long lastSend = 0;
  
  // Send data every 30 seconds
  if (now - lastSend >= 30000) {
    sendSensorData();
    lastSend = now;
  }
  
  // Rest of your loop code...
}
*/

// ====================================================
//  CONFIGURATION STEPS
// ====================================================

/*

Step 1: Get your computer's IP address
  (Windows Terminal):
  ipconfig
  
  Look for IPv4 Address under your WiFi adapter
  Example: 192.168.1.100

Step 2: Update LOCAL_FALLBACK in Arduino sketch:
  const LOCAL_FALLBACK = "http://192.168.1.100:8080/api/sensor-data";

Step 3: Upload sketch to Arduino

Step 4: Start services on computer:

  Terminal 1 - Backend:
  cd Backend
  node server.js

  Terminal 2 - Fallback server:
  node http-fallback-server.js

  Terminal 3 - Health monitor:
  node railway-monitor.js

Step 5: Open Serial Monitor to see Arduino logs
  - Look for "✅ Data sent via Railway" or "✅ Data sent via local fallback"
  - If both fail, debug connection with dashboard

Step 6: Check dashboard
  - http://localhost:3000
  - Real-time data should appear
  - "Connected" indicator should be green

*/

// ====================================================
//  TROUBLESHOOTING
// ====================================================

/*

Issue: Arduino can't reach Railway
  → Check Network: Arduino connected to mobile data? Railway URL correct?
  → Solution: Use "Local fallback" when testing on same WiFi as computer

Issue: Arduino can't reach local fallback
  → Check IP: Is 192.168.x.x correct? Run 'ipconfig' on computer
  → Check Firewall: Windows Firewall blocking port 8080?
  → Solution: Disable firewall temporarily or add rule for port 8080

Issue: Fallback server says "Backend unreachable"
  → Check: Is 'node server.js' running? (Terminal 1)
  → Solution: Start backend first, then fallback server

Issue: Dashboard shows "Disconnected"
  → Check: Is frontend running? (npm start)
  → Check: Is backend running? (node server.js)
  → Check: Browser console for errors (F12)

Issue: Data arrives but not real-time on dashboard
  → Check: Socket.IO connection in browser console
  → Solution: Refresh dashboard page
  → Check: WebSocket in DevTools Network tab

*/

console.log('Arduino configuration guide loaded');
