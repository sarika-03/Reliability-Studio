# 🚀 Reliability Studio - Full Demo Guide

## ✅ Project Successfully Started from Scratch!

All services are running and operational. Here's your complete demo guide.

---

## 📊 **Running Services Status**

| Service | Status | URL | Purpose |
|---------|--------|-----|---------|
| **Grafana** | ✅ Healthy | http://localhost:3000 | Main dashboard UI |
| **Backend API** | ✅ Healthy | http://localhost:9000 | REST API |
| **Prometheus** | ✅ Healthy | http://localhost:9091 | Metrics collection |
| **Loki** | ✅ Healthy | http://localhost:3100 | Log aggregation |
| **Tempo** | ✅ Healthy | http://localhost:3200 | Distributed tracing |
| **PostgreSQL** | ✅ Healthy | localhost:5432 | Database |
| **Test App** | ✅ Healthy | http://localhost:5000 | Demo service |

---

## 🔐 **Authentication**

### Demo User Credentials
- **Username:** `demo`
- **Password:** `DemoPass123!@#`
- **Email:** `demo@example.com`

### Admin User (from seed data)
- **Username:** `admin`
- **Password:** `admin-password`
- **Email:** `admin@reliability.io`

### How to Login via API:
```bash
# Get authentication token
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"DemoPass123!@#"}'

# Response includes access_token (valid for 15 minutes)
```

---

## 🎯 **API Endpoints - Working Demos**

### 1. **Health Checks**
```bash
# Backend health
curl http://localhost:9000/health

# Detailed health check
curl http://localhost:9000/api/health

# Grafana health
curl http://localhost:3000/api/health

# Test app health
curl http://localhost:5000/health
```

### 2. **Incident Management**

#### Get All Incidents (requires auth)
```bash
TOKEN="your-access-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/api/incidents
```

#### Create New Incident
```bash
TOKEN="your-access-token-here"
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High Latency Alert",
    "description": "P95 latency increased to 2.5s",
    "severity": "high",
    "service": "payment-service"
  }' \
  http://localhost:9000/api/incidents
```

#### Get Specific Incident
```bash
TOKEN="your-access-token-here"
INCIDENT_ID="your-incident-id"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/api/incidents/$INCIDENT_ID
```

#### Update Incident Status
```bash
TOKEN="your-access-token-here"
INCIDENT_ID="your-incident-id"
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}' \
  http://localhost:9000/api/incidents/$INCIDENT_ID
```

### 3. **SLO Management**
```bash
TOKEN="your-access-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/api/slos
```

### 4. **Test Endpoints (No Auth Required)**

#### Generate Test Load
```bash
curl -X POST http://localhost:9000/api/test/load \
  -H "Content-Type: application/json" \
  -d '{"duration": 60, "rps": 10}'
```

#### Generate Test Failure
```bash
curl -X POST http://localhost:9000/api/test/fail \
  -H "Content-Type: application/json" \
  -d '{"service": "payment-service", "duration": 30}'
```

#### Generate Test Logs
```bash
curl -X POST http://localhost:9000/api/test/log \
  -H "Content-Type: application/json" \
  -d '{"level": "error", "message": "Database connection timeout"}'
```

---

## 📈 **Prometheus Metrics**

### Access Prometheus UI
Open in browser: http://localhost:9091

### Example Queries
```
# HTTP request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Latency (p95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

---

## 📝 **Loki Logs**

### Access Loki API
```bash
# Query logs
curl "http://localhost:3100/loki/api/v1/query_range?query={service=\"api-gateway\"}&limit=100"

# Query logs with time range
curl "http://localhost:3100/loki/api/v1/query_range?query={level=\"error\"}&start=2026-01-10T05:00:00Z&end=2026-01-10T06:00:00Z"
```

---

## 🔍 **Tempo Traces**

### Access Tempo API
```bash
# Query traces
curl http://localhost:3200/api/search?limit=20
```

---

## 🎨 **Grafana Dashboard**

### Access Grafana
1. Open browser: http://localhost:3000
2. Login with:
   - **Username:** `admin`
   - **Password:** `admin`

### Setup Data Sources

#### Add Prometheus Data Source
1. Go to: **Configuration → Data Sources → Add data source**
2. Select: **Prometheus**
3. URL: `http://prometheus:9090`
4. Click: **Save & Test**

#### Add Loki Data Source
1. Go to: **Configuration → Data Sources → Add data source**
2. Select: **Loki**
3. URL: `http://loki:3100`
4. Click: **Save & Test**

#### Add Tempo Data Source
1. Go to: **Configuration → Data Sources → Add data source**
2. Select: **Tempo**
3. URL: `http://tempo:3200`
4. Click: **Save & Test**

### Access Your Plugin
1. Go to: **Apps → Reliability Studio**
2. Or navigate to: **Dashboards → Reliability Studio**

---

## 🔄 **Real-time Features**

### WebSocket Connection
```javascript
// Connect to real-time updates
const ws = new WebSocket('ws://localhost:9000/api/realtime');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### Incident Detection
The system automatically:
- ✅ Runs incident detection every 30 seconds
- ✅ Generates sample telemetry every 30 seconds
- ✅ Correlates incidents with metrics, logs, and traces
- ✅ Broadcasts real-time updates via WebSocket

---

## 🧪 **Demo Workflow**

### Step 1: Create an Incident
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"DemoPass123!@#"}' | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Create incident
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment Service Degradation",
    "description": "High latency and error rate detected",
    "severity": "critical",
    "service": "payment-service"
  }' \
  http://localhost:9000/api/incidents
```

### Step 2: Monitor in Grafana
1. Open Grafana: http://localhost:3000
2. Navigate to **Apps → Reliability Studio**
3. View the incident in the dashboard

### Step 3: Check Metrics
1. Open Prometheus: http://localhost:9091
2. Query: `rate(http_requests_total[5m])`
3. See real-time metrics

### Step 4: Check Logs
1. In Grafana, go to **Explore**
2. Select **Loki** data source
3. Query: `{service="payment-service"}`

### Step 5: View Traces
1. In Grafana, go to **Explore**
2. Select **Tempo** data source
3. Search for traces related to your service

---

## 🔧 **Useful Commands**

### View Service Logs
```bash
# Backend logs
docker-compose -f docker/docker-compose.yml logs -f backend

# All services
docker-compose -f docker/docker-compose.yml logs -f

# Specific service
docker-compose -f docker/docker-compose.yml logs -f prometheus
```

### Restart Services
```bash
# Restart all
docker-compose -f docker/docker-compose.yml restart

# Restart specific service
docker-compose -f docker/docker-compose.yml restart backend
```

### Stop Services
```bash
docker-compose -f docker/docker-compose.yml down
```

### Start Services
```bash
docker-compose -f docker/docker-compose.yml up -d
```

---

## ✅ **Verified Working Features**

- ✅ **Authentication** - User registration and login with JWT tokens
- ✅ **Incident Management** - Create, read, update incidents
- ✅ **Database** - PostgreSQL with full schema
- ✅ **Metrics** - Prometheus collecting and storing metrics
- ✅ **Logs** - Loki aggregating logs
- ✅ **Traces** - Tempo storing distributed traces
- ✅ **Health Checks** - All services reporting health
- ✅ **Real-time Detection** - Automatic incident detection running
- ✅ **Sample Telemetry** - Generating test data automatically
- ✅ **CORS** - Configured for local development
- ✅ **Security** - JWT authentication, rate limiting, security headers

---

## 🎉 **Everything is Ready!**

Your Reliability Studio is fully operational. You can now:

1. **Access Grafana Dashboard**: http://localhost:3000
2. **Use the REST API**: http://localhost:9000
3. **Monitor Metrics**: http://localhost:9091
4. **Query Logs**: http://localhost:3100
5. **View Traces**: http://localhost:3200

---

## 📚 **Next Steps**

1. **Explore Grafana Plugin**: Install and configure the Reliability Studio plugin
2. **Create Dashboards**: Build custom dashboards for your services
3. **Set Up Alerts**: Configure alerting rules in Prometheus
4. **Add More Services**: Integrate your actual services
5. **Configure SLOs**: Define SLOs for your services
6. **Set Up Incident Workflows**: Customize incident response procedures

---

**Happy Monitoring! 🚀**

