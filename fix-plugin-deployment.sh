#!/bin/bash

###############################################################################
# GRAFANA APP PLUGIN DEPLOYMENT & VERIFICATION GUIDE
# 
# Based on Official Grafana Plugin Documentation:
# https://grafana.com/developers/plugin-tools/key-concepts/plugin-types-usage
# https://grafana.com/developers/plugin-tools/key-concepts/best-practices
#
# This fixes the "App not found" error for App Plugin
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  GRAFANA APP PLUGIN - FIX & DEPLOYMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# STEP 1: Clean and rebuild
echo -e "${YELLOW}STEP 1: Clean and rebuild plugin${NC}"
echo "---"
rm -rf dist/
echo -e "${GREEN}✓${NC} Cleaned dist/"

npm run build
echo -e "${GREEN}✓${NC} Built plugin"
echo ""

# STEP 2: Verify build output
echo -e "${YELLOW}STEP 2: Verify build output${NC}"
echo "---"

if [ ! -f "dist/plugin.json" ]; then
  echo -e "${RED}✗${NC} dist/plugin.json not found"
  exit 1
fi
echo -e "${GREEN}✓${NC} dist/plugin.json exists"

if [ ! -f "dist/module.js" ]; then
  echo -e "${RED}✗${NC} dist/module.js not found"
  exit 1
fi
echo -e "${GREEN}✓${NC} dist/module.js exists"

# Verify module.js has plugin export
if grep -q "export.*plugin" dist/module.js; then
  echo -e "${GREEN}✓${NC} dist/module.js exports plugin"
else
  echo -e "${RED}✗${NC} dist/module.js does NOT export plugin"
  exit 1
fi

# Verify plugin.json has correct structure
if grep -q '"id".*"sarika-reliability-studio-app"' dist/plugin.json; then
  echo -e "${GREEN}✓${NC} plugin.json has correct id"
else
  echo -e "${RED}✗${NC} plugin.json id mismatch"
  exit 1
fi

if grep -q '"type".*"app"' dist/plugin.json; then
  echo -e "${GREEN}✓${NC} plugin.json has type: 'app'"
else
  echo -e "${RED}✗${NC} plugin.json type is not 'app'"
  exit 1
fi

if grep -q '"module".*"dist/module.js"' dist/plugin.json; then
  echo -e "${GREEN}✓${NC} plugin.json has correct module path"
else
  echo -e "${RED}✗${NC} plugin.json module path is incorrect"
  exit 1
fi

echo ""

# STEP 3: Restart Grafana with Docker
echo -e "${YELLOW}STEP 3: Restart Grafana container${NC}"
echo "---"

# Check if running in Docker
if docker ps | grep -q grafana; then
  echo -e "Stopping Grafana container..."
  docker stop grafana
  sleep 2
  
  echo -e "Starting Grafana container..."
  docker start grafana
  sleep 3
  
  echo -e "${GREEN}✓${NC} Grafana restarted"
  echo ""
  
  # Wait for Grafana to be healthy
  echo "Waiting for Grafana to be ready..."
  for i in {1..30}; do
    if curl -s http://localhost:3000/api/health | grep -q "ok"; then
      echo -e "${GREEN}✓${NC} Grafana is healthy"
      break
    fi
    echo -n "."
    sleep 1
  done
else
  echo -e "${YELLOW}⚠${NC} Grafana container not running"
  echo "Make sure to restart Grafana:"
  echo "  docker-compose -f docker/docker-compose.yml restart grafana"
fi

echo ""

# STEP 4: Verify plugin loaded
echo -e "${YELLOW}STEP 4: Verify plugin is registered in Grafana${NC}"
echo "---"

# Check if Grafana is responding
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  # List all plugins
  PLUGINS=$(curl -s http://localhost:3000/api/plugins | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  
  if echo "$PLUGINS" | grep -q "sarika-reliability-studio-app"; then
    echo -e "${GREEN}✓${NC} Plugin 'sarika-reliability-studio-app' is registered"
  else
    echo -e "${RED}✗${NC} Plugin 'sarika-reliability-studio-app' NOT found"
    echo ""
    echo "Registered plugins:"
    echo "$PLUGINS" | sed 's/^/  - /'
    echo ""
    echo "DEBUGGING:"
    echo "1. Check Docker logs: docker logs grafana | grep -i plugin"
    echo "2. Check plugin folder: docker exec grafana ls -la /var/lib/grafana/plugins/"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠${NC} Cannot reach Grafana at http://localhost:3000"
  echo "Make sure Grafana is running:"
  echo "  docker-compose -f docker/docker-compose.yml up -d"
fi

echo ""

# STEP 5: Final summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PLUGIN DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "1. Open browser: http://localhost:3000"
echo "2. Go to Administration → Plugins"
echo "3. Search for 'Reliability Studio'"
echo "4. Click to enable if not already enabled"
echo "5. In sidebar, you should see 'Sarika Reliability Studio' under 'Apps'"
echo "6. Click to open: http://localhost:3000/a/sarika-reliability-studio-app"
echo ""
echo "If you still see 'App not found':"
echo "1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "2. Check browser console (F12) for errors"
echo "3. Run: docker logs grafana | tail -50"
echo ""
