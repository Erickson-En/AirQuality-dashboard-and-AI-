# 🚨 QUICK FIX FOR HTTP 301 ERROR

## What's Wrong
Your Arduino is getting **HTTP 301 redirect** because Railway forces HTTPS, but SIM800L struggles with SSL.

## THE SOLUTION (2 Steps)

### Step 1: Try HTTPS First

In [integrated_gsm_sender.ino](arduino/integrated_gsm_sender.ino), line 43:
```cpp
const char* PROTOCOL = "https://";  // Already set correctly
```

**Upload to Arduino and test.** 

- ✅ **If you see "Status: 200"** → You're done! 🎉
- ❌ **If you see "Error 606"** → Continue to Step 2

---

### Step 2: Deploy HTTP Proxy (When HTTPS Fails)

#### A. Deploy Proxy to Railway

```bash
# In your project folder
cd "c:\Users\PC\Desktop\Air Quality data\airqualitydashboard"

# Deploy (will use existing package.json)
railway init
railway up

# Set target
railway variables set TARGET_URL=https://backend-air-quality-production.up.railway.app

# Get your URL
railway domain
```

Copy the URL shown (e.g., `airqualitydashboard-production-xxxx.up.railway.app`)

#### B. Update Arduino Code

Change these lines in `integrated_gsm_sender.ino`:

```cpp
// Line 40: Use your proxy URL
const char* BACKEND_URL = "your-proxy-url.up.railway.app";  // ← CHANGE THIS

// Line 43: Use HTTP for proxy
const char* PROTOCOL = "http://";  // ← CHANGE THIS
```

#### C. Upload and Test

You should see:
```
HTTP Status: 200
✓ Data sent successfully!
```

---

## Files Updated

✅ [arduino/integrated_gsm_sender.ino](arduino/integrated_gsm_sender.ino) - Better error messages
✅ [http-proxy-server.js](http-proxy-server.js) - Uses environment variables
✅ [TROUBLESHOOTING_301_REDIRECT.md](arduino/TROUBLESHOOTING_301_REDIRECT.md) - Detailed guide
✅ [PROXY_DEPLOYMENT_GUIDE.md](PROXY_DEPLOYMENT_GUIDE.md) - Full deployment steps

---

## Still Stuck?

1. **Check Serial Monitor** - What status code do you see?
2. **Check GPRS IP** - Is it a real IP (not 0.0.0.0)?
3. **Test SIM in Phone** - Can you browse internet?
4. **Try different APN** - Change to "internet" instead of "safaricom"

---

## Common Errors Reference

| Code | Meaning | Fix |
|------|---------|-----|
| 301 | Redirect | Use HTTPS or use proxy |
| 606 | SSL Failed | Deploy HTTP proxy |
| 200 | Success | ✅ Working! |
| 0.0.0.0 IP | No Data Plan | Check SIM has active data |
