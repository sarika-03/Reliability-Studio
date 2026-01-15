#!/bin/bash

echo "🧪 Testing CORS configuration..."

# Test preflight request
echo ""
echo "Testing OPTIONS request with x-request-started header:"
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: x-request-started,x-trace-id" \
     -X OPTIONS \
     http://localhost:9000/api/incidents -v 2>&1 | grep -i "access-control"

echo ""
echo "✅ If you see 'X-Request-Started' and 'X-Trace-ID' in Access-Control-Allow-Headers, CORS is working!"

