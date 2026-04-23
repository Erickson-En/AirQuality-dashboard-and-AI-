# 🔄 System Architecture Diagram

## Overall System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIR QUALITY DASHBOARD SYSTEM                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Arduino    │
│   GSM        │ (Sends JSON via HTTP)
│   Module     │
└──────┬───────┘
       │
       │ HTTP POST
       │ /api/sensor-data
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼ (Primary - HTTPS)                          ▼ (Fallback - HTTP local)
    ┌─────────────────┐                     ┌──────────────────┐
    │  Railway        │                     │  HTTP Fallback   │
    │  HTTPS Proxy    │                     │  Server          │
    │  (Production)   │                     │  (Development)   │
    └────────┬────────┘                     └────────┬─────────┘
             │ HTTPS                                 │ HTTP
             │ Encrypted                             │ Local Network
             │                                       │
             └───────────────────┬───────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Main Backend Server    │
                    │  (Node.js + Express)    │
                    │  :5000                  │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌────────────┐    ┌────────────┐   ┌────────────┐
        │ MongoDB    │    │ Socket.IO  │   │ API Routes │
        │ Database   │    │ WebSocket  │   │ /api/*     │
        └────────────┘    └──────┬─────┘   └────────────┘
                                 │
                                 │ Real-time events
                    ┌────────────▼─────────────┐
                    │  Frontend React App      │
                    │  (Port 3000)             │
                    └──────────────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │ Browser / UI     │
                    │ Dashboard        │
                    │ Charts & Metrics │
                    └──────────────────┘
```

---

## Startup Sequence

```
┌─────────────────────────────────────────────┐
│ Developer runs: start-all.bat               │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │Backend │  │Fallback│  │Monitor │
    │ :5000  │  │ :8080  │  │Railway │
    └───┬────┘  └───┬────┘  └───┬────┘
        │           │           │
        │ Connects  │ Ready    │ Starts
        │ MongoDB   │ for HTTP │ Health
        │           │ requests │ Checks
        │           │          │
        ▼           ▼          ▼
   ✅ Running    ✅ Running  ✅ Running
   
   Then:
   
   npm start → ✅ Frontend running
   
   Arduino sends data → 🔄 System receives and processes
```

---

## Data Collection Paths

### Path 1: Normal Operation (Railway Available)

```
Arduino (HTTP)
    │
    └─→ [Try Railway] ✅
           │
           └─→ Render Backend → MongoDB
                    │
                    └─→ Socket.IO → React → Dashboard 📊
```

### Path 2: Railway Failure (Fallback Active)

```
Arduino (HTTP)
    │
    ├─→ [Try Railway] ❌ Timeout/Error
    │
    └─→ [Try Local Fallback] ✅
           │
           └─→ Local HTTP Server (8080)
                    │
                    └─→ Render Backend → MongoDB
                             │
                             └─→ Socket.IO → React → Dashboard 📊
```

### Path 3: Complete Failure (Development Monitor)

```
Arduino (HTTP)
    │
    ├─→ [Try Railway] ❌
    │
    ├─→ [Try Fallback] ❌
    │
    └─→ Development team:
           - Checks logs
           - Runs: node monitor_live.js
           - Tests: curl http://localhost:5000/health
           - Verifies: Backend running
```

---

## Real-Time Data Flow

```
┌──────────────┐
│  Arduino     │ Reads sensors every 30s
└──────┬───────┘
       │ POST JSON
       │ {
       │   location: "Nairobi",
       │   metrics: {
       │     pm25: 35.5,
       │     co: 3.2,
       │     temperature: 25,
       │     ... 6 more fields
       │   }
       │ }
       │
       ▼
   [HTTP Endpoint]
   Railway OR Local
       │
       ▼
   ┌──────────────┐
   │  Backend     │
   │  Validation  │
   ├──────────────┤
   │ - Check JSON │
   │ - Validate   │
   │ - Save to DB │
   └──────┬───────┘
          │
          ├─→ Save: Reading collection
          │        └─→ MongoDB
          │
          └─→ Emit: "sensorData" event
             └─→ Socket.IO
                └─→ All connected clients
                    ├─→ Browser Tab 1 🌐
                    ├─→ Browser Tab 2 🌐
                    └─→ Mobile App 📱
                         │
                         ▼
                    ┌──────────────────┐
                    │  React Component │
                    │  RealTimeData.js │
                    ├──────────────────┤
                    │ - Update state   │
                    │ - Calc AQI       │
                    │ - Check alerts   │
                    │ - Redraw charts  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Dashboard UI    │
                    │  Shows:          │
                    │ - Metric cards   │
                    │ - Live charts    │
                    │ - AQI indicator  │
                    │ - Alerts         │
                    │ - Statistics     │
                    └──────────────────┘
```

---

## Monitoring & Health Checks

```
┌──────────────────────────────────────────┐
│  Railway Monitor (Runs every 5 minutes)  │
└────┬─────────────────────────────────────┘
     │
     ├─→ Check: https://railway.url/health
     │
     ├─→ Response 200 ✅
     │   └─→ Log: "Railway is HEALTHY"
     │
     └─→ Response ❌ or Timeout
         └─→ Consecutive failures counted
            ├─→ First failure: "⚠️  Warning"
            ├─→ 2nd failure: "❌ Offline detected"
            │   └─→ Notify: "Use fallback server"
            └─→ 3rd+ failures: Critical alert
                └─→ Signal: Activate redundancy


┌──────────────────────────────────────────┐
│  Health Check Endpoints (Any time)       │
└────┬─────────────────────────────────────┘
     │
     ├─→ curl http://localhost:5000/health
     │   └─→ {"status":"ok","service":"backend"}
     │
     ├─→ curl http://localhost:8080/health
     │   └─→ {"status":"ok","service":"fallback"}
     │
     └─→ curl http://localhost:3000/
         └─→ Dashboard loads ✅
```

---

## Error Handling & Fallback Logic

```
Arduino sends data
        │
        ▼
    [Timeout 15s]
        │
    ┌───┴───┐
    │       │
    ▼       ▼
Railway  Error?
    │       │
    │  ┌────┘
    │  │
    ▼  ▼
 Response?
    │
    ├─→ 200-299: ✅ SUCCESS
    │   └─→ Log "Data sent"
    │   └─→ Go to sleep
    │
    └─→ 4xx, 5xx, Timeout: ❌ FAIL
        │
        ▼
    Try Fallback
        │
        ├─→ Connects to 192.168.x.x:8080
        │
        ├─→ Fallback exists & responds: ✅
        │   └─→ Forwards to backend
        │   └─→ Backend saves to MongoDB
        │   └─→ Success!
        │
        └─→ Fallback also fails: ❌
            └─→ Log error
            └─→ Will retry next cycle
            └─→ Website shows: "Offline"
```

---

## Component Interactions

```
┌─────────────────────────────────────────────┐
│  3 Terminal Windows (from start-all.bat)    │
└─────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Terminal 1     │  │  Terminal 2     │  │  Terminal 3     │
│  Backend        │  │  Fallback       │  │  Monitor        │
└────┬────────────┘  └────┬────────────┘  └────┬────────────┘
     │                    │                    │
     │ Port 5000          │ Port 8080          │ HTTP Checks
     │ DB: MongoDB        │ Forwards to 5000   │ Reports health
     │ Emits: Sensor data │ Validates JSON     │ Alerts failures
     │ API: /api/*        │ CORS enabled       │ Logs stats
     │                    │                    │
     └────────┬───────────┴────────────────────┘
              │
              └──→ All three work together
                  to ensure data reaches
                  MongoDB no matter what!
```

---

## Network Topology

```
┌────────────────────────────────────────────────────────┐
│                INTERNET (Production)                   │
├────────────────────────────────────────────────────────┤
│  Railway HTTPS Proxy                                   │
│  (ssl.railway.app)                                     │
└─────────────────┬──────────────────────────────────────┘
                  │ HTTPS
                  │
    ┌─────────────┴──────────────┐
    │                            │
    ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│ Render Backend       │    │ Arduino GSM          │
│ air-quality...       │    │ cellular connection  │
│ onrender.com         │    │ (HTTPS only)         │
│ MongoDB Atlas        │    │                      │
└──────────────────────┘    └──────────────────────┘


┌────────────────────────────────────────────────────────┐
│                LOCAL NETWORK (Development)             │
├────────────────────────────────────────────────────────┤
│  192.168.1.x Subnet                                    │
│                                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │ Computer   │  │ Arduino    │  │ Tablets/   │      │
│  │ 192.168.x ├──┤ WiFi       │  │ Phones     │      │
│  │ :5000 ← ─ ┤  │ 192.168.x  │  │ (Dashboard)│      │
│  │ :3000     │  │ Wi-Fi      │  │            │      │
│  │ :8080     │  │            │  │            │      │
│  └────────────┘  └────────────┘  └────────────┘      │
└────────────────────────────────────────────────────────┘
```

---

## Database Schema (Simplified)

```sql
MongoDB Collections
│
├─ readings (sensor data)
│  ├─ _id: ObjectId
│  ├─ location: "Nairobi"
│  ├─ timestamp: 2026-04-17T14:30:00Z
│  └─ metrics: {
│     ├─ pm1: 15.3
│     ├─ pm25: 35.5
│     ├─ pm10: 60.2
│     ├─ co: 3.2
│     ├─ co2: 420
│     ├─ temperature: 25.5
│     ├─ humidity: 55
│     ├─ voc_index: 120
│     └─ nox_index: 45
│  }
│
├─ alerts (threshold violations)
│  ├─ readingId: ObjectId
│  ├─ metric: "pm25"
│  ├─ value: 45.5
│  ├─ threshold: 35.4
│  └─ severity: "unhealthy"
│
└─ users (authentication)
   ├─ username: "user@email.com"
   ├─ password: (hashed)
   └─ role: "viewer" | "admin"
```

---

## Performance Metrics

```
Expected Throughput:

Arduino send interval:    30 seconds
HTTP request:             < 1 second (Railway) or < 500ms (Local)
Database insert:          < 100ms
Socket.IO broadcast:      < 50ms
Dashboard update:         < 100ms
─────────────────────────────────────
Total latency:            ~ 1-2 seconds
─────────────────────────────────────

Dashboard updates:        Every 30-60 seconds
Real-time points:         Last 50 readings shown
Memory usage:             ~50-100MB per service
Database size:            ~500KB per 1000 readings
```

---

## Deployment Scenarios

### Scenario 1: Both Systems Online ✅

```
Arduino → [Railway] ✅ → Backend → Dashboard shows live data
Dashboard indicator: 🟢 Connected (green)
```

### Scenario 2: Railway Down, Fallback Online ✅

```
Arduino → [Railway ❌] → [Fallback ✅] → Backend → Dashboard shows live data
Dashboard indicator: 🟡 Connected (using fallback)
```

### Scenario 3: Both Offline ❌

```
Arduino → [Railway ❌] → [Fallback ❌] → No connection
Dashboard indicator: 🔴 Disconnected (offline)
Shows last known data (cached)
```

---

This system ensures **maximum uptime** for your air quality monitoring!
