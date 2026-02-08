/**
 * AIR QUALITY MONITOR - ARDUINO DUE + GSM
 * Sends real sensor data to backend via GSM
 * 
 * Hardware: Arduino Due, SIM800L, PMS5003, DHT11, MQ-7, RTC, Display
 */

#include <U8g2lib.h>
#include "DHT.h"
#include "RTClib.h"
#include <Wire.h>

// ----------------------
// Pin definitions
// ----------------------
#define DHTPIN 7
#define DHTTYPE DHT11
#define MQ7_PIN A0

// SIM800L on Serial1 (Arduino Due)
#define SIM800L_SERIAL Serial1
const long GSM_BAUD = 9600;

// ----------------------
// Sensors / Display / RTC
// ----------------------
DHT dht(DHTPIN, DHTTYPE);
RTC_DS3231 rtc;
U8G2_ST7920_128X64_F_SW_SPI u8g2(U8G2_R0, 13, 11, 10, 8);

// ----------------------
// UI page variables
// ----------------------
int page = 0;
unsigned long lastSwitchTime = 0;
const unsigned long pageInterval = 3000;

// ----------------------
// PMS5003 Data
// ----------------------
uint16_t pm1_0 = 0;
uint16_t pm2_5 = 0;
uint16_t pm10 = 0;

// ----------------------
// Backend Configuration
// ----------------------
// IMPORTANT: Render uses HTTPS, but SIM800L might have issues with it
// If you get connection errors, you may need to:
// 1. Use HTTP proxy (contact for setup)
// 2. Or use AT+HTTPSSL=1 command (if your SIM800L firmware supports it)
String serverURL = "http://backend-air-quality.onrender.com/api/airdata";
// For HTTPS (if supported): "https://backend-air-quality.onrender.com/api/airdata"

const char* APN = "safaricom";  // Your carrier APN

// ----------------------
// Settings
// ----------------------
const unsigned long SEND_INTERVAL = 60000;  // Send every 60 seconds (1 minute)
// Note: 15 seconds is very frequent - consider 60-300 seconds to save data/battery

// ------------------------------------------------------
// Read PMS5003
// ------------------------------------------------------
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

// ------------------------------------------------------
// Send AT Command
// ------------------------------------------------------
String sendAT(String cmd, long timeout = 2000) {
  SIM800L_SERIAL.println(cmd);
  unsigned long t = millis();
  String resp = "";

  while (millis() - t < timeout) {
    if (SIM800L_SERIAL.available()) {
      resp += char(SIM800L_SERIAL.read());
    }
  }

  Serial.println("> " + cmd);
  Serial.println(resp);
  return resp;
}

// ------------------------------------------------------
// Send JSON to Backend (HTTP POST)
// ------------------------------------------------------
void sendToServer(String json) {
  Serial.println("=== Sending to backend ===");
  Serial.println(json);

  // Setup GPRS connection
  sendAT("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"");
  sendAT("AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"");
  sendAT("AT+SAPBR=1,1", 5000);
  sendAT("AT+SAPBR=2,1");

  // Initialize HTTP
  sendAT("AT+HTTPINIT");
  sendAT("AT+HTTPPARA=\"CID\",1");
  
  // If using HTTPS, uncomment this line (requires SSL support in SIM800L):
  // sendAT("AT+HTTPSSL=1");
  
  sendAT("AT+HTTPPARA=\"CONTENT\",\"application/json\"");

  // Set URL
  SIM800L_SERIAL.print("AT+HTTPPARA=\"URL\",\"");
  SIM800L_SERIAL.print(serverURL);
  SIM800L_SERIAL.println("\"");
  delay(500);

  // Send JSON data
  SIM800L_SERIAL.print("AT+HTTPDATA=");
  SIM800L_SERIAL.print(json.length());
  SIM800L_SERIAL.println(",10000");
  delay(300);

  SIM800L_SERIAL.println(json);
  delay(1500);

  // Execute POST request
  String response = sendAT("AT+HTTPACTION=1", 8000);
  
  // Check response
  if (response.indexOf("200") > 0) {
    Serial.println("✓ SUCCESS: Data sent to backend!");
  } else if (response.indexOf("600") > 0) {
    Serial.println("✗ ERROR: Not connected to network");
  } else if (response.indexOf("601") > 0) {
    Serial.println("✗ ERROR: Network timeout");
  } else if (response.indexOf("602") > 0) {
    Serial.println("✗ ERROR: No HTTP response");
  } else if (response.indexOf("603") > 0) {
    Serial.println("✗ ERROR: DNS error");
  } else if (response.indexOf("604") > 0) {
    Serial.println("✗ ERROR: Stack busy");
  } else {
    Serial.println("? Unknown response");
  }

  // Read server response
  sendAT("AT+HTTPREAD", 2000);

  // Terminate HTTP
  sendAT("AT+HTTPTERM");
  
  Serial.println("=== Transmission complete ===\n");
}


void sendSMS(String number, String message) {
  Serial.println("Sending SMS to " + number);
  SIM800L_SERIAL.print("AT+CMGS=\"");
  SIM800L_SERIAL.print(number);
  SIM800L_SERIAL.println("\"");
  delay(500);

  SIM800L_SERIAL.print(message);
  SIM800L_SERIAL.write(0x1A);  // end SMS (Ctrl+Z)
  delay(3000);

  Serial.println("SMS sent!");
}


void setup() {
  Serial.begin(9600);
  while (!Serial) { delay(10); }  // Wait for Serial on Due
  
  Serial.println("\n\n=================================");
  Serial.println("AIR QUALITY MONITORING SYSTEM");
  Serial.println("=================================\n");

  // Initialize display
  u8g2.begin();
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);
  u8g2.drawStr(10, 30, "Initializing...");
  u8g2.sendBuffer();

  // Initialize sensors
  Serial.println("Initializing sensors...");
  dht.begin();
  rtc.begin();
  Wire.begin();

  // PMS sensor
  Serial2.begin(9600);

  // GSM Init
  Serial.println("Initializing GSM module...");
  SIM800L_SERIAL.begin(GSM_BAUD);
  delay(3000);
  
  sendAT("AT");
  sendAT("AT+CMGF=1");  
  sendAT("AT+CSQ");    
  
  // Startup SMS
  sendSMS("+254710347036", "Air Quality System Started! Location: Station-1");

  Serial.println("✓ System Ready!");
  Serial.println("Backend: " + serverURL);
  Serial.println("APN: " + String(APN));
  Serial.println("Send Interval: " + String(SEND_INTERVAL / 1000) + " seconds\n");
}


unsigned long lastSend = 0;

void loop() {
  
  readPMS5003();

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Check if DHT readings are valid
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Warning: Failed to read from DHT sensor!");
    humidity = 0;
    temperature = 0;
  }

  int mq7_raw = analogRead(MQ7_PIN);
  float voltage = (mq7_raw * 3.3) / 1023.0;
  float CO_ppm = voltage * 200.0;

  DateTime now = rtc.now();

  // ================== JSON FOR BACKEND ===================
  String json = "{";
  json += "\"location\":\"Station-1\",";
  json += "\"metrics\":{";
  json += "\"pm25\":" + String(pm2_5) + ",";
  json += "\"pm10\":" + String(pm10) + ",";
  json += "\"co\":" + String(CO_ppm, 2) + ",";  // 2 decimal places
  json += "\"temperature\":" + String(temperature, 1) + ",";
  json += "\"humidity\":" + String(humidity, 1);
  json += "}}";

  // ================== SEND TO BACKEND ===================
  if (millis() - lastSend >= SEND_INTERVAL) {
    sendToServer(json);
    lastSend = millis();
  }

  // Print current readings to Serial every 5 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 5000) {
    Serial.println("Current Readings:");
    Serial.println("  PM2.5: " + String(pm2_5) + " μg/m³");
    Serial.println("  PM10: " + String(pm10) + " μg/m³");
    Serial.println("  CO: " + String(CO_ppm, 2) + " ppm");
    Serial.println("  Temp: " + String(temperature, 1) + "°C");
    Serial.println("  Humidity: " + String(humidity, 1) + "%");
    Serial.println("  Next send in: " + String((SEND_INTERVAL - (millis() - lastSend)) / 1000) + "s\n");
    lastPrint = millis();
  }

  // ================== DISPLAY ===================
  char timeStr[15], dateStr[15];
  sprintf(timeStr, "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
  sprintf(dateStr, "%02d/%02d/%d", now.day(), now.month(), now.year());

  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);

  // PAGE SWITCHING
  if (millis() - lastSwitchTime > pageInterval) {
    page = (page + 1) % 3;
    lastSwitchTime = millis();
  }

  // PAGES
  if (page == 0) {
    u8g2.drawStr(30, 10, "GAS LEVELS");
    u8g2.drawStr(5, 22, timeStr);
    u8g2.drawStr(75, 22, dateStr);

    char buf1[20];
    sprintf(buf1, "CO : %.0f ppm", CO_ppm);
    u8g2.drawStr(10, 40, buf1);

    char p1[20], p25[20], p10s[20];
    sprintf(p1, "PM1.0 : %d", pm1_0);
    sprintf(p25, "PM2.5 : %d", pm2_5);
    sprintf(p10s, "PM10  : %d", pm10);

    u8g2.drawStr(10, 52, p1);
    u8g2.drawStr(10, 62, p25);
  }

  else if (page == 1) {
    u8g2.drawStr(25, 10, "ENVIRONMENT");
    u8g2.drawStr(5, 22, timeStr);
    u8g2.drawStr(75, 22, dateStr);

    char tStr[20], hStr[20];
    sprintf(tStr, "Temp: %.1f C", temperature);
    sprintf(hStr, "Hum : %.1f %%", humidity);

    u8g2.drawStr(10, 40, tStr);
    u8g2.drawStr(10, 52, hStr);
  }

  else if (page == 2) {
    u8g2.drawStr(15, 10, "AIR QUALITY");
    u8g2.drawStr(5, 22, timeStr);
    u8g2.drawStr(75, 22, dateStr);

    if (CO_ppm < 9 && pm2_5 < 35 && humidity < 70) {
      u8g2.drawStr(10, 40, "Status: GOOD");
      u8g2.drawStr(10, 52, "Safe to go out");
    } else if (CO_ppm < 35 && pm2_5 < 100) {
      u8g2.drawStr(10, 40, "Status: MODERATE");
      u8g2.drawStr(10, 52, "Use mask outside");
    } else {
      u8g2.drawStr(10, 40, "Status: UNHEALTHY");
      u8g2.drawStr(10, 52, "Stay indoors!");
    }
  }

  u8g2.sendBuffer();
  
  delay(100);  // Small delay for stability
}
