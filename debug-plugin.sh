#!/bin/bash

###############################################################################
# GRAFANA PLUGIN UI DEBUGGING SCRIPT
# 
# This script performs automated checks on your plugin setup
# Run: chmod +x debug-plugin.sh && ./debug-plugin.sh
###############################################################################

echo "=========================================="
echo "🔍 GRAFANA PLUGIN DIAGNOSTICS"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Helper functions
check_file() {
  local file=$1
  local name=$2
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $name exists"
  else
    echo -e "${RED}✗${NC} $name missing: $file"
    ((ERRORS++))
  fi
}

check_dir() {
  local dir=$1
  local name=$2
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✓${NC} $name exists"
  else
    echo -e "${RED}✗${NC} $name missing: $dir"
    ((ERRORS++))
  fi
}

echo "📋 STEP 1: Configuration Files"
echo "---"
check_file "plugin.json" "plugin.json"
check_file "package.json" "package.json"
check_file "tsconfig.json" "tsconfig.json"
check_file "vite.config.ts" "vite.config.ts"
check_file "src/module.tsx" "src/module.tsx"
check_file "src/app/App.tsx" "src/app/App.tsx"
echo ""

echo "📂 STEP 2: Source Directory"
echo "---"
check_dir "src" "src/"
check_dir "src/app" "src/app/"
check_dir "src/components" "src/components/"
echo ""

echo "🔨 STEP 3: Build Output"
echo "---"
check_dir "dist" "dist/ folder"
if [ -d "dist" ]; then
  check_file "dist/module.js" "dist/module.js"
  
  if [ -f "dist/module.js" ]; then
    SIZE=$(wc -c < dist/module.js)
    LINES=$(wc -l < dist/module.js)
    echo -e "${GREEN}✓${NC} module.js is $(( SIZE / 1024 ))KB ($LINES lines)"
    
    # Check for valid ES module
    if head -1 dist/module.js | grep -q "^import\|^export"; then
      echo -e "${GREEN}✓${NC} module.js appears to be valid ES module"
    else
      echo -e "${YELLOW}⚠${NC} module.js might not be ES module format"
      ((WARNINGS++))
    fi
  fi
fi
echo ""

echo "📦 STEP 4: Dependencies"
echo "---"
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules exists"
  
  # Check for key Grafana packages
  if [ -d "node_modules/@grafana/ui" ]; then
    echo -e "${GREEN}✓${NC} @grafana/ui installed"
  else
    echo -e "${RED}✗${NC} @grafana/ui missing"
    ((ERRORS++))
  fi
  
  if [ -d "node_modules/@grafana/data" ]; then
    echo -e "${GREEN}✓${NC} @grafana/data installed"
  else
    echo -e "${RED}✗${NC} @grafana/data missing"
    ((ERRORS++))
  fi
  
  if [ -d "node_modules/react" ]; then
    echo -e "${GREEN}✓${NC} react installed"
  else
    echo -e "${RED}✗${NC} react missing"
    ((ERRORS++))
  fi
else
  echo -e "${RED}✗${NC} node_modules missing"
  echo "   Run: npm install"
  ((ERRORS++))
fi
echo ""

echo "🔍 STEP 5: Key File Contents Check"
echo "---"

# Check plugin.json has type: app
if grep -q '"type".*:.*"app"' plugin.json; then
  echo -e "${GREEN}✓${NC} plugin.json has type: 'app'"
else
  echo -e "${RED}✗${NC} plugin.json type is not 'app'"
  ((ERRORS++))
fi

# Check plugin.json has includes
if grep -q '"includes"' plugin.json; then
  echo -e "${GREEN}✓${NC} plugin.json has 'includes'"
else
  echo -e "${RED}✗${NC} plugin.json missing 'includes'"
  ((ERRORS++))
fi

# Check module.tsx exports plugin
if grep -q "export const plugin" src/module.tsx; then
  echo -e "${GREEN}✓${NC} src/module.tsx exports plugin"
else
  echo -e "${RED}✗${NC} src/module.tsx missing plugin export"
  ((ERRORS++))
fi

# Check module.tsx uses setRootPage
if grep -q "setRootPage" src/module.tsx; then
  echo -e "${GREEN}✓${NC} src/module.tsx uses setRootPage()"
else
  echo -e "${RED}✗${NC} src/module.tsx missing setRootPage()"
  ((ERRORS++))
fi

# Check App.tsx accepts AppRootProps
if grep -q "AppRootProps" src/app/App.tsx; then
  echo -e "${GREEN}✓${NC} src/app/App.tsx uses AppRootProps"
else
  echo -e "${YELLOW}⚠${NC} src/app/App.tsx might not accept AppRootProps"
  ((WARNINGS++))
fi

echo ""
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run: npm run build"
  echo "2. Check browser console (F12) for errors"
  echo "3. Check Network tab (F12) for module.js"
  echo "4. Hard refresh: Ctrl+Shift+R"
  echo ""
else
  echo -e "${RED}❌ Found $ERRORS error(s) to fix${NC}"
  echo ""
  echo "Fix the errors above and try again"
fi

if [ $WARNINGS -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠ $WARNINGS warning(s) - review above${NC}"
fi
