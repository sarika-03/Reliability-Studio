#!/bin/bash

echo "🔍 Reliability Studio - Quick Status Check"
echo "=========================================="
echo ""

echo "📊 Services Available:"
curl -s http://localhost:9000/api/services | jq -r '.[] | "  - \(.name) (\(.status))"'
echo ""

echo "🚨 Active Incidents:"
INCIDENT_COUNT=$(curl -s http://localhost:9000/api/incidents | jq '. | length')
echo "  Total: $INCIDENT_COUNT"
if [ "$INCIDENT_COUNT" -gt 0 ]; then
    curl -s http://localhost:9000/api/incidents | jq -r '.[] | "  - [\(.severity)] \(.title) - \(.service)"'
fi
echo ""

echo "📈 SLOs Status:"
curl -s http://localhost:9000/api/slos | jq -r '.[] | "  - \(.service_name)/\(.name): \(.current_percentage)% (\(.status))"'
echo ""

echo "💉 Injecting Test Load & Failures..."
echo ""
echo "  1. Generating load for payment-service..."
curl -s -X POST http://localhost:9000/api/test/load \
  -H 'Content-Type: application/json' \
  -d '{"service":"payment-service","requests":1000,"duration_seconds":60}' | jq .

echo ""
echo "  2. Injecting failures (30% error rate)..."
curl -s -X POST http://localhost:9000/api/test/fail \
  -H 'Content-Type: application/json' \
  -d '{"service":"payment-service","error_rate":0.3}' | jq .

echo ""
echo "⏳ Wait 30-60 seconds for incident detector to run..."
echo ""
echo "🌐 Open Grafana:"
echo "   http://localhost:3000"
echo ""
echo "   Default credentials: admin/admin"
echo "   Navigate to: Reliability Studio plugin"
echo "   Select service: payment-service"
echo ""
