# Quick Start Guide - GSM Air Quality System

## 🚀 Get Started in 3 Steps

### Step 1: Test GSM Connection (Recommended First)
Use the **simple test version** to verify GSM works:

1. **Wire only GSM module:**
   ```
   SIM800L TX  →  Arduino Pin 7
   SIM800L RX  →  Arduino Pin 8 (via 1kΩ resistor)
   SIM800L VCC →  4.0V (NOT 5V!)
   SIM800L GND →  Arduino GND
   ```

2. **Update configuration in `gsm_test_simple.ino`:**
   ```cpp
   const char* APN = "safaricom";  // Your carrier APN
   const char* BACKEND_URL = "your-backend-url.onrender.com";
   ```

3. **Upload and test:**
   - Upload `gsm_test_simple.ino` to Arduino
   - Open Serial Monitor (9600 baud)
   - Watch for "✓ Data sent successfully!"
   - Check your dashboard for test data

### Step 2: Add Real Sensors
Once GSM works, add sensors one by one:

1. **Start with DHT11** (easiest):
   ```
   DHT11 VCC  →  5V
   DHT11 DATA →  Arduino Pin 2 (+ 10kΩ pull-up to 5V)
   DHT11 GND  →  Arduino GND
   ```

2. **Add PMS5003** for PM measurements:
   ```
   PMS5003 Pin 1 (VCC) →  5V
   PMS5003 Pin 2 (GND) →  GND
   PMS5003 Pin 4 (TX)  →  Arduino Pin 10
   PMS5003 Pin 5 (RX)  →  Arduino Pin 11
   ```

3. **Add MQ-7** for CO measurement:
   ```
   MQ-7 VCC →  5V
   MQ-7 A0  →  Arduino Pin A0
   MQ-7 GND →  Arduino GND
   ```

### Step 3: Run Full System
Upload `air_quality_gsm_sender.ino` with all sensors connected.

---

## 📋 Configuration Checklist

- [ ] SIM card inserted and has active data plan
- [ ] APN configured correctly (check with your carrier)
- [ ] Backend URL updated in code
- [ ] All sensors wired correctly
- [ ] Power supply adequate (2A for GSM module)
- [ ] Serial Monitor shows successful transmission

---

## 🔧 Common APNs by Carrier

| Carrier | Country | APN |
|---------|---------|-----|
| Safaricom | Kenya | `safaricom` |
| Airtel | Kenya | `internet` |
| MTN | Various | `internet` |
| Vodacom | South Africa | `internet` |
| Telkom | Kenya | `telkom` |
| AT&T | USA | `phone` |
| T-Mobile | USA | `fast.t-mobile.com` |
| Verizon | USA | `vzwinternet` |

---

## 🎯 Expected Serial Monitor Output

```
===============================
GSM Sender Test - Starting
===============================

--- Initializing GSM ---
CMD: AT
OK
CMD: AT+CPIN?
+CPIN: READY
OK
✓ SIM card ready
CMD: AT+CSQ
+CSQ: 18,0
OK
Connecting to GPRS...
✓ GSM Ready!

>>> Sending test data...
Payload: {"location":"Test Site","metrics":{"pm25":23.5,"pm10":45.2,"co":3.4,"o3":28,"temperature":26.5,"humidity":65.0}}
CMD: AT+HTTPPARA="URL","http://your-backend-url.onrender.com/api/sensor-data"
OK
✓ Data sent successfully!
```

---

## ⚠️ Critical Safety Notes

1. **SIM800L Voltage**: Must be 3.4V - 4.4V (NOT 5V!)
2. **Current**: Needs 2A during transmission - use capacitor or separate supply
3. **Level Shifting**: RX pin needs voltage divider (1kΩ + 2kΩ resistors)
4. **Antenna**: Must be connected before powering on

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "SIM card error" | Check SIM inserted correctly, has data plan |
| "GPRS failed" | Verify APN is correct for your carrier |
| "HTTP request failed" | Check backend URL, ensure HTTP not HTTPS |
| GSM keeps resetting | Add 1000µF capacitor across VCC/GND |
| No sensor data | Check wiring, wait 2-3 min for MQ sensors to warm up |
| Backend not receiving | Test URL with Postman/browser first |

---

## 📱 Test Backend Manually

Before using Arduino, test your backend with curl:

```bash
curl -X POST https://your-backend-url.onrender.com/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Test",
    "metrics": {
      "pm25": 25.5,
      "pm10": 50.0,
      "co": 3.5,
      "o3": 30,
      "temperature": 27.0,
      "humidity": 60.0
    }
  }'
```

Expected response: `{"success":true}`

---

## 📊 View Your Data

1. **Dashboard**: Open `http://localhost:3000` (development)
2. **Real-time page**: See live sensor updates
3. **Analytics page**: View trends and correlations
4. **Historical page**: Review past data

---

## 💡 Tips for Success

1. **Start Simple**: Test GSM alone first, then add sensors
2. **Check Signal**: CSQ value should be > 10 (higher is better)
3. **Power**: Use quality 2A USB adapter or battery pack
4. **Antenna**: GSM needs antenna connected - don't skip it!
5. **Monitor Logs**: Keep Serial Monitor open during testing
6. **Backend First**: Verify backend is running before testing Arduino

---

## 📞 Need Help?

1. Check wiring against diagrams in SETUP_GUIDE.md
2. Review Serial Monitor output for errors
3. Test backend endpoint with Postman
4. Verify SIM card works (test in phone first)
5. Check GSM signal strength in your area

Good luck! Your air quality monitoring system is almost ready! 🌍💚
