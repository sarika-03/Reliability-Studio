# Reliability Studio 🎯

**Reliability Studio** is an open-source Grafana App Plugin that provides a unified incident response and reliability platform for teams using Grafana OSS. Think of it as an alternative to Grafana Cloud IRM for self-hosted environments.

## 🌟 Features

### Core Capabilities
- **[CHART] Incident Management** - Full lifecycle management from detection to resolution
- **🎯 SLO Tracking** - Service Level Objective monitoring with error budget tracking
- **🔗 Auto-Correlation** - Automatically correlates metrics, logs, traces, and K8s events
- **📈 Service Catalog** - Centralized service reliability dashboard
- **[TIME] Timeline** - Automatic incident timeline with all relevant telemetry
-  **[K8S] Kubernetes Integration** - Pod failures, deployments, and cluster health
- **🔍 Root Cause Analysis** - AI-assisted incident investigation

### Technical Stack
- **Backend:** Go 1.21+ with PostgreSQL
- **Frontend:** React 18 + TypeScript with Grafana SDK
- **Observability:** Prometheus, Loki, Tempo integration
- **Infrastructure:** Docker Compose for local development

---

## [ROCKET] Quick Start

### Prerequisites
- Docker & Docker Compose
- 8GB RAM minimum
- Ports: 3000 (Grafana), 9000 (Backend), 5432 (PostgreSQL), 9090 (Prometheus), 3100 (Loki)

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd observability-lab
```

2. **Start all services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL (Database)
- Prometheus (Metrics)
- Loki (Logs)
- Tempo (Traces)
- Alertmanager
- Backend API (Go)
- Grafana (Frontend)
- Sample App (for testing)

3. **Access Grafana**
```
http://localhost:3000
```
Default: Anonymous auth enabled (Admin role)

4. **Access Backend API**
```
http://localhost:9000/health
```

5. **View Logs**
```bash
docker-compose logs -f backend
```

---

## 🏗️ Development

### Backend Development

```bash
cd relaiablity-studio/backend

# Install dependencies
go mod download

# Run locally (requires PostgreSQL)
export DB_HOST=localhost
export PROMETHEUS_URL=http://localhost:9090
export LOKI_URL=http://localhost:3100
go run main.go
```

### Frontend Development

```bash
cd relaiablity-studio

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Migrations

The database schema is automatically initialized on first run. See `backend/database/db.go` for schema definition.

To reset database:
```bash
docker-compose down -v  # Removes volumes
docker-compose up database -d
```

---

## 📁 Project Structure

```
observability-lab/
├── relaiablity-studio/          # Main plugin
│   ├── backend/                  # Go backend
│   │   ├── clients/              # External API clients (Prometheus, Loki, K8s)
│   │   ├── correlation/          # Correlation engine
│   │   ├── database/             # Database schema & operations
│   │   ├── handlers/             # HTTP request handlers
│   │   ├── middleware/           # Auth, logging, recovery
│   │   ├── models/               # Data models
│   │   ├── services/             # Business logic (SLO, incidents)
│   │   └── main.go               # Entry point
│   ├── src/                      # React frontend
│   │   ├── app/                  # Main app components
│   │   ├── panels/               # Grafana panel plugins
│   │   ├── models/               # TypeScript interfaces
│   │   └── utils/                # Helpers
│   ├── plugin.json               # Grafana plugin manifest
│   └── package.json
├── prometheus/                   # Prometheus config
├── loki/                         # Loki config
├── tempo/                        # Tempo config
├── grafana/                      # Grafana provisioning
└── docker-compose.yml
```

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Database
DB_HOST=postgres
DB_NAME=reliability_studio
DB_USER=postgres
DB_PASSWORD=postgres

# Observability
PROMETHEUS_URL=http://prometheus:9090
LOKI_URL=http://loki:3100
TEMPO_URL=http://tempo:3200

# Application
PORT=9000
JWT_SECRET=your-secure-secret-here
```

### Plugin Configuration

Edit `plugin.json` to customize:
- Plugin metadata
- Navigation pages
- Backend routes
- Dependencies

---

## 🐛 Known Issues & Fixes Applied

This project has undergone comprehensive debugging. Key fixes applied:

[OK] **FIXED:** Added PostgreSQL database service  
[OK] **FIXED:** Nil pointer checks in Kubernetes client  
[OK] **FIXED:** Missing Health() methods on clients  
[OK] **FIXED:** Loki timestamp parsing (Unix nano → RFC3339)  
[OK] **FIXED:** Goroutine leaks in background jobs  
[OK] **FIXED:** Array bounds checking in Prometheus client  
[OK] **FIXED:** Added graceful shutdown handling  
[OK] **FIXED:** Grafana datasource provisioning  
[OK] **FIXED:** Missing frontend dependencies  

[WARNING] **TODO:** Implement JWT authentication (currently using mock)  
[WARNING] **TODO:** Add rate limiting implementation  
[WARNING] **TODO:** Complete handler implementations  

See `AUDIT_REPORT.md` for full details.

---

## [KEY] Security

**[WARNING] IMPORTANT:** This project is in **development mode** and has several security limitations:

1. **Authentication:** Currently using mock tokens - **DO NOT use in production**
2. **CORS:** Allows all origins - Restrict in production
3. **Database:** Default credentials - Change before deploying
4. **API:** No rate limiting - Vulnerable to abuse

### Hardening for Production

1. Implement JWT authentication in `backend/middleware/middleware.go`
2. Use strong passwords and secrets (generate with `openssl rand -hex 32`)
3. Enable TLS/HTTPS
4. Restrict CORS origins
5. Implement rate limiting
6. Use PostgreSQL with authentication
7. Run security audit: `go run github.com/securego/gosec/v2/cmd/gosec@latest ./...`

---

## [CHART] API Documentation

### Health Check
```
GET /health
Response: {"status": "healthy", "database": "healthy", "prometheus": "healthy"}
```

### Incidents
```
GET    /api/incidents              # List all incidents
POST   /api/incidents              # Create incident
GET    /api/incidents/{id}         # Get incident details
PATCH  /api/incidents/{id}         # Update incident
GET    /api/incidents/{id}/timeline # Get incident timeline
```

### SLOs
```
GET    /api/slos                   # List all SLOs
POST   /api/slos                   # Create SLO
GET    /api/slos/{id}              # Get SLO
PATCH  /api/slos/{id}              # Update SLO
DELETE /api/slos/{id}              # Delete SLO
POST   /api/slos/{id}/calculate    # Recalculate SLO
```

### Metrics
```
GET /api/metrics/availability/{service}
GET /api/metrics/error-rate/{service}
GET /api/metrics/latency/{service}
```

### Kubernetes (if enabled)
```
GET /api/kubernetes/pods/{namespace}/{service}
GET /api/kubernetes/deployments/{namespace}/{service}
GET /api/kubernetes/events/{namespace}/{service}
```

---

## 🧪 Testing

### Test Incident Creation
```bash
curl -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High Error Rate Detected",
    "description": "500 errors spiking on payment-service",
    "severity": "critical",
    "service": "payment-service"
  }'
```

### Test SLO Calculation
```bash
curl -X POST http://localhost:9000/api/slos/{slo-id}/calculate
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Quality Checks

```bash
# Go formatting
go fmt ./...

# Go linting
golangci-lint run

# TypeScript checks
npm run typecheck

# Build verification
docker-compose build
```

---

## [LOGS] License

MIT License (update as needed)

---

## 🙏 Acknowledgments

- Grafana OSS community
- Prometheus, Loki, Tempo teams
- Kubernetes SIG-Observability

---

## 📞 Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Documentation: `/docs` folder

---

**Built with ❤️ for SRE teams**