# 🎯 GRAFANA APP PLUGIN UI DEBUGGING GUIDE - COMPLETE SOLUTION

## **STATUS: Plugin Successfully Registered ✅**

Your app plugin `sarika-reliability-studio-app` is:
- ✅ **Registered** in Grafana
- ✅ **Enabled** 
- ✅ **Pinned** in sidebar
- ✅ **module.js** built correctly (96.78 kB)
- ✅ **plugin.json** configured correctly

---

## **WHY YOU'RE SEEING "App not found"**

Based on your screenshot and the official Grafana documentation:
https://grafana.com/developers/plugin-tools/key-concepts/plugin-types-usage

### 🔍 Root Cause Analysis

The "App not found" error occurs when:

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Stale cache** | Sees old version, route doesn't load | Hard refresh: `Ctrl+Shift+R` |
| **Module not rendered** | Plugin exists but components not mounting | Check `setRootPage()` in module.tsx |
| **Component error** | Error in App or IncidentControlRoom | Check browser console (F12) |
| **Path mismatch** | plugin.json path != actual route | Verify `path: "/a/sarika-reliability-studio-app"` |
| **Container height issue** | UI renders off-screen | Ensure root div has `height: 100%` |

---

## **STEP 1: Hard Refresh Browser Cache**

Your issue is most likely **stale cache**. The plugin IS registered, but your browser cached the old 404 page.

**Do this now:**

```bash
# Windows/Linux:
Ctrl + Shift + R

# Mac:
Cmd + Shift + R

# Or clear all cache:
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (Mac)
```

Then navigate to: `http://localhost:3000/a/sarika-reliability-studio-app`

**Expected result:** You should see your Incident Control Room UI, not "App not found"

---

## **STEP 2: Verify Plugin Load in Browser Console**

If you still see "App not found":

1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Check for any red errors
4. Look for messages like:
   ```
   App component mounted with props: {...}
   IncidentControlRoom component mounted
   ```

**If you see errors:**
- Copy the error message
- Check [Troubleshooting Errors](#troubleshooting-errors-section) below

---

## **STEP 3: Verify Plugin Mounted Correctly in Docker**

Confirm the plugin directory is mounted correctly:

```bash
# Check if plugin files are in Grafana container
docker exec grafana ls -la /var/lib/grafana/plugins/sarika-reliability-studio-app/

# Expected output:
# -rw-rw-r-- module.js
# -rw-rw-r-- plugin.json
# drwxr-xr-x img/
# drwxr-xr-x screenshots/
```

If files are missing, the docker-compose mount failed:

```bash
# Restart with fresh mount
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d
```

---

## **STEP 4: Check IncidentControlRoom Component**

Your `src/components/IncidentControlRoom.tsx` must:

1. ✅ Be exported as a function component
2. ✅ Return valid JSX
3. ✅ Handle loading states
4. ✅ Handle errors gracefully

**Quick test - temporarily use diagnostic component:**

Edit [src/module.tsx](src/module.tsx):

```tsx
// TEMPORARY: Switch to diagnostic component to test loading
import { AppDiagnostic } from './app/AppDiagnostic';

export const plugin = new AppPlugin<{}>()
    .setRootPage(AppDiagnostic);  // ← Use this temporarily
```

Then:
```bash
npm run build
# Hard refresh browser
```

**If you see the diagnostic "✅ PLUGIN LOADED SUCCESSFULLY" message:**
- Plugin loading works correctly ✓
- Problem is in IncidentControlRoom component
- Edit src/module.tsx back to use `App` instead of `AppDiagnostic`

**If you still don't see it:**
- Problem is deeper (module.js not loading)
- Check Network tab (F12 → Network) for module.js status

---

## **STEP 5: Fix Common UI Issues**

### ❌ Issue: App renders but blank/white

**Solution:** Ensure root element has dimensions

```tsx
// src/app/App.tsx
export const App = (props: AppRootProps) => {
  return (
    <ErrorBoundary level="page">
      <div className="page-container" style={{ 
        width: '100%', 
        height: '100%',      // ← REQUIRED!
        display: 'flex',     // ← Add this
        flexDirection: 'column'
      }}>
        <IncidentControlRoom />
      </div>
    </ErrorBoundary>
  );
};
```

### ❌ Issue: Only sidebar shows, no content

**Solution:** IncidentControlRoom not rendering. Check:

```tsx
// src/components/IncidentControlRoom.tsx - line ~300

export function IncidentControlRoom() {
  // Must have these checks:
  
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load data...
    backendAPI.getIncidents()
      .then(setIncidents)
      .catch(err => {
        console.error('Failed to load incidents:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);
  
  // ✅ Show loading state
  if (loading) {
    return <LoadingPlaceholder text="Loading incidents..." />;
  }
  
  // ✅ Show error state
  if (error) {
    return <Alert type="error" title={error} />;
  }
  
  // ✅ Then render content
  return <div>{/* Your UI */}</div>;
}
```

### ❌ Issue: Styling broken or colors wrong

**Solution:** Use Grafana theming

```tsx
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

export const MyComponent = () => {
  const theme = useTheme2();
  
  const styles = css`
    background: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.weak};
  `;
  
  return <div className={styles}>Content</div>;
};
```

---

## **Troubleshooting Errors Section**

### 🔴 Console Error: "Cannot use import statement outside a module"

**Cause:** module.js failed to load or is corrupted  
**Fix:**
```bash
npm run clean
npm run build
# Restart Grafana:
docker restart grafana
# Hard refresh: Ctrl+Shift+R
```

### 🔴 Console Error: "IncidentControlRoom is not defined"

**Cause:** Component import failed  
**Fix:** Check [src/app/App.tsx](src/app/App.tsx) line 4:
```tsx
// Make sure this exists:
import { IncidentControlRoom } from '../components/IncidentControlRoom';
```

### 🔴 Console Error: "Cannot read property 'xyz' of undefined"

**Cause:** Component trying to use props/state before they load  
**Fix:** Add null checks:
```tsx
const data = incidents?.[0];  // Use optional chaining
const value = data?.id || 'unknown';
```

### 🔴 Page loads but IncidentControlRoom is empty

**Cause:** Backend API call failing or data not displayed  
**Fix:** Check backend health:
```bash
# Test backend API
curl -s http://localhost:8080/api/incidents | jq .

# If 404 or error, backend not running:
docker-compose -f docker/docker-compose.yml logs backend | tail -20
```

---

## **Official Grafana Best Practices**

Based on https://grafana.com/developers/plugin-tools/key-concepts/best-practices:

### ✅ App Plugin Best Practices

```tsx
// 1. Specify root page
.setRootPage(App)  // ✓ MUST have this

// 2. Use Grafana UI components
import { Button, Alert, Container } from '@grafana/ui';  // ✓

// 3. Use theme variables
const theme = useTheme2();  // ✓
const bg = theme.colors.background.primary;  // ✓

// 4. Use Emotion for styling
import { css } from '@emotion/css';  // ✓
const styles = css`...${theme.colors}...`;  // ✓

// 5. Handle errors gracefully
<ErrorBoundary level="page">  // ✓
  <App />
</ErrorBoundary>

// 6. Show loading states
if (loading) return <LoadingPlaceholder />;  // ✓

// 7. Access props
export const App = (props: AppRootProps) => {...}  // ✓
```

---

## **Next Steps**

1. **Try the hard refresh first** → 90% chance this fixes it
   ```
   Ctrl+Shift+R
   ```

2. **If still broken**, run diagnostic:
   ```bash
   npm run build
   docker restart grafana
   sleep 3
   curl -s http://localhost:3000/api/plugins | grep sarika-reliability-studio-app
   ```

3. **Check browser console** (F12 → Console tab)
   - Copy any red errors
   - Check Network tab for module.js status

4. **If component fails**, use diagnostic component temporarily:
   ```tsx
   // In src/module.tsx
   import { AppDiagnostic } from './app/AppDiagnostic';
   .setRootPage(AppDiagnostic);
   ```

---

## **Reference Links**

📚 **Official Grafana Documentation:**
- [App Plugin Types & Usage](https://grafana.com/developers/plugin-tools/key-concepts/plugin-types-usage)
- [Best Practices](https://grafana.com/developers/plugin-tools/key-concepts/best-practices)
- [UI Components](https://developers.grafana.com/ui/latest/)
- [Theming Guide](https://github.com/grafana/grafana/blob/main/contribute/style-guides/themes.md)

📝 **Your Plugin Files:**
- [plugin.json](plugin.json) ← Plugin metadata
- [src/module.tsx](src/module.tsx) ← Plugin entry point
- [src/app/App.tsx](src/app/App.tsx) ← Root component
- [src/components/IncidentControlRoom.tsx](src/components/IncidentControlRoom.tsx) ← Main UI

---

## **Quick Checklist**

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console (F12) for errors
- [ ] Verify plugin appears in /plugins endpoint
- [ ] Check Docker mount: `docker exec grafana ls /var/lib/grafana/plugins/sarika-reliability-studio-app/`
- [ ] Rebuild and restart: `npm run build && docker restart grafana`
- [ ] Try diagnostic component if main UI fails
- [ ] Check backend health: `curl -s http://localhost:8080/api/incidents`

---

**👉 Start with a hard refresh - that usually solves it!**
