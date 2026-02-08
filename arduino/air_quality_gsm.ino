/**
 * AIR QUALITY MONITORING WITH GSM
 * ================================
 * Reads air quality sensors and sends data to your backend via GSM/GPRS
 * 
 * HARDWARE REQUIRED:
 * - Arduino board (Uno, Mega, etc.)
 * - SIM800L or SIM900 GSM Module
 * - Air Quality Sensors (examples below):
 *   * MQ-135 (Air quality, CO, NH3, benzene)
 *   * MQ-7 (Carbon Monoxide)
 *   * PMS5003 or PMS7003 (PM2.5, PM10)
 *   * DHT22 (Temperature, Humidity)
 * - Power supply (3.7V-4.2V for GSM module)
 

#include <SoftwareSerial.h>

// ========== CONFIGURATION ==========
// GSM Module pins
#define GSM_RX 7  // Connect to GSM TX
#define GSM_TX 8  // Connect to GSM RX

// Sensor pins (adjust based on your sensors)
#define MQ135_PIN A0  // Air quality sensor
#define MQ7_PIN A1    // CO sensor
#define DHT_PIN 2     // DHT22 temperature/humidity

// Your backend server details
const char* APN = "internet";  // Change to your carrier's APN (safaricom, airtel, etc.)
const char* SERVER = "backend-air-quality.onrender.com";  // Your Render backend
const int PORT = 443;  // HTTPS port (Render uses HTTPS)
const char* ENDPOINT = "/api/sensor-data";

// Location identifier
const char* LOCATION = "Site A";  // Change to your location

// How often to send data (milliseconds)
const unsigned long SEND_INTERVAL = 60000;  // 1 minute

// ========== GLOBAL VARIABLES ==========
SoftwareSerial gsm(GSM_RX, GSM_TX);
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(9600);
  gsm.begin(9600);
  
  Serial.println("Air Quality Monitor Starting...");
  
  // Initialize sensor pins
  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ7_PIN, INPUT);
  
  delay(3000);
  
  // Initialize GSM module
  initGSM();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Send data at specified intervals
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentTime;
    
    // Read sensors
    float pm25 = readPM25();
    float pm10 = readPM10();
    float co = readCO();
    float temperature = readTemperature();
    float humidity = readHumidity();
    
    // Send data to server
    sendDataToServer(pm25, pm10, co, temperature, humidity);
  }
  
  delay(1000);
}

// ========== GSM FUNCTIONS ==========

void initGSM() {
  Serial.println("Initializing GSM...");
  
  // Test AT command
  sendATCommand("AT", 1000);
  
  // Set SMS mode to text
  sendATCommand("AT+CMGF=1", 1000);
  
  // Connect to GPRS
  connectGPRS();
}

void connectGPRS() {
  Serial.println("Connecting to GPRS...");
  
  sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 2000);
  
  String apnCommand = "AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"";
  sendATCommand(apnCommand.c_str(), 2000);
  
  sendATCommand("AT+SAPBR=1,1", 5000);
  sendATCommand("AT+SAPBR=2,1", 2000);
  
  Serial.println("GPRS Connected");
}

void sendATCommand(const char* command, int timeout) {
  gsm.println(command);
  Serial.print("Sent: ");
  Serial.println(command);
  
  long int time = millis();
  while((time + timeout) > millis()) {
    while(gsm.available()) {
      char c = gsm.read();
      Serial.write(c);
    }
  }
  Serial.println();
}

void sendDataToServer(float pm25, float pm10, float co, float temp, float humidity) {
  Serial.println("Sending data to server...");
  
  // Initialize HTTP
  sendATCommand("AT+HTTPINIT", 2000);
  sendATCommand("AT+HTTPPARA=\"CID\",1", 2000);
  
  // Set URL (using HTTPS for Render)
  String url = "AT+HTTPPARA=\"URL\",\"https://" + String(SERVER) + String(ENDPOINT) + "\"";
  sendATCommand(url.c_str(), 2000);
  
  // Build JSON payload
  String jsonData = buildJSON(pm25, pm10, co, temp, humidity);
  
  // Set content type
  sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 2000);
  
  // Set data length and send data
  String dataLengthCmd = "AT+HTTPDATA=" + String(jsonData.length()) + ",10000";
  gsm.println(dataLengthCmd);
  delay(2000);
  
  gsm.println(jsonData);
  Serial.println("JSON Data: " + jsonData);
  delay(2000);
  
  // POST request
  sendATCommand("AT+HTTPACTION=1", 5000);
  
  // Read response
  sendATCommand("AT+HTTPREAD", 2000);
  
  // Terminate HTTP
  sendATCommand("AT+HTTPTERM", 2000);
  
  Serial.println("Data sent successfully!");
}

String buildJSON(float pm25, float pm10, float co, float temp, float humidity) {
  String json = "{";
  json += "\"location\":\"" + String(LOCATION) + "\",";
  json += "\"metrics\":{";
  json += "\"pm25\":" + String(pm25, 2) + ",";
  json += "\"pm10\":" + String(pm10, 2) + ",";
  json += "\"co\":" + String(co, 2) + ",";
  json += "\"temperature\":" + String(temp, 2) + ",";
  json += "\"humidity\":" + String(humidity, 2);
  json += "}}";
  return json;
}

// ========== SENSOR READING FUNCTIONS ==========
// REPLACE THESE WITH YOUR ACTUAL SENSOR CODE

float readPM25() {
  // Example: Read from PMS5003 sensor
  // You'll need to implement based on your sensor
  // For now, reading analog value from MQ135 as example
  int rawValue = analogRead(MQ135_PIN);
  float pm25 = map(rawValue, 0, 1023, 0, 500) / 10.0;
  return pm25;
}

float readPM10() {
  // Example: Read from PMS5003 sensor
  // Implement based on your sensor
  int rawValue = analogRead(MQ135_PIN);
  float pm10 = map(rawValue, 0, 1023, 0, 600) / 10.0;
  return pm10;
}

float readCO() {
  // Example: Read from MQ-7 CO sensor
  int rawValue = analogRead(MQ7_PIN);
  // Convert to ppm based on sensor calibration
  float voltage = rawValue * (5.0 / 1023.0);
  float co = voltage * 10;  // Simplified conversion
  return co;
}

float readTemperature() {
  // Example: Read from DHT22
  // You'll need DHT library: #include <DHT.h>
  // DHT dht(DHT_PIN, DHT22);
  // return dht.readTemperature();
  
  // Placeholder
  return 25.0;
}

float readHumidity() {
  // Example: Read from DHT22
  // return dht.readHumidity();
  
  // Placeholder
  return 60.0;
}

// ========== ALTERNATIVE: USING SIM800L HTTP LIBRARY ==========
/*
 * If you prefer using a library, install "TinyGSM" library:
 * 
 * #include <TinyGsmClient.h>
 * TinyGsm modem(gsm);
 * TinyGsmClient client(modem);
 * 
 * Then use standard HTTP client methods
 */
