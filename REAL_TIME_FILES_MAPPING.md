# 🎯 Real-Time Workflow - Files & Flow Mapping

Yeh document poore system ko explain karta hai - kaun si file kya kaam karta hai.

---

## 📊 COMPLETE ARCHITECTURE FLOWCHART

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🌐 USER BROWSER (React Frontend)                     │
│                    [src/app/App.tsx] [src/intelligence/*]                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    HTTP + JWT Token (Bearer)
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🚀 BACKEND API (Go) - Port 9000                        │
│              [backend/main.go] with Middleware [backend/middleware/*]        │
│                                                                              │
│  Routes:                                                                     │
│  ├─ /api/auth/register        → [middleware/middleware.go]                 │
│  ├─ /api/auth/login           → [middleware/middleware.go]                 │
│  ├─ /api/incidents            → [handlers/handlers.go]                     │
│  ├─ /api/incidents/{id}       → [handlers/handlers.go]                     │
│  ├─ /api/incidents/{id}/timeline → [services/timeline_services.go]        │
│  ├─ /api/incidents/{id}/correlations → [correlation/engine.go]            │
│  ├─ /api/slos                 → [services/slo_service.go]                  │
│  └─ /api/test/fail            → [handlers/test.go]                         │
│                                                                              │
│  Middleware: [backend/middleware/middleware.go]                             │
│  ├─ JWT Authentication ✅                                                   │
│  ├─ CORS Policy ✅                                                          │
│  └─ Request Logging ✅                                                      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    PostgreSQL + Prometheus + Loki + Tempo
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
   ┌─────────┐          ┌──────────────────┐     ┌─────────────────┐
   │          │          │ Observability    │     │ Correlation     │
   │PostgreSQL│          │ Stack            │     │ Engine          │
   │ Database │          │                  │     │                 │
   │          │          │ ├─ Prometheus    │     │ [correlation/   │
   │ Tables:  │          │ │  (9090)        │     │  engine.go]     │
   │          │          │ ├─ Loki (3100)   │     │                 │
   │ -incident│          │ ├─ Tempo (3200)  │     │ Analyzes:       │
   │ -service │          │ └─ Grafana (3000)│     │ ├─ Metrics      │
   │ -timeline│          │                  │     │ ├─ Logs         │
   │ -slo     │          │ Root cause data  │     │ ├─ Traces       │
   │ -tasks   │          │ source           │     │ └─ K8s state    │
   │          │          │                  │     │                 │
   └─────────┘          └──────────────────┘     └─────────────────┘
```

---

## 1️⃣ SYSTEM STARTUP FLOW

### Files Involved:
- **[docker/docker-compose.yml](docker/docker-compose.yml)** - Orchestrates all 6 services
- **[backend/main.go](backend/main.go)** - Backend initialization (lines 45-100)
- **[backend/Dockerfile](backend/Dockerfile)** - Container configuration

### Flow:
```
docker-compose up
    ├─ PostgreSQL starts
    │   └─ Executes [backend/database/schema.sql]
    │       ├─ Creates 'services' table
    │       ├─ Creates 'incidents' table
    │       ├─ Creates 'timeline_events' table
    │       ├─ Creates 'slos' table
    │       └─ Creates 'incident_tasks' table
    │
    ├─ Prometheus starts (port 9090)
    │   └─ Loads [docker/prometheus.yml]
    │
    ├─ Loki starts (port 3100)
    │   └─ Loads [docker/loki.yml]
    │
    ├─ Tempo starts (port 3200)
    │   └─ Loads [docker/tempo.yml]
    │
    ├─ Grafana starts (port 3000)
    │
    └─ Backend starts (port 9000)
        ├─ Connects to PostgreSQL
        ├─ Initializes services [backend/services/*]
        ├─ Registers handlers [backend/handlers/*]
        └─ Starts HTTP server with middleware
```

### System State After Startup:
```
No incident active ✓
SLO normal ✓
Metrics stable ✓
System idle & healthy ✓
```

---

## 2️⃣ LOGIN FLOW

### Files Involved:
- **[backend/middleware/middleware.go](backend/middleware/middleware.go)** - JWT handling
- **[src/app/api/backend.ts](src/app/api/backend.ts)** - Frontend API client

### Authentication Process:

```
User enters credentials in UI
    │
    ▼ [src/app/App.tsx] sends POST
POST /api/auth/register
    │
    ▼ [backend/middleware/middleware.go] - RegisterHandler
    ├─ Hash password with bcrypt
    ├─ Store in database
    └─ Return user_id
    
User logs in
    │
    ▼ [src/app/api/backend.ts] sends POST
POST /api/auth/login
    │
    ▼ [backend/middleware/middleware.go] - LoginHandler
    ├─ Verify password
    ├─ Create JWT Claims [backend/middleware/middleware.go] (lines 20-30)
    │   ├─ user_id ✓
    │   ├─ username ✓
    │   ├─ email ✓
    │   ├─ roles ✓
    │   ├─ token_type: "access" ✓
    │   └─ exp: 15 minutes ✓
    ├─ Sign with JWT_SECRET
    └─ Return {access_token, refresh_token}
    
    ▼ Frontend stores JWT
    
System State After Login:
    • User authenticated ✓
    • JWT token valid ✓
    • Access to protected routes ✓
```

### Protected Routes:
```go
api := router.PathPrefix("/api").Subrouter()
api.Use(middleware.Auth)  // [backend/middleware/middleware.go] line 39

api.HandleFunc("/incidents", ...).Methods("GET")
api.HandleFunc("/incidents", ...).Methods("POST")
api.HandleFunc("/incidents/{id}", ...).Methods("PATCH")
// ... more protected routes
```

---

## 3️⃣ FAILURE SIMULATION FLOW

### Files Involved:
- **[backend/handlers/test.go](backend/handlers/test.go)** - Failure injection
- **[docker/prometheus.yml](docker/prometheus.yml)** - Metrics scraping

### Simulation Process:

```
POST /api/test/fail
    │
    ├─ Payload: {
    │     "service": "payment-processing",
    │     "error_rate": 0.95,
    │     "cpu_usage": 92,
    │     "memory_usage": 88,
    │     "response_time_ms": 3400,
    │     "db_connections": 45
    │   }
    │
    ▼ [backend/handlers/test.go] - HandleTestFail
    ├─ Generate error responses
    ├─ Increase latency artificially
    ├─ Consume memory
    └─ Create incident if error_rate > 0.25
        │
        ▼ [backend/services/incident_service.go] - Create()
            └─ Stores in database [incident table]

Prometheus scrapes metrics every 15s
    │
    ▼ [docker/prometheus.yml] configuration
    ├─ Prometheus detects metrics spike
    └─ Data available for correlation

System State During Failure:
    • Metrics spike: CPU 45% → 92% ✓
    • Error rate spike: 0.5% → 95% ✓
    • Response time: 120ms → 3400ms ✓
    • DB connections: 20/50 → 45/50 ✓
    • Incident created ✓
```

---

## 4️⃣ INCIDENT CREATION FLOW

### Files Involved:
- **[backend/handlers/handlers.go](backend/handlers/handlers.go)** - REST handlers
- **[backend/services/incident_service.go](backend/services/incident_service.go)** - Business logic
- **[backend/database/schema.sql](backend/database/schema.sql)** - Data storage

### Creation Process:

```
UI or API sends: POST /api/incidents
    │
    ├─ Headers: {Authorization: Bearer <JWT>}
    │
    ▼ [backend/middleware/middleware.go] - Auth middleware
    ├─ Validate JWT
    ├─ Extract user_id, username
    └─ Pass to handler
    
    ▼ [backend/handlers/handlers.go] - CreateIncident()
    │   ├─ Decode request body
    │   ├─ Extract: title, description, severity, service_ids
    │   └─ Call incident service
    │
    ▼ [backend/services/incident_service.go] - Create()
    │   ├─ Generate UUID for incident
    │   ├─ Set status = "open"
    │   ├─ Set started_at = NOW()
    │   │
    │   ├─ BEGIN TRANSACTION
    │   │
    │   ├─ INSERT into [incidents table]:
    │   │   ├─ id (UUID)
    │   │   ├─ title
    │   │   ├─ description
    │   │   ├─ severity (critical/high/medium/low)
    │   │   ├─ status (open/investigating/mitigated/resolved)
    │   │   ├─ started_at
    │   │   ├─ detected_at
    │   │   └─ metadata (JSONB)
    │   │
    │   ├─ INSERT into [incident_services table]:
    │   │   ├─ incident_id
    │   │   ├─ service_id
    │   │   └─ impact_level (primary/secondary/tertiary)
    │   │
    │   ├─ COMMIT TRANSACTION
    │   │
    │   ├─ Launch correlation goroutine ⚡
    │   │   └─ Calls [correlation/engine.go] - CorrelateIncident()
    │   │
    │   └─ Return incident object
    │
    ▼ Backend returns: {id: "uuid", status: 200}
    
    ▼ [src/app/components/IncidentList.tsx]
    └─ UI updates with new incident

System State After Creation:
    • Incident in database ✓
    • Status = "open" → "investigating" ✓
    • Timeline started ✓
    • Correlation analysis started ⚡ (async)
    • Business impact computed ✓
```

---

## 5️⃣ CORRELATION ENGINE FLOW

### Files Involved:
- **[backend/correlation/engine.go](backend/correlation/engine.go)** - Root cause analysis
- **[backend/clients/prometheus.go](backend/clients/prometheus.go)** - Metrics queries
- **[backend/clients/loki.go](backend/clients/loki.go)** - Log analysis
- **[backend/clients/kubernetes.go](backend/clients/kubernetes.go)** - K8s state

### Analysis Process:

```
CorrelateIncident() triggered
    │
    ├─ Input:
    │   ├─ incident_id
    │   ├─ service name
    │   ├─ namespace
    │   └─ start_time
    │
    ▼ [backend/correlation/engine.go] - CorrelateIncident()
    │
    ├─ Acquire worker slot (max 10 concurrent)
    │
    ├─ Parallel data collection:
    │   │
    │   ├─ [prometheus.go] - GetErrorRate()
    │   │   └─ Query: "rate(errors_total[5m])"
    │   │   └─ Result: error_rate = 0.95 (95%)
    │   │
    │   ├─ [prometheus.go] - GetLatencyP95()
    │   │   └─ Query: "histogram_quantile(0.95, duration_ms)"
    │   │   └─ Result: latency = 3400ms
    │   │
    │   ├─ [kubernetes.go] - GetPods()
    │   │   └─ Check pod status
    │   │   └─ Check restart counts
    │   │   └─ Result: 2 pods restarting
    │   │
    │   ├─ [loki.go] - GetErrorLogs()
    │   │   └─ Query logs since incident start
    │   │   └─ Result: 1247 "connection pool exhausted" errors
    │   │
    │   └─ [loki.go] - DetectLogPatterns()
    │       └─ Pattern analysis
    │       └─ Result: "connection pool" appears 890 times
    │
    ▼ Correlation Analysis
    │   ├─ Match error rate spike with log errors
    │   │   └─ Confidence: 98%
    │   │
    │   ├─ Match latency spike with DB connections
    │   │   └─ Confidence: 97%
    │   │
    │   ├─ Match pod restarts with error timeline
    │   │   └─ Confidence: 95%
    │   │
    │   └─ Identify root cause: PostgreSQL connection pool exhaustion
    │       └─ Overall confidence: 98%
    │
    ▼ Store correlations in database
    │   INSERT into [correlations table]
    │
    ▼ Add timeline event
    │   INSERT into [timeline_events table]
    │   ├─ event_type: "correlation_analysis_complete"
    │   ├─ title: "Root Cause Identified"
    │   ├─ description: "PostgreSQL connection pool exhaustion (98% confidence)"
    │   └─ metadata: {correlations: [...]}
    │
    └─ Release worker slot

System State After Correlation:
    • Root cause: PostgreSQL connection pool exhaustion ✓
    • Confidence score: 98% ✓
    • 4 correlations found ✓
    • Impact radius: payment-processing service ✓
    • Available via: GET /api/incidents/{id}/correlations ✓
```

---

## 6️⃣ TIMELINE BUILDING FLOW

### Files Involved:
- **[backend/services/timeline_services.go](backend/services/timeline_services.go)** - Timeline management
- **[src/intelligence/IncidentTimeline.tsx](src/intelligence/IncidentTimeline.tsx)** - UI display

### Timeline Process:

```
Events happen throughout incident lifecycle:

1. Incident Created (T=0s)
   ├─ Source: user
   ├─ Event: "incident_created"
   └─ Action: [timeline_services.go] - AddEvent()
       └─ INSERT into timeline_events
       
2. Correlation Started (T=1s)
   ├─ Source: system
   ├─ Event: "correlation_analysis_started"
   └─ Action: AddEvent()

3. Metric Spike Detected (T=2s)
   ├─ Source: prometheus
   ├─ Event: "metric_spike"
   ├─ Metric: error_rate = 95%
   └─ Action: AddEvent()

4. Root Cause Found (T=5s)
   ├─ Source: correlation_engine
   ├─ Event: "root_cause_identified"
   ├─ Cause: "PostgreSQL connection pool exhaustion"
   └─ Action: AddEvent()

5. SLO Breach (T=6s)
   ├─ Source: slo_system
   ├─ Event: "slo_breach"
   ├─ SLOs breached: 3
   └─ Action: AddEvent()

6. Mitigation Applied (T=15s)
   ├─ Source: user
   ├─ Event: "mitigation_applied"
   ├─ Action: "Increased connection pool 20→50"
   └─ Action: AddEvent()

Timeline Query:
    GET /api/incidents/{id}/timeline
    ▼
    [handlers/handlers.go] - GetIncidentTimeline()
    ▼
    [timeline_services.go] - GetTimeline()
    ▼
    SELECT * FROM timeline_events WHERE incident_id = ?
    ORDER BY created_at
    ▼
    Return [event1, event2, event3, ...]

UI Display:
    [src/intelligence/IncidentTimeline.tsx]
    ├─ Loop through events
    ├─ Display chronological order
    ├─ Show source and timestamp
    └─ Render complete story

System State After Timeline:
    • 6 events recorded ✓
    • Chronological order ✓
    • Complete story visible ✓
    • Available via API ✓
    • Displayed in UI ✓
```

---

## 7️⃣ SLO & BUSINESS IMPACT FLOW

### Files Involved:
- **[backend/services/slo_service.go](backend/services/slo_service.go)** - SLO calculations
- **[src/intelligence/ImpactSummary.tsx](src/intelligence/ImpactSummary.tsx)** - UI display
- **[backend/database/schema.sql](backend/database/schema.sql)** - SLO tables

### Impact Calculation:

```
Incident created
    │
    ▼ [handlers/handlers.go] - CreateIncident()
    │
    ├─ Link services: INSERT into incident_services
    │   ├─ incident_id
    │   └─ service_id (with impact_level)
    │
    ▼ Calculate business impact
    │
    ├─ [slo_service.go] - GetAllSLOs()
    │   └─ Fetch all SLOs for affected service
    │
    ├─ For each SLO:
    │   ├─ [slo_service.go] - CalculateSLO()
    │   │   ├─ Query Prometheus
    │   │   ├─ Get current SLI value
    │   │   ├─ Calculate: (current - target) / target = breach %
    │   │   └─ Check if breached
    │   │
    │   ├─ [slo_service.go] - CalculateBurnRate()
    │   │   ├─ Check 1-minute burn rate
    │   │   ├─ Check 5-minute burn rate
    │   │   └─ Check 30-minute burn rate
    │   │
    │   └─ Update status: healthy → warning → critical
    │
    ▼ Calculate user impact
    │   ├─ Get service: affected_users = 15,234
    │   └─ Store in metadata
    │
    ▼ Calculate revenue impact
    │   ├─ Get service: revenue_per_hour = $45,000
    │   └─ Duration × revenue = business impact
    │
    ▼ Add timeline event
    │   INSERT into timeline_events
    │   ├─ event_type: "slo_breach"
    │   └─ metadata: {slos_breached: 3, users_affected: 15234, revenue_at_risk: 45000}
    │
    ▼ Update incident metadata
        └─ business_impact: {
              slos_breached: 3,
              users_affected: 15234,
              revenue_at_risk: 45000,
              severity: "critical"
          }

SLO Display:
    GET /api/slos
    ▼
    [handlers/handlers.go] - GetSLOs()
    ▼
    SELECT * FROM slos WHERE service_id = ?
    ▼
    UI displays:
    ├─ Availability: 99.9% (BREACHED)
    ├─ Latency P95: < 200ms (BREACHED)
    ├─ Error Rate: < 0.1% (BREACHED)
    └─ Durability: OK

System State After SLO Calculation:
    • 3/4 SLOs breached ✓
    • Error budget: 45.2% burned ✓
    • Users affected: 15,234 ✓
    • Revenue at risk: $45,000/hour ✓
    • Severity: CRITICAL ✓
```

---

## 8️⃣ RESOLUTION FLOW

### Files Involved:
- **[backend/handlers/handlers.go](backend/handlers/handlers.go)** - UpdateIncident()
- **[backend/services/incident_service.go](backend/services/incident_service.go)** - Update logic

### Resolution Process:

```
User applies fix:
    POST /api/incidents/{id} {status: "resolved"}
    │
    ▼ [handlers/handlers.go] - UpdateIncident()
    │
    ├─ Decode request
    ├─ Extract: status, root_cause, resolution
    │
    ▼ [services/incident_service.go] - Update()
    │
    ├─ Calculate MTTR (Mean Time To Resolve)
    │   └─ resolved_at - started_at = 12m 45s
    │
    ├─ Calculate MTTA (Mean Time To Acknowledge)
    │   └─ acknowledged_at - started_at
    │
    ├─ UPDATE incidents table
    │   ├─ status = "resolved"
    │   ├─ resolved_at = NOW()
    │   ├─ root_cause = user input
    │   ├─ resolution = user input
    │   ├─ mttr_seconds = 765 (12m 45s)
    │   └─ mtta_seconds = calculated
    │
    ├─ Add final timeline event
    │   INSERT into timeline_events
    │   ├─ event_type: "incident_resolved"
    │   ├─ title: "Incident Resolved"
    │   └─ metadata: {mttr: "12m 45s", services_recovered: "3/3"}
    │
    ├─ Lock timeline (no more events)
    │
    └─ Return updated incident
    
UI Updates:
    [src/intelligence/IncidentBoard.tsx]
    ├─ Status: "Resolved" (green)
    ├─ MTTR: 12m 45s
    ├─ Services recovered: 3/3
    ├─ Root cause documented
    ├─ Resolution documented
    └─ Timeline locked

System State After Resolution:
    • Incident status: RESOLVED ✓
    • MTTR recorded: 12m 45s ✓
    • Root cause documented ✓
    • Timeline complete ✓
    • Services recovered: 3/3 ✓
    • Complete story ready ✓
```

---

## 📁 FILE STRUCTURE MAPPING

### Backend (Go)
```
backend/
├─ main.go                          # Server initialization
├─ middleware/middleware.go         # JWT auth, CORS
├─ handlers/
│  ├─ handlers.go                  # REST endpoint handlers
│  └─ test.go                      # Test/failure injection
├─ services/
│  ├─ incident_service.go          # Incident CRUD
│  ├─ slo_service.go               # SLO calculations
│  ├─ timeline_services.go         # Timeline events
│  └─ k8s_client.go                # Kubernetes integration
├─ correlation/
│  └─ engine.go                    # Root cause analysis
├─ clients/
│  ├─ prometheus.go                # Metrics queries
│  ├─ loki.go                      # Log analysis
│  └─ kubernetes.go                # K8s API
├─ database/
│  └─ schema.sql                   # Database tables
└─ models/
   └─ models.go                    # Data structures
```

### Frontend (React/TypeScript)
```
src/
├─ app/
│  ├─ App.tsx                      # Main app component
│  ├─ api/
│  │  ├─ backend.ts                # API client
│  │  └─ incidents.ts              # Incident API
│  ├─ components/                  # UI components
│  └─ hooks/                       # Custom hooks
├─ intelligence/
│  ├─ IncidentBoard.tsx            # Incident list
│  ├─ IncidentTimeline.tsx         # Timeline display
│  ├─ RootCausePanel.tsx           # Root cause display
│  └─ ImpactSummary.tsx            # Business impact
└─ utils/
   ├─ cache.ts                     # Caching logic
   ├─ retry-logic.ts               # Retry mechanism
   └─ circuit-breaker.ts           # Circuit breaker
```

### Docker
```
docker/
├─ docker-compose.yml              # Service orchestration
├─ prometheus.yml                  # Metrics config
├─ loki.yml                        # Logs config
└─ tempo.yml                       # Traces config
```

---

## 🔗 API ENDPOINT MAPPING

```
Protected Routes (Require JWT):
├─ POST   /api/incidents           → CreateIncident()
├─ GET    /api/incidents           → ListIncidents()
├─ GET    /api/incidents/{id}      → GetIncident()
├─ PATCH  /api/incidents/{id}      → UpdateIncident()
├─ GET    /api/incidents/{id}/timeline      → GetTimeline()
├─ POST   /api/incidents/{id}/timeline      → AddTimelineEvent()
├─ GET    /api/incidents/{id}/correlations  → GetCorrelations()
├─ GET    /api/slos                → ListSLOs()
├─ POST   /api/slos                → CreateSLO()
├─ GET    /api/slos/{id}           → GetSLO()
├─ PATCH  /api/slos/{id}           → UpdateSLO()
└─ POST   /api/test/fail           → HandleTestFail()

Public Routes (No JWT needed):
├─ GET    /health                  → HealthCheck()
├─ POST   /api/auth/register       → RegisterHandler()
└─ POST   /api/auth/login          → LoginHandler()
```

---

## ✅ COMPLETE VERIFICATION CHECKLIST

### Database Schema ✓
- [x] incidents table
- [x] timeline_events table
- [x] slos table
- [x] services table
- [x] incident_services (many-to-many)
- [x] slo_history table
- [x] incident_tasks table

### API Handlers ✓
- [x] Authentication (login, register, refresh)
- [x] Incident CRUD operations
- [x] Timeline operations
- [x] SLO calculations
- [x] Correlation retrieval
- [x] Test failure injection

### Services ✓
- [x] IncidentService
- [x] SLOService
- [x] TimelineService
- [x] TaskService
- [x] CorrelationEngine

### Middleware ✓
- [x] JWT authentication
- [x] CORS configuration
- [x] Authorization checks

### Frontend Components ✓
- [x] IncidentBoard (list)
- [x] IncidentTimeline (display)
- [x] RootCausePanel (analysis)
- [x] ImpactSummary (business impact)

### Docker Services ✓
- [x] Backend (port 9000)
- [x] PostgreSQL (port 5432)
- [x] Grafana (port 3000)
- [x] Prometheus (port 9090)
- [x] Loki (port 3100)
- [x] Tempo (port 3200)

---

## 🎯 READY FOR PRODUCTION

All files properly configured for:
- ✅ Development
- ✅ Testing
- ✅ Staging
- ✅ Production (with scaling)

**Status**: COMPLETE & VERIFIED ✅
