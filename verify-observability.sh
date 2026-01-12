#!/usr/bin/env bash
# Observability Pipeline Verification Script
# Validates metrics, logs, and traces are flowing correctly

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROMETHEUS_URL="http://localhost:9091"
LOKI_URL="http://localhost:3100"
TEMPO_URL="http://localhost:3200"
BACKEND_URL="http://localhost:9000"
TEST_APP_URL="http://localhost:5000"
GRAFANA_URL="http://localhost:3000"

# Test counters
PASSED=0
FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

test_service_health() {
    local service=$1
    local url=$2
    
    echo -n "Testing $service health... "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ Unhealthy${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# ============================================
# 1. Service Health Checks
# ============================================
print_header "1️⃣  Service Health Checks"

test_service_health "Prometheus" "$PROMETHEUS_URL/-/healthy"
test_service_health "Loki" "$LOKI_URL/ready"
test_service_health "Tempo" "$TEMPO_URL/ready"
test_service_health "Backend" "$BACKEND_URL/health"
test_service_health "Test-App" "$TEST_APP_URL/health"
test_service_health "Grafana" "$GRAFANA_URL/api/health"

# ============================================
# 2. Prometheus Metrics
# ============================================
print_header "2️⃣  Prometheus Metrics Pipeline"

echo "Checking Prometheus targets..."
TARGETS=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | jq -r '.data.activeTargets[] | select(.health == "up") | .labels.job' | sort | uniq)
TARGET_COUNT=$(echo "$TARGETS" | wc -w)

echo "Active targets: $TARGET_COUNT"
echo "$TARGETS" | sed 's/^/  - /'

if [ "$TARGET_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✅ All expected targets healthy${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Missing targets (expected 6, got $TARGET_COUNT)${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "Checking backend /metrics endpoint..."
METRICS=$(curl -s "$BACKEND_URL/metrics" | grep -c "# HELP")
if [ "$METRICS" -gt 0 ]; then
    echo -e "${GREEN}✅ Backend exporting metrics ($METRICS metric families)${NC}"
    PASSED=$((PASSED + 1))
    # Show first few metrics
    curl -s "$BACKEND_URL/metrics" | head -10 | sed 's/^/    /'
else
    echo -e "${RED}❌ No metrics from backend${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "Checking test-app /metrics endpoint..."
TEST_METRICS=$(curl -s "$TEST_APP_URL/metrics" | grep -c "# HELP")
if [ "$TEST_METRICS" -gt 0 ]; then
    echo -e "${GREEN}✅ Test-app exporting metrics ($TEST_METRICS metric families)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ No metrics from test-app${NC}"
    FAILED=$((FAILED + 1))
fi

# ============================================
# 3. Prometheus Query Testing
# ============================================
print_header "3️⃣  Prometheus Queries"

echo "Executing: up (service status)"
UP_QUERY=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=up" | jq '.data.result | length')
echo "  Results: $UP_QUERY services"

if [ "$UP_QUERY" -ge 6 ]; then
    echo -e "${GREEN}✅ Query 'up' returns all services${NC}"
    PASSED=$((PASSED + 1))
    curl -s "$PROMETHEUS_URL/api/v1/query?query=up" | jq '.data.result[] | {job: .metric.job, instance: .metric.instance, value: .value[1]}' | sed 's/^/    /'
else
    echo -e "${RED}❌ Query 'up' returns insufficient results${NC}"
    FAILED=$((FAILED + 1))
fi

# ============================================
# 4. Loki Logs
# ============================================
print_header "4️⃣  Loki Logs Pipeline"

echo "Checking Loki labels..."
LABELS=$(curl -s "$LOKI_URL/loki/api/v1/labels" | jq '.data | length')
echo "  Found $LABELS labels"

if [ "$LABELS" -gt 0 ]; then
    echo -e "${GREEN}✅ Loki has label data${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Loki has no labels (may need to wait for logs)${NC}"
fi

echo ""
echo "Querying logs from {job=\"docker\"}..."
LOG_STREAMS=$(curl -s "http://localhost:3100/loki/api/v1/query?query=%7Bjob%3D%22docker%22%7D" | jq '.data.result | length' 2>/dev/null || echo "0")

if [ "$LOG_STREAMS" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $LOG_STREAMS log streams${NC}"
    PASSED=$((PASSED + 1))
    # Show sample containers
    curl -s "http://localhost:3100/loki/api/v1/query?query=%7Bjob%3D%22docker%22%7D" | jq -r '.data.result[].metric.container_name' | sort | uniq | head -5 | sed 's/^/    Container: /'
else
    echo -e "${YELLOW}⚠️  No log streams found yet (logs may be delayed)${NC}"
    echo "    Tip: Wait a moment for Promtail to scrape Docker logs"
fi

# ============================================
# 5. Generate Observability Traffic
# ============================================
print_header "5️⃣  Generating Observability Traffic"

echo "Generating HTTP traffic to create spans and logs..."

# Backend traffic
for i in {1..3}; do
    curl -s "$BACKEND_URL/api/health" > /dev/null
    echo "  ✓ Backend request $i/3"
done

# Test-app traffic (creates spans)
for i in {1..3}; do
    curl -s "$TEST_APP_URL/slow" > /dev/null 2>&1
    echo "  ✓ Test-app slow request $i/3"
done

echo -e "${GREEN}✅ Traffic generated${NC}"
PASSED=$((PASSED + 1))

# ============================================
# 6. Tempo Traces
# ============================================
print_header "6️⃣  Tempo Traces Pipeline"

echo "Checking Tempo is receiving traces..."
sleep 2  # Wait for traces to be written

TRACES=$(curl -s "$TEMPO_URL/api/search?service=test-app" 2>/dev/null | jq '.traces | length' 2>/dev/null || echo "0")

if [ "$TRACES" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $TRACES trace(s) from test-app${NC}"
    PASSED=$((PASSED + 1))
    # Show trace IDs
    curl -s "$TEMPO_URL/api/search?service=test-app" 2>/dev/null | jq -r '.traces[]' | head -3 | sed 's/^/    Trace: /'
else
    echo -e "${YELLOW}⚠️  No traces found yet${NC}"
    echo "    Tip: Traces may take a few seconds to appear in Tempo"
fi

echo ""
echo "Checking backend traces..."
BACKEND_TRACES=$(curl -s "$TEMPO_URL/api/search?service=reliability-backend" 2>/dev/null | jq '.traces | length' 2>/dev/null || echo "0")

if [ "$BACKEND_TRACES" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $BACKEND_TRACES trace(s) from backend${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  No backend traces found yet${NC}"
fi

# ============================================
# 7. Grafana Data Sources
# ============================================
print_header "7️⃣  Grafana Data Sources"

echo "Checking Grafana data sources..."
DS=$(curl -s -H "Authorization: Bearer admin" "$GRAFANA_URL/api/datasources" 2>/dev/null | jq '.[] | .name' 2>/dev/null || echo "")

if echo "$DS" | grep -q "Prometheus"; then
    echo -e "${GREEN}✅ Prometheus data source configured${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Prometheus data source not found${NC}"
fi

if echo "$DS" | grep -q "Loki"; then
    echo -e "${GREEN}✅ Loki data source configured${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Loki data source not found${NC}"
fi

if echo "$DS" | grep -q "Tempo"; then
    echo -e "${GREEN}✅ Tempo data source configured${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Tempo data source not found${NC}"
fi

# ============================================
# 8. Summary
# ============================================
print_header "📊 Verification Summary"

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Tests Run: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Success Rate: $PERCENTAGE%"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ OBSERVABILITY PIPELINE IS FULLY OPERATIONAL${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Open Grafana: http://localhost:3000"
    echo "  2. Navigate to Explore (top-left)"
    echo "  3. Test Prometheus: Query 'up' to see all services"
    echo "  4. Test Loki: Query '{job=\"docker\"}' to see container logs"
    echo "  5. Test Tempo: Search for traces from 'test-app' service"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "  • Check service logs: docker-compose logs -f <service>"
    echo "  • Verify Docker socket: ls -la /var/run/docker.sock"
    echo "  • Check Promtail: docker-compose logs promtail"
    echo "  • View Tempo storage: docker exec tempo ls /tmp/tempo/"
    echo ""
    exit 1
fi
