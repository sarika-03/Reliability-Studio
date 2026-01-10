# End-to-End Runtime Control Loop Fixes

## ✅ Complete Fix Summary

### Control Loop: Trigger → Detection → Correlation → Storage → API → UI

All broken integrations have been repaired. The system now works end-to-end in real-time.

---

## 🔧 Critical Fixes Applied

### 1. **Detection Engine → Database Integration** ✅
**Problem**: Incidents created by detection engine were not linked to services, causing NULL service names in API responses.

**Fix**:
- Modified `processDetectionEvent()` to get/create service before creating incident
- Added `service_id` to incident INSERT statement
- Service name now properly appears in API responses

**Files Changed**:
- `backend/detection/detector.go` (lines 331-377)

---

### 2. **Detection → Correlation Trigger** ✅
**Problem**: When detection engine created incidents, correlation engine was never triggered.

**Fix**:
- Added `CorrelationCallback` interface to `IncidentDetector`
- Set callback in `main.go` to trigger correlation when incidents are detected
- Correlation now runs automatically for all detected incidents

**Files Changed**:
- `backend/detection/detector.go` (added callback mechanism)
- `backend/main.go` (wired callback to correlation engine)

---

### 3. **Timeline Event Parameter Order** ✅
**Problem**: Timeline events had incorrect parameter order in SQL INSERT, causing failures.

**Fix**:
- Corrected parameter order: `(id, incident_id, event_type, timestamp, source, title, description, metadata)`
- All timeline events now properly saved

**Files Changed**:
- `backend/detection/detector.go` (line 364-366)

---

### 4. **Real-Time WebSocket Integration** ✅
**Problem**: WebSocket server existed but was never initialized or connected to incident creation.

**Fix**:
- Initialized WebSocket server in `main.go`
- Added `/api/realtime` route
- Wired WebSocket broadcasts to:
  - Incident creation (from detection)
  - Correlation completion
- Fixed WebSocket helper functions (timestamps, deadlines)
- Integrated `useRealtime` hook in frontend App component

**Files Changed**:
- `backend/websocket/server.go` (fixed helper functions)
- `backend/main.go` (initialized server, added route, wired broadcasts)
- `src/app/App.tsx` (integrated WebSocket hook)

---

### 5. **Frontend Polling Frequency** ✅
**Problem**: Frontend polled every 30s but detection ran every 60s, missing updates.

**Fix**:
- Reduced frontend polling to 10s (faster than detection's 30s)
- Detection interval reduced to 30s for faster response
- WebSocket provides instant updates, polling is backup

**Files Changed**:
- `src/app/App.tsx` (polling interval)
- `backend/main.go` (detection interval)

---

### 6. **API Service Name Resolution** ✅
**Problem**: API query joined with services but incidents without service_id returned NULL.

**Fix**:
- Detection now always creates/links services
- API query uses `COALESCE(s.name, 'unknown')` for safety
- All incidents now have proper service names

**Files Changed**:
- `backend/detection/detector.go` (service linking)
- `backend/main.go` (API query already correct)

---

## 🔄 Complete Control Loop Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER PHASE                             │
│  Prometheus/Loki/K8s → Metrics/Logs/Events                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              DETECTION ENGINE (30s interval)                │
│  1. Load enabled rules from correlation_rules table         │
│  2. Evaluate rules against telemetry                        │
│  3. Create incidents in database with service_id            │
│  4. Create timeline events                                  │
│  5. Trigger correlation callback                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            CORRELATION ENGINE (async)                       │
│  1. Correlate K8s state                                     │
│  2. Correlate metrics                                        │
│  3. Correlate logs                                          │
│  4. Analyze root cause                                      │
│  5. Save correlations to database                           │
│  6. Broadcast correlation results via WebSocket             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              STORAGE (PostgreSQL)                            │
│  - incidents table (with service_id)                        │
│  - timeline_events table                                    │
│  - correlations table                                       │
│  - services table                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              API LAYER                                       │
│  GET /api/incidents → Returns incidents with service names  │
│  GET /api/incidents/:id/timeline → Returns timeline events  │
│  GET /api/incidents/:id/correlations → Returns correlations │
│  WebSocket /api/realtime → Real-time updates              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         GRAFANA PLUGIN UI                                    │
│  1. Polls API every 10s (backup)                            │
│  2. WebSocket provides instant updates                      │
│  3. UI updates when:                                         │
│     - New incident created (WebSocket + polling)            │
│     - Incident updated (WebSocket)                          │
│     - Correlation found (WebSocket)                         │
│  4. Displays:                                                │
│     - Incident list with service names                      │
│     - Timeline events                                        │
│     - Correlations                                           │
│     - Telemetry (metrics/logs/traces/K8s)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Validation Scenarios

### Scenario 1: Latency Spike
1. **Trigger**: P95 latency exceeds threshold
2. **Detection**: Rule "High Latency" triggers
3. **Incident**: Created with service linked
4. **Correlation**: Metrics analyzed, root cause identified
5. **UI**: Incident appears in list with timeline and correlations

### Scenario 2: Error Rate Spike
1. **Trigger**: Error rate > 5%
2. **Detection**: Rule "High Error Rate" triggers
3. **Incident**: Created with service linked
4. **Correlation**: Logs analyzed, error patterns found
5. **UI**: Incident appears with error log correlations

### Scenario 3: Kubernetes Failure
1. **Trigger**: Pod in CrashLoopBackOff
2. **Detection**: Rule "Pod Crash Loop" triggers
3. **Incident**: Created with service="kubernetes"
4. **Correlation**: K8s state analyzed, affected pods identified
5. **UI**: Incident appears with K8s correlation data

### Scenario 4: SLO Breach
1. **Trigger**: SLO error budget depleted
2. **Detection**: SLO service detects breach
3. **Incident**: Created (via SLO service integration)
4. **Correlation**: Metrics and logs correlated
5. **UI**: Incident appears with SLO impact data

---

## 🚀 Real-Time Updates

### WebSocket Events
- `incident_created`: New incident detected
- `incident_updated`: Incident status/severity changed
- `correlation_found`: New correlation data available

### Frontend Response
- WebSocket messages trigger immediate UI refresh
- Polling (10s) provides backup if WebSocket fails
- Selected incident context reloads on correlation events

---

## 📊 Data Flow Verification

### ✅ Detection → Storage
- Incidents created with `service_id` ✅
- Timeline events created ✅
- Services auto-created if missing ✅

### ✅ Storage → API
- `/api/incidents` returns service names ✅
- `/api/incidents/:id/timeline` returns events ✅
- `/api/incidents/:id/correlations` returns correlations ✅

### ✅ API → UI
- Frontend polls every 10s ✅
- WebSocket provides instant updates ✅
- UI displays all incident data ✅

### ✅ Real-Time Updates
- WebSocket broadcasts on incident creation ✅
- WebSocket broadcasts on correlation completion ✅
- Frontend reacts to WebSocket messages ✅

---

## 🔍 Testing Checklist

- [x] Detection engine creates incidents with services
- [x] Correlation engine triggers automatically
- [x] Timeline events saved correctly
- [x] API returns proper service names
- [x] WebSocket server initialized
- [x] WebSocket broadcasts incidents
- [x] Frontend connects to WebSocket
- [x] Frontend updates on WebSocket messages
- [x] Frontend polling works as backup
- [x] All mock data removed (using real backend state)

---

## 🎯 Result

**The system now works end-to-end in real-time.**

When a trigger occurs:
1. ✅ Detection engine creates incident (with service)
2. ✅ Correlation engine analyzes and saves correlations
3. ✅ WebSocket broadcasts to all connected clients
4. ✅ Frontend receives update and refreshes UI
5. ✅ Incident appears with timeline, correlations, and telemetry

**No mock data. No static placeholders. Only real backend state.**

---

**Status**: ✅ **PRODUCTION READY**
**Last Updated**: 2026-01-09


