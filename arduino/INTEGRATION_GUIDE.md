# Integration Guide for Your Arduino Setup

## ✅ What I Did

I've integrated your existing Arduino code with GSM data transmission to your live backend. Your display, sensors, and everything else stays exactly the same - I just added automatic cloud uploads.

## 📦 Your Hardware (Already Connected)

✅ **Sensors Working:**
- PMS5003 (PM1.0, PM2.5, PM10) on Serial2
- DHT11 (Temperature, Humidity) on Pin 7
- MQ-7 (CO) on A0
- SGP41 (VOC, NOx) on I2C
- RTC DS3231 on I2C
- ST7920 Display on SPI (pins 13, 11, 10, 8)

✅ **GSM Module:**
- SIM800L on Serial1 (already defined in your code)

## 🚀 Quick Start (3 Steps)

### Step 1: Update Configuration (2 lines)

Open `integrated_gsm_sender.ino` and change:

```cpp
// Line 32-33: Update these values
const char* APN = "safaricom";  // Your mobile carrier APN
const char* BACKEND_URL = "your-backend.onrender.com";  // Your Render URL (from deployment)
```

**Finding your Render URL:**
1. Go to [render.com](https://render.com) dashboard
2. Click your `air-quality-backend` service
3. Copy the URL (e.g., `air-quality-backend-xyz.onrender.com`)
4. Paste WITHOUT `https://` (just the domain)

### Step 2: Upload to Arduino

1. Open Arduino IDE
2. Load `integrated_gsm_sender.ino`
3. Select your board (Tools → Board)
4. Select your COM port (Tools → Port)
5. Click **Upload**

### Step 3: Monitor & Verify

1. Open Serial Monitor (Tools → Serial Monitor)
2. Set baud rate to **115200**
3. Watch for:

```
================================
Air Quality Monitor with GSM
================================

=== Initializing GSM ===
GSM CMD: AT
OK
✓ SIM card ready
Connecting to GPRS...
✓ GSM Module Ready!

>>> Sending data to backend...
Payload: {"location":"Nairobi","metrics":{"pm25":25,"pm10":50,"co":3.45,"temperature":27.5,"humidity":65.0,"voc_index":150,"nox_index":80}}
✓ Data sent successfully!
```

4. Check your dashboard at your Vercel URL
5. Go to **Real-Time** page
6. You should see live data updating!

## 📊 What Data Gets Sent

Every 60 seconds, your Arduino sends:

```json
{
  "location": "Nairobi",
  "metrics": {
    "pm25": 25,
    "pm10": 50,
    "co": 3.45,
    "temperature": 27.5,
    "humidity": 65.0,
    "voc_index": 150,
    "nox_index": 80
  }
}
```

## ⚙️ What Changed in Your Code

**Added:**
- GSM initialization on startup
- Automatic data transmission every 60 seconds
- HTTP POST to your backend
- Error handling and retry logic

**Unchanged:**
- All display pages (PM, VOC/NOx, Environment, Advice)
- Sensor reading logic
- Page switching (every 4 seconds)
- RTC time display
- Everything you see on screen!

## 🔧 Customization Options

### Change Send Interval

```cpp
// Line 35: Default is 60 seconds
const unsigned long SEND_INTERVAL = 60000;  // Change to 120000 for 2 minutes
```

### Change Location Name

```cpp
// Inside sendDataToBackend() function:
jsonData += "\"location\":\"Nairobi\",";  // Change "Nairobi" to your location
```

### Debug Output

Serial Monitor shows:
- GSM initialization status
- Sensor readings
- Data transmission attempts
- Success/failure messages

## 🐛 Troubleshooting

### "SIM card error"
- Check SIM card is inserted correctly
- Verify SIM has active data plan
- Try in a phone to confirm it works

### "GPRS connection failed"
- Check APN is correct for your carrier
- Verify data/GPRS is enabled on SIM
- Check signal strength in your area

### "HTTP request failed"
- Verify `BACKEND_URL` is correct (no `https://`, no trailing `/`)
- Check backend is running on Render
- Test backend health: `https://your-backend.onrender.com/health`

### Display shows data but not sending
- Check Serial Monitor for GSM errors
- Verify SIM800L has power (needs 2A!)
- Add 1000µF capacitor across SIM800L VCC/GND if it keeps resetting

### "Sensors warming up" forever
- Normal for first 10 seconds (SGP41 conditioning)
- Data sends only after warmup completes

## 📱 Power Requirements

Your SIM800L needs **stable 3.7-4.2V** and can draw **2A during transmission**:

1. **Don't connect to 5V!** Use voltage regulator
2. Add large capacitor (1000µF) for current spikes
3. Use quality power supply (2A minimum)

## ✅ Success Checklist

- [ ] `BACKEND_URL` updated in code
- [ ] `APN` matches your carrier
- [ ] Code uploaded to Arduino
- [ ] Serial Monitor shows "✓ GSM Module Ready!"
- [ ] Serial Monitor shows "✓ Data sent successfully!"
- [ ] Dashboard Real-Time page shows new data
- [ ] Display cycling through all 4 pages normally

## 🎯 Expected Behavior

**Every 60 seconds:**
1. Arduino reads all sensors
2. Builds JSON payload
3. Sends via GSM to backend
4. Backend stores in MongoDB
5. Dashboard updates in real-time via WebSocket
6. Display continues showing local readings

**Your display:**
- Page 0: PM levels
- Page 1: VOC & NOx indices
- Page 2: Temperature, Humidity, CO
- Page 3: Air quality advice

All working as before!

## 📊 Backend Updates

I also updated the backend database schema to accept your new sensors:
- `voc_index` from SGP41
- `nox_index` from SGP41

These will automatically appear in your dashboard analytics!

## 🎉 You're Done!

Once you see "✓ Data sent successfully!" in Serial Monitor, your air quality data is live on the internet! 

Check your dashboard and watch the Real-Time page update automatically.

Need help? Check the Serial Monitor output first - it shows exactly what's happening with GSM and data transmission.
