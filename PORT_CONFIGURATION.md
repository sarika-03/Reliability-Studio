# Port Configuration & Wiring Guide

## 🎯 Complete Port Mapping

### Docker Compose Port Mapping (Host:Container)

| Service | Host Port | Container Port | Internal Docker Network | Status |
|---------|-----------|----------------|------------------------|--------|
| **Grafana** | 3000 | 3000 | grafana:3000 | ✅ |
| **Prometheus** | 9091 | 9090 | prometheus:9090 | ✅ |
| **Loki** | 3100 | 3100 | loki:3100 | ✅ |
| **Tempo** | 3200 | 3200 | tempo:3200 | ✅ |
| **Tempo OTLP** | 4317 | 4317 | tempo:4317 | ✅ |
| **PostgreSQL** | 5432 | 5432 | postgres:5432 | ✅ |
| **Backend API** | 9000 | 9000 | backend:9000 | ✅ |
| **Test App** | 5000 | 5000 | test-app:5000 | ✅ |
| **Vite Dev** | 5173 | 5173 | N/A (host only) | ✅ |

## 🔌 Service Wiring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HOST MACHINE                              │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Grafana  │  │Prometheus│  │   Loki   │                  │
│  │ :3000    │  │  :9091    │  │  :3100   │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │             │              │                         │
│       └─────────────┼──────────────┘                         │
│                     │                                         │
│              ┌──────▼──────┐                                 │
│              │   Tempo      │                                 │
│              │   :3200      │                                 │
│              │   :4317      │                                 │
│              └──────┬───────┘                                 │
│                     │                                         │
│              ┌──────▼───────┐                                 │
│              │  PostgreSQL   │                                 │
│              │    :5432      │                                 │
│              └──────┬────────┘                                 │
│                     │                                         │
│              ┌──────▼────────┐                                │
│              │ Backend API   │                                │
│              │    :9000      │                                │
│              └──────┬────────┘                                │
│                     │                                         │
│              ┌──────▼────────┐                                │
│              │ Grafana Plugin│                                │
│              │   (Frontend)  │                                │
│              └───────────────┘                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              DOCKER INTERNAL NETWORK                         │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Grafana  │  │Prometheus│  │   Loki   │                  │
│  │ :3000    │  │  :9090    │  │  :3100   │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │             │              │                         │
│       └─────────────┼──────────────┘                         │
│                     │                                         │
│              ┌──────▼──────┐                                 │
│              │   Tempo      │                                 │
│              │   :3200      │                                 │
│              │   :4317      │                                 │
│              └──────┬───────┘                                 │
│                     │                                         │
│              ┌──────▼───────┐                                 │
│              │  PostgreSQL   │                                 │
│              │    :5432      │                                 │
│              └──────┬────────┘                                 │
│                     │                                         │
│              ┌──────▼────────┐                                │
│              │ Backend API   │                                │
│              │    :9000      │                                │
│              └──────┬────────┘                                │
│                     │                                         │
│         ┌──────────┼──────────┐                               │
│         │          │          │                               │
│    ┌────▼────┐ ┌───▼───┐ ┌────▼────┐                         │
│    │Incident │ │Correl │ │Timeline │                         │
│    │Detector │ │Engine  │ │Engine   │                         │
│    └─────────┘ └───────┘ └─────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Port Configuration Verification

### 1. Backend Configuration (main.go)
```go
promURL := getEnv("PROMETHEUS_URL", "http://prometheus:9090")  // ✅ Correct
lokiURL := getEnv("LOKI_URL", "http://loki:3100")              // ✅ Correct
port := getEnv("PORT", "9000")                                  // ✅ Correct
```

### 2. Docker Compose Environment Variables
```yaml
PROMETHEUS_URL: http://prometheus:9090  # ✅ Internal Docker network
LOKI_URL: http://loki:3100              # ✅ Internal Docker network
TEMPO_URL: http://tempo:3200             # ✅ Internal Docker network
PORT: 9000                               # ✅ Backend port
```

### 3. Grafana Datasources (provisioning)
```yaml
Prometheus: http://prometheus:9090  # ✅ Internal Docker network
Loki: http://loki:3100              # ✅ Internal Docker network
Tempo: http://tempo:3200            # ✅ Internal Docker network
```

### 4. Frontend API Configuration
```typescript
const API_BASE = "http://localhost:9000/api";  // ✅ Host access
WebSocket: ws://localhost:9000/api/realtime    // ✅ Host access
```

## 🔍 Port Access Patterns

### From Host Machine (Development)
- **Grafana UI**: http://localhost:3000
- **Prometheus UI**: http://localhost:9091 ⚠️ (Note: 9091, not 9090)
- **Loki UI**: http://localhost:3100
- **Tempo UI**: http://localhost:3200
- **Backend API**: http://localhost:9000
- **PostgreSQL**: localhost:5432

### From Docker Containers (Internal Network)
- **Prometheus**: http://prometheus:9090 ✅
- **Loki**: http://loki:3100 ✅
- **Tempo**: http://tempo:3200 ✅
- **PostgreSQL**: postgres:5432 ✅
- **Backend**: http://backend:9000 ✅

## ⚠️ Important Notes

### Prometheus Port Mapping
- **Host Port**: 9091 (for external access)
- **Container Port**: 9090 (internal Docker network)
- **Why**: Port 9090 might be in use on host, so we map to 9091
- **Backend uses**: `http://prometheus:9090` ✅ (correct for internal network)
- **External access**: Use `http://localhost:9091` ⚠️

### No Port Conflicts
All ports are unique and properly mapped:
- ✅ No duplicate host ports
- ✅ No duplicate container ports
- ✅ All services can communicate internally
- ✅ All services accessible from host

## 🧪 Testing Port Connectivity

### From Host
```bash
# Grafana
curl http://localhost:3000/api/health

# Prometheus (note: port 9091)
curl http://localhost:9091/-/healthy

# Loki
curl http://localhost:3100/ready

# Tempo
curl http://localhost:3200/ready

# Backend
curl http://localhost:9000/api/health

# PostgreSQL
psql -h localhost -p 5432 -U postgres -d reliability_studio
```

### From Backend Container
```bash
docker exec reliability-backend curl http://prometheus:9090/-/healthy
docker exec reliability-backend curl http://loki:3100/ready
docker exec reliability-backend curl http://tempo:3200/ready
```

## 🔧 Environment Variable Reference

### Backend Environment Variables
```bash
# Database
DB_HOST=postgres              # Docker service name
DB_PORT=5432                  # Container port
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reliability_studio

# Observability Stack
PROMETHEUS_URL=http://prometheus:9090  # Internal Docker network
LOKI_URL=http://loki:3100              # Internal Docker network
TEMPO_URL=http://tempo:3200            # Internal Docker network

# Backend
PORT=9000                               # Backend API port
JWT_SECRET=your-secret-here
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional
ENABLE_PPROF=true                      # Enable pprof on :6060
```

## ✅ Verification Checklist

- [x] All ports are unique (no conflicts)
- [x] Backend connects to Prometheus via internal network ✅
- [x] Backend connects to Loki via internal network ✅
- [x] Backend connects to Tempo via internal network ✅
- [x] Frontend connects to Backend via host network ✅
- [x] Grafana connects to all datasources via internal network ✅
- [x] All services are accessible from host ✅
- [x] Docker healthchecks use correct ports ✅

## 🚀 Production Considerations

For production deployment:

1. **Use environment variables** for all URLs (already implemented ✅)
2. **Use service discovery** or DNS for service URLs
3. **Configure reverse proxy** (nginx/traefik) for external access
4. **Use HTTPS** for all external endpoints
5. **Restrict internal network** access (firewall rules)
6. **Use secrets management** for passwords and tokens

## 📊 Port Summary Table

| Port | Service | Access | Purpose |
|------|---------|--------|---------|
| 3000 | Grafana | Host + Internal | Grafana UI |
| 5000 | Test App | Host + Internal | Test application |
| 5173 | Vite Dev | Host only | Development server |
| 5432 | PostgreSQL | Host + Internal | Database |
| 9000 | Backend API | Host + Internal | Reliability Studio API |
| 9091 | Prometheus | Host only | Prometheus UI (external) |
| 9090 | Prometheus | Internal only | Prometheus API (internal) |
| 3100 | Loki | Host + Internal | Loki API |
| 3200 | Tempo | Host + Internal | Tempo API |
| 4317 | Tempo OTLP | Host + Internal | OpenTelemetry Protocol |

---

**Status**: ✅ All ports configured correctly, no conflicts detected
**Last Updated**: 2026-01-09



