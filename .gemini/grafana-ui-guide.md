# 🎨 Grafana UI से Reliability Studio को Use करने का Complete Guide

## स्टेप 1: Service Select करें

**Your Current View:**
```
┌─────────────────────────────┐
│ Service Filter              │
│ ┌─────────────────────────┐ │
│ │ order-service         ▼ │ │  <-- यहाँ click करें
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Change to:**
```
┌─────────────────────────────┐
│ Service Filter              │
│ ┌─────────────────────────┐ │
│ │ payment-service       ▼ │ │  <-- payment-service select करें
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## स्टेप 2: Test Data Generate करें (Grafana Explore से)

### Method 1: Using Grafana Explore (Visual Way)

1. **Grafana में left sidebar में "Explore" (🔍 icon) पर click करें**

2. **Prometheus datasource select करें** (top-left dropdown)

3. **ये queries run करें** (Code tab में paste करें):

#### Query 1: Generate Success Metrics
```promql
# इसे run करने के लिए:
# 1. Query box में copy-paste करें
# 2. "Run query" button click करें

sum(rate(http_requests_total{service="payment-service",status="200"}[5m]))
```

#### Query 2: Check Error Rate  
```promql
rate(http_requests_total{service="payment-service",status=~"5.."}[5m]) 
/ 
rate(http_requests_total{service="payment-service"}[5m]) * 100
```

---

## स्टेप 3: Browser Console से Quick Test (One-time Setup)

**अगर Grafana Explore confusing लग रहा है**, तो एक बार ये करें:

1. **Grafana page पर रहते हुए** `F12` press करें (Developer Tools खुलेंगे)

2. **Console tab** में जाएं

3. **ये commands paste करें और Enter दबाएं:**

```javascript
// Test Load Generate करें
fetch('http://localhost:9000/api/test/load', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    service: 'payment-service',
    requests: 1000,
    duration_seconds: 60
  })
}).then(r => r.json()).then(console.log);

// Failures Inject करें  
fetch('http://localhost:9000/api/test/fail', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    service: 'payment-service',
    error_rate: 0.35
  })
}).then(r => r.json()).then(console.log);
```

4. **Console में response देखें:**
```
✅ {status: "load_injected", requests_generated: 1000, ...}
✅ {status: "failure_injected", error_rate: 0.35, ...}
```

---

## स्टेप 4: Wait & Refresh

1. **30-60 seconds wait करें** (Incident Detector हर 30s में run होता है)

2. **Reliability Studio page को refresh करें** (browser में F5 या reload button)

3. **Service Filter में "payment-service" confirm करें**

4. **अब incidents दिखने चाहिए!**

---

## 🎬 Expected Result:

```
┌────────────────────────────────────────┐
│ Active Incidents                        │
│ ┌────────────────────────────────────┐ │
│ │ 🔴 [CRITICAL]                      │ │
│ │ High Error Rate Detected           │ │
│ │ payment-service                    │ │
│ │ Started: 12:30 PM                  │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

Click करने पर right side में:
- Timeline events
- Metrics graphs  
- Logs
- Kubernetes status

---

## 🚨 अगर अब भी "No active incidents" दिख रहा:

### Quick Debug via Grafana Explore:

1. **Explore → Prometheus**
2. **Run this query:**
```promql
http_requests_total{service="payment-service"}
```

**यदि कुछ नहीं दिखा:**
- Prometheus को metrics नहीं मिल रहे
- Pushgateway check करें: http://localhost:19092

**यदि results दिखे:**
- Incident detector को manually trigger करने के लिए browser console में:
```javascript
fetch('http://localhost:9000/api/test/fail', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({service: 'payment-service', error_rate: 0.4})
}).then(r => r.json()).then(console.log);
```

---

## 💡 Pro Tips:

1. **Real-time Updates:** Plugin automatically WebSocket से connect होता है, refresh नहीं करना पड़ता normally

2. **Service Switch:** Service बदलने से incidents filter हो जाते हैं

3. **Browser Cache:** Hard refresh करें (Ctrl+Shift+R) अगर changes नहीं दिख रहे

4. **Grafana Datasources:** Connections → Data sources में Prometheus/Loki configured होने चाहिए

---

## 📍 Screen Navigation:

```
Grafana Sidebar (Left)
  ├─ 🏠 Home
  ├─ ⭐ Starred  
  ├─ 📊 Dashboards
  ├─ 🔍 Explore ←── यहाँ testing के लिए
  ├─ 🔔 Alerting
  └─ 🔌 Plugins
       └─ Reliability Studio ←── आपका main app
```

अब try करें! 🚀
