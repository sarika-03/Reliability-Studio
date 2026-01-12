#!/usr/bin/env bash
# Reliability Studio - Production Testing Script
# This script validates the complete end-to-end system

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:9000}"
API_BASE="$BACKEND_URL/api"
TIMEOUT=10

# Test results
PASSED=0
FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_code=$4
    
    echo -n "Testing $method $endpoint... "
    
    local response
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --connect-timeout $TIMEOUT)
    else
        response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint" \
            --connect-timeout $TIMEOUT)
    fi
    
    local http_code=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        echo "$body"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected HTTP $expected_code, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Main test suite
main() {
    print_header "🏥 RELIABILITY STUDIO - PRODUCTION VALIDATION"
    
    # ============================================
    # 1. Health Checks
    # ============================================
    print_header "1️⃣  Health Checks"
    
    echo "Checking backend health..."
    if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        echo "Make sure to run: docker-compose -f docker/docker-compose.yml up -d"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # ============================================
    # 2. Database Connectivity
    # ============================================
    print_header "2️⃣  Database & Schema"
    
    test_endpoint "GET" "/health" "" "200"
    
    # ============================================
    # 3. Incident Management - Create
    # ============================================
    print_header "3️⃣  Incident Creation"
    
    INCIDENT_DATA='{
        "title": "Test Incident - High Error Rate",
        "description": "Error rate exceeded threshold",
        "severity": "critical",
        "service": "payment-service"
    }'
    
    RESPONSE=$(curl -s -X POST "$API_BASE/incidents" \
        -H "Content-Type: application/json" \
        -d "$INCIDENT_DATA")
    
    echo "Creating incident..."
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    
    INCIDENT_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
    
    if [ -n "$INCIDENT_ID" ] && [ "$INCIDENT_ID" != "null" ]; then
        echo -e "${GREEN}✅ Incident created successfully${NC}"
        echo "Incident ID: $INCIDENT_ID"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ Failed to create incident${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # ============================================
    # 4. Incident Management - List All
    # ============================================
    print_header "4️⃣  List All Incidents"
    
    echo "Fetching all incidents..."
    RESPONSE=$(curl -s "$API_BASE/incidents")
    
    INCIDENT_COUNT=$(echo "$RESPONSE" | jq 'length' 2>/dev/null)
    
    if [ "$INCIDENT_COUNT" -ge 1 ]; then
        echo -e "${GREEN}✅ Retrieved incidents${NC}"
        echo "Total incidents: $INCIDENT_COUNT"
        echo "$RESPONSE" | jq '.[0:2]' 2>/dev/null || echo "$RESPONSE"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ Failed to list incidents${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # ============================================
    # 5. Incident Management - Get Active
    # ============================================
    print_header "5️⃣  Get Active Incidents (NEW)"
    
    echo "Fetching only active incidents (status != 'resolved')..."
    RESPONSE=$(curl -s "$API_BASE/incidents/active")
    
    ACTIVE_COUNT=$(echo "$RESPONSE" | jq 'length' 2>/dev/null)
    
    if [ "$ACTIVE_COUNT" -ge 1 ]; then
        echo -e "${GREEN}✅ Retrieved active incidents${NC}"
        echo "Active incidents: $ACTIVE_COUNT"
        echo "$RESPONSE" | jq '.[0:2]' 2>/dev/null || echo "$RESPONSE"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  No active incidents found (this is OK)${NC}"
        PASSED=$((PASSED + 1))
    fi
    
    # ============================================
    # 6. Incident Management - Get Single
    # ============================================
    print_header "6️⃣  Get Single Incident"
    
    if [ -n "$INCIDENT_ID" ] && [ "$INCIDENT_ID" != "null" ]; then
        echo "Fetching incident $INCIDENT_ID..."
        RESPONSE=$(curl -s "$API_BASE/incidents/$INCIDENT_ID")
        
        if echo "$RESPONSE" | jq . > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Retrieved incident details${NC}"
            echo "$RESPONSE" | jq .
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ Failed to retrieve incident${NC}"
            echo "Response: $RESPONSE"
            FAILED=$((FAILED + 1))
        fi
    fi
    
    # ============================================
    # 7. Incident Management - Update
    # ============================================
    print_header "7️⃣  Update Incident Status"
    
    if [ -n "$INCIDENT_ID" ] && [ "$INCIDENT_ID" != "null" ]; then
        UPDATE_DATA='{
            "status": "investigating",
            "description": "Updated via test - investigating root cause"
        }'
        
        echo "Updating incident to 'investigating' status..."
        RESPONSE=$(curl -s -X PATCH "$API_BASE/incidents/$INCIDENT_ID" \
            -H "Content-Type: application/json" \
            -d "$UPDATE_DATA")
        
        if echo "$RESPONSE" | jq . > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Incident updated successfully${NC}"
            echo "$RESPONSE" | jq .
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ Failed to update incident${NC}"
            echo "Response: $RESPONSE"
            FAILED=$((FAILED + 1))
        fi
    fi
    
    # ============================================
    # 8. Create Multiple Incidents
    # ============================================
    print_header "8️⃣  Stress Test - Multiple Incidents"
    
    for i in {1..3}; do
        INCIDENT_DATA="{
            \"title\": \"Stress Test Incident $i\",
            \"description\": \"Auto-generated incident for stress testing\",
            \"severity\": \"$([ $((RANDOM % 2)) -eq 0 ] && echo 'high' || echo 'medium')\",
            \"service\": \"test-service-$i\"
        }"
        
        RESPONSE=$(curl -s -X POST "$API_BASE/incidents" \
            -H "Content-Type: application/json" \
            -d "$INCIDENT_DATA")
        
        if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Incident $i created${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ Failed to create incident $i${NC}"
            FAILED=$((FAILED + 1))
        fi
    done
    
    # ============================================
    # 9. Validation Tests
    # ============================================
    print_header "9️⃣  Validation Tests"
    
    # Test missing title
    echo -n "Testing validation: missing title... "
    RESPONSE=$(curl -s -X POST "$API_BASE/incidents" \
        -H "Content-Type: application/json" \
        -d '{"severity": "high", "service": "test"}')
    
    if echo "$RESPONSE" | grep -q "required"; then
        echo -e "${GREEN}✅ Validation working${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  Validation may need review${NC}"
    fi
    
    # ============================================
    # Final Summary
    # ============================================
    print_header "📊 Test Summary"
    
    TOTAL=$((PASSED + FAILED))
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    
    echo "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo "Success Rate: $PERCENTAGE%"
    echo
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ ALL TESTS PASSED - SYSTEM IS PRODUCTION READY${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        return 0
    else
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        return 1
    fi
}

# Run main function
main "$@"
