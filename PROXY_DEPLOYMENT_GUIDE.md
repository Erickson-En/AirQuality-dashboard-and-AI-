# HTTP Proxy Server - Deployment Guide

## Why You Need This

Your Arduino SIM800L is getting **HTTP 301 redirects** because:
- Railway/Render force HTTPS connections
- SIM800L can't handle HTTPS properly (power/firmware limitations)

**Solution**: This proxy bridges HTTP ↔ HTTPS for you

```
Arduino (HTTP) → Proxy (HTTP in, HTTPS out) → Backend (HTTPS)
```

---

## Quick Deploy to Railway

### Method 1: Railway CLI (Fastest)

1. **Install Railway CLI** (if not installed):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy the proxy**:
   ```bash
   cd "c:\Users\PC\Desktop\Air Quality data\airqualitydashboard"
   railway init
   railway up
   ```

4. **Set environment variable**:
   ```bash
   railway variables set TARGET_URL=https://backend-air-quality-production.up.railway.app
   ```

5. **Get your proxy URL**:
   ```bash
   railway domain
   ```
   Example output: `http-proxy-production-xxxx.up.railway.app`

### Method 2: Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Configure:
   - **Root Directory**: `/`
   - **Build Command**: `npm install`
   - **Start Command**: `node http-proxy-server.js`
5. Add environment variable:
   - **Key**: `TARGET_URL`
   - **Value**: `https://backend-air-quality-production.up.railway.app`
6. Deploy and copy the generated URL

---

## Deploy to Render (Alternative)

1. Go to [Render Dashboard](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `http-proxy`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node http-proxy-server.js`
5. Add environment variable:
   - **Key**: `TARGET_URL`
   - **Value**: `https://backend-air-quality-production.up.railway.app`
6. Click **"Create Web Service"**
7. Copy the generated URL (e.g., `http-proxy-xxxx.onrender.com`)

---

## Update Arduino Code

Once deployed, update your `integrated_gsm_sender.ino`:

```cpp
// ----------------------
// GSM CONFIGURATION
// ----------------------
const char* APN = "safaricom";

// USE YOUR PROXY URL HERE (not the backend URL)
const char* BACKEND_URL = "http-proxy-xxxx.up.railway.app";  // ← Your proxy URL
const char* BACKEND_PATH = "/api/sensor-data";

// Use HTTP for proxy (proxy handles HTTPS to backend)
const char* PROTOCOL = "http://";
```

**Important**: 
- `BACKEND_URL` should be your **proxy URL**, not your backend URL
- Use `http://` protocol (proxy will convert to HTTPS)

---

## Test Your Proxy

### 1. Test with curl (from your computer):
```bash
curl -X POST http://your-proxy-url.up.railway.app/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"location":"Test","metrics":{"pm25":10,"pm10":20,"co":5,"temperature":25,"humidity":60,"voc_index":100,"nox_index":1}}'
```

**Expected response**:
```json
{"success":true,"forwarded":true,"backendStatus":200}
```

### 2. Check proxy logs:
- **Railway**: `railway logs`
- **Render**: Check logs in dashboard

You should see:
```
📥 Received from Arduino: {...}
✅ Forwarded successfully. Backend response: 200
```

### 3. Upload Arduino code and monitor:
```
>>> Sending data to backend...
URL: http://your-proxy-url.up.railway.app/api/sensor-data
+HTTPACTION: 1,200,45
HTTP Status: 200
✓ Data sent successfully!
```

---

## Troubleshooting

### Proxy shows 502/504 error
- **Cause**: Proxy can't reach backend
- **Fix**: Check `TARGET_URL` environment variable is correct

### Arduino still gets 301
- **Cause**: Using backend URL instead of proxy URL
- **Fix**: Update `BACKEND_URL` in Arduino code to proxy URL

### Proxy works but backend shows no data
- **Cause**: Backend might be rejecting requests
- **Fix**: Check backend logs for authentication/validation errors

### "Cannot find module" error
- **Cause**: Dependencies not installed
- **Fix**: Ensure `package.json` has `express` and `axios`, redeploy

---

## Monitoring

### Check if proxy is running:
```bash
curl http://your-proxy-url.up.railway.app/
```

**Expected response**:
```json
{
  "status": "HTTP Proxy Running",
  "forwards_to": "https://backend-air-quality-production.up.railway.app",
  "note": "SIM800L sends HTTP here, proxy forwards to HTTPS backend"
}
```

### View logs in real-time:
- **Railway**: `railway logs --follow`
- **Render**: Dashboard → Logs tab

---

## Cost

- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier (750 hours/month)

Both sufficient for a proxy that runs 24/7 (720 hours/month)

---

## Next Steps

1. ✅ Deploy proxy using method above
2. ✅ Get proxy URL
3. ✅ Update Arduino code with proxy URL
4. ✅ Change PROTOCOL to `http://`
5. ✅ Upload to Arduino
6. ✅ Check Serial Monitor for "Status: 200"
7. ✅ Verify data in backend logs

---

## Need Help?

Check logs in this order:
1. **Arduino Serial Monitor** - See what Arduino sends
2. **Proxy Logs** - See if proxy receives and forwards
3. **Backend Logs** - See if data is processed

The error will show in one of these three places.
