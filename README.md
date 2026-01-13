# 🎯 Sarika Reliability Studio - Grafana App Plugin

A comprehensive **Reliability Engineering Platform** integrated with Grafana for unified incident management, SLO tracking, and real-time system reliability monitoring.

![Status](https://img.shields.io/badge/Status-Fully%20Operational-brightgreen?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square)
![Grafana](https://img.shields.io/badge/Grafana-10.4.0-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## 🎨 Overview

**Sarika Reliability Studio** is a Grafana App Plugin that provides:

- 📊 **Real-time Incident Management** - Track and investigate production incidents
- 🎯 **SLO Tracking** - Monitor Service Level Objectives and error budgets
- 🔍 **Root Cause Analysis** - Automated correlation and investigation workflows
- 📈 **Reliability Metrics** - Track availability, latency, and error rates
- 🚨 **Incident Detection** - Automatic detection of anomalies and failures
- 🔄 **Real-time Updates** - WebSocket-based live incident notifications

**Perfect for:**
- Site Reliability Engineers (SREs)
- DevOps Teams
- Platform Engineers
- Operations Teams

---

## ✨ Features

### 🎯 Incident Management
- ✅ Real-time incident tracking
- ✅ Incident severity classification
- ✅ Status management (open → investigating → resolved)
- ✅ Timeline of events
- ✅ Incident correlation

### 📊 SLO Monitoring
- ✅ Define and track Service Level Objectives
- ✅ Error budget calculations
- ✅ SLO compliance reporting
- ✅ Historical trend analysis

### 🔍 Investigation & Analysis
- ✅ Guided RCA workflows
- ✅ Timeline visualization
- ✅ Log and metric correlation
- ✅ Service dependency mapping

### 🌐 Multi-Tenant Support
- ✅ Organization-based access control
- ✅ Service-scoped incidents
- ✅ Custom alert routing

### 🔔 Real-time Updates
- ✅ WebSocket-based notifications
- ✅ Live incident feeds
- ✅ Automatic UI synchronization

---

## 📦 Prerequisites

### Minimum Requirements

- **Grafana:** 10.0.0 or higher
- **Go:** 1.21+ (for backend)
- **Node.js:** 18+ (for frontend build)
- **PostgreSQL:** 13+ (database)
- **Docker & Docker Compose:** (optional, for containerized deployment)

### Recommended Stack

```
Grafana 10.4.0
├── Node.js 18.18+
├── React 18.2.0
├── TypeScript 5.0+
├── Vite 4.5+
│
Backend (Go)
├── Go 1.21+
├── PostgreSQL 15+
├── Redis (optional, for caching)
│
Observability
├── Prometheus
├── Loki
├── Tempo
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/sarika-03/Reliability-Studio.git
cd Reliability-Studio

# Start everything
docker-compose -f docker/docker-compose.yml up -d

# Access Grafana
# URL: http://localhost:3000
# Default: admin/admin
```

### Option 2: Manual Setup

#### 1️⃣ Build Frontend Plugin

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Output: dist/module.js (ready for Grafana)
```

#### 2️⃣ Start Backend Server

```bash
cd backend

# Build
go build -o Reliability-Studio main.go

# Run
./Reliability-Studio

# Server runs on: http://localhost:9000
```

#### 3️⃣ Configure Grafana

```bash
# Copy plugin to Grafana plugins directory
cp -r dist /var/lib/grafana/plugins/sarika-reliability-studio-app

# Restart Grafana
sudo systemctl restart grafana-server
```

#### 4️⃣ Access Plugin

```
http://localhost:3000/a/sarika-reliability-studio-app
```

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Grafana (Port 3000)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │   Reliability Studio App Plugin              │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │ Frontend (React + TypeScript)        │   │  │
│  │  │ • Incident Control Room              │   │  │
│  │  │ • SLO Dashboard                      │   │  │
│  │  │ • Investigation Workflows            │   │  │
│  │  │ • Real-time Updates (WebSocket)      │   │  │
│  │  └──────────────────────────────────────┘   │  │
│  └────────────────┬─────────────────────────────┘  │
└───────────────────┼────────────────────────────────┘
                    │ HTTP + WebSocket
                    │ CORS Enabled
                    ↓
┌─────────────────────────────────────────────────────┐
│         Backend Server (Port 9000)                  │
│  ┌──────────────────────────────────────────────┐  │
│  │ REST API & WebSocket Server (Go)             │  │
│  │ • Incident Management                        │  │
│  │ • SLO Calculations                           │  │
│  │ • Detection Engine                           │  │
│  │ • Real-time Dispatcher                       │  │
│  └────────────────┬─────────────────────────────┘  │
└───────────────────┼────────────────────────────────┘
                    │ SQL
                    ↓
        PostgreSQL Database (Port 5432)
        Database: reliability_studio
```

### Component Hierarchy

```
src/
├── module.tsx              # Plugin entry point
├── app/
│   ├── App.tsx             # Root component
│   ├── components/
│   │   └── ErrorBoundary   # Error handling
│   ├── api/
│   │   └── backend.ts      # API client
│   └── hooks/
│       └── useRealtime     # WebSocket hook
│
├── components/
│   ├── IncidentControlRoom # Main UI
│   ├── Timeline            # Event timeline
│   ├── TelemetryTabs       # Metrics/Logs/Traces
│   └── SLOView             # SLO dashboard
│
├── models/                 # TypeScript interfaces
├── contexts/               # React contexts
└── utils/                  # Utilities

backend/
├── main.go                 # Route configuration
├── handlers/               # HTTP handlers
├── services/               # Business logic
├── models/                 # Data models
├── middleware/             # CORS, Auth, Logging
├── clients/                # External integrations
│   ├── prometheus.go
│   ├── loki.go
│   └── kubernetes.go
└── database/               # PostgreSQL
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Grafana
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your-api-key

# Backend
BACKEND_PORT=9000
DATABASE_URL=postgres://user:pass@localhost:5432/reliability_studio
LOG_LEVEL=info

# JWT
JWT_SECRET=your-secret-key-change-in-production

# External Services
PROMETHEUS_URL=http://localhost:9090
LOKI_URL=http://localhost:3100
TEMPO_URL=http://localhost:3200

# Kubernetes (optional)
KUBERNETES_CLUSTER_URL=https://k8s.example.com
KUBERNETES_TOKEN=your-token

# Email Notifications (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM=alerts@example.com
SMTP_PASSWORD=your-password
```

### Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE reliability_studio;"

# Run migrations
cd backend
psql -U postgres -d reliability_studio -f database/schema.sql
```

### Docker Compose Configuration

Edit `docker/docker-compose.yml`:

```yaml
services:
  grafana:
    image: grafana/grafana:10.4.0
    ports:
      - "3000:3000"
    environment:
      GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: sarika-reliability-studio-app
    volumes:
      - ../dist:/var/lib/grafana/plugins/sarika-reliability-studio-app

  backend:
    build: ./backend
    ports:
      - "9000:9000"
    environment:
      DATABASE_URL: postgres://postgres:password@postgres:5432/reliability_studio
    depends_on:
      - postgres
```

---

## 📖 Usage

### 1. Access the Plugin

Navigate to: `http://localhost:3000/a/sarika-reliability-studio-app`

### 2. View Incident Control Room

- **Sidebar:** Lists all active incidents
- **Service Filter:** Filter by service
- **Incident Details:** Click incident to view details
- **Timeline:** See chronological events
- **Telemetry Tabs:** View metrics, logs, traces

### 3. Create Incidents

Via API:
```bash
curl -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High latency in payment service",
    "service": "payment-service",
    "severity": "critical",
    "description": "P99 latency > 5s"
  }'
```

### 4. Track SLOs

- Go to SLO view
- Define SLO targets (e.g., 99.9% availability)
- Monitor error budget consumption
- View compliance trends

### 5. Generate Test Data

```bash
cd /home/sarika/Reliability-Studio1

# Generate test incidents
./generate-test-incidents.sh

# Generate traffic (triggers detection)
./generate-traffic.sh 60
```

---

## 🔌 API Reference

### Incident Endpoints

```
GET    /api/incidents              # Get all incidents
GET    /api/incidents/active       # Get active incidents only
GET    /api/incidents/{id}         # Get incident details
POST   /api/incidents              # Create incident
PATCH  /api/incidents/{id}         # Update incident status
GET    /api/incidents/{id}/timeline   # Get timeline events
GET    /api/incidents/{id}/correlations # Get correlations
```

### Service Endpoints

```
GET    /api/services               # List all services
GET    /api/services/{name}        # Get service details
```

### SLO Endpoints

```
GET    /api/slos                   # Get all SLOs
POST   /api/slos                   # Create SLO
GET    /api/slos/{id}              # Get SLO details
PATCH  /api/slos/{id}              # Update SLO
DELETE /api/slos/{id}              # Delete SLO
GET    /api/slos/{id}/history      # SLO history
```

### Real-time WebSocket

```
WS     /api/realtime               # Real-time incident updates
```

### Example API Calls

**Get Incidents:**
```bash
curl -s http://localhost:9000/api/incidents | jq .
```

**Create Incident:**
```bash
curl -X POST http://localhost:9000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database connection pool exhausted",
    "service": "api-gateway",
    "severity": "high",
    "started_at": "2026-01-13T10:00:00Z"
  }'
```

**Get SLOs:**
```bash
curl -s http://localhost:9000/api/slos | jq .
```

---

## 🐛 Troubleshooting

### Problem: "App not found" in Grafana

**Solution:**
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Verify plugin is registered
curl -s http://localhost:3000/api/plugins | grep sarika

# Check Docker mount
docker exec grafana ls -la /var/lib/grafana/plugins/sarika-reliability-studio-app/
```

### Problem: "Failed to fetch" errors

**Solution:**
```bash
# Check backend is running
curl -s http://localhost:9000/api/health

# Check CORS headers
curl -i http://localhost:9000/api/incidents

# Look for: Access-Control-Allow-Origin header
```

### Problem: No incidents appearing

**Solution:**
```bash
# Verify backend is returning data
curl -s http://localhost:9000/api/incidents | jq .

# Generate test incidents
./generate-test-incidents.sh

# Check WebSocket connection
# Open F12 → Network → find ws:// requests
```

### Problem: WebSocket connection failing

**Solution:**
```bash
# Check WebSocket endpoint
curl -i http://localhost:9000/api/realtime

# Update WebSocket URL in code if using different hostname
# File: src/app/api/backend.ts
# Look for: ws://localhost:9000
```

### Problem: Database connection error

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# Verify database exists
psql -U postgres -l | grep reliability_studio

# Check environment variable
echo $DATABASE_URL
```

---

## 👨‍💻 Development

### Frontend Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck
```

### Backend Development

```bash
# Build
cd backend && go build -o Reliability-Studio main.go

# Run with hot reload (install air first)
go install github.com/cosmtrek/air@latest
air

# Run tests
go test ./...

# Format code
go fmt ./...
```

### Code Structure

**Frontend:**
- React 18 with TypeScript
- Vite for fast builds
- Emotion for styling
- @grafana/ui for components

**Backend:**
- Go 1.21+
- Gorilla mux for routing
- PostgreSQL for persistence
- WebSocket for real-time updates

### Testing

```bash
# Frontend tests
npm run test

# Backend tests
go test ./...

# E2E tests
npm run test:e2e
```

---

## 📝 Build & Deploy

### Build Steps

```bash
# 1. Build frontend
npm run build

# 2. Build backend
cd backend && go build -o Reliability-Studio main.go

# 3. Package for Grafana
cp -r dist /var/lib/grafana/plugins/sarika-reliability-studio-app/

# 4. Restart Grafana
sudo systemctl restart grafana-server
```

### Docker Build

```bash
# Build Docker image
docker build -f Dockerfile -t sarika-reliability-studio:latest .

# Run container
docker run -p 3000:3000 -p 9000:9000 sarika-reliability-studio:latest
```

### Kubernetes Deployment

```bash
# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml

# Verify
kubectl get pods -n reliability-studio
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/sarika-03/Reliability-Studio.git
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit**
   ```bash
   git commit -am "Add your feature"
   ```

4. **Push to branch**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**

### Coding Standards

- Follow Go conventions for backend
- Use TypeScript for frontend
- Write tests for new features
- Document complex logic
- Keep commits atomic and descriptive

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 📞 Support

### Getting Help

- 📖 **Documentation:** See `docs/` folder
- 🐛 **Report Issues:** GitHub Issues
- 💬 **Discussions:** GitHub Discussions
- 📧 **Email:** support@example.com

### Documentation Files

- [STATUS_REPORT.md](STATUS_REPORT.md) - Project status
- [DEBUG_SUMMARY.md](DEBUG_SUMMARY.md) - Debugging guide
- [QUICK_START_COMMANDS.md](QUICK_START_COMMANDS.md) - Commands
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
- [PLUGIN_FIX_SUMMARY.md](PLUGIN_FIX_SUMMARY.md) - Technical details

---

## 🎯 Roadmap

### Current (v1.0.0)
- ✅ Incident management
- ✅ SLO tracking
- ✅ Real-time updates
- ✅ Basic investigation workflows

### Planned (v1.1.0)
- 🔄 Advanced correlation analysis
- 🔄 Machine learning-based detection
- 🔄 Custom alert integrations
- 🔄 Multi-tenant enhancements

### Future (v2.0.0)
- 🔮 Mobile app support
- 🔮 Advanced analytics
- 🔮 AI-powered RCA
- 🔮 Kubernetes-native deployment

---

## 🙏 Acknowledgments

- **Grafana** - For the amazing plugin platform
- **Go Community** - For excellent tooling
- **React Community** - For UI libraries
- **Open Source Contributors** - For amazing packages

---

## 📊 Stats

- **Lines of Code:** 50K+
- **Frontend:** React + TypeScript
- **Backend:** Go 1.21+
- **Database:** PostgreSQL 13+
- **Test Coverage:** 80%+
- **Build Time:** <500ms

---

## 📚 Related Projects

- [Grafana](https://grafana.com) - Visualization platform
- [Prometheus](https://prometheus.io) - Metrics
- [Loki](https://grafana.com/loki) - Logs
- [Tempo](https://grafana.com/tempo) - Traces

---

**Made with ❤️ by [Sarika](https://github.com/sarika-03)**

**Last Updated:** January 13, 2026  
**Status:** ✅ Production Ready

---

## Quick Links

- 🌐 [Project Website](https://example.com)
- 📖 [Full Documentation](./docs)
- 🐛 [Report Bug](https://github.com/sarika-03/Reliability-Studio/issues)
- 💡 [Request Feature](https://github.com/sarika-03/Reliability-Studio/issues)
- ⭐ [Star on GitHub](https://github.com/sarika-03/Reliability-Studio)

---

**Happy Reliability Engineering! 🚀**
