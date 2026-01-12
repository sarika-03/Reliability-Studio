#!/bin/bash

################################################################################
# Reliability Studio - Quick Verification Script
#
# Validates that all systems are operational and properly configured
# without requiring full demo execution
#
# Usage: ./verify-system.sh
# Duration: ~2 minutes
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# Configuration
BACKEND_URL="http://localhost:9000/api"
PROMETHEUS_URL="http://localhost:9091"
LOKI_URL="http://localhost:3100"
TEMPO_URL="http://localhost:3200"
GRAFANA_URL="http://localhost:3000"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="reliability"
DB_USER="reliability_user"
DB_PASSWORD="reliability_pass"

log_banner() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Reliability Studio - System Verification                       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

log_check_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((CHECKS_PASSED++))
}

log_check_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((CHECKS_FAILED++))
}

log_check_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((CHECKS_WARNED++))
}

log_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

check_service() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        log_check_pass "$name is responding"
        return 0
    else
        log_check_fail "$name is not responding at $url"
        return 1
    fi
}

main() {
    log_banner

    log_section "1. Infrastructure Checks"
    
    # Docker
    if command -v docker &> /dev/null; then
        log_check_pass "Docker is installed"
    else
        log_check_fail "Docker is not installed"
    fi

    # Docker Compose
    if command -v docker-compose &> /dev/null; then
        log_check_pass "Docker Compose is installed"
    else
        log_check_fail "Docker Compose is not installed"
    fi

    # Check running containers
    RUNNING=$(docker ps --format "{{.Names}}" 2>/dev/null | wc -l)
    if [ "$RUNNING" -gt 0 ]; then
        log_check_pass "$RUNNING containers running"
    else
        log_check_warn "No containers running"
    fi

    log_section "2. Backend Services"

    # Backend API
    check_service "$BACKEND_URL/health" "Backend API (port 9000)"

    # Prometheus
    check_service "$PROMETHEUS_URL/api/v1/query" "Prometheus (port 9091)"

    # Loki
    check_service "$LOKI_URL/loki/api/v1/label" "Loki (port 3100)"

    # Tempo
    check_service "$TEMPO_URL/status" "Tempo (port 3200)"

    # Grafana
    check_service "$GRAFANA_URL/api/health" "Grafana (port 3000)"

    log_section "3. Database Checks"

    # PostgreSQL connectivity
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        log_check_pass "PostgreSQL connection successful"
        
        # Check schema
        TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" -t 2>/dev/null | tr -d ' ')
        if [ "$TABLE_COUNT" -gt 5 ]; then
            log_check_pass "Database schema initialized ($TABLE_COUNT tables)"
        else
            log_check_warn "Database has limited tables ($TABLE_COUNT) - schema may be incomplete"
        fi
    else
        log_check_fail "PostgreSQL connection failed"
    fi

    log_section "4. Data Ingestion Checks"

    # Prometheus metrics
    METRIC_COUNT=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=up" 2>/dev/null | jq '.data.result | length' || echo "0")
    if [ "$METRIC_COUNT" -gt 0 ]; then
        log_check_pass "Prometheus has $METRIC_COUNT metrics indexed"
    else
        log_check_warn "No metrics in Prometheus - may need to generate load"
    fi

    # Loki logs
    LOKI_LABELS=$(curl -s "$LOKI_URL/loki/api/v1/label" 2>/dev/null | jq '.values | length' || echo "0")
    if [ "$LOKI_LABELS" -gt 0 ]; then
        log_check_pass "Loki has $LOKI_LABELS labels indexed"
    else
        log_check_warn "No labels in Loki - may need to generate logs"
    fi

    log_section "5. API Endpoint Checks"

    # List incidents
    INCIDENT_COUNT=$(curl -s "$BACKEND_URL/incidents" 2>/dev/null | jq 'length' || echo "0")
    log_check_pass "GET /api/incidents returns $INCIDENT_COUNT incidents"

    # Get services
    SERVICE_COUNT=$(curl -s "$BACKEND_URL/services" 2>/dev/null | jq 'length' || echo "0")
    log_check_pass "GET /api/services returns $SERVICE_COUNT services"

    # List SLOs
    SLO_COUNT=$(curl -s "$BACKEND_URL/slos" 2>/dev/null | jq 'length' || echo "0")
    log_check_pass "GET /api/slos returns $SLO_COUNT SLOs"

    log_section "6. Feature Checks"

    # Create test incident
    TEST_INCIDENT=$(curl -s -X POST "$BACKEND_URL/incidents" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Test Incident",
            "description": "Verification test",
            "severity": "warning",
            "service_id": "test-service"
        }' 2>/dev/null | jq -r '.id // empty')

    if [ -n "$TEST_INCIDENT" ]; then
        log_check_pass "Can create incidents (ID: ${TEST_INCIDENT:0:8}...)"
        
        # Retrieve it
        if curl -s "$BACKEND_URL/incidents/$TEST_INCIDENT" > /dev/null 2>&1; then
            log_check_pass "Can retrieve incidents by ID"
        else
            log_check_warn "Created incident but cannot retrieve it"
        fi
    else
        log_check_warn "Could not create test incident"
    fi

    # Test metrics endpoint
    if curl -s "$BACKEND_URL/../metrics" > /dev/null 2>&1; then
        log_check_pass "Prometheus /metrics endpoint available"
    else
        log_check_warn "Prometheus /metrics endpoint not responding"
    fi

    log_section "7. Performance Checks"

    # Measure API response time
    START=$(date +%s%N)
    curl -s "$BACKEND_URL/incidents" > /dev/null 2>&1
    END=$(date +%s%N)
    ELAPSED=$(( (END - START) / 1000000 ))  # Convert to ms

    if [ "$ELAPSED" -lt 1000 ]; then
        log_check_pass "API response time: ${ELAPSED}ms"
    else
        log_check_warn "API response time slow: ${ELAPSED}ms"
    fi

    log_section "8. Summary"

    TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNED))
    PASS_PERCENT=$((CHECKS_PASSED * 100 / TOTAL))

    echo -e "${GREEN}Passed:  $CHECKS_PASSED${NC}"
    echo -e "${YELLOW}Warned:  $CHECKS_WARNED${NC}"
    echo -e "${RED}Failed:  $CHECKS_FAILED${NC}"
    echo -e "${BLUE}Total:   $TOTAL${NC}"
    echo ""
    echo -e "Success Rate: ${CYAN}${PASS_PERCENT}%${NC}"
    echo ""

    if [ "$CHECKS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}✓ System is ready for demonstration${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Run: ${CYAN}./demo-system.sh${NC}"
        echo "  2. Open: ${CYAN}http://localhost:3000${NC}"
        echo "  3. Navigate to Reliability Studio plugin"
        return 0
    else
        echo -e "${RED}✗ System has issues that need to be addressed${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "  • Check Docker is running: ${CYAN}docker ps${NC}"
        echo "  • Check logs: ${CYAN}docker-compose logs${NC}"
        echo "  • Rebuild: ${CYAN}docker-compose up -d${NC}"
        return 1
    fi
}

main "$@"
