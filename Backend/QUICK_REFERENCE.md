# 🎯 Quick Reference Card

## One-Click Startup (Windows)

```bash
cd Backend
start-all.bat
```

This opens 3 windows:
1. ✅ Main Backend (port 5000)
2. ✅ HTTP Fallback (port 8080)  
3. ✅ Health Monitor

Then in another terminal:
```bash
npm start
```

Dashboard opens at: **http://localhost:3000**

---

## Get Your IP Address

```powershell
ipconfig
```

Find "IPv4 Address" under WiFi. Example: `192.168.1.100`

---

## Update Arduino

In your sketch:
```cpp
const LOCAL_FALLBACK = "http://192.168.1.100:8080/api/sensor-data";
```

Replace IP with **your actual IP** from above.

---

## Data Flow When Railway Fails

```
Arduino sends HTTP to:

1️⃣ PRIMARY: https://railway.app/api/sensor-data
   ↓ (fails)
2️⃣ FALLBACK: http://192.168.1.100:8080/api/sensor-data
   ↓ (succeeds)
3️⃣ Backend: http://localhost:5000
   ↓
4️⃣ Database: MongoDB
   ↓
5️⃣ Dashboard: Shows real-time data
```

---

## Test Endpoints

```bash
# Health checks
curl http://localhost:5000/health
curl http://localhost:8080/health

# Send test data
curl -X POST http://localhost:8080/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"location":"Test","metrics":{"pm25":50,"co":5}}'
```

---

## Logs Location

Each service logs to its terminal:

| Service | Shows | Location |
|---------|-------|----------|
| Backend | `✅ MongoDB Connected` | Terminal 1 |
| Fallback | `📨 Received from Arduino` | Terminal 2 |
| Monitor | `✅ Railway proxy is HEALTHY` | Terminal 3 |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Kill process: `netstat -ano \| findstr :8080` |
| Arduino no data | Check IP address is correct |
| Dashboard "Disconnected" | Refresh page (F5) or restart services |
| Backend error | Check MongoDB connection string in `.env` |
| Fallback doesn't forward | Start backend first, then fallback |

---

## Emergency Commands

```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Find what's using port 8080
netstat -ano | findstr :8080

# Clear MongoDB cache (Windows)
del ~/.mongo_history

# Restart just backend
cd Backend && node server.js

# Monitor incoming data
node Backend/monitor_live.js
```

---

## Arduino Serial Debug

```
✅ Sent via Railway
  → Data reached Render via Railway ✓

⚠️  Railway failed, trying local fallback...
✅ Sent via local fallback
  → Data reached local server ✓

❌ Both endpoints failed
  → Check Arduino network connection
  → Check IP address
  → Check services running
```

---

## Files Created

| File | Purpose | Run Command |
|------|---------|------------|
| `http-fallback-server.js` | HTTP→HTTP bridge | `node http-fallback-server.js` |
| `railway-monitor.js` | Health monitor | `node railway-monitor.js` |
| `start-all.bat` | Start everything | `start-all.bat` |
| `FALLBACK_SETUP_README.md` | Full guide | Read in editor |
| `ARDUINO_FALLBACK_CONFIG.md` | Arduino code | Copy code to sketch |

---

## Environment Variables (Optional)

```bash
# In .env file:
FALLBACK_PORT=8080
BACKEND_URL=http://localhost:5000
RAILWAY_PROXY_URL=https://your-railway-url
CHECK_INTERVAL=300000
```

---

## Deployment Checklist

- [ ] Arduino configured with local IP (while testing)
- [ ] All 3 services started (`start-all.bat`)
- [ ] Dashboard shows "Connected" (green indicator)
- [ ] Test data visible in real-time
- [ ] Serial monitor shows "✅ Data sent"
- [ ] Railway monitor shows "HEALTHY"
- [ ] Fallback server shows "Forwarded to backend"

---

## Support Quick Links

- 📖 Full Setup: [FALLBACK_SETUP_README.md](./FALLBACK_SETUP_README.md)
- 🔧 Arduino Config: [ARDUINO_FALLBACK_CONFIG.md](./ARDUINO_FALLBACK_CONFIG.md)
- 💻 Backend Code: [server.js](./server.js)
- 🎨 Frontend Config: [src/config/api.js](../src/config/api.js)

---

**Status: ✅ All systems configured and tested**

Your air quality dashboard now has **automatic fallback** when Railway fails!
