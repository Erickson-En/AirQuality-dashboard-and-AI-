# Quick Start Guide: Arduino GSM to Dashboard

## 🎯 What You Have

Your backend is **already configured** to receive real sensor data! The endpoint `/api/sensor-data` accepts POST requests with sensor readings.

## 📋 What You Need

### Hardware
1. Arduino board (Uno/Mega)
2. SIM800L or SIM900 GSM module
3. SIM card with data plan
4. Air quality sensors (MQ-135, PMS5003, DHT22, etc.)
5. 3.7-4.2V power supply for GSM module

### Software
1. Arduino IDE
2. Your backend server accessible over internet

## 🚀 Quick Setup Steps

### 1. Hardware Assembly
See `HARDWARE_SETUP.md` for detailed wiring instructions.

**Key Points:**
- GSM module needs separate 3.7-4.2V power (2A capable)
- Connect all grounds together
- Wire sensors to Arduino pins as specified in code

### 2. Configure Arduino Code

Open `air_quality_gsm.ino` and update:

```cpp
// Line 19-26
const char* APN = "your-carrier-apn";        // e.g., "internet"
const char* SERVER = "your-server.com";      // Your server address
const int PORT = 5000;                        // Your server port
const char* LOCATION = "Site A";              // Your location name
```

### 3. Upload to Arduino

1. Open `air_quality_gsm.ino` in Arduino IDE
2. Select board: Tools → Board → Arduino Uno
3. Select port: Tools → Port → COMx
4. Click Upload

### 4. Monitor Serial Output

1. Open Serial Monitor (Ctrl+Shift+M)
2. Set baud rate to 9600
3. Watch for "Data sent successfully!"

### 5. View Data in Dashboard

Your dashboard will automatically receive and display the real sensor data via WebSocket!

## 📡 Data Flow

```
Arduino Sensors → GSM Module → Internet → 
Your Backend (/api/sensor-data) → MongoDB → 
WebSocket → Dashboard (real-time updates)
```

## 🔍 Testing Without Hardware

Test the backend first:

```bash
curl -X POST http://localhost:5000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"location":"Test","metrics":{"pm25":35,"pm10":82,"co":4}}'
```

## 📚 Detailed Documentation

- `HARDWARE_SETUP.md` - Complete hardware guide, wiring, troubleshooting
- `BACKEND_CONFIG.md` - Server deployment, security, production setup
- `air_quality_gsm.ino` - Arduino code with extensive comments

## ⚡ Key Changes Made

**No backend changes needed!** Your server.js already has:
- ✅ `/api/sensor-data` POST endpoint ready
- ✅ WebSocket real-time broadcasting
- ✅ MongoDB storage
- ✅ Alert system with threshold checking
- ✅ Historical data endpoints

## 🎓 Next Steps

1. **Assemble hardware** following HARDWARE_SETUP.md
2. **Deploy backend** to accessible server (see BACKEND_CONFIG.md)
3. **Update Arduino code** with your server details
4. **Upload and test** Arduino code
5. **Watch dashboard** update with real data!

## 💡 Tips

- Test GSM connectivity separately first
- Some sensors need 5-30 minute warm-up time
- Adjust sending interval (default: 1 minute) for battery life
- Use ngrok for quick testing before production deployment

## 🆘 Need Help?

Check the troubleshooting sections in:
- HARDWARE_SETUP.md (hardware issues)
- BACKEND_CONFIG.md (server/network issues)
- Arduino Serial Monitor (connection debugging)

---

**No fake data needed anymore!** Once connected, your Arduino will send real sensor readings to your dashboard automatically. 🎉
