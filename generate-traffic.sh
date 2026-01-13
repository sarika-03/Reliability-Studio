#!/bin/bash

###############################################################################
# Generate Test Traffic to Backend
# Simulates requests that would trigger incident detection
###############################################################################

BACKEND_URL="http://localhost:8080"
SERVICES=("payment-service" "api-gateway" "user-service" "frontend-web")
DURATION=${1:-30}  # Default 30 seconds, or pass duration as argument

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  GENERATING TEST TRAFFIC              ║${NC}"
echo -e "${BLUE}║  Duration: ${DURATION}s                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if backend is running
echo -n "Checking backend health... "
if curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Backend is running"
else
  echo -e "${RED}✗${NC} Backend not responding at $BACKEND_URL"
  echo ""
  echo "Start backend with:"
  echo "  cd backend && go run main.go"
  exit 1
fi

echo ""
echo -e "${YELLOW}Generating requests...${NC}"
echo ""

start_time=$(date +%s)
request_count=0
error_count=0

while true; do
  current_time=$(date +%s)
  elapsed=$((current_time - start_time))
  
  if [ $elapsed -ge $DURATION ]; then
    break
  fi
  
  # Random service
  service=${SERVICES[$((RANDOM % ${#SERVICES[@]}))]}
  
  # Random endpoint
  endpoint=$(( RANDOM % 4 ))
  case $endpoint in
    0) path="/api/incidents" ;;
    1) path="/api/services" ;;
    2) path="/api/metrics?service=$service" ;;
    3) path="/api/logs?service=$service" ;;
  esac
  
  # Simulate requests
  curl -s -X GET "$BACKEND_URL$path" > /dev/null 2>&1
  result=$?
  
  if [ $result -eq 0 ]; then
    ((request_count++))
    echo -ne "\r${GREEN}✓${NC} Requests: $request_count | Elapsed: ${elapsed}s / ${DURATION}s"
  else
    ((error_count++))
    echo -ne "\r${RED}✗${NC} Requests: $request_count | Errors: $error_count | Elapsed: ${elapsed}s / ${DURATION}s"
  fi
  
  # Small delay between requests
  sleep 0.1
done

echo ""
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✓ TRAFFIC GENERATION COMPLETE${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Summary:"
echo "  Total Requests: $request_count"
echo "  Errors: $error_count"
echo "  Success Rate: $(echo "scale=2; ($request_count * 100) / ($request_count + $error_count)" | bc)%"
echo ""
echo "Next steps:"
echo "  1. Check Grafana UI: http://localhost:3000/a/sarika-reliability-studio-app"
echo "  2. Hard refresh: Ctrl+Shift+R"
echo "  3. Look for incidents in the sidebar"
echo ""
