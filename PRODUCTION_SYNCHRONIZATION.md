# Phase 3: Full Production System Synchronization Guide

**Objective**: Make Grafana plugin UI perfectly synchronized with backend reality with explicit state handling, error transparency, and demo-ready UX.

## 1. State Synchronization Architecture

### 1.1 Zero Hardcoded Data

**Principle**: All UI data must come from backend APIs. No fake/default/hardcoded data.

**Implementation**:
- ✅ `usePolledData()` hook for real-time incident polling (5s interval)
- ✅ `useFetchData()` hook for one-time data loads (services, SLOs)
- ✅ `useMutation()` hook for create/update operations with optimistic UI
- ✅ Enhanced API client (backend.ts) with trace ID propagation

**Components Updated**:
```typescript
// BEFORE: Components had hardcoded data
const [incidents, setIncidents] = useState([
  { id: 'inc-001', name: 'Database timeout', severity: 'high' },
  { id: 'inc-002', name: 'API latency', severity: 'medium' },
]);

// AFTER: Data from backend only
const { state, data: incidents } = usePolledData(
  () => backendAPI.incidents.list(),
  { interval: 5000, enabled: true }
);
```

**Validation**:
- [ ] IncidentControlRoom-v2.tsx uses usePolledData() for incidents
- [ ] TelemetryTabs loads metrics/logs/traces on-demand from backend
- [ ] Empty state shown only when backend returns zero results
- [ ] No placeholder/skeleton data persists after load

### 1.2 Explicit UI States (Loading, Empty, Active, Error)

**UIState Type System**:
```typescript
export type UIState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface UIStateConfig<T> {
  state: UIState;
  data?: T;
  error?: { message: string; code?: string; traceId?: string };
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; handler: () => void };
}
```

**Every Screen Must Support All States**:

1. **idle** - Initial state, no UI rendered yet
2. **loading** - Spinner with "Loading {resource}..." message
3. **success** - Data displayed with full interactivity
4. **error** - Red alert with error message + trace ID + retry button
5. **empty** - Friendly message explaining why no data + action button

**Example Implementation** (IncidentControlRoom-v2):
```tsx
{incidentsState === 'loading' ? (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <div className={styles.loadingSpinner} />
  </div>
) : incidentsState === 'empty' ? (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>✅</div>
    <div className={styles.emptyTitle}>All Systems Healthy</div>
    <div className={styles.emptyDescription}>
      No active incidents detected. All services are operating normally.
    </div>
    <button onClick={handleCreateIncident}>+ Create Test Incident</button>
  </div>
) : incidentsState === 'error' ? (
  <ErrorAlert error={incidentsError} onRetry={refetchIncidents} />
) : (
  // Render incidents list
)}
```

**StateRenderer Utility** (`src/utils/state-renderer.tsx`):
```tsx
<StateRenderer 
  config={{
    state: metricsState,
    data: metricsData,
    error: metricsError,
    emptyTitle: 'No metrics available',
    emptyDescription: 'Metrics will appear once the service generates traffic.',
  }}
>
  <MetricsChart data={metricsData} />
</StateRenderer>
```

**Validation Checklist**:
- [ ] IncidentControlRoom: incidents (loading/empty/error/active)
- [ ] IncidentControlRoom: services (loading/error/active)
- [ ] IncidentControlRoom: timeline (loading/empty/active)
- [ ] TelemetryTabs: metrics (loading/empty/error/active)
- [ ] TelemetryTabs: logs (loading/empty/error/active)
- [ ] TelemetryTabs: traces (loading/empty/error/active)
- [ ] TelemetryTabs: kubernetes (loading/empty/error/active)
- [ ] IncidentFeed: incidents (loading/empty/error/active)
- [ ] Each state has proper messaging and visual treatment

### 1.3 Incident Page Behavior

**Backend State → UI Behavior Mapping**:

| Backend State | UI Behavior | UX Message |
|---|---|---|
| No incidents | Empty state | "✅ All Systems Healthy - No active incidents. All services operating normally." + "Create Test Incident" button |
| Incidents exist | List with live polling | 🔴 severity badge, service name, time since creation |
| Incident selected | Load timeline + telemetry | Incident header + timeline (left) + correlation tabs (right) |
| Timeline loading | Spinner | "Loading timeline events..." |
| No timeline events | Empty state | "📋 No timeline events yet - Events appear as incident progresses" |
| Metrics unavailable | Graceful partial | Show logs/traces even if metrics pending |
| Logs loading | Spinner in tab | "Loading error logs..." |
| No error logs | Empty in tab | "✅ No error logs - System operating normally" |

**Implementation** (IncidentControlRoom-v2.tsx):
```tsx
const { state: incidentsState, data: incidents, error: incidentsError } = 
  usePolledData(() => backendAPI.incidents.list(), { interval: 5000 });

// Incidents list rendering logic handles all 5 states
// Timeline loads on incident selection
const { state: timelineState, data: timelineEvents } = 
  useFetchData(
    selectedIncidentId ? () => backendAPI.incidents.getTimeline(selectedIncidentId) : async () => [],
    [selectedIncidentId]
  );

// Each state has explicit UI branch
```

## 2. Backend Error Transparency

### 2.1 Error Context in API Responses

**Enhanced API Client** (`src/app/api/backend.ts`):
```typescript
// Generate unique trace ID for request
function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

// Send trace ID to backend in request headers
const headers = {
  'X-Trace-ID': traceId,
  'X-Request-Started': new Date().toISOString(),
  ...
};

// Capture error context on failure
const error = new Error(apiError.message) as Error & ApiError;
Object.assign(error, {
  status: apiError.status,           // HTTP 400, 500, etc.
  traceId: apiError.traceId,         // Backend trace ID
  requestId: apiError.requestId,     // Request ID
  endpoint: apiError.endpoint,       // /api/incidents
  method: apiError.method,           // GET, POST
  duration: apiError.duration,       // ms
});
```

**Error Display in UI** (StateRenderer.tsx):
```tsx
{state === 'error' && error && (
  <ErrorState 
    message={error.message}
    code={error.code}
    traceId={error.traceId}
    requestId={error.requestId}
    endpoint={error.endpoint}
    method={error.method}
    duration={error.duration}
    onRetry={onRetry}
  />
)}
```

**Trace ID Propagation Flow**:
1. Frontend generates trace ID: `a1b2c3d4-e5f6g7h8`
2. Frontend sends in header: `X-Trace-ID: a1b2c3d4-e5f6g7h8`
3. Backend receives and logs: `[a1b2c3d4-e5f6g7h8] GET /api/incidents`
4. Backend includes in response: `X-Trace-ID: a1b2c3d4-e5f6g7h8`
5. Frontend captures in error: `error.traceId = 'a1b2c3d4-e5f6g7h8'`
6. User sees in error UI: `Trace ID: a1b2c3d4-e5f6g7h8` (clickable to logs)

### 2.2 Error Types & Messages

**No Silent Failures**:
- ❌ Connection failed → Try again
- ✅ Failed to fetch incidents: Connection timeout (trace: a1b2c3d4). Server may be unreachable. Retrying...

**Meaningful Error Messages** (from enhanced backend.ts):
```typescript
// Before: Generic error
"API error: Internal Server Error"

// After: Contextual error with trace ID
"Failed to fetch incidents (500): Database connection failed. Check backend logs with trace a1b2c3d4-e5f6g7h8"

// Before: Silent timeout
// Nothing shown to user

// After: Explicit timeout
"Request timeout (30s): /api/incidents took longer than expected. Trace a1b2c3d4-e5f6g7h8 available in backend logs"
```

**Backend Error Context** (main.go enhancement):
```go
// Return error responses with trace ID
w.Header().Set("X-Trace-ID", traceId)
json.NewEncoder(w).Encode(map[string]interface{}{
  "error": "Failed to retrieve incidents",
  "details": "Database query timeout after 30s",
  "trace_id": traceId,
  "request_id": requestId,
  "timestamp": time.Now(),
})
```

### 2.3 Error Recovery Paths

**Retry Logic** (`api-hooks.ts`):
```typescript
export function usePolledData<T>(
  fetchFn: () => Promise<T>,
  options: PollingOptions = {}
) {
  const { retryCount = 3, backoffMultiplier = 2 } = options;
  
  // Exponential backoff on error
  const delay = Math.min(
    interval * Math.pow(backoffMultiplier, retryAttempt - 1), 
    60000  // Max 60s between retries
  );
  
  // Automatically retries with backoff
  // User can also click "Retry" button for immediate retry
}
```

**UI Error Recovery**:
- Manual: "Retry" button calls `refetch()` immediately
- Automatic: Failed requests auto-retry with exponential backoff (1s → 2s → 4s → ...)
- User Experience: Spinner changes to error state after 3 attempts, then shows retry UI

## 3. Demo-Ready UX

### 3.1 Onboarding Flow (< 30 seconds)

**Empty State Guidance**:
```
Empty Incident List
├── Icon: ✅
├── Title: "All Systems Healthy"
├── Description: "No active incidents detected. All services operating normally."
└── Action: "+ Create Test Incident" button
    └── Shows curl command to create incident via API
```

**First Incident Created**:
1. User clicks "+ Create Test Incident"
2. Shows curl command and API endpoint
3. System shows new incident in list (live polling)
4. Incident auto-selected, timeline + telemetry load
5. User sees correlation between metrics, logs, traces

### 3.2 Empty State Actions

**Every empty state has a clear action**:

| Empty State | Action | Command |
|---|---|---|
| No incidents | Create incident | `curl -X POST .../api/incidents` |
| No timeline events | Wait for events | Explained: "Events appear as incident progresses" |
| No metrics | Generate traffic | "Send requests to the service" |
| No logs | No errors | Explained: "✅ System healthy - no errors" |
| No services | Create service | `curl -X POST .../api/services` |

**Implementation**:
```tsx
const handleCreateIncident = useCallback(() => {
  const cmd = `curl -X POST http://localhost:9000/api/incidents \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Database connection timeout",
    "service_id": "api-server",
    "severity": "high",
    "description": "Customers experiencing slow page loads"
  }'`;

  alert(`Create an incident using:\n\n${cmd}`);
}, []);
```

### 3.3 Visual Clarity

**Color-Coded Severity**:
- 🔴 Critical: #f44336 (red)
- 🟠 High: #ff9800 (orange)
- 🟡 Medium: #ffeb3b (yellow)
- 🟢 Low: #4caf50 (green)

**Status Indicators**:
- 🟢 Live polling: "Live polling enabled" (green dot)
- 🔴 Offline: "Connection lost" (red dot)
- ⏳ Loading: Spinner with "Loading..."
- ⚠️ Error: Red alert with error message + trace ID

**Time Formatting**:
- Just now (< 1 min)
- 5m ago
- 2h ago
- 3d ago
- Full date (> 7 days)

## 4. Performance & Reliability

### 4.1 API Polling with Backoff

**usePolledData Hook**:
```typescript
const { state, data, error, isPolling } = usePolledData(
  () => backendAPI.incidents.list(),
  {
    interval: 5000,              // Poll every 5 seconds
    enabled: true,               // Start polling immediately
    retryCount: 3,               // Retry failed requests 3 times
    backoffMultiplier: 2,        // 1s → 2s → 4s between retries
  }
);
```

**Polling Strategy**:
- Success: Poll at configured interval (5s)
- Error: Exponential backoff (1s → 2s → 4s → ...)
- Max delay: 60 seconds between polls
- Stop polling: `stopPolling()` when user navigates away
- Resume polling: `startPolling()` when user returns

### 4.2 Optimistic Updates (Pending Implementation)

**Incident Creation Flow**:
```typescript
const { mutate: createIncident } = useMutation(
  async (data) => backendAPI.incidents.create(data)
);

const handleCreateIncident = async (data: NewIncident) => {
  // 1. Generate temporary ID for optimistic UI
  const tempId = `temp-${Date.now()}`;
  
  // 2. Add to local state immediately
  setIncidents([
    ...incidents,
    { ...data, id: tempId, status: 'creating' }
  ]);

  try {
    // 3. Send to backend
    const result = await createIncident(data);
    
    // 4. Replace temp with real incident
    setIncidents(incidents.map(i => i.id === tempId ? result : i));
  } catch (error) {
    // 5. Rollback on failure
    setIncidents(incidents.filter(i => i.id !== tempId));
    showError(`Failed to create incident: ${error.message}`);
  }
};
```

### 4.3 Graceful Partial Failure Handling

**Independent Data Loading** (TelemetryTabs):
```typescript
// Load each data source independently, not as a single unit
const { state: metricsState, data: metrics, error: metricsError } = 
  useFetchData(() => backendAPI.metrics.getAvailability(serviceId), [serviceId]);

const { state: logsState, data: logs, error: logsError } = 
  useFetchData(() => backendAPI.logs.getErrors(serviceId), [serviceId]);

const { state: tracesState, data: traces, error: tracesError } = 
  useFetchData(() => backendAPI.traces.list(serviceId), [serviceId]);

// Render each independently
return (
  <Tabs>
    <Tab label="Metrics">
      <StateRenderer config={{ state: metricsState, data: metrics, error: metricsError }}>
        <MetricsChart />
      </StateRenderer>
    </Tab>
    <Tab label="Logs">
      <StateRenderer config={{ state: logsState, data: logs, error: logsError }}>
        <LogsTable />
      </StateRenderer>
    </Tab>
    <Tab label="Traces">
      <StateRenderer config={{ state: tracesState, data: traces, error: tracesError }}>
        <TracesTimeline />
      </StateRenderer>
    </Tab>
  </Tabs>
);

// Result: Metrics can load while logs are still loading or failed
```

**Benefit**: Users see available data immediately instead of waiting for all data or seeing all-or-nothing failure.

## 5. Implementation Checklist

### Phase 3 Core Tasks

- [x] Create `usePolledData()` hook for real-time incident polling
- [x] Create `useFetchData()` hook for one-time data loads
- [x] Create `useMutation()` hook for create/update operations
- [x] Enhance backend.ts with trace ID generation and propagation
- [x] Create state-renderer.tsx UIState utility
- [x] Create IncidentControlRoom-v2.tsx with full state management
- [ ] Replace current IncidentControlRoom with v2
- [ ] Update TelemetryTabs to use independent data loading
- [ ] Update IncidentFeed to use usePolledData()
- [ ] Add graceful partial failure handling to all components
- [ ] Create demo initialization script
- [ ] Create production readiness validation tests

### Testing Requirements

```bash
# Start system with clean state
docker-compose up -d

# Test: Empty state UX
curl http://localhost:9000/api/incidents
# Expected: []
# UI Shows: "✅ All Systems Healthy" with "Create Test Incident" button

# Test: Create incident
curl -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API latency spike",
    "service_id": "api-server",
    "severity": "high"
  }'
# Expected: { "id": "inc-xxx", "name": "API latency spike", ... }

# Test: Live polling
# Open UI, watch incidents list update in real-time (5s polling)

# Test: Error recovery
curl http://localhost:9000/api/incidents-invalid
# Expected: HTTP 404, UI shows error with trace ID

# Test: Graceful partial failure
# Make metrics endpoint return 500, logs return 200
# Expected: TelemetryTabs shows error for metrics, success for logs

# Test: Trace ID tracking
# Look at browser console for:
# [API] GET /api/incidents (trace: a1b2c3d4)
# [API] ✓ GET /api/incidents (123ms, trace: a1b2c3d4)
```

## 6. Files Modified/Created

| File | Status | Purpose |
|---|---|---|
| src/utils/api-hooks.ts | ✅ Created | usePolledData, useFetchData, useMutation hooks |
| src/utils/state-renderer.tsx | ✅ Created | UIState type system + StateRenderer component |
| src/app/api/backend.ts | ✅ Enhanced | Trace ID generation, request logging, error context |
| src/components/IncidentControlRoom-v2.tsx | ✅ Created | Full state management with all 5 UI states |
| src/components/IncidentControlRoom.tsx | 🔄 Pending | Replace with v2 version |
| src/components/TelemetryTabs.tsx | 🔄 Pending | Independent data loading per tab |
| src/components/IncidentFeed.tsx | 🔄 Pending | usePolledData() integration |

## 7. Success Metrics

**Phase 3 is complete when**:
- ✅ All data comes from backend APIs (zero hardcoded)
- ✅ Every screen has loading/empty/error/active states with UI
- ✅ Every error shows trace ID + request context
- ✅ New user understands in < 30 seconds (empty → create → see incident)
- ✅ Live polling works (incidents update every 5s)
- ✅ Error recovery works (retry buttons, auto-backoff)
- ✅ Partial failures handled gracefully (metrics fail, logs succeed)
- ✅ All tests pass (state synchronization, error handling, polling)

## 8. Next Steps

1. **Replace current IncidentControlRoom** with IncidentControlRoom-v2.tsx
2. **Update TelemetryTabs** to use independent usePolledData() for each data source
3. **Update IncidentFeed** to use usePolledData() for real-time updates
4. **Add graceful partial failure handling** throughout
5. **Create demo initialization** script with sample data
6. **Create production readiness** test suite

