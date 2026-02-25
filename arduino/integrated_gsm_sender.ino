/*
 * AIR QUALITY SENSOR WITH GSM - INTEGRATED VERSION
 * =================================================
 * Your existing code + GSM data transmission to backend
 * 
 * Hardware:
 * - Arduino (your current setup)
 * - PMS5003, DHT11, MQ-7, SGP41, RTC, Display (already connected)
 * - SIM800L on Serial1 (you already have this defined)
 * 
 * Backend: Sends data to your deployed backend every 60 seconds
 */

#include <Arduino.h>
#include <U8g2lib.h>
#include "DHT.h"
#include "RTClib.h"
#include <Wire.h>
#include <SensirionI2CSgp41.h>
#include <VOCGasIndexAlgorithm.h>
#include <NOxGasIndexAlgorithm.h>

// ----------------------
// Pin definitions
// ----------------------
#define DHTPIN 7
#define DHTTYPE DHT11
#define MQ7_PIN A0

#define SIM800L_SERIAL Serial1
const long GSM_BAUD = 9600;

// ----------------------
// GSM CONFIGURATION - UPDATE THESE!
// ----------------------
// APN for your carrier (Kenya):
// Safaricom: "safaricom" or "internet" 
// Airtel: "internet" or "airtelgprs.com"
const char* APN = "safaricom";  

// -------------------------------------------------------
// RAILWAY TCP PROXY SETUP:
// Your Railway public domain (backend-air-quality-production.up.railway.app)
// forces HTTPS which SIM800L can't handle.
//
// Your TCP proxy bypasses this. To get the correct values:
// 1. Go to railway.app → your backend service → Settings → Networking
// 2. Under "TCP Proxy" section, copy the EXTERNAL hostname and port
//    It looks like:  roundhouse.proxy.rlwy.net   and port e.g. 34521
//    (NOT the internal .railway.internal address)
// 3. Also make sure the TCP proxy target port is set to 8080
//    (Your app runs on PORT 8080 - check Railway service settings)
// -------------------------------------------------------
const char* BACKEND_URL = "yamanote.proxy.rlwy.net"; // Railway TCP proxy hostname
const int   BACKEND_PORT = 45265;                     // Railway TCP proxy external port
const char* BACKEND_PATH = "/api/sensor-data";

// Plain HTTP via Railway TCP Proxy (bypasses Railway's HTTPS enforcement)
const char* PROTOCOL = "http://";

// Send interval (milliseconds)
const unsigned long SEND_INTERVAL = 300000;  // Send data every 5 minutes (was 60s - reduced to prevent Railway log flooding)
unsigned long lastSendTime = 0;
bool gsmReady = false;

// ----------------------
// Devices & Algorithms
// ----------------------
DHT dht(DHTPIN, DHTTYPE);
RTC_DS3231 rtc;
U8G2_ST7920_128X64_F_SW_SPI u8g2(U8G2_R0, 13, 11, 10, 8);

SensirionI2CSgp41 sgp41;
VOCGasIndexAlgorithm voc_helper;
NOxGasIndexAlgorithm nox_helper;

// ----------------------
// Variables
// ----------------------
int page = 0;
unsigned long lastSwitchTime = 0;
const unsigned long pageInterval = 4000; 

uint16_t pm1_0 = 0, pm2_5 = 0, pm10 = 0;
int32_t voc_index = 0, nox_index = 0;
uint16_t conditioning_s = 10; 

float humidity = 0;
float temperature = 0;
float CO_ppm = 0;

// ----------------------
// Read PMS5003
// ----------------------
bool readPMS5003() {
  if (Serial2.available() < 32) return false;
  uint8_t data[32];
  Serial2.readBytes(data, 32);
  if (data[0] != 0x42 || data[1] != 0x4D) return false;
  
  pm1_0 = (data[10] << 8) | data[11];
  pm2_5 = (data[12] << 8) | data[13];
  pm10  = (data[14] << 8) | data[15];
  return true;
}

// ----------------------
// GSM Functions
// ----------------------
bool sendATCommand(const char* cmd, const char* expectedResponse, unsigned long timeout) {
  Serial.print(F("GSM CMD: "));
  Serial.println(cmd);
  
  SIM800L_SERIAL.println(cmd);
  
  String response = "";
  unsigned long startTime = millis();
  
  while (millis() - startTime < timeout) {
    while (SIM800L_SERIAL.available()) {
      char c = SIM800L_SERIAL.read();
      response += c;
      Serial.write(c);
    }
    
    if (response.indexOf(expectedResponse) != -1) {
      Serial.println();
      return true;
    }
  }
  
  Serial.println(F("\nGSM Timeout"));
  return false;
}

bool waitForResponse(const char* expected, unsigned long timeout) {
  String response = "";
  unsigned long startTime = millis();
  
  while (millis() - startTime < timeout) {
    while (SIM800L_SERIAL.available()) {
      char c = SIM800L_SERIAL.read();
      response += c;
      Serial.write(c);
    }
    
    if (response.indexOf(expected) != -1) {
      Serial.println();
      return true;
    }
  }
  
  return false;
}

bool checkNetworkRegistration() {
  Serial.println(F("Checking network registration..."));
  
  // Check network registration status
  SIM800L_SERIAL.println("AT+CREG?");
  delay(1000);
  
  String response = "";
  unsigned long startTime = millis();
  
  while (millis() - startTime < 3000) {
    while (SIM800L_SERIAL.available()) {
      char c = SIM800L_SERIAL.read();
      response += c;
      Serial.write(c);
    }
  }
  
  // +CREG: 0,1 or +CREG: 0,5 means registered
  if (response.indexOf("+CREG: 0,1") != -1 || response.indexOf("+CREG: 0,5") != -1) {
    Serial.println(F("✓ Network registered"));
    return true;
  }
  
  Serial.println(F("✗ Not registered on network"));
  return false;
}

void initGSM() {
  Serial.println(F("\n=== Initializing GSM ==="));
  
  // Test AT
  sendATCommand("AT", "OK", 2000);
  delay(500);
  
  // Disable echo
  sendATCommand("ATE0", "OK", 2000);
  delay(500);
  
  // Check SIM
  if (sendATCommand("AT+CPIN?", "READY", 5000)) {
    Serial.println(F("✓ SIM card ready"));
  } else {
    Serial.println(F("✗ SIM card error"));
    return;
  }
  
  // Signal strength
  sendATCommand("AT+CSQ", "OK", 2000);
  delay(500);
  
  // Check network registration
  if (!checkNetworkRegistration()) {
    Serial.println(F("Warning: Network not registered. Continuing anyway..."));
  }
  
  // Check GPRS attachment
  Serial.println(F("Checking GPRS attachment..."));
  SIM800L_SERIAL.println("AT+CGATT?");
  delay(2000);
  
  String attachResponse = "";
  unsigned long attachStart = millis();
  while (millis() - attachStart < 2000) {
    while (SIM800L_SERIAL.available()) {
      char c = SIM800L_SERIAL.read();
      attachResponse += c;
      Serial.write(c);
    }
  }
  
  // If not attached (+CGATT: 0), try to attach
  if (attachResponse.indexOf("+CGATT: 0") != -1) {
    Serial.println(F("\n✗ Not attached to GPRS. Attempting to attach..."));
    sendATCommand("AT+CGATT=1", "OK", 10000);
    delay(5000);  // Wait for attachment
    
    // Verify attachment
    sendATCommand("AT+CGATT?", "+CGATT: 1", 5000);
  } else if (attachResponse.indexOf("+CGATT: 1") != -1) {
    Serial.println(F("\n✓ GPRS attached"));
  }
  
  // Connect to GPRS
  Serial.println(F("Connecting to GPRS bearer..."));
  
  // First, close any existing bearer
  Serial.println(F("Closing any existing bearer..."));
  SIM800L_SERIAL.println("AT+SAPBR=0,1");
  delay(3000);  // Wait for close
  
  // Configure bearer
  sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 2000);
  delay(500);
  
  String apnCmd = "AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"";
  sendATCommand(apnCmd.c_str(), "OK", 2000);
  delay(500);
  
  // Try opening bearer with extended timeout (can take 30+ seconds)
  Serial.println(F("Opening GPRS bearer (this may take 30-60 seconds)..."));
  if (sendATCommand("AT+SAPBR=1,1", "OK", 65000)) {
    Serial.println(F("✓ Bearer opened"));
  } else {
    Serial.println(F("✗ Bearer open failed"));
    Serial.println(F("  Possible issues:"));
    Serial.println(F("  - SIM card has no active data plan"));
    Serial.println(F("  - Wrong APN (try 'internet' or leave blank)"));
    Serial.println(F("  - Network congestion - wait and retry"));
  }
  delay(5000);  // Wait for connection to stabilize
  
  // Check bearer status and IP
  Serial.println(F("Checking bearer status..."));
  SIM800L_SERIAL.println("AT+SAPBR=2,1");
  delay(2000);
  
  String bearerResponse = "";
  unsigned long startTime = millis();
  while (millis() - startTime < 3000) {
    while (SIM800L_SERIAL.available()) {
      char c = SIM800L_SERIAL.read();
      bearerResponse += c;
      Serial.write(c);
    }
  }
  
  // Check if we got a valid IP (not 0.0.0.0)
  if (bearerResponse.indexOf("0.0.0.0") != -1) {
    Serial.println(F("\n✗ GPRS Connection Failed: No IP assigned"));
    Serial.println(F("  CRITICAL: SIM card is NOT connected to data network"));
    Serial.println(F("  Solutions to try:"));
    Serial.println(F("  1. Verify SIM has active DATA plan (not just airtime)"));
    Serial.println(F("  2. Try APN: 'internet' (change line 38)"));
    Serial.println(F("  3. Try empty APN: const char* APN = \"\";"));
    Serial.println(F("  4. Contact carrier to enable data on this SIM"));
    Serial.println(F("  5. Test SIM in a phone - can you browse internet?"));
    gsmReady = false;
    return;
  } else if (bearerResponse.indexOf("+SAPBR: 1,1") != -1) {
    Serial.println(F("\n✓ GPRS Connected with valid IP!"));
  } else {
    Serial.println(F("\n⚠ Unknown bearer status"));
    // Extract and show the actual response
    int sapbrIndex = bearerResponse.indexOf("+SAPBR:");
    if (sapbrIndex != -1) {
      String statusLine = bearerResponse.substring(sapbrIndex, bearerResponse.indexOf("\n", sapbrIndex));
      Serial.print(F("  Status: "));
      Serial.println(statusLine);
    }
  }
  
  // Terminate any existing HTTP session
  SIM800L_SERIAL.println("AT+HTTPTERM");
  delay(1000);
  
  // Initialize HTTP
  sendATCommand("AT+HTTPINIT", "OK", 2000);
  delay(500);
  
  sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 2000);
  delay(500);
  
  // Disable SSL - using plain HTTP via Railway TCP proxy
  sendATCommand("AT+HTTPSSL=0", "OK", 2000);
  delay(500);
  
  gsmReady = true;
  Serial.println(F("✓ GSM Module Ready!\n"));
}

void sendDataToBackend() {
  // Guard: skip if all primary sensor values are still zero (sensors not ready)
  if (pm2_5 == 0 && pm10 == 0 && temperature == 0.0 && humidity == 0.0) {
    Serial.println(F("⚠ Skipping send: sensor readings not ready (all zero)"));
    return;
  }

  Serial.println(F("\n>>> Sending data to backend..."));
  
  // Check GPRS connection first
  SIM800L_SERIAL.println("AT+SAPBR=2,1");
  delay(1000);
  
  String bearerCheck = "";
  unsigned long startTime = millis();
  while (millis() - startTime < 2000) {
    while (SIM800L_SERIAL.available()) {
      char c = SIM800L_SERIAL.read();
      bearerCheck += c;
    }
  }
  
  if (bearerCheck.indexOf("0.0.0.0") != -1) {
    Serial.println(F("✗ GPRS not connected (no valid IP). Skipping send."));
    Serial.println(F("  Try: Change APN to 'internet' or check SIM data plan"));
    return;
  }
  
  // Build JSON payload with all your sensors
  String jsonData = "{";
  jsonData += "\"location\":\"Nairobi\",";  // Change to your location
  jsonData += "\"metrics\":{";
  jsonData += "\"pm25\":" + String(pm2_5) + ",";
  jsonData += "\"pm10\":" + String(pm10) + ",";
  jsonData += "\"co\":" + String(CO_ppm, 2) + ",";
  jsonData += "\"temperature\":" + String(temperature, 1) + ",";
  jsonData += "\"humidity\":" + String(humidity, 1) + ",";
  jsonData += "\"voc_index\":" + String(voc_index) + ",";
  jsonData += "\"nox_index\":" + String(nox_index);
  jsonData += "}}";
  
  Serial.print(F("Payload: "));
  Serial.println(jsonData);
  
  // Terminate previous HTTP session (if any)
  SIM800L_SERIAL.println("AT+HTTPTERM");
  delay(500);
  sendATCommand("AT+HTTPINIT", "OK", 2000);
  delay(500);
  sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 2000);
  delay(500);
  
  // Disable SSL - plain HTTP via TCP proxy
  sendATCommand("AT+HTTPSSL=0", "OK", 2000);
  delay(500);
  
  // Build URL with explicit port for TCP proxy
  // Format: http://hostname:port/path
  String fullUrl = String(PROTOCOL) + String(BACKEND_URL) + ":" + String(BACKEND_PORT) + String(BACKEND_PATH);
  String urlCmd = "AT+HTTPPARA=\"URL\",\"" + fullUrl + "\"";
  Serial.print(F("URL: "));
  Serial.println(fullUrl);
  
  sendATCommand(urlCmd.c_str(), "OK", 2000);
  delay(500);
  
  // Set content type
  sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 2000);
  delay(500);
  
  // Set POST data
  String dataCmd = "AT+HTTPDATA=" + String(jsonData.length()) + ",10000";
  SIM800L_SERIAL.println(dataCmd);
  delay(1000);
  
  if (waitForResponse("DOWNLOAD", 2000)) {
    SIM800L_SERIAL.println(jsonData);
    delay(2000);
    
    // Execute HTTP POST
    SIM800L_SERIAL.println("AT+HTTPACTION=1");
    delay(5000);
    
    // Get response
    if (waitForResponse("+HTTPACTION:", 15000)) {
      // Read the full response to check status code
      String httpResponse = "";
      unsigned long startTime = millis();
      delay(1000);
      
      while (millis() - startTime < 2000) {
        while (SIM800L_SERIAL.available()) {
          char c = SIM800L_SERIAL.read();
          httpResponse += c;
        }
      }
      
      // Parse status code from +HTTPACTION: <method>,<status>,<datalen>
      int firstComma = httpResponse.indexOf(',');
      int secondComma = httpResponse.indexOf(',', firstComma + 1);
      
      if (firstComma > 0 && secondComma > firstComma) {
        String statusStr = httpResponse.substring(firstComma + 1, secondComma);
        int statusCode = statusStr.toInt();
        
        Serial.print(F("HTTP Status: "));
        Serial.println(statusCode);
        
        if (statusCode == 200 || statusCode == 201) {
          Serial.println(F("✓ Data sent successfully!"));
        } else if (statusCode == 301 || statusCode == 302 || statusCode == 307 || statusCode == 308) {
          Serial.println(F("✗ ERROR: HTTP Redirect (Backend forcing HTTPS)"));
          Serial.println(F("  CAUSE: Railway/Render require HTTPS, but you're using HTTP"));
          Serial.println(F("  "));
          Serial.println(F("  SOLUTION 1 (Try First): Use HTTPS"));
          Serial.println(F("    Change line 43: const char* PROTOCOL = \"https://\";"));
          Serial.println(F("    Reupload and test. May fail with error 606 if power is weak."));
          Serial.println(F("  "));
          Serial.println(F("  SOLUTION 2 (If HTTPS fails): Use HTTP Proxy"));
          Serial.println(F("    1. Deploy http-proxy-server.js to Railway/Render"));
          Serial.println(F("    2. Update BACKEND_URL to proxy URL (e.g., proxy-xxxxx.up.railway.app)"));
          Serial.println(F("    3. Keep PROTOCOL = \"http://\" for proxy"));
          Serial.println(F("    4. Proxy will forward HTTP → HTTPS for you"));
        } else if (statusCode == 601) {
          Serial.println(F("✗ ERROR 601: Network/DNS error"));
          Serial.println(F("  Troubleshooting:"));
          Serial.println(F("  1. SIM800L doesn't support HTTPS - try HTTP"));
          Serial.println(F("     Change line 41: const char* PROTOCOL = \"http://\";"));
          Serial.println(F("  2. Verify GPRS has valid IP (not 0.0.0.0)"));
          Serial.println(F("  3. Test different APN: 'internet' or 'airtelgprs.com'"));
        } else if (statusCode == 602) {
          Serial.println(F("✗ ERROR 602: DNS resolution failed"));
        } else if (statusCode == 603) {
          Serial.println(F("✗ ERROR 603: Connection error"));
        } else if (statusCode == 604) {
          Serial.println(F("✗ ERROR 604: Connection closed by server"));
        } else if (statusCode == 606) {
          Serial.println(F("✗ ERROR 606: SSL/TLS Connection Failed"));
          Serial.println(F("  CAUSE: SIM800L can't establish HTTPS connection"));
          Serial.println(F("  Common reasons:"));
          Serial.println(F("    - Insufficient power supply (SIM800L needs 2A, voltage drops during SSL)"));
          Serial.println(F("    - SIM800L firmware doesn't support TLS 1.2+"));
          Serial.println(F("  "));
          Serial.println(F("  SOLUTION: Use HTTP Proxy (Recommended)"));
          Serial.println(F("    1. Your project has http-proxy-server.js ready to use"));
          Serial.println(F("    2. Deploy it to Railway:"));
          Serial.println(F("       - Go to Railway dashboard"));
          Serial.println(F("       - Create new service from http-proxy-server.js"));
          Serial.println(F("       - Get the deployed URL (e.g., proxy-xxxxx.up.railway.app)"));
          Serial.println(F("    3. Update Arduino code:"));
          Serial.println(F("       - Line 40: BACKEND_URL = \"your-proxy-url.up.railway.app\""));
          Serial.println(F("       - Line 43: PROTOCOL = \"http://\""));
          Serial.println(F("    4. Proxy will forward: Arduino HTTP → Proxy → Backend HTTPS"));
        } else {
          Serial.print(F("✗ HTTP Error: "));
          Serial.println(statusCode);
        }
      }
      
      sendATCommand("AT+HTTPREAD", "OK", 3000);
    } else {
      Serial.println(F("✗ HTTP request timeout"));
    }
  } else {
    Serial.println(F("✗ Failed to enter data mode"));
  }
  
  delay(1000);
}

// ----------------------
// SETUP
// ----------------------
void setup() {
  Serial.begin(115200);
  u8g2.begin();
  dht.begin();
  Wire.begin(); 
  rtc.begin();
  sgp41.begin(Wire);
  Serial2.begin(9600);
  SIM800L_SERIAL.begin(GSM_BAUD);
  
  if (rtc.lostPower()) {
    // rtc.adjust(DateTime(2026, 02, 13, 11, 01, 0)); 
  }
  
  Serial.println(F("\n================================"));
  Serial.println(F("Air Quality Monitor with GSM"));
  Serial.println(F("================================\n"));
  
  // Initialize GSM
  delay(3000);  // Wait for GSM module to boot
  initGSM();
}

// ----------------------
// MAIN LOOP
// ----------------------
void loop() {
  // Read all sensors (your existing code)
  readPMS5003();

  // SGP41 Reading
  uint16_t srawVoc = 0, srawNox = 0;
  if (conditioning_s > 0) {
      sgp41.executeConditioning(0x8000, 0x6666, srawVoc);
      conditioning_s--;
  } else {
      sgp41.measureRawSignals(0x8000, 0x6666, srawVoc, srawNox);
  }
  voc_index = voc_helper.process(srawVoc);
  nox_index = nox_helper.process(srawNox);

  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  int mq7_raw = analogRead(MQ7_PIN);
  CO_ppm = ((mq7_raw * 3.3) / 1023.0) * 200.0;

  DateTime now = rtc.now();
  char timeStr[10], dateStr[12];
  sprintf(timeStr, "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
  sprintf(dateStr, "%02d/%02d/%d", now.day(), now.month(), now.year());

  // Page switching logic
  if (millis() - lastSwitchTime > pageInterval) {
    page = (page + 1) % 4; 
    lastSwitchTime = millis();
  }

  // Display rendering (your existing code)
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);

  // HEADER
  u8g2.drawStr(0, 10, timeStr);
  u8g2.drawStr(65, 10, dateStr);
  u8g2.drawHLine(0, 13, 128);

  // --- PAGE 0: PARTICULATE MATTER ---
  if (page == 0) {
    u8g2.drawStr(35, 25, "[ PM LEVELS ]");
    char p1[20], p25[20], p10[20];
    sprintf(p1,  "PM1.0: %d ug/m3", pm1_0);
    sprintf(p25, "PM2.5: %d ug/m3", pm2_5);
    sprintf(p10, "PM10 : %d ug/m3", pm10);
    
    u8g2.drawStr(5, 40, p1);
    u8g2.drawStr(5, 52, p25);
    u8g2.drawStr(5, 64, p10);
  }
  // --- PAGE 1: SGP41 VOC & NOX ---
  else if (page == 1) {
    u8g2.drawStr(30, 25, "[ VOC & NOX ]");
    if (conditioning_s > 0) {
      u8g2.drawStr(10, 45, "Warming up...");
      u8g2.setCursor(85, 45); u8g2.print(conditioning_s); u8g2.print("s");
    } else {
      char vStr[20], nStr[20];
      sprintf(vStr, "VOC Index: %ld", voc_index);
      sprintf(nStr, "NOx Index: %ld", nox_index);
      u8g2.drawStr(10, 45, vStr);
      u8g2.drawStr(10, 60, nStr);
    }
  }
  // --- PAGE 2: ENVIRONMENT (Temp, Hum, CO) ---
  else if (page == 2) {
    u8g2.drawStr(25, 25, "[ ENVIRONMENT ]");
    char tStr[20], hStr[20], coStr[20];
    sprintf(tStr,  "Temp: %.1f C", temperature);
    sprintf(hStr,  "Hum : %.1f %%", humidity);
    sprintf(coStr, "CO  : %.1f ppm", CO_ppm);
    
    u8g2.drawStr(10, 40, tStr);
    u8g2.drawStr(10, 52, hStr);
    u8g2.drawStr(10, 64, coStr);
  }
  // --- PAGE 3: ADVICE ---
  else if (page == 3) {
    u8g2.drawStr(30, 25, "[ ADVICE ]");
    if (CO_ppm < 9 && pm2_5 < 35 && voc_index < 150) {
      u8g2.drawStr(15, 50, "Air Quality: GOOD");
    } else if (CO_ppm > 35 || voc_index > 300 || pm2_5 > 75) {
      u8g2.drawStr(15, 50, "DANGER: VENTILATE!");
    } else {
      u8g2.drawStr(15, 50, "Quality: MODERATE");
    }
  }

  u8g2.sendBuffer();
  
  // ----------------------
  // GSM DATA TRANSMISSION
  // ----------------------
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    if (gsmReady && conditioning_s == 0) {  // Only send after sensor warmup
      sendDataToBackend();
    } else if (!gsmReady) {
      Serial.println(F("GSM not ready, attempting to reinitialize..."));
      initGSM();
    }
    lastSendTime = currentTime;
  }
  
  delay(100); 
}