# Arduino GSM Air Quality Monitor - Hardware Setup Guide

## 📋 Required Components

### Core Components
1. **Arduino Board** (Uno, Mega, or similar)
2. **GSM Module** (SIM800L or SIM900)
3. **SIM Card** with active data plan
4. **Power Supply** (3.7V-4.2V for GSM, 5V for Arduino)

### Air Quality Sensors
Choose based on your monitoring needs:

#### Essential Sensors
- **PMS5003 or PMS7003** - Particulate Matter (PM2.5, PM10)
- **MQ-135** - Air Quality (general)
- **DHT22** - Temperature & Humidity

#### Optional Sensors
- **MQ-7** - Carbon Monoxide (CO)
- **MQ-131** - Ozone (O3)
- **MQ-136** - Hydrogen Sulfide (H2S)
- **MICS-6814** - NO2, CO, NH3

## 🔌 Wiring Diagram

### GSM Module (SIM800L) Connection
```
SIM800L    →    Arduino
---------------------------------
VCC        →    3.7-4.2V (separate power supply!)
GND        →    GND (common ground with Arduino)
TXD        →    Pin 7 (RX in code)
RXD        →    Pin 8 (TX in code)
RST        →    (optional, for hardware reset)
```

⚠️ **IMPORTANT**: 
- SIM800L requires 3.7-4.2V and can draw up to 2A during transmission
- Do NOT power it directly from Arduino's 5V or 3.3V pins
- Use a dedicated power supply or buck converter
- Connect grounds together

### PMS5003 (PM Sensor) Connection
```
PMS5003    →    Arduino
---------------------------------
VCC        →    5V
GND        →    GND
TX         →    Pin 10 (Software Serial RX)
RX         →    Pin 11 (Software Serial TX)
```

### MQ-135 (Air Quality) Connection
```
MQ-135     →    Arduino
---------------------------------
VCC        →    5V
GND        →    GND
AOUT       →    A0 (analog pin)
```

### DHT22 (Temperature/Humidity) Connection
```
DHT22      →    Arduino
---------------------------------
VCC        →    5V
GND        →    GND
DATA       →    Pin 2
```

### Complete Wiring Example
```
                    ┌─────────────┐
                    │   Arduino   │
                    │    Uno      │
                    └─────────────┘
                         │ │ │
        ┌────────────────┘ │ └────────────────┐
        │                  │                   │
   ┌────▼────┐        ┌───▼───┐         ┌────▼────┐
   │ SIM800L │        │DHT22  │         │ PMS5003 │
   │  GSM    │        │       │         │  PM     │
   └─────────┘        └───────┘         └─────────┘
        │
   ┌────▼────┐
   │ 3.7V    │
   │ Battery │
   └─────────┘
```

## 🔧 Assembly Steps

### Step 1: Prepare the GSM Module
1. Insert SIM card into SIM800L
2. Ensure SIM card has:
   - PIN lock disabled
   - Active data plan
   - Sufficient balance
3. Connect external antenna (if available)

### Step 2: Power Setup
1. Connect Arduino to USB or 9V adapter
2. Connect SIM800L to 3.7V-4.2V power supply
3. **Connect all grounds together** (very important!)
4. Add 100-1000µF capacitor near SIM800L power pins (reduces noise)

### Step 3: Connect Sensors
1. Wire PMS5003 to Arduino (pins 10, 11 for software serial)
2. Wire MQ-135 to analog pin A0
3. Wire DHT22 to digital pin 2
4. Double-check all connections

### Step 4: Test Individual Components
```arduino
// Test GSM module first
void testGSM() {
  Serial.begin(9600);
  gsm.begin(9600);
  gsm.println("AT");
  delay(1000);
  while(gsm.available()) {
    Serial.write(gsm.read());  // Should print "OK"
  }
}
```

## 📱 SIM Card Configuration

### Get Your Carrier's APN
Common APNs:
- **Safaricom (Kenya)**: `safaricom` or `internet`
- **Airtel**: `internet`
- **AT&T**: `phone`
- **Verizon**: `vzwinternet`
- **T-Mobile**: `fast.t-mobile.com`

Check your carrier's website for the correct APN.

### Enable Data
1. Ensure mobile data is enabled on the SIM
2. Test data connectivity with a phone first
3. Verify sufficient balance/data plan

## ⚙️ Arduino Configuration

### Install Required Libraries

Open Arduino IDE → Sketch → Include Library → Manage Libraries

Install these:
1. **SoftwareSerial** (usually pre-installed)
2. **DHT sensor library** by Adafruit
3. **PMS Library** by Mariusz Kacki (for PMS5003)
4. **TinyGSM** (optional, for easier GSM handling)

### Update Code Configuration

In `air_quality_gsm.ino`, modify:

```cpp
// Line 19-26: Update these values
const char* APN = "your-carrier-apn";  // Your carrier's APN
const char* SERVER = "your-server.com"; // Your server IP or domain
const int PORT = 5000;                  // Your server port
const char* LOCATION = "Your Location"; // Monitoring location name
```

## 🚀 Upload and Test

### Step 1: Upload Code
1. Connect Arduino to computer via USB
2. Select correct board: Tools → Board → Arduino Uno
3. Select correct port: Tools → Port → COMx
4. Click Upload button

### Step 2: Monitor Serial Output
1. Open Serial Monitor (Tools → Serial Monitor)
2. Set baud rate to 9600
3. Watch for initialization messages
4. Look for "GPRS Connected" message
5. Wait for first data transmission

### Expected Output:
```
Air Quality Monitor Starting...
Initializing GSM...
Sent: AT
OK
Connecting to GPRS...
GPRS Connected
Sending data to server...
JSON Data: {"location":"Site A","metrics":{"pm25":35.20,...}}
Data sent successfully!
```

## 🔍 Troubleshooting

### GSM Module Not Responding
- Check power supply (needs 3.7-4.2V, 2A capable)
- Verify TX/RX connections (should be crossed)
- Add capacitor near power pins
- Try hardware reset

### GPRS Connection Fails
- Verify APN is correct
- Check SIM card has active data plan
- Ensure SIM PIN is disabled
- Test SIM in a phone first

### Sensors Reading Zero
- Check sensor power connections
- Verify correct pin numbers in code
- Some sensors need warm-up time (5-30 minutes)
- Check sensor-specific libraries are installed

### Data Not Reaching Server
- Verify server IP/domain is correct
- Check server port is open (firewall)
- Ensure backend server is running
- Test with Postman or curl first

## 📊 Power Consumption Tips

1. **Sleep Mode**: Put Arduino to sleep between readings
2. **Reduce Frequency**: Send data every 5-15 minutes instead of every minute
3. **Solar Power**: Use solar panel + battery for outdoor deployment
4. **Power Bank**: 10,000mAh can run system for 24-48 hours

## 🌐 Testing Without Hardware

If you don't have all sensors yet, use the test script:

```bash
# Test from your computer using curl
curl -X POST http://your-server:5000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"location":"Test Site","metrics":{"pm25":35.5,"pm10":82.3,"co":4.2}}'
```

This verifies your backend is working before connecting Arduino.
