# 🚀 Backend Start Instructions

## Problem Fixed:
- ✅ JWT_SECRET issue - now uses default for development
- ✅ CORS headers updated - includes X-Trace-ID and X-Request-Started
- ✅ WebSocket URL fixed - uses localhost:9000

## To Start Backend:

```bash
cd /home/sarika/Reliability-Studio/backend
go build -o Reliability-Studio main.go
./Reliability-Studio
```

Ya use the script:
```bash
cd /home/sarika/Reliability-Studio
./restart-backend.sh
```

## Verify CORS is Working:

After starting backend, test with:
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Headers: x-request-started,x-trace-id" \
     -X OPTIONS \
     http://localhost:9000/api/incidents -v
```

You should see in response:
```
Access-Control-Allow-Headers: Content-Type, Authorization, X-Trace-ID, X-Request-Started, x-trace-id, x-request-started
```

## Then:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh browser (Ctrl+Shift+R)
3. Check console - CORS errors should be gone!

