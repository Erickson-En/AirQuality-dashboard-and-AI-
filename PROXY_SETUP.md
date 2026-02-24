# HTTP Proxy Setup for SIM800L

## Problem
Your SIM800L module can't handle HTTPS because:
- SSL/TLS operations require 2A current spikes
- Your power supply causes brownouts (continuous blinking)
- Error 606: SSL connection failed

## Solution
Deploy this HTTP proxy that:
- Accepts HTTP requests from Arduino
- Forwards them to your HTTPS Render backend
- Arduino only does simple HTTP (low power)

## Deployment Steps

### 1. Deploy Proxy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository (or create a new one with these files)
4. Settings:
   - **Name**: `air-quality-proxy`
   - **Root Directory**: Leave blank (or point to proxy folder if needed)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node http-proxy-server.js`
5. Before deploying, rename `proxy-package.json` to `package.json`:
   ```bash
   # In your project root
   mv proxy-package.json package.json
   ```
6. Click **Create Web Service**
7. Wait for deployment (2-3 minutes)
8. **Copy the URL** (e.g., `air-quality-proxy.onrender.com`)

### 2. Update Arduino Code

Open `integrated_gsm_sender.ino` and update line 41:

```cpp
// Change this line:
const char* BACKEND_URL = "YOUR-PROXY-URL.onrender.com";

// To your actual proxy URL (example):
const char* BACKEND_URL = "air-quality-proxy.onrender.com";
```

Make sure line 47 says:
```cpp
const char* PROTOCOL = "http://";  // MUST be http, not https
```

### 3. Upload to Arduino

1. Open Arduino IDE
2. Upload the updated code
3. Open Serial Monitor (115200 baud)

### 4. Expected Output

```
✓ GPRS Connected with valid IP!
AT+HTTPINIT
AT+HTTPPARA="URL","http://air-quality-proxy.onrender.com/api/sensor-data"
+HTTPACTION: 1,200,0
HTTP Status: 200
✓ Data sent successfully!
```

## Troubleshooting

### Still Getting Error 606?
- Make sure you updated BOTH the URL and changed to `http://`
- Verify the proxy is running (visit `http://your-proxy.onrender.com` in browser)

### Proxy Deployment Failed?
Make sure you renamed `proxy-package.json` to `package.json` before deploying

### Data Not Reaching Backend?
- Check proxy logs on Render dashboard
- Verify `BACKEND_URL` in proxy code points to your actual backend

## Files

- `http-proxy-server.js` - The proxy server code
- `proxy-package.json` - Dependencies (rename to package.json for deployment)
- `integrated_gsm_sender.ino` - Updated Arduino code (already configured for HTTP)

## How It Works

```
Arduino (HTTP) → Proxy (HTTP→HTTPS) → Render Backend (HTTPS) → MongoDB
```

The proxy acts as a bridge, handling the HTTPS conversion so your Arduino only needs simple HTTP.
