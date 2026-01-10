# Plugin Fix Required - Grafana Angular Detection Issue

## Issue
Grafana 12.3.1 is detecting the plugin as Angular and rejecting it:
```
logger=plugins.validator.angular level=error msg="Refusing to initialize plugin because it's using Angular, which has been disabled" pluginId=sarika-reliability-studio-app
```

## Root Cause
The built `module.js` contains Angular compatibility code from `@grafana/data` package, which triggers Grafana's Angular validator.

## Solution Options

### Option 1: Update Grafana Plugin Configuration
Add to docker-compose.yml:
```yaml
environment:
  GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: "sarika-reliability-studio-app"
  GF_PLUGINS_ENABLE_ANGULAR: "true"  # Temporarily enable Angular detection
```

### Option 2: Update plugin.json
Add explicit React framework marker (if supported by Grafana 12).

### Option 3: Use Grafana Toolkit
Rebuild using `@grafana/toolkit` which properly handles React app plugins.

### Option 4: Update Dependencies
Update `@grafana/data`, `@grafana/runtime`, `@grafana/ui` to latest versions compatible with Grafana 12.

## Current Status
- ✅ Plugin builds successfully
- ✅ plugin.json is correct
- ✅ module.js is generated
- ❌ Grafana rejects plugin due to Angular detection
- ❌ Plugin not visible in Grafana Apps menu

## Temporary Workaround
Access plugin directly via URL: `http://localhost:3000/a/sarika-reliability-studio-app`

## Next Steps
1. Test direct URL access
2. Update Grafana plugin dependencies to v12 compatible versions
3. Rebuild and test

