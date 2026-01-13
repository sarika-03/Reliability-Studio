#!/bin/bash

###############################################################################
# Generate Test Incidents for Reliability Studio
# Creates synthetic incidents to test the UI
###############################################################################

BACKEND_URL="http://localhost:8080"
SERVICES=("payment-service" "api-gateway" "user-service" "frontend-web" "database")
SEVERITIES=("critical" "high" "medium" "low")

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== GENERATING TEST INCIDENTS ===${NC}\n"

# Create multiple incidents
create_incident() {
  local service=$1
  local severity=$2
  local title=$3
  
  echo -ne "${GREEN}✓${NC} Creating incident: $title ... "
  
  curl -s -X POST "$BACKEND_URL/api/incidents" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"service\": \"$service\",
      \"severity\": \"$severity\",
      \"description\": \"Test incident for UI validation\",
      \"started_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"status\": \"open\"
    }" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✓"
  else
    echo "failed"
  fi
}

# Generate incidents for different services
create_incident "payment-service" "critical" "High latency in payment processing"
create_incident "api-gateway" "high" "Authentication service timeout"
create_incident "user-service" "medium" "Increased error rate in user queries"
create_incident "frontend-web" "low" "Slow CSS loading detected"
create_incident "database" "critical" "Connection pool exhausted"

sleep 1

# Verify incidents were created
echo ""
echo -e "${BLUE}=== VERIFYING INCIDENTS ===${NC}\n"

INCIDENTS=$(curl -s "$BACKEND_URL/api/incidents" | jq '.[] | {id, title, service, severity, status}' 2>/dev/null)

if [ -z "$INCIDENTS" ]; then
  echo "❌ No incidents found - backend might not be running"
  echo ""
  echo "Start backend with:"
  echo "  cd backend && go run main.go"
else
  echo "✅ Incidents created successfully:"
  echo ""
  curl -s "$BACKEND_URL/api/incidents" | jq -r '.[] | "  • [\(.severity|ascii_upcase)] \(.title) (\(.service))"' 2>/dev/null
fi

echo ""
echo -e "${BLUE}=== TESTING COMPLETE ===${NC}"
echo ""
echo "Now refresh Grafana UI:"
echo "  1. Go to: http://localhost:3000/a/sarika-reliability-studio-app"
echo "  2. Hard refresh: Ctrl+Shift+R"
echo "  3. You should see incidents in the sidebar"
echo ""
