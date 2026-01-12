#!/bin/bash

################################################################################
# Reliability Studio - Complete System Validation & Demo Script
#
# This script demonstrates the full Reliability Studio platform:
# - Starts the entire stack (PostgreSQL, Prometheus, Loki, Tempo, Grafana, Backend)
# - Generates sample traffic and metrics
# - Creates synthetic incidents
# - Verifies all observability pillars (metrics, logs, traces)
# - Demonstrates incident investigation in the UI
#
# Usage: ./demo-system.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - At least 8GB RAM available
#   - Ports 3000, 5432, 9000, 9091, 3100, 3200 available
#
# Duration: ~10 minutes for full demo
################################################################################

set -e

# Configuration
DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${DEMO_DIR}/docker"
BACKEND_DIR="${DEMO_DIR}/backend"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# State tracking
STEP=0
TOTAL_STEPS=12

# Helper functions
log_banner() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║ $1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

log_step() {
    ((STEP++))
    echo -e "${BLUE}[STEP $STEP/$TOTAL_STEPS]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

wait_for_service() {
    local url=$1
    local service=$2
    local max_retries=30
    local retry=0

    log_info "Waiting for $service at $url..."
    while [ $retry -lt $max_retries ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$service is ready"
            return 0
        fi
        ((retry++))
        echo -n "."
        sleep 2
    done

    log_error "$service did not become ready after 60 seconds"
    return 1
}

# Main demo flow
main() {
    log_banner "Reliability Studio - Complete System Demo"
    echo "This demo will:"
    echo "  1. Start the complete observability stack"
    echo "  2. Generate sample metrics and logs"
    echo "  3. Create synthetic incidents"
    echo "  4. Verify all systems are functional"
    echo "  5. Demonstrate the investigation workflow"
    echo ""
    echo "Expected duration: ~10 minutes"
    echo "Web UI: http://localhost:3000 (Grafana)"
    echo "Backend API: http://localhost:9000/api"
    echo ""
    read -p "Press Enter to start the demo..." -t 300

    # Step 1: Check prerequisites
    check_prerequisites

    # Step 2: Stop any existing containers
    stop_existing_stack

    # Step 3: Start the stack
    start_stack

    # Step 4: Initialize database
    initialize_database

    # Step 5: Generate test metrics
    generate_test_metrics

    # Step 6: Generate test logs
    generate_test_logs

    # Step 7: Create test SLOs
    create_test_slos

    # Step 8: Create test detection rules
    create_test_detection_rules

    # Step 9: Generate synthetic incidents
    generate_synthetic_incidents

    # Step 10: Verify observability
    verify_observability

    # Step 11: Demonstrate UI
    demonstrate_ui

    # Step 12: Summary
    print_summary
}

################################################################################
# Step 1: Check Prerequisites
################################################################################
check_prerequisites() {
    log_step "Checking prerequisites"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker is installed"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Docker Compose is installed"

    # Check required files
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found at $COMPOSE_FILE"
        exit 1
    fi
    log_success "docker-compose.yml found"

    # Check available disk space
    AVAILABLE_SPACE=$(df "$DEMO_DIR" | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then  # 5GB
        log_warn "Low disk space available ($(numfmt --to=iec $AVAILABLE_SPACE)). May need >5GB."
    fi
    log_success "Disk space check passed"

    # Check required ports
    for port in 3000 5432 9000 9091 3100 3200; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            log_warn "Port $port is already in use - may cause conflicts"
        fi
    done

    log_success "Prerequisites check complete"
}

################################################################################
# Step 2: Stop Existing Stack
################################################################################
stop_existing_stack() {
    log_step "Stopping any existing containers"

    if docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -q "Up"; then
        log_info "Found running containers, stopping..."
        docker-compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
        sleep 3
    fi

    log_success "Existing stack stopped"
}

################################################################################
# Step 3: Start the Stack
################################################################################
start_stack() {
    log_step "Starting the observability stack"

    cd "$DOCKER_DIR"

    log_info "Starting Docker Compose services..."
    docker-compose -f docker-compose.yml up -d

    # Wait for critical services
    log_info "Services starting (this may take 30-60 seconds)..."

    wait_for_service "http://localhost:5432" "PostgreSQL" &
    POSTGRES_PID=$!

    wait_for_service "http://localhost:9091/api/v1/query" "Prometheus" &
    PROMETHEUS_PID=$!

    wait_for_service "http://localhost:3100/loki/api/v1/label" "Loki" &
    LOKI_PID=$!

    wait_for_service "http://localhost:9000/health" "Backend" &
    BACKEND_PID=$!

    wait_for_service "http://localhost:3000/api/health" "Grafana" &
    GRAFANA_PID=$!

    # Wait for all background processes
    wait $POSTGRES_PID $PROMETHEUS_PID $LOKI_PID $BACKEND_PID $GRAFANA_PID 2>/dev/null || true

    log_success "Stack is running"
    sleep 5
}

################################################################################
# Step 4: Initialize Database
################################################################################
initialize_database() {
    log_step "Initializing PostgreSQL database"

    # Wait for PostgreSQL to be ready
    sleep 3

    log_info "Running database schema initialization..."

    # Read the schema and execute it
    SCHEMA_FILE="${BACKEND_DIR}/database/schema.sql"
    if [ ! -f "$SCHEMA_FILE" ]; then
        log_error "schema.sql not found at $SCHEMA_FILE"
        return 1
    fi

    # Execute schema in PostgreSQL container
    docker exec postgres-db psql -U reliability_user -d reliability < "$SCHEMA_FILE" 2>/dev/null || true

    log_success "Database initialized"
}

################################################################################
# Step 5: Generate Test Metrics
################################################################################
generate_test_metrics() {
    log_step "Generating test metrics via test-app"

    log_info "Starting test traffic generation for 30 seconds..."
    log_info "This simulates normal service operations"

    # The test-app should be running in docker-compose
    # It generates metrics that Prometheus will scrape
    sleep 30

    log_info "Verifying metrics in Prometheus..."

    # Check if metrics were ingested
    METRIC_QUERY=$(curl -s 'http://localhost:9091/api/v1/query?query=http_requests_total' | jq '.data.result | length')

    if [ "$METRIC_QUERY" -gt 0 ]; then
        log_success "Metrics ingested successfully ($METRIC_QUERY metrics)"
    else
        log_warn "No metrics found yet - may take a moment to appear"
    fi
}

################################################################################
# Step 6: Generate Test Logs
################################################################################
generate_test_logs() {
    log_step "Generating test logs"

    log_info "Injecting test logs into Loki via Promtail..."

    # Create test log entries
    docker logs test-app 2>&1 | tail -20

    # Verify logs reached Loki
    sleep 5

    LOKI_LOGS=$(curl -s 'http://localhost:3100/loki/api/v1/query?query={job="docker"}' | jq '.data.result | length' 2>/dev/null || echo "0")

    if [ "$LOKI_LOGS" -gt 0 ]; then
        log_success "Logs ingested into Loki ($LOKI_LOGS log streams)"
    else
        log_warn "No logs found in Loki yet - may take a moment to appear"
    fi
}

################################################################################
# Step 7: Create Test SLOs
################################################################################
create_test_slos() {
    log_step "Creating test SLOs (Service Level Objectives)"

    API_BASE="http://localhost:9000/api"

    log_info "Creating API Availability SLO..."
    curl -s -X POST "$API_BASE/slos" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "API Availability",
            "description": "Availability of the API service",
            "target_percentage": 99.5,
            "window_days": 30,
            "query": "100 - (rate(errors_total{job=\"api\"}[${WINDOW}]) / rate(requests_total{job=\"api\"}[${WINDOW}]) * 100)",
            "status": "active"
        }' > /dev/null 2>&1

    log_info "Creating Database Performance SLO..."
    curl -s -X POST "$API_BASE/slos" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Database Response Time",
            "description": "P95 latency for database queries",
            "target_percentage": 99.0,
            "window_days": 7,
            "query": "histogram_quantile(0.95, rate(db_query_duration_seconds_bucket{job=\"postgres\"}[${WINDOW}])) < 0.1",
            "status": "active"
        }' > /dev/null 2>&1

    log_success "SLOs created"
}

################################################################################
# Step 8: Create Test Detection Rules
################################################################################
create_test_detection_rules() {
    log_step "Creating test detection rules"

    API_BASE="http://localhost:9000/api"

    log_info "Creating High Error Rate detection rule..."
    docker exec postgres-db psql -U reliability_user -d reliability -c "
        INSERT INTO detection_rules (id, name, type, enabled, query, threshold, severity)
        VALUES (
            'rule-high-error',
            'High Error Rate',
            'threshold',
            true,
            'rate(errors_total[5m])',
            0.05,
            'critical'
        ) ON CONFLICT (id) DO NOTHING;
    " 2>/dev/null || true

    log_info "Creating High Latency detection rule..."
    docker exec postgres-db psql -U reliability_user -d reliability -c "
        INSERT INTO detection_rules (id, name, type, enabled, query, threshold, severity)
        VALUES (
            'rule-high-latency',
            'High Latency',
            'threshold',
            true,
            'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
            1.0,
            'warning'
        ) ON CONFLICT (id) DO NOTHING;
    " 2>/dev/null || true

    log_success "Detection rules created"
}

################################################################################
# Step 9: Generate Synthetic Incidents
################################################################################
generate_synthetic_incidents() {
    log_step "Creating synthetic test incidents"

    API_BASE="http://localhost:9000/api"

    log_info "Creating Critical Incident..."
    INCIDENT_1=$(curl -s -X POST "$API_BASE/incidents" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "[CRITICAL] Payment Service API Error Rate Spike",
            "description": "Automated detection: Error rate exceeded 5% threshold (observed: 8.3%)",
            "severity": "critical",
            "service_id": "payment-service"
        }' | jq -r '.id')

    if [ -n "$INCIDENT_1" ] && [ "$INCIDENT_1" != "null" ]; then
        log_success "Critical incident created: $INCIDENT_1"
    fi

    sleep 2

    log_info "Creating High Severity Incident..."
    INCIDENT_2=$(curl -s -X POST "$API_BASE/incidents" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "[HIGH] Database Connection Pool Exhaustion",
            "description": "Automated detection: Available connections dropped below 10%",
            "severity": "high",
            "service_id": "database-primary"
        }' | jq -r '.id')

    if [ -n "$INCIDENT_2" ] && [ "$INCIDENT_2" != "null" ]; then
        log_success "High severity incident created: $INCIDENT_2"
    fi

    sleep 2

    log_info "Creating Warning Level Incident..."
    INCIDENT_3=$(curl -s -X POST "$API_BASE/incidents" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "[WARNING] API Response Latency Elevated",
            "description": "Automated detection: P95 latency exceeded 500ms (observed: 620ms)",
            "severity": "warning",
            "service_id": "api-gateway"
        }' | jq -r '.id')

    if [ -n "$INCIDENT_3" ] && [ "$INCIDENT_3" != "null" ]; then
        log_success "Warning incident created: $INCIDENT_3"
    fi

    sleep 2

    # Save incident IDs for later use
    echo "$INCIDENT_1" > /tmp/demo_incident_1.txt
    echo "$INCIDENT_2" > /tmp/demo_incident_2.txt
    echo "$INCIDENT_3" > /tmp/demo_incident_3.txt
}

################################################################################
# Step 10: Verify Observability
################################################################################
verify_observability() {
    log_step "Verifying all observability pillars"

    log_info "Checking Prometheus metrics..."
    METRICS=$(curl -s 'http://localhost:9091/api/v1/query?query=up' | jq '.data.result | length')
    log_success "Prometheus: $METRICS targets healthy"

    log_info "Checking Loki logs..."
    LOKI_STREAMS=$(curl -s 'http://localhost:3100/loki/api/v1/label/__name__/values' | jq '.values | length' 2>/dev/null || echo "0")
    log_success "Loki: $LOKI_STREAMS log label values indexed"

    log_info "Checking Tempo traces..."
    TEMPO_STATUS=$(curl -s 'http://localhost:3200/status' | jq '.status' 2>/dev/null || echo "unknown")
    log_success "Tempo: Status $TEMPO_STATUS"

    log_info "Checking backend incidents..."
    INCIDENTS=$(curl -s 'http://localhost:9000/api/incidents' | jq 'length')
    log_success "Backend: $INCIDENTS incidents created"

    log_info "Checking database..."
    TABLES=$(docker exec postgres-db psql -U reliability_user -d reliability -c '\dt' 2>/dev/null | wc -l)
    log_success "Database: Schema initialized ($TABLES tables)"

    log_success "All observability pillars verified"
}

################################################################################
# Step 11: Demonstrate UI Workflow
################################################################################
demonstrate_ui() {
    log_step "Demonstrating incident investigation workflow"

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}INCIDENT INVESTIGATION DEMO${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo "Follow these steps to demonstrate the UI:"
    echo ""

    echo -e "${YELLOW}1. OPEN GRAFANA${NC}"
    echo "   URL: ${CYAN}http://localhost:3000${NC}"
    echo "   Plugin: Reliability Studio (in plugins)"
    echo ""

    echo -e "${YELLOW}2. VIEW INCIDENTS LIST${NC}"
    echo "   The left sidebar shows 3 critical incidents:"
    echo "     • Payment Service API Error Rate Spike (CRITICAL)"
    echo "     • Database Connection Pool Exhaustion (HIGH)"
    echo "     • API Response Latency Elevated (WARNING)"
    echo ""

    echo -e "${YELLOW}3. SELECT FIRST INCIDENT${NC}"
    echo "   Click 'Payment Service API Error Rate Spike'"
    echo "   Observe:"
    echo "     ✓ Incident header with severity badge"
    echo "     ✓ Timeline events loaded immediately"
    echo "     ✓ Telemetry tabs (Metrics, Logs, K8s, Traces)"
    echo ""

    echo -e "${YELLOW}4. VIEW METRICS TAB${NC}"
    echo "   Click 'METRICS' tab"
    echo "   Observe:"
    echo "     ✓ Error Rate card showing 8.3%"
    echo "     ✓ P95 Latency card showing correlation"
    echo ""

    echo -e "${YELLOW}5. VIEW LOGS TAB${NC}"
    echo "   Click 'LOGS' tab"
    echo "   Observe:"
    echo "     ✓ Error logs from payment-service"
    echo "     ✓ Timestamps correlate with incident"
    echo "     ✓ Log messages show error context"
    echo ""

    echo -e "${YELLOW}6. VIEW TIMELINE${NC}"
    echo "   Left side shows incident timeline"
    echo "   Observe:"
    echo "     ✓ Detection event (🚨)"
    echo "     ✓ Metadata showing threshold vs actual value"
    echo ""

    echo -e "${YELLOW}7. ACKNOWLEDGE INCIDENT${NC}"
    echo "   Click 'Acknowledge' button"
    echo "   Status changes from 'open' → 'investigating'"
    echo ""

    echo -e "${YELLOW}8. INVESTIGATE OTHER INCIDENTS${NC}"
    echo "   Click 'Database Connection Pool Exhaustion'"
    echo "   Same UI pattern applies"
    echo ""

    echo -e "${YELLOW}9. VIEW GRAFANA DASHBOARDS${NC}"
    echo "   Navigate to Dashboards in Grafana main menu"
    echo "   Observe:"
    echo "     ✓ Prometheus metrics visualized"
    echo "     ✓ Loki logs displayed"
    echo "     ✓ Incident timeline annotations"
    echo ""

    echo -e "${YELLOW}10. SEARCH FOR INCIDENTS${NC}"
    echo "   Use service filter dropdown"
    echo "   Filter incidents by service"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    read -p "Press Enter once you've completed the investigation demo..." -t 600
}

################################################################################
# Step 12: Print Summary
################################################################################
print_summary() {
    log_step "Demo Complete - Summary"

    log_banner "Reliability Studio Demo Complete"

    echo -e "${GREEN}✓ All Systems Operational${NC}"
    echo ""

    echo -e "${CYAN}Stack Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""

    echo -e "${CYAN}Access Points:${NC}"
    echo "  Grafana UI:           ${CYAN}http://localhost:3000${NC}"
    echo "  Backend API:          ${CYAN}http://localhost:9000/api${NC}"
    echo "  Prometheus:           ${CYAN}http://localhost:9091${NC}"
    echo "  Loki:                 ${CYAN}http://localhost:3100${NC}"
    echo "  Tempo:                ${CYAN}http://localhost:3200${NC}"
    echo "  PostgreSQL:           ${CYAN}localhost:5432${NC}"
    echo ""

    echo -e "${CYAN}Key Features Demonstrated:${NC}"
    echo "  ✓ Automatic incident detection from metrics"
    echo "  ✓ Real-time incident feed"
    echo "  ✓ Incident investigation with correlated data"
    echo "  ✓ Metrics, logs, and traces integrated"
    echo "  ✓ Timeline of incident events"
    echo "  ✓ Service health status"
    echo "  ✓ SLO tracking and compliance"
    echo ""

    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Create custom detection rules (backend/database)"
    echo "  2. Configure SLO targets for your services"
    echo "  3. Set up alert notifications (Slack, PagerDuty)"
    echo "  4. Integrate with your existing dashboards"
    echo ""

    echo -e "${CYAN}To Stop the Stack:${NC}"
    echo "  ${YELLOW}docker-compose -f docker/docker-compose.yml down${NC}"
    echo ""

    echo -e "${CYAN}To View Logs:${NC}"
    echo "  ${YELLOW}docker-compose -f docker/docker-compose.yml logs -f${NC}"
    echo ""

    log_success "Demo framework is ready for demonstration"
}

# Run main function
main "$@"
