#!/bin/bash

# Test script to inject fake logs and data into Reliability Studio

set -e

BACKEND_URL="http://localhost:9000"
LOKI_URL="http://loki:3100"
PROMETHEUS_URL="http://prometheus:9090"

echo "🧪 Starting Reliability Studio Test Suite..."
echo "==========================================="

# Test 1: Backend Health Check
echo -e "\n1️⃣ Testing Backend Health..."
curl -s http://localhost:9000/health || echo "⚠️ Health endpoint not available yet"

# Test 2: Get Services (no auth - testing)
echo -e "\n2️⃣ Testing Services API..."
curl -s http://localhost:9000/api/services | jq . || echo "⚠️ Services endpoint requires auth"

# Test 3: Get SLOs (no auth - testing)
echo -e "\n3️⃣ Testing SLOs API..."
curl -s http://localhost:9000/api/slos | jq . || echo "⚠️ SLOs endpoint requires auth"

# Test 4: Get Incidents (no auth - testing)
echo -e "\n4️⃣ Testing Incidents API..."
curl -s http://localhost:9000/api/incidents | jq . || echo "⚠️ Incidents endpoint requires auth"

# Test 5: Inject fake logs into Loki
echo -e "\n5️⃣ Injecting Fake Logs into Loki..."
cat > /tmp/fake_logs.json << 'EOF'
{
  "streams": [
    {
      "stream": {
        "job": "reliability-studio",
        "service": "payment-service",
        "level": "error"
      },
      "values": [
        ["$(date -d '10 seconds ago' +%s)000000000", "Payment processing failed: timeout after 30s"],
        ["$(date -d '5 seconds ago' +%s)000000000", "Retry attempt 1 failed"]
      ]
    },
    {
      "stream": {
        "job": "reliability-studio",
        "service": "api-gateway",
        "level": "warning"
      },
      "values": [
        ["$(date +%s)000000000", "High memory usage detected: 85%"],
        ["$(date +%s)000000000", "CPU spike: 95% utilization"]
      ]
    },
    {
      "stream": {
        "job": "reliability-studio",
        "service": "database",
        "level": "error"
      },
      "values": [
        ["$(date -d '2 seconds ago' +%s)000000000", "Connection pool exhausted"],
        ["$(date -d '1 second ago' +%s)000000000", "Query timeout: SELECT * FROM transactions took 120s"]
      ]
    }
  ]
}
EOF

# Send logs to Loki
echo "Sending fake logs to Loki..."
curl -X POST -H "Content-Type: application/json" \
  -d @/tmp/fake_logs.json \
  http://localhost:3100/loki/api/v1/push || echo "⚠️ Loki endpoint not available"

# Test 6: Create fake Prometheus metrics
echo -e "\n6️⃣ Creating Fake Prometheus Metrics..."
cat > /tmp/metrics.txt << 'EOF'
# HELP service_errors_total Total number of service errors
# TYPE service_errors_total counter
service_errors_total{service="payment-service"} 42
service_errors_total{service="api-gateway"} 15
service_errors_total{service="database"} 8

# HELP request_duration_seconds Request duration in seconds
# TYPE request_duration_seconds histogram
request_duration_seconds_bucket{service="payment-service",le="0.1"} 100
request_duration_seconds_bucket{service="payment-service",le="0.5"} 250
request_duration_seconds_bucket{service="payment-service",le="1"} 280
request_duration_seconds_bucket{service="payment-service",le="+Inf"} 300
request_duration_seconds_count{service="payment-service"} 300
request_duration_seconds_sum{service="payment-service"} 120.5

# HELP service_uptime_seconds Service uptime in seconds
# TYPE service_uptime_seconds gauge
service_uptime_seconds{service="api-gateway"} 86400
service_uptime_seconds{service="payment-service"} 3600
service_uptime_seconds{service="database"} 172800
EOF

echo "Fake metrics created at /tmp/metrics.txt"

# Test 7: Create an incident via API (if auth is disabled for testing)
echo -e "\n7️⃣ Creating Test Incident..."
INCIDENT_PAYLOAD='{
  "title": "Payment Service Degradation",
  "description": "Payment processing experiencing 95% error rate",
  "severity": "CRITICAL",
  "status": "ACTIVE",
  "services": ["payment-service"],
  "root_cause": "Database connection pool exhausted",
  "impact_score": 9.5,
  "start_time": "'$(date -u -Iseconds)'",
  "timeline_events": [
    {
      "timestamp": "'$(date -u -Iseconds)'",
      "event_type": "DETECTION",
      "message": "Alert triggered: payment service error rate > 90%"
    },
    {
      "timestamp": "'$(date -u -Iseconds)'",
      "event_type": "INVESTIGATION",
      "message": "Database team investigating connection pool"
    }
  ]
}'

curl -X POST -H "Content-Type: application/json" \
  -d "$INCIDENT_PAYLOAD" \
  http://localhost:9000/api/incidents || echo "⚠️ Incident creation failed (may require auth)"

# Test 8: Test data endpoints
echo -e "\n8️⃣ Testing K8s Snapshot API..."
curl -s http://localhost:9000/api/k8s/snapshot | jq . 2>/dev/null || echo "⚠️ K8s endpoint not available"

echo -e "\n9️⃣ Testing Correlation Engine..."
curl -s "http://localhost:9000/api/correlations?service=payment-service" | jq . 2>/dev/null || echo "⚠️ Correlations endpoint not available"

echo -e "\n✅ Test suite completed!"
echo "==========================================="
echo ""
echo "📊 Access your services:"
echo "  • Grafana: http://localhost:3000"
echo "  • Backend API: http://localhost:9000"
echo "  • Prometheus: http://localhost:9090"
echo ""
echo "📝 Log storage:"
echo "  • Loki: http://localhost:3100"
echo "  • Tempo: http://localhost:3200"
echo ""
echo "💾 Database:"
echo "  • PostgreSQL: localhost:5432"
echo ""
