# 🔧 Grafana App Plugin UI Debugging Guide

## STEP 1: Answer These 4 Diagnostic Questions

### Question 1: WHERE is the UI problem?
```
[ ] A) Completely blank/white page
    └─ Plugin navigates but shows nothing

[ ] B) Sidebar missing
    └─ Plugin doesn't appear in Grafana sidebar at all

[ ] C) Navigation works but content empty
    └─ Can click plugin, see blank main area

[ ] D) UI appears but styling broken
    └─ Components visible but layout/colors wrong

[ ] E) Partial rendering
    └─ Some components show, others don't

[ ] F) Works locally, broken in production
    └─ Dev (npm run dev) OK, but Grafana instance fails
```

**ANSWER: Which letter (A-F)?**

---

### Question 2: WHEN did it break?
```
[ ] A) Never worked
    └─ Plugin was never displaying correctly from start

[ ] B) Worked before, recently broke
    └─ What changed? (Grafana update / code change / new dependency?)

[ ] C) Works locally only
    └─ npm run dev works, but deployed Grafana fails

[ ] D) Intermittent
    └─ Sometimes works, sometimes doesn't (cache? timing issue?)
```

**ANSWER: Which letter (A-D)? And if B, what changed?**

---

### Question 3: Browser Console & Network
**INSTRUCTIONS:**
1. Open Grafana in browser
2. Navigate to your app plugin
3. Press **F12** (Developer Tools)
4. Go to **Console** tab
5. Go to **Network** tab
6. **ANSWER THESE:**

```
Q: Are there any RED ERROR messages in Console?
   [ ] Yes  [ ] No
   If YES, copy & paste them:
   
   [PASTE ERROR MESSAGES HERE]


Q: Can you find "module.js" in Network tab?
   [ ] Yes - Shows success (green checkmark)
   [ ] Yes - Shows error (red/warning)
   [ ] No - File not loading
   
   What's the HTTP status code? [___]


Q: Any CORS errors or failed requests?
   [ ] Yes  [ ] No
   If YES, which URLs failed?
   
   [PASTE FAILED URLS HERE]
```

**ANSWER: Paste your console & network findings**

---

### Question 4: Plugin Loading Status
**INSTRUCTIONS:**
1. Open Grafana
2. Click hamburger menu (≡) → Administration
3. Go to **Plugins**
4. Search for "Reliability Studio"

```
[ ] A) Shows in list with green checkmark (installed & enabled)
    └─ Shows in sidebar too?  [ ] Yes  [ ] No

[ ] B) Shows with warning/error icon
    └─ Copy the error message:
       [PASTE ERROR HERE]

[ ] C) Not in list at all
    └─ Check /plugins directory exists and dist/module.js built?
```

**ANSWER: Which scenario (A-C)?**

---

## STEP 2: Build Verification Commands

Once you answer the questions above, run these commands and share output:

```bash
# 1. Clean build
npm run clean
npm run build

# Expected: "dist/module.js" created successfully
# If ERROR, share the error output

# 2. Check dist folder exists
ls -la dist/

# Expected: Should show module.js, plugin.json
# If missing, build failed

# 3. Check if dist/module.js is valid ES module
head -20 dist/module.js

# Expected: Should see ES module syntax, not errors

# 4. TypeScript check
npm run typecheck

# Expected: No errors reported
# If errors, share them
```

**ANSWER: Run these and share output**

---

## STEP 3: Provide Your Plugin Configuration

**plugin.json contents:**
```json
[PASTE YOUR plugin.json HERE]
```

**src/module.tsx contents:**
```tsx
[PASTE YOUR module.tsx HERE]
```

**src/app/App.tsx contents:**
```tsx
[PASTE YOUR App.tsx HERE]
```

---

## TROUBLESHOOTING CHECKLIST (While You're Gathering Info)

### ✅ Quick Fixes to Try Now

**Fix #1: Ensure Root Element Has Height**
```tsx
// In App.tsx, make sure main div has height:
<div className="page-container" style={{ 
  width: '100%', 
  height: '100%',  // ← CRITICAL!
  display: 'flex',  // ← Add this
  flexDirection: 'column'
}}>
```

**Fix #2: Rebuild After Any Change**
```bash
npm run clean && npm run build
# Then reload Grafana in browser (Ctrl+Shift+R for hard refresh)
```

**Fix #3: Clear Browser Cache**
- Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
- Clear cache and cookies
- Reload Grafana

**Fix #4: Check plugin.json Has Correct Path**
```json
{
  "id": "sarika-reliability-studio-app",
  "type": "app",
  "includes": [
    {
      "type": "page",
      "path": "/a/sarika-reliability-studio-app"
    }
  ]
}
```

**Fix #5: Verify IncidentControlRoom Renders**
```tsx
// Temporarily simplify App.tsx to test:
export const App = (props: AppRootProps) => {
  return (
    <div style={{ width: '100%', height: '100%', background: 'red' }}>
      <h1>Test - If you see RED, plugin is loading!</h1>
    </div>
  );
};
// Rebuild and check. If you see RED page, rendering works.
// If not, plugin isn't loading at all.
```

---

## NEXT STEPS

**After you answer the 4 questions and run the build commands:**

I will provide:
1. ✅ **Exact code fixes** for your specific issue
2. ✅ **Deployment verification** steps
3. ✅ **Advanced debugging** for complex cases
4. ✅ **Performance optimization** tips

**Please provide:**
- Answers to 4 questions (A-D format)
- Build command output (errors if any)
- Console/Network tab screenshots or paste
- Current plugin.json, module.tsx, App.tsx contents
