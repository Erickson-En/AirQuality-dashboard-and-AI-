# Fixing HTTP 301 Redirect Error

## What You're Seeing
```
+HTTPACTION: 1,301,0
HTTP Status: 301
```

**This means**: Your backend (Railway/Render) is redirecting HTTP to HTTPS, but the SIM800L cannot follow redirects automatically.

---

## Solution Path

### Step 1: Try HTTPS First (Quick Test)

1. **Update the code** (line 43 in `integrated_gsm_sender.ino`):
   ```cpp
   const char* PROTOCOL = "https://";
   ```

2. **Upload and test**

3. **Expected outcomes**:
   - ✅ **Success (Status 200/201)**: Perfect! You're done.
   - ❌ **Error 606 (SSL failed)**: Move to Step 2 - you need the HTTP proxy

---

### Step 2: Deploy HTTP Proxy (Recommended Solution)

If HTTPS fails with error 606 (SSL connection failed), use the HTTP proxy:

#### Why It Fails
- SIM800L requires 2A power supply for SSL
- Most USB/weak adapters drop voltage during HTTPS
- SIM800L firmware may not support modern TLS versions

#### HTTP Proxy Solution
The proxy acts as a bridge:
```
Arduino (HTTP) → Proxy (HTTP to HTTPS) → Backend (HTTPS)
```

---

## Deploying the HTTP Proxy

Your project already has `http-proxy-server.js` ready to use!

### Option A: Deploy to Railway

1. **Create new service**:
   ```bash
   # In your project folder
   railway up
   ```
   Or use Railway dashboard to deploy `http-proxy-server.js`

2. **Set environment variable**:
   - Variable: `TARGET_URL`
   - Value: `https://backend-air-quality-production.up.railway.app`

3. **Get your proxy URL**:
   - Example: `http-proxy-xxxxx.up.railway.app`

4. **Update Arduino code**:
   ```cpp
   const char* BACKEND_URL = "http-proxy-xxxxx.up.railway.app";
   const char* BACKEND_PATH = "/api/sensor-data";
   const char* PROTOCOL = "http://";
   ```

### Option B: Deploy to Render

1. **Create new Web Service** on Render dashboard
2. **Connect** your repository
3. **Configure**:
   - Build Command: `npm install`
   - Start Command: `node http-proxy-server.js`
   - Environment Variable: `TARGET_URL` = `https://backend-air-quality-production.up.railway.app`

4. **Get your proxy URL** and update Arduino code (same as above)

---

## Verify It Works

After deploying proxy and updating code:

1. **Upload to Arduino**
2. **Check Serial Monitor** for:
   ```
   HTTP Status: 200
   ✓ Data sent successfully!
   ```

3. **Check backend logs** - you should see sensor data arriving

---

## Quick Reference Table

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 301/302/307/308 | HTTP Redirect | Try HTTPS, or use proxy |
| 606 | SSL Failed | Use HTTP proxy (power issue) |
| 200/201 | Success | ✅ Working! |
| 601 | Network/DNS error | Check URL, GPRS connection |
| 602 | DNS failed | Check BACKEND_URL spelling |

---

## Still Having Issues?

1. **Check GPRS connection**:
   - Serial monitor should show valid IP (not 0.0.0.0)
   - Example: `+SAPBR: 1,1,"10.247.252.65"` ✅

2. **Verify SIM data plan**:
   - Test SIM in phone - can you browse internet?
   - Some SIMs only have airtime, not data

3. **Test different APN**:
   ```cpp
   const char* APN = "internet";  // Alternative for Safaricom
   ```

4. **Check power supply**:
   - SIM800L needs 3.7-4.2V with 2A current capability
   - Voltage drops during transmission cause failures
