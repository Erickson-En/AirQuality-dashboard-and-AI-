# GSM Air Quality Sensor - Setup Guide

## 📋 Overview
This system sends real air quality sensor data from Arduino to your backend using GSM/GPRS connectivity.

## 🔌 Hardware Requirements

### Required Components:
1. **Arduino Board** (Uno, Mega, or Nano)
2. **SIM800L or SIM900 GSM Module**
3. **PMS5003 Particulate Matter Sensor** (measures PM2.5 and PM10)
4. **MQ-7 CO Sensor** (measures Carbon Monoxide)
5. **DHT11 or DHT22 Sensor** (measures Temperature and Humidity)
6. **MQ-131 O3 Sensor** (optional - measures Ozone)
7. **SIM Card** with active data plan
8. **Power Supply** (5V for Arduino, 3.7-4.2V for SIM800L)
9. **Breadboard and Jumper Wires**

### Optional Components:
- LCD Display (16x2) for local readings
- SD Card Module for local data logging
- Battery pack for portable operation

---

## 🔧 Wiring Diagram

### Arduino Uno Connections:

```
ARDUINO UNO          →    COMPONENT
═══════════════════════════════════════════

Pin 2                →    DHT11/DHT22 Data Pin
Pin 7                →    SIM800L TX (receive)
Pin 8                →    SIM800L RX (transmit)
Pin 10               →    PMS5003 TX (receive)
Pin 11               →    PMS5003 RX (transmit)
Pin A0               →    MQ-7 Analog Output
Pin A1               →    MQ-131 Analog Output (optional)

5V                   →    DHT11, MQ-7, MQ-131 VCC
3.3V or 4.2V         →    SIM800L VCC (use voltage regulator!)
GND                  →    All GND pins (common ground)
```

### SIM800L GSM Module Wiring:
```
SIM800L PIN          →    CONNECTION
═══════════════════════════════════════════
VCC                  →    4.0V (use step-down from 5V)
GND                  →    Arduino GND
TXD                  →    Arduino Pin 7 (GSM_RX)
RXD                  →    Arduino Pin 8 (GSM_TX) via 1kΩ resistor
RST                  →    Not connected (or 3.3V for always on)
```

**⚠️ IMPORTANT**: SIM800L operates at 3.4V-4.4V. Do NOT connect 5V directly!
Use a voltage regulator (like LM2596 or AMS1117) to step down from 5V to 4.0V.

### PMS5003 Sensor Wiring:
```
PMS5003 PIN          →    CONNECTION
═══════════════════════════════════════════
VCC (Pin 1)          →    5V
GND (Pin 2)          →    Arduino GND
TXD (Pin 4)          →    Arduino Pin 10 (PMS_RX)
RXD (Pin 5)          →    Arduino Pin 11 (PMS_TX)
```

### DHT11/DHT22 Wiring:
```
DHT PIN              →    CONNECTION
═══════════════════════════════════════════
VCC                  →    5V
DATA                 →    Arduino Pin 2
GND                  →    Arduino GND
```
Add a 10kΩ pull-up resistor between VCC and DATA pin.

### MQ-7 CO Sensor:
```
MQ-7 PIN             →    CONNECTION
═══════════════════════════════════════════
VCC                  →    5V
GND                  →    Arduino GND
A0 (Analog Out)      →    Arduino Pin A0
```

### MQ-131 O3 Sensor (Optional):
```
MQ-131 PIN           →    CONNECTION
═══════════════════════════════════════════
VCC                  →    5V
GND                  →    Arduino GND
A0 (Analog Out)      →    Arduino Pin A1
```

---

## 📱 SIM Card Setup

1. **Insert SIM card** into the SIM800L module
2. **Ensure data plan is active** (need GPRS/mobile data)
3. **Know your APN**: 
   - Safaricom (Kenya): `safaricom`
   - Airtel (Kenya): `internet`
   - Vodafone: `internet`
   - AT&T: `phone`
   - Verizon: `vzwinternet`

---

## 💻 Software Setup

### 1. Install Required Libraries

Open Arduino IDE and install these libraries:
- **DHT sensor library** by Adafruit
- **Adafruit Unified Sensor** by Adafruit

Go to: `Sketch > Include Library > Manage Libraries`

### 2. Configure the Code

Open `air_quality_gsm_sender.ino` and modify these lines:

```cpp
// Line 24-26: Update your APN
const char* APN = "safaricom";  // Change to your carrier's APN

// Line 27: Update your backend URL
const char* BACKEND_URL = "your-backend-url.onrender.com";

// Line 31: Set sending interval (milliseconds)
const unsigned long SEND_INTERVAL = 60000;  // 60 seconds
```

### 3. Upload the Code

1. Connect Arduino to computer via USB
2. Select board: `Tools > Board > Arduino Uno` (or your board)
3. Select port: `Tools > Port > COM# (Arduino Uno)`
4. Click **Upload** button

---

## 🧪 Testing

### Serial Monitor Testing:

1. Open Serial Monitor: `Tools > Serial Monitor`
2. Set baud rate to **9600**
3. You should see:

```
=================================
Air Quality GSM Sender Starting
=================================

--- Initializing GSM Module ---
CMD: AT
OK
✓ SIM card ready
Connecting to GPRS...
✓ GSM Module Ready!

--- Current Sensor Readings ---
PM2.5: 23.5 µg/m³
PM10:  45.2 µg/m³
CO:    4.3 ppm
O3:    25.1 ppb
Temp:  28.5 °C
Humid: 65.0 %
--------------------------------

>>> Sending data to backend...
Payload: {"location":"Nairobi","metrics":{"pm25":23.5,"pm10":45.2,"co":4.3,"o3":25.1,"temperature":28.5,"humidity":65.0}}
✓ Data sent successfully!
```

---

## 🔍 Troubleshooting

### GSM Module Issues:

**Problem**: `SIM card error`
- **Solution**: Check SIM card is inserted correctly
- Ensure SIM card has active data plan
- Try resetting the module

**Problem**: `GPRS connection failed`
- **Solution**: Check APN settings
- Verify SIM card has data/GPRS enabled
- Check signal strength (CSQ command should return > 10)

**Problem**: `HTTP request failed`
- **Solution**: Verify backend URL is correct
- Ensure backend is running and accessible
- Check if using HTTP (not HTTPS) - SIM800L has limited SSL support

### Sensor Issues:

**Problem**: All sensor readings show 0
- **Solution**: Check wiring connections
- Verify sensors are powered (check VCC and GND)
- Allow MQ sensors to warm up (2-3 minutes)

**Problem**: DHT readings show NaN
- **Solution**: Check 10kΩ pull-up resistor
- Verify DHT_TYPE matches your sensor (DHT11 or DHT22)
- Try different pin

### Power Issues:

**Problem**: GSM module restarts repeatedly
- **Solution**: SIM800L needs 2A current during transmission
- Use separate power supply or large capacitor (100-1000µF)
- Check voltage is 3.7V-4.2V (not 5V!)

---

## 📊 Backend Verification

### Check if data is received:

1. Open your backend logs (Render dashboard)
2. Look for: `POST /api/sensor-data`
3. Check database (MongoDB) for new readings
4. Open your frontend dashboard - you should see real-time updates!

### Test with Postman (optional):

```
POST https://your-backend-url.onrender.com/api/sensor-data
Content-Type: application/json

{
  "location": "Test Site",
  "metrics": {
    "pm25": 25.5,
    "pm10": 50.2,
    "co": 3.8,
    "o3": 30.1,
    "temperature": 27.5,
    "humidity": 60.0
  }
}
```

Expected response:
```json
{
  "success": true
}
```

---

## ⚡ Power Management Tips

1. **Use deep sleep** between readings to save battery
2. **Send data less frequently** (5-15 minutes) to reduce power consumption
3. **Use solar panel** for outdoor installations
4. **Monitor battery voltage** and send low-battery alerts

---

## 🎯 Next Steps

1. ✅ Wire up all components according to diagram
2. ✅ Install required Arduino libraries
3. ✅ Configure APN and backend URL in code
4. ✅ Upload code to Arduino
5. ✅ Monitor Serial output to verify GSM connection
6. ✅ Check backend logs for incoming data
7. ✅ View real-time data on your dashboard!

---

## 📞 Support

If you encounter issues:
1. Check all wiring connections
2. Verify power supply voltages
3. Review Serial Monitor output for error messages
4. Ensure SIM card has active data plan
5. Test backend endpoint with Postman first

Good luck! 🚀
