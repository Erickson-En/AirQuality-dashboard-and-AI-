/*
 * SIMPLIFIED GSM SENDER - FOR TESTING
 * ====================================
 * This version uses simulated data for testing the GSM connection
 * Use this first to verify your GSM module works before adding sensors
 * 
 * Hardware Required:
 * - Arduino (any model)
 * - SIM800L/SIM900 GSM Module
 * - SIM Card with data plan
 * 
 * Once this works, use the full version with real sensors
 */

#include <SoftwareSerial.h>

// ========== CONFIGURATION ==========
#define GSM_RX 7          // GSM module TX connects here
#define GSM_TX 8          // GSM module RX connects here

// IMPORTANT: Update these values!
const char* APN = "safaricom";                              // Your carrier APN
const char* BACKEND_URL = "your-backend-url.onrender.com";  // Your backend URL
const char* BACKEND_PATH = "/api/sensor-data";

const unsigned long SEND_INTERVAL = 30000;  // Send every 30 seconds for testing
unsigned long lastSendTime = 0;

SoftwareSerial gsmSerial(GSM_RX, GSM_TX);
bool gsmReady = false;

void setup() {
  Serial.begin(9600);
  gsmSerial.begin(9600);
  
  delay(3000);
  
  Serial.println(F("==============================="));
  Serial.println(F("GSM Sender Test - Starting"));
  Serial.println(F("===============================\n"));
  
  initGSM();
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    if (gsmReady) {
      sendTestData();
    } else {
      Serial.println(F("GSM not ready, reinitializing..."));
      initGSM();
    }
    lastSendTime = currentTime;
  }
  
  delay(1000);
}

void initGSM() {
  Serial.println(F("--- Initializing GSM ---"));
  
  sendATCommand("AT", "OK", 2000);
  delay(500);
  
  sendATCommand("ATE0", "OK", 2000);
  delay(500);
  
  if (sendATCommand("AT+CPIN?", "READY", 5000)) {
    Serial.println(F("✓ SIM card ready"));
  } else {
    Serial.println(F("✗ SIM card error"));
    return;
  }
  
  sendATCommand("AT+CSQ", "OK", 2000);
  delay(500);
  
  Serial.println(F("Connecting to GPRS..."));
  sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 2000);
  delay(500);
  
  String apnCmd = "AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"";
  sendATCommand(apnCmd.c_str(), "OK", 2000);
  delay(500);
  
  sendATCommand("AT+SAPBR=1,1", "OK", 10000);
  delay(2000);
  
  sendATCommand("AT+HTTPINIT", "OK", 2000);
  delay(500);
  
  sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 2000);
  delay(500);
  
  gsmReady = true;
  Serial.println(F("✓ GSM Ready!\n"));
}

void sendTestData() {
  Serial.println(F("\n>>> Sending test data..."));
  
  // Generate random test values
  float pm25 = random(100, 500) / 10.0;    // 10.0 - 50.0
  float pm10 = random(200, 1000) / 10.0;   // 20.0 - 100.0
  float co = random(10, 80) / 10.0;        // 1.0 - 8.0
  float temp = random(200, 350) / 10.0;    // 20.0 - 35.0
  float humid = random(400, 800) / 10.0;   // 40.0 - 80.0
  
  String jsonData = "{";
  jsonData += "\"location\":\"Test Site\",";
  jsonData += "\"metrics\":{";
  jsonData += "\"pm25\":" + String(pm25, 1) + ",";
  jsonData += "\"pm10\":" + String(pm10, 1) + ",";
  jsonData += "\"co\":" + String(co, 1) + ",";
  jsonData += "\"o3\":" + String(random(10, 50)) + ",";
  jsonData += "\"temperature\":" + String(temp, 1) + ",";
  jsonData += "\"humidity\":" + String(humid, 1);
  jsonData += "}}";
  
  Serial.print(F("Payload: "));
  Serial.println(jsonData);
  
  String urlCmd = "AT+HTTPPARA=\"URL\",\"http://" + String(BACKEND_URL) + String(BACKEND_PATH) + "\"";
  sendATCommand(urlCmd.c_str(), "OK", 2000);
  delay(500);
  
  sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 2000);
  delay(500);
  
  String dataCmd = "AT+HTTPDATA=" + String(jsonData.length()) + ",10000";
  gsmSerial.println(dataCmd);
  delay(1000);
  
  if (waitForResponse("DOWNLOAD", 2000)) {
    gsmSerial.println(jsonData);
    delay(2000);
    
    gsmSerial.println("AT+HTTPACTION=1");
    delay(5000);
    
    if (waitForResponse("+HTTPACTION:", 10000)) {
      Serial.println(F("✓ Data sent successfully!"));
      sendATCommand("AT+HTTPREAD", "OK", 3000);
    } else {
      Serial.println(F("✗ HTTP request failed"));
    }
  } else {
    Serial.println(F("✗ Failed to enter data mode"));
  }
  
  delay(1000);
}

bool sendATCommand(const char* cmd, const char* expectedResponse, unsigned long timeout) {
  Serial.print(F("CMD: "));
  Serial.println(cmd);
  
  gsmSerial.println(cmd);
  return waitForResponse(expectedResponse, timeout);
}

bool waitForResponse(const char* expected, unsigned long timeout) {
  String response = "";
  unsigned long startTime = millis();
  
  while (millis() - startTime < timeout) {
    while (gsmSerial.available()) {
      char c = gsmSerial.read();
      response += c;
      Serial.write(c);
    }
    
    if (response.indexOf(expected) != -1) {
      Serial.println();
      return true;
    }
  }
  
  Serial.println(F("\n✗ Timeout"));
  return false;
}
