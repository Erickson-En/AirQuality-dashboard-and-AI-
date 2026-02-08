# Your Air Quality System Configuration

## ✅ Backend Status: DEPLOYED & WORKING

**Backend URL:** `https://backend-air-quality.onrender.com/`

**Test Result:** ✅ Successfully tested - data is being received and stored!

## 🔧 Arduino Configuration (Already Updated)

Your `air_quality_gsm.ino` is now configured with:

```cpp
const char* SERVER = "backend-air-quality.onrender.com";
const int PORT = 443;  // HTTPS
const char* ENDPOINT = "/api/sensor-data";
```

## 📡 Important Notes for Render Deployment

### 1. HTTPS Required
Render provides HTTPS by default, so:
- Use port **443** (not 5000)
- Use **https://** protocol in Arduino code ✅ (already configured)
- No need to specify port in URL

### 2. GSM Module HTTPS Support

⚠️ **Critical:** SIM800L/SIM900 may have issues with HTTPS. Solutions:

#### Option A: Enable SSL in GSM Module (Recommended)
```cpp
// Add before HTTP commands in Arduino code:
sendATCommand("AT+HTTPSSL=1", 2000);  // Enable SSL
```

#### Option B: Use HTTP Proxy (If Option A doesn't work)
If your GSM module doesn't support HTTPS well, you have two options:
1. Deploy a simple HTTP-to-HTTPS proxy
2. Contact me and I can help set up a workaround

#### Option C: Test Without SSL First
For initial testing, you can temporarily disable HTTPS requirement on your backend, but **not recommended for production**.

## 🧪 Testing Commands

### Test Backend from Computer:
```powershell
$body = @{
    location = "Arduino Test"
    metrics = @{
        pm25 = 35.5
        pm10 = 82.3
        co = 4.2
        temperature = 25.5
        humidity = 60.2
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://backend-air-quality.onrender.com/api/sensor-data" -Method Post -Body $body -ContentType "application/json"
```

### Get Latest Reading:
```powershell
Invoke-RestMethod -Uri "https://backend-air-quality.onrender.com/api/sensor-data/latest" -Method Get
```

### Get Historical Data:
```powershell
Invoke-RestMethod -Uri "https://backend-air-quality.onrender.com/api/historical" -Method Get
```

### Health Check:
```powershell
Invoke-RestMethod -Uri "https://backend-air-quality.onrender.com/health" -Method Get
```

## 📱 SIM Card Configuration

### Common Kenyan APNs (Update in Arduino code line 21):
```cpp
// Safaricom
const char* APN = "safaricom";
// or
const char* APN = "internet";

// Airtel
const char* APN = "internet";
```

## 🚀 Next Steps

1. **Assemble Hardware** (see HARDWARE_SETUP.md)
   - Arduino board
   - SIM800L GSM module
   - Air quality sensors
   - Power supply (3.7-4.2V for GSM)

2. **Update Arduino Code** (if needed)
   - Line 21: Set your carrier's APN
   - Line 26: Set your location name
   - Lines 150-190: Implement your specific sensor reading functions

3. **Test SSL Support**
   - Add `AT+HTTPSSL=1` command in Arduino code
   - Test connection with Serial Monitor
   - If issues, contact for HTTP proxy solution

4. **Upload to Arduino**
   - Open air_quality_gsm.ino in Arduino IDE
   - Select your board and port
   - Upload code

5. **Monitor & Verify**
   - Open Serial Monitor (9600 baud)
   - Watch for "Data sent successfully!"
   - Check dashboard for real-time updates

## 📊 Data Flow

```
Arduino Sensors → GSM Module (with SIM) → 
Mobile Network → Internet → 
https://backend-air-quality.onrender.com/api/sensor-data → 
MongoDB → WebSocket → 
Your Dashboard (Real-time display)
```

## 🔍 Troubleshooting

### If GSM Can't Connect:
1. Check SIM has active data plan
2. Verify APN is correct for your carrier
3. Check signal strength (AT+CSQ command)
4. Try disabling SSL temporarily to test

### If Data Not Appearing:
1. Check Serial Monitor for error messages
2. Verify backend is awake (Render may sleep after inactivity)
3. Test backend URL manually (commands above)
4. Check MongoDB connection in backend logs

### Backend Sleep Issue (Render Free Tier):
Render free tier sleeps after 15 minutes of inactivity. Solutions:
1. Use a ping service to keep it awake
2. Upgrade to paid tier
3. First request after sleep takes ~30 seconds

## 💡 Pro Tips

1. **Test sensors individually** before combining
2. **Use Serial Monitor** to debug GSM commands
3. **Start with longer intervals** (5-15 minutes) to save data/battery
4. **Monitor data usage** on your SIM card
5. **Keep GSM module well-powered** (2A capable supply)

## 🎉 Success Indicators

✅ Serial Monitor shows "Data sent successfully!"  
✅ Backend /api/sensor-data/latest returns your data  
✅ Dashboard displays real-time updates  
✅ MongoDB contains your readings  
✅ Alerts trigger when thresholds exceeded  

---

**Your system is ready to go! The backend is deployed and tested.** 🚀

Next: Assemble hardware and upload the Arduino code!
