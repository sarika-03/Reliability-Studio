# 🚀 **QUICK START - Copy & Paste Commands**

## **Step 1: Build and Start Backend**

```bash
cd /home/sarika/Reliability-Studio1/backend
go build -o Reliability-Studio main.go
./Reliability-Studio
```

**Keep this terminal open. Backend will run on port 9000.**

---

## **Step 2: In New Terminal - Generate Test Incidents**

```bash
cd /home/sarika/Reliability-Studio1
./generate-test-incidents.sh
```

---

## **Step 3: View in Grafana**

1. **Open browser:** http://localhost:3000/a/sarika-reliability-studio-app
2. **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **You should see:**
   - Incident Control Room UI loads
   - Sidebar with "Active Incidents"
   - Service filter dropdown
   - Incidents from previous step appearing

---

## **Step 4: Generate Continuous Traffic (Optional)**

```bash
cd /home/sarika/Reliability-Studio1
./generate-traffic.sh 60     # Generate traffic for 60 seconds
```

---

## **Expected Screenshots**

### **Before:** 
```
❌ App not found
❌ "Cannot use import statement outside module"
❌ "Failed to fetch" errors in console
```

### **After:**
```
✅ Incident Control Room UI visible
✅ Sidebar showing incidents
✅ Service filter working
✅ Real-time updates via WebSocket
✅ Timeline and telemetry tabs responsive
```

---

## **Troubleshooting**

### **Backend won't start**
```bash
# Check if port 9000 is already in use
lsof -i :9000

# Kill process if needed
kill -9 <PID>

# Then try again
./Reliability-Studio
```

### **No incidents appearing**
```bash
# Verify backend is responding
curl -s http://localhost:9000/api/incidents | jq .

# Should return JSON array of incidents
# If error, check backend terminal for logs
```

### **Still seeing "Failed to fetch"**
```bash
# Hard refresh browser
Ctrl+Shift+R

# Check browser console (F12)
# Look for CORS or network errors

# If still failing, restart backend
Ctrl+C (in backend terminal)
./Reliability-Studio
```

---

## **One-Liner Commands**

Start everything at once (in separate terminals):

**Terminal 1 - Backend:**
```bash
cd /home/sarika/Reliability-Studio1/backend && go build -o Reliability-Studio main.go && ./Reliability-Studio
```

**Terminal 2 - Generate Incidents:**
```bash
cd /home/sarika/Reliability-Studio1 && sleep 5 && ./generate-test-incidents.sh
```

**Terminal 3 - Generate Traffic:**
```bash
cd /home/sarika/Reliability-Studio1 && sleep 10 && ./generate-traffic.sh 120
```

**Browser:**
```
http://localhost:3000/a/sarika-reliability-studio-app
```

---

## **Verify Everything is Working**

```bash
# 1. Check backend health
curl -s http://localhost:9000/api/health | jq .

# 2. Check incidents
curl -s http://localhost:9000/api/incidents | jq '.[] | {id, title, service, severity}'

# 3. Check services
curl -s http://localhost:9000/api/services | jq .

# 4. Verify WebSocket endpoint
curl -i http://localhost:9000/api/realtime
```

---

## **Architecture Summary**

```
┌─────────────────────────────────────┐
│     Grafana (port 3000)             │
│  ┌─────────────────────────────┐    │
│  │ Reliability Studio App      │    │
│  │ (Your Plugin)               │    │
│  └──────────────┬──────────────┘    │
└─────────────────┼────────────────────┘
                  │ HTTP/WebSocket
                  │ CORS enabled
                  ↓
┌─────────────────────────────────────┐
│   Backend (port 9000)               │
│   ┌─────────────────────────────┐   │
│   │ REST API                    │   │
│   │ WebSocket Real-time         │   │
│   │ Incident Detection          │   │
│   └──────────────┬──────────────┘   │
└─────────────────┼────────────────────┘
                  │ SQL
                  ↓
        PostgreSQL (port 5432)
```

---

**That's it! Enjoy your Grafana plugin! 🎉**
