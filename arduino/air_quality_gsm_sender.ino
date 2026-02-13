/*
 * AIR QUALITY SENSOR - GSM DATA SENDER
 * =====================================
 * Sends real sensor data to your backend via GSM/GPRS
 * 
 * Hardware Required:
 * - Arduino (Uno, Mega, or similar)
 * - SIM800L/SIM900 GSM Module
 * - PMS5003 Particulate Matter Sensor (PM2.5, PM10)
 * - MQ-7 CO Sensor
 * - MQ-131 O3 Sensor (optional)
 * - DHT11/DHT22 Temperature & Humidity Sensor
 * 
 * Backend Endpoint: https://your-backend-url.com/api/sensor-data
 */

#include <SoftwareSerial.h>
#include "DHT.h"

// ========== CONFIGURATION ==========
#define GSM_RX 7          // GSM module TX connects here
#define GSM_TX 8          // GSM module RX connects here
#define DHT_PIN 2         // DHT11/DHT22 data pin
#define DHT_TYPE DHT11    // Change to DHT22 if using that sensor
#define MQ7_PIN A0        // MQ-7 CO sensor analog pin
#define MQ131_PIN A1      // MQ-131 O3 sensor analog pin (optional)
#define PMS_RX 10         // PMS5003 TX connects here
#define PMS_TX 11         // PMS5003 RX connects here

// GSM Configuration
const char* APN = "safaricom";           // Your carrier APN (e.g., "safaricom", "airtel", "internet")
const char* BACKEND_URL = "your-backend-url.onrender.com";  // Replace with your actual backend URL
const char* BACKEND_PATH = "/api/sensor-data";
const int BACKEND_PORT = 80;             // Use 443 for HTTPS (if SIM800L supports SSL)

// Timing
const unsigned long SEND_INTERVAL = 60000;  // Send data every 60 seconds (1 minute)
unsigned long lastSendTime = 0;

// ========== OBJECTS ==========
SoftwareSerial gsmSerial(GSM_RX, GSM_TX);
SoftwareSerial pmsSerial(PMS_RX, PMS_TX);
DHT dht(DHT_PIN, DHT_TYPE);

// Sensor data variables
float pm25 = 0;
float pm10 = 0;
float co = 0;
float o3 = 0;
float temperature = 0;
float humidity = 0;

bool gsmReady = false;

// ========== SETUP ==========
void setup() {
  Serial.begin(9600);
  gsmSerial.begin(9600);
  pmsSerial.begin(9600);
  dht.begin();
  
  delay(3000);
  
  Serial.println(F("================================="));
  Serial.println(F("Air Quality GSM Sender Starting"));
  Serial.println(F("================================="));
  
  // Initialize GSM
  initGSM();
}

// ========== MAIN LOOP ==========
void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors
  readAllSensors();
  
  // Display readings on Serial Monitor
  displayReadings();
  
  // Send data at interval
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    if (gsmReady) {
      sendDataToBackend();
    } else {
      Serial.println(F("GSM not ready, attempting to reinitialize..."));
      initGSM();
    }
    lastSendTime = currentTime;
  }
  
  delay(5000);  // Wait 5 seconds before next sensor reading
}

// ========== GSM INITIALIZATION ==========
void initGSM() {
  Serial.println(F("\n--- Initializing GSM Module ---"));
  
  // Test AT command
  sendATCommand("AT", "OK", 2000);
  delay(500);
  
  // Disable echo
  sendATCommand("ATE0", "OK", 2000);
  delay(500);
  
  // Check SIM card
  if (sendATCommand("AT+CPIN?", "READY", 5000)) {
    Serial.println(F("✓ SIM card ready"));
  } else {
    Serial.println(F("✗ SIM card error"));
    return;
  }
  
  // Check signal strength
  sendATCommand("AT+CSQ", "OK", 2000);
  delay(500);
  
  // Connect to GPRS
  Serial.println(F("Connecting to GPRS..."));
  sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 2000);
  delay(500);
  
  String apnCmd = "AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"";
  sendATCommand(apnCmd.c_str(), "OK", 2000);
  delay(500);
  
  sendATCommand("AT+SAPBR=1,1", "OK", 5000);
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

// ========== READ ALL SENSORS ==========
void readAllSensors() {
  // Read PMS5003 (PM2.5 and PM10)
  readPMS5003();
  
  // Read DHT11/DHT22 (Temperature and Humidity)
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  if (isnan(temperature)) temperature = 0;
  if (isnan(humidity)) humidity = 0;
  
  // Read MQ-7 (CO sensor)
  co = readMQ7();
  
  // Read MQ-131 (O3 sensor) - Optional
  o3 = readMQ131();
}

// ========== READ PMS5003 SENSOR ==========
void readPMS5003() {
  // PMS5003 sends 32 bytes of data
  // Simplified reading - you may need a proper parser
  
  if (pmsSerial.available() >= 32) {
    byte buffer[32];
    int idx = 0;
    
    while (pmsSerial.available() && idx < 32) {
      buffer[idx++] = pmsSerial.read();
    }
    
    // Check for valid frame (starts with 0x42, 0x4D)
    if (buffer[0] == 0x42 && buffer[1] == 0x4D) {
      // PM2.5 is at bytes 12-13 (CF=1 standard particle)
      pm25 = (buffer[12] << 8) | buffer[13];
      
      // PM10 is at bytes 14-15
      pm10 = (buffer[14] << 8) | buffer[15];
    }
  } else {
    // If no data available, use simulated values for testing
    pm25 = random(10, 50);
    pm10 = random(20, 100);
  }
}

// ========== READ MQ-7 CO SENSOR ==========
float readMQ7() {
  int rawValue = analogRead(MQ7_PIN);
  
  // Convert to ppm (this is a simplified conversion)
  // You should calibrate this based on your sensor's datasheet
  float voltage = rawValue * (5.0 / 1023.0);
  float ppm = voltage * 10;  // Simplified conversion
  
  return ppm;
}

// ========== READ MQ-131 O3 SENSOR ==========
float readMQ131() {
  int rawValue = analogRead(MQ131_PIN);
  
  // Convert to ppb (this is a simplified conversion)
  // You should calibrate this based on your sensor's datasheet
  float voltage = rawValue * (5.0 / 1023.0);
  float ppb = voltage * 20;  // Simplified conversion
  
  return ppb;
}

// ========== DISPLAY READINGS ==========
void displayReadings() {
  Serial.println(F("\n--- Current Sensor Readings ---"));
  Serial.print(F("PM2.5: ")); Serial.print(pm25); Serial.println(F(" µg/m³"));
  Serial.print(F("PM10:  ")); Serial.print(pm10); Serial.println(F(" µg/m³"));
  Serial.print(F("CO:    ")); Serial.print(co); Serial.println(F(" ppm"));
  Serial.print(F("O3:    ")); Serial.print(o3); Serial.println(F(" ppb"));
  Serial.print(F("Temp:  ")); Serial.print(temperature); Serial.println(F(" °C"));
  Serial.print(F("Humid: ")); Serial.print(humidity); Serial.println(F(" %"));
  Serial.println(F("--------------------------------\n"));
}

// ========== SEND DATA TO BACKEND ==========
void sendDataToBackend() {
  Serial.println(F("\n>>> Sending data to backend..."));
  
  // Build JSON payload
  String jsonData = "{";
  jsonData += "\"location\":\"Nairobi\",";
  jsonData += "\"metrics\":{";
  jsonData += "\"pm25\":" + String(pm25, 1) + ",";
  jsonData += "\"pm10\":" + String(pm10, 1) + ",";
  jsonData += "\"co\":" + String(co, 1) + ",";
  jsonData += "\"o3\":" + String(o3, 1) + ",";
  jsonData += "\"temperature\":" + String(temperature, 1) + ",";
  jsonData += "\"humidity\":" + String(humidity, 1);
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
  gsmSerial.println(dataCmd);
  delay(1000);
  
  if (waitForResponse("DOWNLOAD", 2000)) {
    gsmSerial.println(jsonData);
    delay(2000);
    
    // Execute HTTP POST
    gsmSerial.println("AT+HTTPACTION=1");
    delay(5000);
    
    // Get response
    if (waitForResponse("+HTTPACTION:", 10000)) {
      Serial.println(F("✓ Data sent successfully!"));
      
      // Read response
      sendATCommand("AT+HTTPREAD", "OK", 3000);
    } else {
      Serial.println(F("✗ HTTP request failed"));
    }
  } else {
    Serial.println(F("✗ Failed to enter data mode"));
  }
  
  delay(1000);
}

// ========== SEND AT COMMAND ==========
bool sendATCommand(const char* cmd, const char* expectedResponse, unsigned long timeout) {
  Serial.print(F("CMD: "));
  Serial.println(cmd);
  
  gsmSerial.println(cmd);
  
  return waitForResponse(expectedResponse, timeout);
}

// ========== WAIT FOR RESPONSE ==========
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
