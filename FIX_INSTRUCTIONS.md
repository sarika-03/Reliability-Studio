# 🔧 Fix Instructions - UI Working Karne Ke Liye

## Problem:
1. **CORS Error**: `x-request-started` header blocked ho raha hai
2. **WebSocket Error**: `ws://reliability-backend:9000` use ho raha hai instead of `ws://localhost:9000`

## ✅ Solutions Applied:
1. ✅ CORS middleware updated - ab `X-Request-Started` aur `X-Trace-ID` headers allow honge
2. ✅ WebSocket URL fixed - ab `ws://localhost:9000/api/realtime` use hoga
3. ✅ Frontend rebuild complete

## 🚀 Steps to Fix (Abhi Karein):

### Step 1: Backend Restart Karein
```bash
cd /home/sarika/Reliability-Studio
./restart-backend.sh
```

Ya manually:
```bash
cd /home/sarika/Reliability-Studio/backend
go build -o Reliability-Studio main.go
./Reliability-Studio
```

### Step 2: Browser Cache Clear Karein
1. **Chrome/Edge**: Press `Ctrl + Shift + Delete` → Select "Cached images and files" → Clear
2. **Ya Hard Refresh**: Press `Ctrl + Shift + R` (Windows/Linux) ya `Cmd + Shift + R` (Mac)
3. **Ya Developer Tools**: F12 → Right click on refresh button → "Empty Cache and Hard Reload"

### Step 3: Verify
1. Backend console mein check karein: `✅ Server started on port 9000`
2. Browser console mein check karein: CORS errors nahi aane chahiye
3. WebSocket connection: `ws://localhost:9000/api/realtime` dikhna chahiye

## 🔍 If Still Not Working:

### Check Backend is Running:
```bash
curl http://localhost:9000/health
```

### Check CORS Headers:
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: x-request-started" \
     -X OPTIONS \
     http://localhost:9000/api/incidents -v
```

Response mein ye dikhna chahiye:
```
Access-Control-Allow-Headers: Content-Type, Authorization, X-Trace-ID, X-Request-Started
```

### Check Frontend Build:
```bash
cd /home/sarika/Reliability-Studio
npm run build
```

## 📝 Notes:
- Backend restart **mandatory** hai - CORS changes apply karne ke liye
- Browser cache clear **mandatory** hai - new WebSocket URL ke liye
- Agar Grafana plugin use kar rahe ho, to Grafana bhi restart karein

