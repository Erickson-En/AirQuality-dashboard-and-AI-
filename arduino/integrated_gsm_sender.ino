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
const char* APN = "safaricom";  // Your carrier APN (safaricom, airtel, internet, etc.)
const char* BACKEND_URL = "air-quality-backend-xyz.onrender.com";  // UPDATE: Your Render backend URL (without https://)
const char* BACKEND_PATH = "/api/sensor-data";

// Send interval
const unsigned long SEND_INTERVAL = 60000;  // Send data every 60 seconds
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
  
  // Connect to GPRS
  Serial.println(F("Connecting to GPRS..."));
  sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 2000);
  delay(500);
  
  String apnCmd = "AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"";
  sendATCommand(apnCmd.c_str(), "OK", 2000);
  delay(500);
  
  sendATCommand("AT+SAPBR=1,1", "OK", 10000);
  delay(2000);
  
  sendATCommand("AT+SAPBR=2,1", "OK", 2000);
  delay(500);
  
  // Initialize HTTP
  sendATCommand("AT+HTTPINIT", "OK", 2000);
  delay(500);
  
  sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 2000);
  delay(500);
  
  gsmReady = true;
  Serial.println(F("✓ GSM Module Ready!\n"));
}

void sendDataToBackend() {
  Serial.println(F("\n>>> Sending data to backend..."));
  
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
  
  // Set HTTP URL
  String urlCmd = "AT+HTTPPARA=\"URL\",\"http://" + String(BACKEND_URL) + String(BACKEND_PATH) + "\"";
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
