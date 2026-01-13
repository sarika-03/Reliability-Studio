# 🧪 Testing Guide - Reliability Studio Plugin

## **Status: ✅ UI is WORKING!**

Your plugin UI is now rendering correctly! Now let's test it with real incidents.

---

## **Quick Start - 3 Easy Steps**

### **Step 1: Start the Backend**

```bash
cd /home/sarika/Reliability-Studio1/backend
go run main.go
```

**Expected output:**
```
Starting server on :8080
Connected to database
Listening for WebSocket connections
```

---

### **Step 2: Generate Test Incidents**

Open a new terminal and run:

```bash
cd /home/sarika/Reliability-Studio1
./generate-test-incidents.sh
```

**Expected output:**
```
=== GENERATING TEST INCIDENTS ===
✓ Creating incident: High latency in payment processing ... ✓
✓ Creating incident: Authentication service timeout ... ✓
✓ Creating incident: Increased error rate in user queries ... ✓
✓ Creating incident: Slow CSS loading detected ... ✓
✓ Creating incident: Connection pool exhausted ... ✓

=== VERIFYING INCIDENTS ===
✅ Incidents created successfully:
  • [CRITICAL] High latency in payment processing (payment-service)
  • [HIGH] Authentication service timeout (api-gateway)
  • [MEDIUM] Increased error rate in user queries (user-service)
```

---

### **Step 3: View Incidents in Grafana UI**

1. **Open Grafana:** http://localhost:3000/a/sarika-reliability-studio-app
2. **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **You should see:**
   - Incidents appearing in the left sidebar
   - Click on an incident to see details
   - Service filter dropdown working

---

## **Advanced Testing: Generate Traffic**

Simulate realistic traffic patterns with:

```bash
./generate-traffic.sh 30     # Run for 30 seconds (default)
./generate-traffic.sh 60     # Run for 60 seconds
```

This will:
- Send requests to backend endpoints
- Trigger incident detection
- Generate metrics and logs
- Populate the dashboard with data

---

## **Testing Checklist**

- [ ] Backend is running on port 8080
- [ ] Incidents appear in sidebar after generation
- [ ] Clicking incident shows details in main area
- [ ] Service filter dropdown works
- [ ] Timeline loads when incident selected
- [ ] Telemetry tabs show data
- [ ] Error handling displays gracefully

---

## **Common Issues & Fixes**

### ❌ Backend not running

**Error:** `Failed to fetch` in Services error

**Fix:**
```bash
cd backend && go run main.go
```

### ❌ No incidents appearing

**Error:** Still seeing "All systems are healthy"

**Fix:**
```bash
# Verify backend is responding
curl -s http://localhost:8080/api/incidents | jq .

# If empty, generate incidents
./generate-test-incidents.sh

# Refresh Grafana
# Ctrl+Shift+R
```

### ❌ "Failed to load incidents" error

**Check backend logs:**
```bash
# See what backend is returning
curl -s http://localhost:8080/api/incidents | jq .
```

---

## **What Each Component Does**

| Component | Purpose | Test Method |
|-----------|---------|------------|
| **Incident List (Sidebar)** | Shows active incidents | `curl http://localhost:8080/api/incidents` |
| **Service Filter** | Filter incidents by service | Select different services in dropdown |
| **Timeline** | Shows incident events chronologically | Click incident to load timeline |
| **Telemetry Tabs** | Metrics, logs, traces | Click incident → scroll through tabs |
| **Actions (Acknowledge/Resolve)** | Change incident status | Click buttons |

---

## **Performance Test**

To stress test the UI:

```bash
# Generate 100 requests over 60 seconds
for i in {1..100}; do
  curl -s http://localhost:8080/api/incidents > /dev/null &
done
wait

# Watch backend performance
watch -n 1 'curl -s http://localhost:8080/api/health | jq .'
```

---

## **Monitoring Backend Health**

```bash
# Check if backend is healthy
curl -s http://localhost:8080/api/health | jq .

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "uptime_seconds": 1234
# }
```

---

## **Next Steps**

1. ✅ Start backend
2. ✅ Generate test incidents
3. ✅ Verify UI loads incidents
4. ✅ Test filtering and navigation
5. ✅ Check error handling

**Congratulations! Your Grafana App Plugin is working! 🎉**
