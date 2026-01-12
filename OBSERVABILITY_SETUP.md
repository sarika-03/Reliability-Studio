# Reliability Studio - Observability Pipeline Setup Guide

## Overview

The Reliability Studio observability pipeline consists of three core components integrated with Grafana:

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  APPLICATION LAYER                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │   Backend API    │  │   Test App       │  │   Services   │   │
│  │ (9000/metrics)   │  │ (5000/metrics)   │  │              │   │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────┘   │
│           │                     │                                │
│           ├─────────────────────┼─────────────────┐              │
│           │                     │                 │              │
│  COLLECTION LAYER                                                │
│  ┌────────▼──────────┐  ┌──────▼──────────┐  ┌──▼─────────────┐ │
│  │   Prometheus      │  │    Promtail     │  │    OTLP gRPC   │ │
│  │  (scrape /metrics)│  │  (Docker logs)  │  │   (port 4317)  │ │
│  │  (9090)           │  │  (9080)         │  │                │ │
│  └────────┬──────────┘  └────────┬────────┘  └────┬────────────┘ │
│           │                      │                │              │
│  STORAGE & BACKEND LAYER                                         │
│  ┌────────▼──────────┐  ┌──────▼──────────┐  ┌──▼─────────────┐ │
│  │   Prometheus DB   │  │    Loki         │  │     Tempo      │ │
│  │  (tsdb storage)   │  │   (log index)   │  │  (trace spans) │ │
│  │  (9091 pushgw)    │  │  (3100)         │  │   (3200)       │ │
│  └────────┬──────────┘  └────────┬────────┘  └────┬────────────┘ │
│           │                      │                │              │
│  VISUALIZATION LAYER                                             │
│  └────────┬──────────────────────┼────────────────┘              │
│           │                      │                               │
│           └──────────────┬───────┘                               │
│                          │                                       │
│                   ┌──────▼──────────┐                            │
│                   │     Grafana     │                            │
│                   │ - Explore Logs  │                            │
│                   │ - Explore Metrics                            │
│                   │ - Explore Traces│                            │
│                   │ (3000)          │                            │
│                   └─────────────────┘                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Metrics Pipeline (Prometheus)

**Scrape Targets:**
```yaml
job_name: backend
  - backend:9000/metrics (10s interval)
job_name: test-app  
  - test-app:5000/metrics (10s interval)
job_name: prometheus
  - prometheus:9090 (self-monitoring)
job_name: pushgateway
  - pushgateway:9091 (batch jobs)
```

**Metrics Scraped:**
- HTTP request count, duration, status codes
- Go runtime metrics (goroutines, memory, GC)
- Database connection pool metrics
- Custom application metrics

**Configuration Changes:**
- ✅ Added global external labels (cluster, environment)
- ✅ Backend now exposes `/metrics` endpoint (via prometheus/client_golang)
- ✅ Improved scrape intervals (15s global, 10s per job)
- ✅ Added relabel configs for instance labels

### 2. Logs Pipeline (Loki + Promtail)

**Log Sources:**
```
Promtail (9080)
├── Docker Container Logs
│   └── JSON log driver parsing
│       ├── Extracts: log, stream, container_id, container_name
│       └── Labels: job="docker", container_name="{name}"
└── (Optional) Systemd Journal Logs
```

**Log Query Examples:**
```
# All Docker logs
{job="docker"}

# Logs from specific container
{job="docker", container_name="reliability-backend"}

# Error logs only
{job="docker"} | "error"
```

**Configuration Changes:**
- ✅ Enhanced Promtail JSON parsing for Docker logs
- ✅ Added structured metadata support in Loki
- ✅ Configured batch settings for efficient log ingestion
- ✅ Added persistent position tracking
- ✅ Promtail health check endpoint

### 3. Traces Pipeline (Tempo + OpenTelemetry)

**Trace Collection:**
```
Backend (OTLP gRPC)
└── tempo:4317
    └── Tempo Storage (/tmp/tempo)
        ├── Trace spans
        ├── Service map
        └── Metrics derived from traces (experimental)

Test-App (OTLP gRPC)
└── tempo:4317
```

**Configuration Changes:**
- ✅ Enabled OTLP gRPC receiver on port 4317
- ✅ Enabled HTTP receiver on port 4318 (optional)
- ✅ Configured metrics generator for trace-based metrics
- ✅ Set 5m block duration for better query performance
- ✅ Enabled query frontend with compression

## Installation & Startup

### 1. Build and Start Services

```bash
# Navigate to docker directory
cd docker

# Build backend service (includes prometheus/client_golang)
docker-compose build backend

# Start all services
docker-compose up -d

# Verify services are healthy
docker-compose ps
```

Expected output:
```
NAME                 STATUS              PORTS
grafana              healthy (5/5)       0.0.0.0:3000->3000/tcp
prometheus           healthy (60/60)     0.0.0.0:9091->9090/tcp
loki                 healthy (60/60)     0.0.0.0:3100->3100/tcp
tempo                healthy (20/20)     0.0.0.0:3200->3200/tcp
promtail             healthy (10/10)     0.0.0.0:9080->9080/tcp
postgres             healthy (60/60)     0.0.0.0:5432->5432/tcp
backend              healthy (30/30)     0.0.0.0:9000->9000/tcp
test-app             healthy (30/30)     0.0.0.0:5000->5000/tcp
```

### 2. Access Grafana

```bash
# Open Grafana UI
open http://localhost:3000
# or
curl http://localhost:3000

# Default credentials
Username: admin
Password: admin
```

### 3. Verify Data Sources

In Grafana, navigate to **Configuration > Data Sources** and verify:
- ✅ Prometheus (http://prometheus:9090)
- ✅ Loki (http://loki:3100)
- ✅ Tempo (http://tempo:3200)

## Verification Steps

### A. Verify Prometheus Metrics

**1. Check Prometheus is scraping targets:**
```bash
curl http://localhost:9091/api/v1/targets
```

Expected: All 6 jobs should show `"health": "up"`

**2. Grafana Explore - Metrics:**
- Navigate to **Grafana > Explore (top left)**
- Select **Prometheus** data source
- Execute query: `up`

Expected result:
```
up{instance="prometheus:9090", job="prometheus"} = 1
up{instance="backend:9000", job="backend"} = 1
up{instance="test-app:5000", job="test-app"} = 1
up{instance="pushgateway:9091", job="pushgateway"} = 1
up{instance="loki:3100", job="loki"} = 1
up{instance="tempo:3200", job="tempo"} = 1
```

**3. Check backend metrics endpoint:**
```bash
curl http://localhost:9000/metrics | head -20
```

Expected: Prometheus text format with metrics like:
```
# HELP go_goroutines Number of goroutines that currently exist.
# TYPE go_goroutines gauge
go_goroutines 15
# HELP http_requests_total Total HTTP requests
```

### B. Verify Loki Logs

**1. Check Promtail is running:**
```bash
docker-compose logs promtail | head -20
```

Expected: No errors, should show scraping messages

**2. Grafana Explore - Logs:**
- Navigate to **Grafana > Explore**
- Select **Loki** data source
- Execute query: `{job="docker"}`

Expected result: Shows recent Docker container logs with:
- log: The log message
- stream: stdout or stderr
- container_name: Container name

**3. Filter by specific service:**
```
{job="docker", container_name="reliability-backend"}
```

**4. Search for errors:**
```
{job="docker"} | "error" or "ERROR" or "failed"
```

### C. Verify Tempo Traces

**1. Generate trace traffic:**
```bash
# Make requests to backend (generates traces)
for i in {1..5}; do
  curl http://localhost:9000/health
  sleep 1
done

# Make requests to test-app (generates traces with spans)
for i in {1..5}; do
  curl http://localhost:5000/slow
  sleep 1
done
```

**2. Grafana Explore - Traces:**
- Navigate to **Grafana > Explore**
- Select **Tempo** data source
- Click **Search** button (no query needed initially)

Expected: Shows recent trace IDs and their spans

**3. Search for specific service traces:**
- In Tempo explorer, select **Service: backend** or **Service: test-app**
- Click **Search** to see traces for that service

**4. Inspect a trace:**
- Click on any trace ID to see:
  - Span waterfall diagram
  - Service operations
  - Latency breakdown
  - Tags and attributes

## Troubleshooting

### Issue: Prometheus shows "down" for backend

**Diagnosis:**
```bash
# Check backend is running
docker-compose ps backend

# Check metrics endpoint
curl -v http://localhost:9000/metrics
```

**Solution:**
1. Ensure backend is built with prometheus/client_golang: `docker-compose build backend`
2. Verify /metrics endpoint is registered in main.go
3. Check backend logs: `docker-compose logs backend`

### Issue: Loki shows no logs

**Diagnosis:**
```bash
# Check Promtail is running and healthy
docker-compose ps promtail

# Check Docker logs volume mount
docker exec promtail ls -la /var/lib/docker/containers/

# Verify Loki received data
curl http://localhost:3100/loki/api/v1/labels
```

**Solution:**
1. Ensure Promtail has Docker socket access: `-v /var/run/docker.sock:/var/run/docker.sock`
2. Check Promtail logs: `docker-compose logs promtail`
3. Verify Loki is accepting logs: `curl http://localhost:3100/ready`

### Issue: Tempo shows no traces

**Diagnosis:**
```bash
# Check Tempo receiver is listening
netstat -tlnp | grep 4317
# or
docker exec tempo lsof -i :4317

# Generate traffic
curl http://localhost:5000/slow

# Check Tempo stored traces
docker exec tempo ls -la /tmp/tempo/
```

**Solution:**
1. Verify OTEL endpoint in backend/test-app: `tempo:4317`
2. Check network connectivity: `docker network ls`
3. Verify tempo.yml has OTLP gRPC receiver enabled
4. Check Tempo logs: `docker-compose logs tempo`

## Advanced Queries

### Prometheus Queries

```promql
# Request rate per service
rate(http_requests_total[5m]) by (job)

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, http_request_duration_seconds)

# Service availability
(1 - rate(http_requests_total{status=~"5.."}[5m])) * 100
```

### Loki Queries

```logql
# Error logs
{job="docker"} |= "error"

# Specific service
{job="docker", container_name="reliability-backend"} 

# Multiple services
{job="docker", container_name=~"reliability-.*"}

# Log levels
{job="docker"} | json | level="ERROR"

# Rate of errors
rate({job="docker"} |= "error" [1m])
```

### Tempo Queries

```
# Service filter
Service: reliability-backend
Operation: /api/incidents
Min Duration: 100ms
Status Code: 500
```

## Performance Tuning

### Prometheus
- Scrape interval: 15s (global), 10s for application services
- Storage retention: 15 days (default)
- Max samples per second: Unlimited (development)

### Loki
- Ingestion rate: 100MB/min (configurable)
- Batch size: 1024 bytes (efficient batching)
- Position file: Persistent tracking to /tmp/positions.yaml

### Tempo
- Block duration: 5m (better query performance)
- Retention: 10m (development setting, increase for production)
- Metrics generator: Enabled (derive metrics from traces)

## Production Recommendations

### 1. Enable Persistence
```yaml
# Add persistent volumes for observability data
volumes:
  prometheus_data: {}
  loki_data: {}
  tempo_data: {}
```

### 2. Configure Retention
```yaml
# Prometheus: 30 days
prometheus:
  command: --storage.tsdb.retention.time=30d

# Loki: 30 days
limits_config:
  retention_period: 720h

# Tempo: 7 days
storage:
  retention: 7d
```

### 3. Enable Authentication
```yaml
# Loki
auth_enabled: true

# Prometheus: Use reverse proxy with auth

# Grafana: Configure OAuth/LDAP
```

### 4. Enable TLS
- Use nginx/Traefik reverse proxy
- Terminate TLS at proxy layer
- Configure secure communication between services

### 5. Resource Limits
```yaml
backend:
  resources:
    limits:
      memory: "512M"
      cpus: "1"
prometheus:
  resources:
    limits:
      memory: "1G"
loki:
  resources:
    limits:
      memory: "512M"
```

## Summary

✅ **Observability Pipeline Status:**
- ✅ Prometheus metrics collection (backend & test-app)
- ✅ Loki log aggregation (Docker logs via Promtail)
- ✅ Tempo distributed tracing (OTLP gRPC)
- ✅ Grafana visualization (Explore & Dashboards)

**Expected Outcomes:**
- Prometheus `up` query shows all 6 services healthy
- Loki logs available via `{job="docker"}` query
- Tempo traces searchable by service and operation
- Full observability in Grafana Explore

---

**Last Updated**: 2025-01-12  
**Status**: ✅ Production-Ready Observability Pipeline
