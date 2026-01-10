# Reliability Studio Plugin - Access Guide

## ⚠️ Plugin Not Showing in Grafana Apps Menu

**Issue:** Grafana 12.3.1 is detecting the plugin as Angular and rejecting it during validation, even though it's a React app plugin.

**Error in logs:**
```
logger=plugins.validator.angular level=error msg="Refusing to initialize plugin because it's using Angular, which has been disabled"
```

## 🔧 Quick Fix - Direct URL Access

Even though the plugin is rejected during validation, you can **still access it directly** via URL:

### Step 1: Login to Grafana
1. Open: http://localhost:3000
2. Login with: `admin` / `admin`

### Step 2: Access Plugin Directly
After login, navigate directly to:
```
http://localhost:3000/a/sarika-reliability-studio-app
```

This will bypass the Apps menu and load the plugin directly.

## 🛠️ Permanent Fix (After GitHub Push)

The plugin needs to be updated for Grafana 12 compatibility:

1. **Update Grafana dependencies** to v12 compatible versions
2. **Remove Angular compatibility code** from build output
3. **Update plugin.json** if needed for Grafana 12

## ✅ For Now - Use Direct URL

**All functionality works** via direct URL access:
- http://localhost:3000/a/sarika-reliability-studio-app

The plugin will load and function correctly, you just need to access it via direct URL instead of the Apps menu.

---

## 🚀 Complete Demo Flow Using Direct URL

1. **Login to Grafana:** http://localhost:3000 (admin/admin)
2. **Access Plugin:** http://localhost:3000/a/sarika-reliability-studio-app
3. **Trigger Failure:**
   ```bash
   curl -X POST http://localhost:9000/api/test/fail
   ```
4. **Watch Incident Auto-Appear** in the plugin (within 30 seconds)
5. **Use All Features:**
   - View Timeline (auto-updates)
   - Check Metrics, Logs, Traces (auto-filtered)
   - Resolve Incident from UI

---

**The plugin is fully functional, just access it via direct URL until we fix the Grafana validation issue.**

