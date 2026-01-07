# API Testing Guide

Complete guide for testing all backend endpoints.

## Setup

```bash
# Start the backend
docker-compose up -d

# Or run locally
export DATABASE_URL="postgres://rcp_user:changeme@localhost:5432/reliability_control_plane?sslmode=disable"
go run main.go
```

Base URL: `http://localhost:9000`

---

## 1. Health Check

```bash
curl http://localhost:9000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "reliability-control-plane-backend"
}
```

---

## 2. Services API

### Create a Service
```bash
curl -X POST http://localhost:9000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payment-service",
    "description": "Handles payment processing",
    "team": "payments-team",
    "repository_url": "https://github.com/company/payment-service",
    "documentation_url": "https://docs.company.com/payment-service"
  }'
```

### List All Services
```bash
curl http://localhost:9000/api/services
```

### Get Service by ID
```bash
SERVICE_ID="<uuid-from-create>"
curl http://localhost:9000/api/services/$SERVICE_ID
```

### Update Service
```bash
curl -X PATCH http://localhost:9000/api/services/$SERVICE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "team": "new-payments-team"
  }'
```

---

## 3. SLOs API

### Create an SLO
```bash
curl -X POST http://localhost:9000/api/slos \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "'$SERVICE_ID'",
    "name": "API Availability",
    "objective": 99.9,
    "window_days": 30
  }'
```

### List All SLOs
```bash
curl http://localhost:9000/api/slos
```

### Get SLO by ID
```bash
SLO_ID="<uuid-from-create>"
curl http://localhost:9000/api/slos/$SLO_ID
```

### Update SLO
```bash
curl -X PATCH http://localhost:9000/api/slos/$SLO_ID \
  -H "Content-Type: application/json" \
  -d '{
    "error_budget_remaining": 92.5,
    "status": "healthy"
  }'
```

---

## 4. Incidents API

### Create an Incident
```bash
curl -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment API returning 500 errors",
    "description": "Users unable to complete payments due to server errors",
    "severity": "critical",
    "service_ids": ["'$SERVICE_ID'"]
  }'
```

### List Incidents
```bash
# All incidents
curl http://localhost:9000/api/incidents

# Filter by status
curl "http://localhost:9000/api/incidents?status=open"

# Filter by severity
curl "http://localhost:9000/api/incidents?severity=critical"

# Combined filters
curl "http://localhost:9000/api/incidents?status=open&severity=critical"
```

### Get Incident by ID
```bash
INCIDENT_ID="<uuid-from-create>"
curl http://localhost:9000/api/incidents/$INCIDENT_ID
```

### Update Incident
```bash
# Update status
curl -X PATCH http://localhost:9000/api/incidents/$INCIDENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "investigating"
  }'

# Add root cause
curl -X PATCH http://localhost:9000/api/incidents/$INCIDENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "root_cause": "Database connection pool exhausted due to traffic spike"
  }'
```

---

## 5. Timeline Events API

### Add Timeline Event
```bash
curl -X POST http://localhost:9000/api/incidents/$INCIDENT_ID/timeline \
  -H "Content-Type: application/json" \
  -d '{
    "type": "metric_anomaly",
    "source": "prometheus",
    "title": "Error rate spike detected",
    "description": "Error rate increased from 0.1% to 15% at 14:32 UTC",
    "metadata": {
      "metric": "http_requests_total",
      "value": "15.2",
      "threshold": "1.0"
    }
  }'
```

### Get Timeline
```bash
curl http://localhost:9000/api/incidents/$INCIDENT_ID/timeline
```

**Event Types:**
- `alert` - Alert fired
- `log_spike` - Unusual log activity
- `pod_crash` - Kubernetes pod crash
- `metric_anomaly` - Metric threshold exceeded
- `user_action` - Manual action taken
- `detection` - Automated detection

---

## 6. Tasks API

### Create a Task
```bash
curl -X POST http://localhost:9000/api/incidents/$INCIDENT_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Increase database connection pool size",
    "description": "Scale connection pool from 50 to 200 connections",
    "assigned_to": 1
  }'
```

### List Tasks for Incident
```bash
curl http://localhost:9000/api/incidents/$INCIDENT_ID/tasks
```

### Get Task by ID
```bash
TASK_ID="<uuid-from-create>"
curl http://localhost:9000/api/incidents/$INCIDENT_ID/tasks/$TASK_ID
```

### Update Task
```bash
# Mark in progress
curl -X PATCH http://localhost:9000/api/incidents/$INCIDENT_ID/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'

# Mark complete
curl -X PATCH http://localhost:9000/api/incidents/$INCIDENT_ID/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

### Delete Task
```bash
curl -X DELETE http://localhost:9000/api/incidents/$INCIDENT_ID/tasks/$TASK_ID
```

---

## 7. Service Incidents API

### Get All Incidents for a Service
```bash
curl http://localhost:9000/api/services/$SERVICE_ID/incidents
```

---

## Complete Workflow Example

```bash
#!/bin/bash

# 1. Create a service
SERVICE_RESPONSE=$(curl -s -X POST http://localhost:9000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "checkout-service",
    "team": "checkout-team"
  }')
SERVICE_ID=$(echo $SERVICE_RESPONSE | jq -r '.id')
echo "Created service: $SERVICE_ID"

# 2. Create an SLO
SLO_RESPONSE=$(curl -s -X POST http://localhost:9000/api/slos \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "'$SERVICE_ID'",
    "name": "Checkout Availability",
    "objective": 99.95,
    "window_days": 30
  }')
SLO_ID=$(echo $SLO_RESPONSE | jq -r '.id')
echo "Created SLO: $SLO_ID"

# 3. Create an incident
INCIDENT_RESPONSE=$(curl -s -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Checkout Service Degradation",
    "description": "High latency on /checkout endpoint",
    "severity": "high",
    "service_ids": ["'$SERVICE_ID'"]
  }')
INCIDENT_ID=$(echo $INCIDENT_RESPONSE | jq -r '.id')
echo "Created incident: $INCIDENT_ID"

# 4. Add timeline event
curl -s -X POST http://localhost:9000/api/incidents/$INCIDENT_ID/timeline \
  -H "Content-Type: application/json" \
  -d '{
    "type": "detection",
    "source": "automated",
    "title": "High latency detected",
    "description": "P95 latency increased to 5000ms"
  }' > /dev/null
echo "Added timeline event"

# 5. Create tasks
TASK1=$(curl -s -X POST http://localhost:9000/api/incidents/$INCIDENT_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Check database query performance",
    "description": "Review slow query logs"
  }')
echo "Created task 1"

TASK2=$(curl -s -X POST http://localhost:9000/api/incidents/$INCIDENT_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Scale up checkout service pods",
    "description": "Increase replicas from 3 to 10"
  }')
echo "Created task 2"

# 6. Update incident status
curl -s -X PATCH http://localhost:9000/api/incidents/$INCIDENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "investigating"
  }' > /dev/null
echo "Updated incident to investigating"

# 7. View everything
echo "
=== Incident Details ==="
curl -s http://localhost:9000/api/incidents/$INCIDENT_ID | jq '.'

echo "
=== Timeline ==="
curl -s http://localhost:9000/api/incidents/$INCIDENT_ID/timeline | jq '.'

echo "
=== Tasks ==="
curl -s http://localhost:9000/api/incidents/$INCIDENT_ID/tasks | jq '.'
```

---

## Database Queries

```bash
# Connect to database
docker exec -it reliability-postgres psql -U rcp_user -d reliability_control_plane

# View all services
SELECT id, name, team FROM services;

# View all incidents
SELECT id, title, severity, status, started_at FROM incidents ORDER BY started_at DESC;

# View incident timeline
SELECT incident_id, event_type, source, title, timestamp 
FROM timeline_events 
WHERE incident_id = '<uuid>' 
ORDER BY timestamp;

# View tasks
SELECT id, incident_id, title, status FROM incident_tasks;
```

---

## Testing Checklist

- [ ] Health endpoint works
- [ ] Can create services
- [ ] Can list services
- [ ] Can get service by ID
- [ ] Can update service
- [ ] Can create SLO
- [ ] Can list SLOs
- [ ] Can update SLO status
- [ ] Can create incident
- [ ] Can list incidents with filters
- [ ] Can update incident status
- [ ] Can add timeline events
- [ ] Can create tasks
- [ ] Can update task status
- [ ] Can mark tasks complete
- [ ] Can get service incidents
- [ ] All UUIDs are valid
- [ ] Timestamps are correct
- [ ] Error handling works (try invalid UUIDs)

---

## Common Errors

### "Incident not found"
- Check the UUID is correct
- Verify incident exists: `curl http://localhost:9000/api/incidents`

### "Failed to connect to database"
- Check PostgreSQL is running: `docker-compose ps postgres`
- Verify DATABASE_URL is correct

### "Invalid request body"
- Check JSON syntax
- Ensure Content-Type header is set
- Verify required fields are present

### CORS errors
- CORS is enabled for all origins
- If issues persist, check middleware configuration