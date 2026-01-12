# Reliability Studio - System Validation & Demo Checklist

**Version:** 1.0  
**Date:** January 12, 2026  
**Status:** Ready for Production Acceptance  

---

## Executive Summary

This checklist verifies that the Reliability Studio platform meets all acceptance criteria for production deployment. The system integrates metrics (Prometheus), logs (Loki), traces (Tempo), and automated incident detection into a unified platform for infrastructure reliability management.

**Expected Demo Duration:** 10 minutes  
**Expected Validation Duration:** 30 minutes  

---

## Pre-Demo Checklist

### Prerequisites Verification

- [ ] Docker installed and running
- [ ] Docker Compose available (version 1.29+)
- [ ] At least 8GB RAM available
- [ ] At least 20GB disk space available
- [ ] Ports available: 3000, 5432, 9000, 9091, 3100, 3200
- [ ] No VPN/proxy blocking container networking
- [ ] Bash shell available for scripts

### System Preparation

- [ ] Clone repository to demo machine
- [ ] Pull latest Docker images: `docker-compose pull`
- [ ] Run verification: `./verify-system.sh` (should pass all checks)
- [ ] Clear any old Docker volumes: `docker-compose down -v`
- [ ] Verify scripts are executable: `ls -la demo-system.sh verify-system.sh`

---

## Phase 1: Infrastructure Startup (2 minutes)

### Step 1.1: Start Complete Stack

```bash
./demo-system.sh
```

**Expected Output:**
- ✅ All services starting sequentially
- ✅ Health checks passing for each service
- ✅ Database schema initialization
- ✅ No error messages in logs

**Validation Points:**
- [ ] PostgreSQL running: `docker ps | grep postgres-db`
- [ ] Prometheus running: `docker ps | grep prometheus`
- [ ] Loki running: `docker ps | grep loki`
- [ ] Tempo running: `docker ps | grep tempo`
- [ ] Backend running: `docker ps | grep reliability-backend`
- [ ] Grafana running: `docker ps | grep grafana`
- [ ] Test-app running: `docker ps | grep test-app`

**Troubleshooting:**
- If services don't start: Check disk space and available ports
- If database fails: `docker-compose logs postgres-db` and check password
- If backend fails: Verify database is healthy first

---

## Phase 2: Data Generation (3 minutes)

### Step 2.1: Verify Metrics Generation

**Check:**
```bash
curl http://localhost:9091/api/v1/query?query=up | jq '.data.result | length'
```

**Expected:** >0 targets responding

**Validation Points:**
- [ ] test-app metrics ingesting
- [ ] backend metrics ingesting
- [ ] prometheus metrics ingesting
- [ ] loki metrics ingesting
- [ ] tempo metrics ingesting

### Step 2.2: Verify Logs Generation

**Check:**
```bash
curl http://localhost:3100/loki/api/v1/label/__name__/values | jq '.values | length'
```

**Expected:** >0 labels indexed

**Validation Points:**
- [ ] Docker logs captured by Promtail
- [ ] Loki receiving and indexing logs
- [ ] Log timestamps within last 5 minutes
- [ ] Error logs detected and classified

### Step 2.3: Create Test SLOs

**Check:**
```bash
curl http://localhost:9000/api/slos | jq 'length'
```

**Expected:** 2 SLOs created

**Validation Points:**
- [ ] "API Availability" SLO exists
- [ ] "Database Response Time" SLO exists
- [ ] Target percentages set correctly (99.5%, 99.0%)
- [ ] SLO queries valid PromQL

---

## Phase 3: Incident Detection (2 minutes)

### Step 3.1: Verify Detection Rules

**Check:**
```bash
docker exec postgres-db psql -U reliability_user -d reliability -c 'SELECT * FROM detection_rules;'
```

**Expected:** 2 detection rules

**Validation Points:**
- [ ] "High Error Rate" rule enabled
- [ ] "High Latency" rule enabled
- [ ] Query thresholds set (0.05 for errors, 1.0 for latency)
- [ ] Severity levels assigned (critical, warning)

### Step 3.2: Create Synthetic Incidents

**Check:**
```bash
curl http://localhost:9000/api/incidents | jq 'length'
```

**Expected:** 3 incidents created

**Validation Points:**
- [ ] Critical incident created: "Payment Service API Error Rate Spike"
- [ ] High incident created: "Database Connection Pool Exhaustion"
- [ ] Warning incident created: "API Response Latency Elevated"
- [ ] Each has correct severity badge
- [ ] Timestamps are recent (within last minute)

**Verify Incident Structure:**
```bash
curl http://localhost:9000/api/incidents | jq '.[0]' | grep -E 'id|title|severity|status|service'
```

**Expected Fields:**
- ✅ id: UUID
- ✅ title: descriptive string
- ✅ severity: critical/high/warning
- ✅ status: open/investigating/resolved
- ✅ service_id: service UUID or name

---

## Phase 4: Observability Verification (2 minutes)

### Step 4.1: Prometheus Metrics

**Check Targets:**
```bash
curl -s http://localhost:9091/api/v1/targets | jq '.data.activeTargets[] | {job, state}'
```

**Expected Output:**
```json
{"job":"prometheus","state":"up"}
{"job":"backend","state":"up"}
{"job":"test-app","state":"up"}
{"job":"loki","state":"up"}
{"job":"tempo","state":"up"}
```

**Validation Points:**
- [ ] At least 5 targets active
- [ ] Backend target healthy
- [ ] Test-app target healthy
- [ ] No "down" targets

**Query Sample Metrics:**
```bash
curl 'http://localhost:9091/api/v1/query?query=rate(http_requests_total%5B5m%5D)' | jq '.data.result | length'
```

**Expected:** >0 series

### Step 4.2: Loki Logs

**Check Log Streams:**
```bash
curl -s http://localhost:3100/loki/api/v1/label/job/values | jq '.values'
```

**Expected Output:**
```json
["docker","backend","test-app"]
```

**Validation Points:**
- [ ] Docker logs captured
- [ ] Backend logs present
- [ ] Test-app logs present

**Query Sample Logs:**
```bash
curl 'http://localhost:3100/loki/api/v1/query?query=%7Bjob%3D%22docker%22%7D' | jq '.data.result | length'
```

**Expected:** >0 log entries

### Step 4.3: Tempo Traces

**Check Status:**
```bash
curl -s http://localhost:3200/status | jq '.status'
```

**Expected:** "ready"

**Validation Points:**
- [ ] Tempo service healthy
- [ ] OTLP receiver configured
- [ ] Storage operational

---

## Phase 5: UI Demonstration (3 minutes)

### Step 5.1: Open Grafana

**URL:** http://localhost:3000  
**Credentials:** admin / admin (or configured)

**Validation Points:**
- [ ] Login successful
- [ ] Homepage loads
- [ ] Plugins menu visible

### Step 5.2: Navigate to Reliability Studio

**Path:** Dashboards → Plugins → Reliability Studio

**Expected:**
- ✅ Plugin loads without errors
- ✅ No blank/empty states
- ✅ Left sidebar visible with incidents

### Step 5.3: Verify Incident List

**Check Sidebar:**
- [ ] Title "Active Incidents" visible with pulse indicator
- [ ] Service filter dropdown populated
- [ ] 3 incident cards visible
- [ ] Color coding by severity (red/orange/yellow)

**Incidents Shown:**
- [ ] Payment Service API Error Rate Spike (RED)
- [ ] Database Connection Pool Exhaustion (ORANGE)
- [ ] API Response Latency Elevated (YELLOW)

### Step 5.4: Select Critical Incident

**Click:** "Payment Service API Error Rate Spike"

**Expected Display:**
- ✅ Incident details load in main area
- ✅ Header shows severity badge (CRITICAL)
- ✅ Header shows status (open)
- ✅ Timeline loads on left
- ✅ Telemetry tabs visible on right
- ✅ No "Loading..." messages persist >2 seconds

**Validation Points:**
- [ ] Timeline events visible (at least 1)
- [ ] Event icons show correct types (🚨 for metric anomaly)
- [ ] Event timestamps visible
- [ ] Acknowledge/Resolve buttons available

### Step 5.5: View Metrics Tab

**Click:** METRICS tab in Telemetry panel

**Expected:**
- ✅ Tab switches immediately
- ✅ Error Rate card shows value (>0%)
- ✅ P95 Latency card shows value (in seconds)
- ✅ Values are numeric and reasonable

**Validation Points:**
- [ ] Error Rate displays with proper formatting
- [ ] Latency displays with proper unit (seconds)
- [ ] Colors match severity (red for high error rate)
- [ ] Numbers are not null/undefined

### Step 5.6: View Logs Tab

**Click:** LOGS tab in Telemetry panel

**Expected:**
- ✅ Tab switches with loading state
- ✅ Error logs displayed with timestamps
- ✅ Log entries have readable messages
- ✅ No generic "No data" without context

**Validation Points:**
- [ ] Log entries show timestamps
- [ ] Log levels displayed (error, warn, info)
- [ ] Color coding by level
- [ ] Scrollable if >5 logs
- [ ] Empty state if no logs (with helpful message)

### Step 5.7: View Timeline

**In Timeline Section:**

**Expected:**
- ✅ Timeline header shows "Incident Timeline"
- ✅ Vertical timeline with events
- ✅ Event cards with icons
- ✅ Metadata expandable (click "Show metadata")

**Validation Points:**
- [ ] First event is detection trigger
- [ ] Timestamp matches incident creation
- [ ] Threshold value visible in metadata
- [ ] Event description clear and actionable

### Step 5.8: Acknowledge Incident

**Click:** Acknowledge button

**Expected:**
- ✅ Button click responds immediately
- ✅ Status badge changes from "open" to "investigating"
- ✅ No error message appears
- ✅ UI remains responsive

**Validation Points:**
- [ ] Status change visible in card
- [ ] Button state updates appropriately
- [ ] No page reload occurs

### Step 5.9: Select Second Incident

**Click:** "Database Connection Pool Exhaustion"

**Expected:**
- ✅ Sidebar selection highlights new incident
- ✅ Main content updates immediately
- ✅ Timeline loads for new incident
- ✅ No stale data from previous incident

**Validation Points:**
- [ ] Different incident data displayed
- [ ] Service name different (database-primary)
- [ ] Timeline events different
- [ ] Status badge shows correct severity

### Step 5.10: Test Service Filter

**Dropdown:** Service Filter

**Expected:**
- ✅ Filter dropdown has multiple services
- ✅ Can select different services
- ✅ Incident list filters accordingly
- ✅ Auto-selects first incident in filtered list

**Validation Points:**
- [ ] "payment-service" in dropdown
- [ ] "database-primary" in dropdown
- [ ] "api-gateway" in dropdown
- [ ] Filtering works bidirectionally

---

## Phase 6: Backend API Validation (5 minutes)

### Step 6.1: List All Incidents

```bash
curl http://localhost:9000/api/incidents | jq '.'
```

**Expected:**
- ✅ HTTP 200 response
- ✅ Array of incident objects
- ✅ Each incident has: id, title, severity, status, service_id, created_at
- ✅ 3 incidents in list

**Validation Points:**
```bash
curl http://localhost:9000/api/incidents | jq 'length'  # Should be 3
curl http://localhost:9000/api/incidents | jq '.[0].severity'  # Should be "critical"
curl http://localhost:9000/api/incidents | jq '.[].status' | sort | uniq  # Should have "open"
```

### Step 6.2: Get Single Incident

```bash
INCIDENT_ID=$(curl -s http://localhost:9000/api/incidents | jq -r '.[0].id')
curl http://localhost:9000/api/incidents/$INCIDENT_ID | jq '.'
```

**Expected:**
- ✅ HTTP 200 response
- ✅ Full incident details
- ✅ All fields populated
- ✅ service_id present

### Step 6.3: Get Active Incidents Only

```bash
curl http://localhost:9000/api/incidents/active | jq 'length'
```

**Expected:**
- ✅ HTTP 200 response
- ✅ Filtered list (may be 2 or 3 depending on status)
- ✅ No "resolved" incidents

### Step 6.4: Get Timeline Events

```bash
INCIDENT_ID=$(curl -s http://localhost:9000/api/incidents | jq -r '.[0].id')
curl http://localhost:9000/api/incidents/$INCIDENT_ID/timeline | jq '.'
```

**Expected:**
- ✅ HTTP 200 response
- ✅ Array of timeline events
- ✅ Each event has: id, incident_id, event_type, timestamp, title, description
- ✅ At least 1 event

### Step 6.5: List SLOs

```bash
curl http://localhost:9000/api/slos | jq '.'
```

**Expected:**
- ✅ HTTP 200 response
- ✅ Array of SLO objects
- ✅ 2 SLOs present
- ✅ Each has: id, name, target_percentage, current_percentage, status

### Step 6.6: Calculate SLO

```bash
SLO_ID=$(curl -s http://localhost:9000/api/slos | jq -r '.[0].id')
curl -X POST http://localhost:9000/api/slos/$SLO_ID/calculate | jq '.'
```

**Expected:**
- ✅ HTTP 200 response
- ✅ Returns SLOAnalysisResult with:
  - slo object (with current_percentage, error_budget_remaining, status)
  - burn_rates array (with window, burn_rate for each window)

### Step 6.7: Error Handling

**Test Invalid SLO:**
```bash
curl -X POST http://localhost:9000/api/slos/nonexistent/calculate 2>&1 | jq '.'
```

**Expected:**
- ✅ HTTP 500 or 404 response
- ✅ Error message with context (mentions SLO name, query details)
- ✅ Error includes what went wrong (no data, connection error, etc.)

**Test Invalid Incident:**
```bash
curl http://localhost:9000/api/incidents/nonexistent 2>&1 | jq '.'
```

**Expected:**
- ✅ HTTP 404 response
- ✅ Error message is descriptive
- ✅ Message does not say just "not found"

### Step 6.8: Update Incident

```bash
INCIDENT_ID=$(curl -s http://localhost:9000/api/incidents | jq -r '.[0].id')
curl -X PUT http://localhost:9000/api/incidents/$INCIDENT_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "investigating"}' | jq '.'
```

**Expected:**
- ✅ HTTP 200 response
- ✅ Status field updated to "investigating"
- ✅ Other fields unchanged

---

## Phase 7: Grafana Integration (2 minutes)

### Step 7.1: View Prometheus Dashboard

**Path:** Home → Dashboards

**Expected:**
- ✅ Can see Prometheus metrics
- ✅ Graphs show time-series data
- ✅ No "No data" errors

### Step 7.2: View Loki Logs

**Path:** Home → Explore → Loki

**Query:**
```
{job="docker"}
```

**Expected:**
- ✅ Log entries displayed
- ✅ Timestamps visible
- ✅ Can filter and search logs

### Step 7.3: Create Custom Dashboard

**Optional:** Create dashboard showing:
- [ ] Incident count over time
- [ ] Error rate by service
- [ ] Response latency P95
- [ ] Service availability

---

## Phase 8: Load & Stress Testing (Optional, 5 minutes)

### Step 8.1: Generate High Load

```bash
docker exec test-app /stress-test.sh
```

**Expected:**
- ✅ Metrics spike in Prometheus
- ✅ Error rate increases
- ✅ Logs increase in Loki
- ✅ Backend handles load

### Step 8.2: Verify Detection Triggers

**Check:** Do new incidents get auto-created?

**Expected:**
- ✅ If error rate exceeds 5%, new critical incident created
- ✅ If latency exceeds threshold, warning incident created
- ✅ Incidents appear in UI within 10 seconds

### Step 8.3: Verify System Stability

**Check:** During and after load

**Expected:**
- ✅ No panic or crash logs
- ✅ All services remain healthy
- ✅ Database query latency acceptable
- ✅ UI remains responsive

---

## Phase 9: Data Persistence (2 minutes)

### Step 9.1: Restart Backend

```bash
docker-compose restart reliability-backend
```

**Expected:**
- ✅ Service comes back online
- ✅ Incidents still exist
- ✅ Timeline events still exist
- ✅ SLOs still exist

### Step 9.2: Verify Database

```bash
docker exec postgres-db psql -U reliability_user -d reliability \
  -c "SELECT COUNT(*) FROM incidents;"
```

**Expected:**
- ✅ Incident count > 0
- ✅ Data persisted across restarts
- ✅ No data corruption

---

## Phase 10: Cleanup (1 minute)

### Step 10.1: Stop Stack

```bash
docker-compose down -v
```

**Expected:**
- ✅ All services stop
- ✅ No error messages
- ✅ Volumes cleaned up

### Step 10.2: Verify Cleanup

```bash
docker ps | grep reliability
```

**Expected:**
- ✅ No containers running

---

## Final Acceptance Sign-Off

### System Acceptance Criteria

- [ ] **Infrastructure:** All services (PostgreSQL, Prometheus, Loki, Tempo, Grafana, Backend) start successfully
- [ ] **Data:** Sample incidents, metrics, logs, and traces generated and available
- [ ] **UI:** Plugin loads, incidents display, no errors in browser console
- [ ] **Incident Management:** Can select, view, and update incidents
- [ ] **Observability:** Can view metrics, logs, and K8s information for incidents
- [ ] **Correlation:** Incident data correlates with metrics/logs/traces
- [ ] **API:** All endpoints respond correctly with proper error messages
- [ ] **Reliability:** System handles restart and data persistence
- [ ] **Performance:** API responses <1000ms, UI responsive
- [ ] **Documentation:** Scripts, guides, and checklists provided

### Sign-Off

**System is Production-Ready when ALL criteria above are checked.**

**Acceptance Date:** _______________  
**Accepted By:** _______________  
**Verified By:** _______________  

---

## Troubleshooting Reference

### Issue: "Backend not responding"

```bash
# Check backend logs
docker logs reliability-backend | tail -50

# Check database connection
docker exec postgres-db psql -U reliability_user -d reliability -c 'SELECT 1;'

# Restart backend
docker-compose restart reliability-backend
```

### Issue: "No metrics in Prometheus"

```bash
# Check test-app is running
docker ps | grep test-app

# Check Prometheus scrape config
curl -s http://localhost:9091/api/v1/targets | jq '.'

# Restart test-app
docker-compose restart test-app
```

### Issue: "No logs in Loki"

```bash
# Check Promtail is running
docker ps | grep promtail

# Check Promtail logs
docker logs promtail | tail -50

# Check docker.sock mounting
docker exec promtail ls -la /var/run/docker.sock
```

### Issue: "Incidents not appearing in UI"

```bash
# Check incidents in API
curl http://localhost:9000/api/incidents

# Check backend logs for errors
docker logs reliability-backend | grep -i error

# Check WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:9000/api/realtime
```

### Issue: "Plugin not visible in Grafana"

```bash
# Check plugin installation
docker exec grafana ls /var/lib/grafana/plugins/

# Check Grafana logs
docker logs grafana

# Restart Grafana
docker-compose restart grafana
```

---

## Documentation References

- **Architecture:** [PRODUCTION_FIXES_SUMMARY.md](PRODUCTION_FIXES_SUMMARY.md)
- **Observability:** [OBSERVABILITY_SETUP.md](OBSERVABILITY_SETUP.md)
- **SLO/Detection:** [SLO_DETECTION_RELIABILITY.md](SLO_DETECTION_RELIABILITY.md)
- **UI Hardening:** [PLUGIN_UI_HARDENING.md](PLUGIN_UI_HARDENING.md)

---

**Status:** ✅ Ready for Acceptance  
**Last Updated:** January 12, 2026  
**Version:** 1.0
