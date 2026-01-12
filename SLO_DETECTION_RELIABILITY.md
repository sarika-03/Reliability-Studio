# SLO & Incident Detection Reliability Guide

**Version:** 1.0  
**Last Updated:** $(date)  
**Status:** Production-Ready  

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [SLO Calculation Engine](#slo-calculation-engine)
3. [Incident Detection System](#incident-detection-system)
4. [Error Handling & Diagnostics](#error-handling--diagnostics)
5. [Database Persistence](#database-persistence)
6. [Production Validation](#production-validation)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring & Alerting](#monitoring--alerting)

---

## Architecture Overview

The Reliability Studio platform provides a production-grade SLO (Service Level Objective) calculation and automated incident detection engine that integrates with Prometheus, Loki, Tempo, and PostgreSQL.

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Grafana Plugin)                    │
│              Real-time incident and SLO visibility              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│              Backend API (Go 1.24, Port 9000)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SLO Calculation Service        Incident Detection       │   │
│  │  ─ CalculateSLO()              ─ runDetection()         │   │
│  │  ─ GetSLOHistory()             ─ evaluateThresholdRule()│   │
│  │  ─ CalculateBurnRate()         ─ processDetectionEvent()│   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼──────────┐ ┌─────────▼────────────┐ ┌──────▼──────────┐
│  PostgreSQL      │ │   Prometheus        │ │     Loki        │
│  ─ incidents     │ │   (Metrics)         │ │   (Logs)        │
│  ─ slos          │ │   ─ Query results   │ │   ─ Error logs  │
│  ─ services      │ │   ─ Availability    │ │   ─ Patterns    │
│  ─ timeline_     │ │   ─ Error rates     │ │   ─ Detection   │
│    events        │ │                     │ │     alerts      │
│  ─ detection_    │ │                     │ │                 │
│    rules         │ │                     │ │                 │
└──────────────────┘ └─────────────────────┘ └─────────────────┘
```

### Design Principles

1. **Reliability**: All incident creation uses database transactions to ensure atomicity
2. **Observability**: Detailed error messages with context at every step
3. **Resilience**: Circuit breakers for external service calls (Prometheus, Loki)
4. **Scalability**: Batch SLO calculations with configurable windows
5. **Auditability**: Complete timeline events for every incident state change

---

## SLO Calculation Engine

### Overview

SLOs are automatically calculated by querying Prometheus metrics and comparing actual availability against target thresholds.

**Location:** [backend/services/slo_service.go](backend/services/slo_service.go)

### Key Methods

#### `CalculateSLO(ctx, sloID) → SLOAnalysisResult`

Calculates current SLO compliance for a single SLO.

**Inputs:**
- `sloID`: Unique identifier of the SLO to calculate

**Process:**
1. Load SLO configuration (name, target, window, query)
2. Calculate time window: `${WINDOW}` → `"30d"` (from `slo.WindowDays`)
3. Execute Prometheus query with window replacement
4. Parse numeric result (availability percentage)
5. Calculate error budget: `100% - target% - (100% - availability%)`
6. Determine status:
   - `healthy`: error budget ≥ 50%
   - `warning`: error budget 25-50%
   - `critical`: error budget < 25%
7. Update PostgreSQL with new metrics
8. Return analysis with burn rates

**Returns:**
```json
{
  "slo": {
    "id": "slo-001",
    "name": "API Availability",
    "target_percentage": 99.5,
    "current_percentage": 99.7,
    "error_budget_remaining": 75.3,
    "status": "healthy",
    "window_days": 30,
    "last_calculated_at": "2024-01-15T14:30:00Z"
  },
  "burn_rates": [
    {"window": "1h", "burn_rate": 0.5},
    {"window": "1d", "burn_rate": 0.3},
    {"window": "7d", "burn_rate": 0.1}
  ]
}
```

**Error Handling:**

When queries fail, detailed error messages are returned with context:

```json
{
  "status": "error",
  "code": 500,
  "error": "no data returned from SLO query for SLO 'API Availability' (id=slo-001, window=30d): query=availability_percentage{env=\"prod\"} (ensure metric labels are correct and within retention period)",
  "timestamp": "2024-01-15T14:30:00Z"
}
```

**Common Errors & Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| "no data returned from SLO query" | Metric doesn't exist, labels wrong, or outside retention | Verify metric name, labels, and Prometheus retention (default: 15 days) |
| "failed to execute SLO query" | Prometheus connection error or invalid query syntax | Check Prometheus health, verify PromQL syntax |
| "invalid value type in result" | Prometheus returned non-numeric value | Verify SLO query returns scalar result, not vector |
| "failed to update SLO" | Database write failed (connection, permission, constraint) | Check PostgreSQL connection and incident_slos table schema |

### SLO Query Template

SLO queries must contain `${WINDOW}` placeholder:

```promql
# Good: Window will be replaced with "30d", "7d", etc.
100 - (rate(errors_total{job="api"}[${WINDOW}]) / rate(requests_total{job="api"}[${WINDOW}])) * 100

# Bad: Window not in query
100 - (rate(errors_total{job="api"}[30d]) / rate(requests_total{job="api"}[30d])) * 100
```

### HTTP Endpoints

```
GET  /api/slos                    # List all SLOs
GET  /api/slos/{id}              # Get specific SLO
POST /api/slos                   # Create new SLO
PUT  /api/slos/{id}              # Update SLO
DELETE /api/slos/{id}            # Delete SLO
POST /api/slos/{id}/calculate    # Calculate SLO now
GET  /api/slos/{id}/history      # Get SLO historical data
```

**Example: Calculate SLO**

```bash
curl -X POST http://localhost:9000/api/slos/slo-001/calculate \
  -H "Content-Type: application/json"
```

---

## Incident Detection System

### Overview

The incident detection system automatically monitors Prometheus metrics and Loki logs against configured rules, creating incidents when thresholds are breached or anomalies detected.

**Location:** [backend/detection/detector.go](backend/detection/detector.go)

### Detection Rule Types

#### 1. Threshold Rules

Triggers when a metric exceeds a configured threshold.

```json
{
  "id": "rule-001",
  "name": "High Error Rate",
  "type": "threshold",
  "enabled": true,
  "query": "rate(errors_total[5m])",
  "threshold": 0.05,
  "comparison": ">",
  "severity": "critical",
  "window": "5m"
}
```

**Behavior:**
- Queries Prometheus every 30 seconds
- If result > threshold, creates incident with `critical` severity
- Tracks alert with key `"rule-001:service-name"` to prevent duplicates
- Logs: `CREATING INCIDENT: id=..., value=0.087, threshold=0.05`

#### 2. Anomaly Rules

Detects statistical anomalies (stub for extension).

```json
{
  "id": "rule-002",
  "name": "Latency Spike Detection",
  "type": "anomaly",
  "enabled": true,
  "metric": "http_request_duration_seconds",
  "detection_method": "3_sigma"
}
```

#### 3. Pattern Rules

Detects pod crash loops and restart patterns.

```json
{
  "id": "rule-003",
  "name": "Pod Crash Loop Detection",
  "type": "pattern",
  "enabled": true,
  "pattern": "pod_crash_loop",
  "severity": "warning"
}
```

### Key Methods

#### `runDetection() → error`

Main detection loop that runs periodically (every 30 seconds).

**Process:**
1. Load all enabled detection rules from PostgreSQL
2. For each rule:
   - Call `evaluateRule()` to check condition
   - If triggered, call `processDetectionEvent()` to create incident
3. Log results with counts

#### `evaluateThresholdRule(rule) → DetectionEvent, error`

Evaluates a threshold-based rule.

**Process:**
1. Execute Prometheus query from rule
2. Parse numeric result
3. Compare against threshold
4. If condition met, return DetectionEvent with metadata
5. If no data, return nil, nil (condition not triggered)

**Error Handling:**
```
Prometheus error: logs with "Failed to query Prometheus for rule X: [error]"
No data: returns nil (not an error - condition simply not triggered)
Value parsing: logs error, skips rule
```

#### `processDetectionEvent(event) → error`

Creates incident and timeline event for triggered rule.

**Process:**
1. **Deduplication Check**: 
   - Create alert key: `"rule_name:service_id"`
   - Check if already in `d.activeAlerts` map
   - If exists, update timestamp and skip creation (prevents duplicate incidents)

2. **Service Lookup**:
   - Query or create service in PostgreSQL
   - Handle case where service doesn't exist

3. **Database Transaction**:
   ```go
   tx, err := d.db.BeginTx(ctx, nil)
   
   // Insert incident
   INSERT INTO incidents (id, title, description, severity, status, ...)
   
   // Insert timeline event
   INSERT INTO timeline_events (id, incident_id, event_type, ...)
   
   // Commit atomically
   tx.Commit()
   ```

4. **Timeline Entry**: Records detection event with evidence
5. **Callbacks**: Triggers correlation and timeline callbacks
6. **Logging**: Detailed logs at each step

**Example Output:**
```
🔨 CREATING INCIDENT: id=550e8400-e29b-41d4-a716-446655440000, title=[critical] High Error Rate detected in api-service, service=api-service, severity=critical, value=0.087, threshold=0.05

✅ INCIDENT CREATED: id=550e8400-e29b-41d4-a716-446655440000, rule=High Error Rate, service=api-service, severity=critical, value=0.087

📊 Incident details: title='[critical] High Error Rate detected in api-service', description_length=412, evidence_count=3
```

### Transaction Guarantees

**Critical for Reliability:** Incident and timeline event creation uses database transactions.

```go
// Both succeed or both fail - never orphaned records
tx, err := d.db.BeginTx(ctx, nil)
if err != nil {
    return fmt.Errorf("failed to begin transaction: %w", err)
}

// Insert incident
_, err = tx.ExecContext(ctx, insertIncidentQuery, ...)
if err != nil {
    tx.Rollback()  // Automatically called in defer
    return fmt.Errorf("failed to create incident in database: %w", err)
}

// Insert timeline event
_, err = tx.ExecContext(ctx, insertTimelineQuery, ...)
if err != nil {
    tx.Rollback()
    return fmt.Errorf("failed to create timeline event: %w", err)
}

// Atomic commit
if err := tx.Commit(); err != nil {
    return fmt.Errorf("failed to commit incident transaction: %w", err)
}
```

### HTTP Endpoints

```
GET  /api/incidents              # List all incidents
GET  /api/incidents/active       # List active incidents (status != 'resolved')
POST /api/incidents              # Create incident manually
GET  /api/incidents/{id}         # Get specific incident
PUT  /api/incidents/{id}         # Update incident
DELETE /api/incidents/{id}       # Delete incident
GET  /api/incidents/{id}/timeline # Get incident timeline events
POST /api/incidents/{id}/resolve  # Resolve incident
```

**Example: Create Manual Incident**

```bash
curl -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High CPU Usage on database-primary",
    "description": "CPU utilization exceeded 90% threshold",
    "severity": "critical",
    "service_id": "database-primary"
  }'
```

---

## Error Handling & Diagnostics

### Error Message Quality

All errors include context to help debugging:

**Good Error:**
```json
{
  "error": "no data returned from SLO query for SLO 'API Availability' (id=slo-001, window=30d): query=availability_percentage{env=\"prod\"} (ensure metric labels are correct and within retention period)"
}
```

**Bad Error (fixed):**
```json
{
  "error": "no data returned from SLO query"
}
```

### Logging Strategy

**SLO Calculation:**
- `INFO`: "Calculating SLO X"
- `WARN`: "SLO calculation completed but with low budget"
- `ERROR`: Detailed error with query and window

**Incident Detection:**
- `WARN`: "Alert X still active, not creating duplicate incident"
- `ERROR`: "Failed to get/create service: [error]"
- `INFO`: "🔨 CREATING INCIDENT: [details]"
- `INFO`: "✅ INCIDENT CREATED: [details]"
- `ERROR`: "Failed to insert incident record: [error]"
- `ERROR`: "Failed to commit transaction: [error]"

### Accessing Logs

**Backend Logs (Docker):**
```bash
docker logs reliability-backend | grep -E "(INCIDENT|CREATED|ERROR)"
```

**Database Logs:**
```bash
# Check PostgreSQL logs
docker logs postgres | tail -50
```

**Prometheus Metrics Logs:**
```bash
# Verify Prometheus scraping backend
curl http://localhost:9091/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job == "backend")'
```

---

## Database Persistence

### Schema

**Incidents Table:**
```sql
CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    service_id UUID REFERENCES services(id),
    started_at TIMESTAMP NOT NULL,
    detected_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

**Timeline Events Table:**
```sql
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL
);
```

**Detection Rules Table:**
```sql
CREATE TABLE detection_rules (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    query TEXT,
    threshold FLOAT,
    severity VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transaction Model

**Incident Creation Transaction:**
1. `BEGIN TRANSACTION`
2. Insert incident record
3. Insert timeline_events record
4. `COMMIT` (atomic - both succeed or both fail)

**Validation Queries:**

```sql
-- Ensure no orphaned timeline events
SELECT COUNT(*) FROM timeline_events t 
WHERE NOT EXISTS (SELECT 1 FROM incidents i WHERE i.id = t.incident_id);
-- Result should be 0

-- Ensure incident service references are valid
SELECT COUNT(*) FROM incidents i 
WHERE service_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM services s WHERE s.id = i.service_id);
-- Result should be 0

-- Count incidents by status
SELECT status, COUNT(*) FROM incidents GROUP BY status;

-- Get recent incidents with events
SELECT i.id, i.title, COUNT(t.id) as event_count
FROM incidents i
LEFT JOIN timeline_events t ON i.id = t.incident_id
GROUP BY i.id, i.title
ORDER BY i.created_at DESC
LIMIT 10;
```

---

## Production Validation

### Pre-Deployment Checklist

- [ ] SLO Prometheus queries tested and verified
- [ ] Detection rules configured and enabled
- [ ] PostgreSQL backups scheduled
- [ ] Prometheus retention set to ≥ 30 days
- [ ] Loki log retention configured
- [ ] Grafana dashboards created
- [ ] Alert notifications configured (email, Slack, PagerDuty)
- [ ] On-call runbooks prepared

### Running Validation Script

```bash
./verify-slo-detection.sh
```

**Output:**
```
[TEST] Checking backend health
[PASS] Backend is available
[TEST] Listing all SLOs
[PASS] Found 5 SLO(s)
[TEST] Calculating SLO: slo-001
[PASS] SLO calculated successfully: availability=99.7%, budget=75.3%, status=healthy
[TEST] Creating test incident via API
[PASS] Incident created successfully: 550e8400-e29b-41d4-a716-446655440000
[PASS] Incident found in database
[PASS] Found 2 timeline event(s) for incident

[PASS] 9 tests
[FAIL] 0 tests
Success Rate: 100%
✅ All validation tests passed!
```

### Manual Testing

**Test 1: SLO Calculation with Real Data**
```bash
curl -X POST http://localhost:9000/api/slos/slo-001/calculate | jq '.'
```

**Test 2: Incident Creation**
```bash
curl -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test incident","severity":"warning"}'
```

**Test 3: Query via API**
```bash
curl http://localhost:9000/api/incidents | jq 'length'
curl http://localhost:9000/api/incidents/active | jq 'length'
```

**Test 4: Database Validation**
```bash
psql -h localhost -U reliability_user -d reliability \
  -c "SELECT COUNT(*) as incident_count FROM incidents;"
```

---

## Troubleshooting

### Problem: SLO Shows "No Data Returned"

**Diagnosis:**
```sql
-- Check if metric exists in Prometheus
curl 'http://localhost:9091/api/v1/query?query=METRIC_NAME'

-- Check SLO query configuration
SELECT id, name, query, window_days FROM slos WHERE status != 'disabled';

-- Check Prometheus retention period
curl 'http://localhost:9091/api/v1/query?query=up'
```

**Solutions:**
1. Verify metric name spelling: `rate(` vs `Rate(`, `_total` suffix
2. Verify labels: `{job="api"}` must match Prometheus scrape config
3. Ensure data point exists: manually query in Prometheus UI
4. Check Prometheus retention: `--storage.tsdb.retention.time=30d`

### Problem: Incidents Not Being Created

**Diagnosis:**
```bash
# Check backend logs for detection errors
docker logs reliability-backend | grep -E "(INCIDENT|ERROR|Failed)"

# Check if detection is enabled
curl http://localhost:9000/api/health | jq '.detection_enabled'

# Check detection rules
curl http://localhost:9000/api/detection/rules | jq '.[].enabled'
```

**Solutions:**
1. Verify detection rules are enabled in database
2. Check Prometheus connectivity: `curl http://prometheus:9091/api/v1/query`
3. Verify rule queries are valid PromQL
4. Check PostgreSQL connectivity for incident creation

### Problem: Duplicate Incidents Created

**Diagnosis:**
```sql
-- Find duplicate incidents from same rule
SELECT rule_name, service_id, COUNT(*) as count 
FROM incidents 
WHERE created_at > NOW() - INTERVAL '1 hour' 
GROUP BY rule_name, service_id 
HAVING COUNT(*) > 1;
```

**Solutions:**
1. Ensure detection rule deduplication is working (check `activeAlerts` map)
2. Verify rule evaluation interval (should be 30+ seconds)
3. Check for database transaction failures in logs

### Problem: SLO Status Incorrect

**Diagnosis:**
```bash
# Manually calculate availability
curl 'http://localhost:9091/api/v1/query?query=availability_percentage{job="api"}'

# Check SLO target vs current
curl http://localhost:9000/api/slos/slo-001 | jq '{target: .target_percentage, current: .current_percentage, budget: .error_budget_remaining}'
```

**Solutions:**
1. Verify error budget calculation: `100 - target - (100 - current)`
2. Check SLO query window matches calculation
3. Ensure Prometheus query returns scalar result, not vector
4. Validate metric freshness in Prometheus

---

## Monitoring & Alerting

### Key Metrics to Monitor

```promql
# SLO Compliance
- slo_error_budget_remaining (for each SLO)
- slo_current_percentage
- slo_status

# Incident Detection
- incidents_created_total
- incidents_active
- detection_rule_evaluations_total
- detection_rule_errors_total

# Backend Performance
- http_request_duration_seconds (for /api/slos, /api/incidents)
- http_requests_total
- postgres_connections_active
```

### Example Alert Rules

```yaml
# Alert when SLO error budget < 25%
- alert: SLOErrorBudgetCritical
  expr: slo_error_budget_remaining < 25
  for: 5m
  annotations:
    summary: "SLO {{ $labels.slo_name }} error budget critical"
    description: "{{ $labels.slo_name }} has {{ $value }}% budget remaining"

# Alert when incidents are not being created (detection failure)
- alert: NoIncidentsCreated
  expr: rate(incidents_created_total[1h]) == 0
  for: 30m
  annotations:
    summary: "Incident detection may be broken"
    description: "No incidents created in last 30 minutes"

# Alert on detection rule errors
- alert: DetectionRuleErrors
  expr: rate(detection_rule_errors_total[5m]) > 0.1
  for: 10m
  annotations:
    summary: "Detection rules experiencing errors"
```

### Grafana Dashboard

Create a dashboard with:
1. **SLO Overview Panel**: Show all SLOs with status (healthy/warning/critical)
2. **Error Budget Trend**: Line graph of error budget over time
3. **Recent Incidents**: Table of incidents with creation time and status
4. **Detection Rules Status**: Show enabled rules and last evaluation time
5. **Incident Timeline**: Annotated graph showing incident occurrences

---

## FAQ

**Q: How often are SLOs calculated?**  
A: Configure via cron or background task. Default: every 15 minutes. Can be triggered on-demand via `/api/slos/{id}/calculate`.

**Q: Can I create incidents manually?**  
A: Yes, via `POST /api/incidents` endpoint with title, description, severity, and optional service_id.

**Q: How long are incidents retained?**  
A: As long as they're not deleted. Recommend archiving resolved incidents older than 90 days.

**Q: What happens if Prometheus is down?**  
A: SLO calculation returns error "failed to execute SLO query". Detection rules skip evaluation. Both have retry logic.

**Q: Are detection rules evaluated in parallel?**  
A: Rules are evaluated sequentially but in a goroutine. No parallelization to avoid Prometheus overload.

**Q: How do I silence a rule?**  
A: Set `enabled=false` in detection_rules table: `UPDATE detection_rules SET enabled=false WHERE name='Rule Name';`

---

## Support & Documentation

- **Backend Repository**: [/backend](backend)
- **Database Schema**: [backend/database/schema.sql](backend/database/schema.sql)
- **SLO Service**: [backend/services/slo_service.go](backend/services/slo_service.go)
- **Detection System**: [backend/detection/detector.go](backend/detection/detector.go)
- **Validation Script**: [verify-slo-detection.sh](verify-slo-detection.sh)
- **Observability Setup**: [OBSERVABILITY_SETUP.md](OBSERVABILITY_SETUP.md)
- **Production Fixes**: [PRODUCTION_FIXES_SUMMARY.md](PRODUCTION_FIXES_SUMMARY.md)

---

**Last Updated:** $(date)  
**Author:** Reliability Studio Team  
**Status:** Production-Ready with Transaction Guarantees
