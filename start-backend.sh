#!/bin/bash

# Kill any existing Go processes
pkill -f "go run main.go" || true
pkill -f "Reliability-Studio" || true

sleep 2

# Start the backend
cd /home/sarika/Reliability-Studio1/backend

echo "🔧 Building backend..."
go build -o Reliability-Studio main.go

if [ -f "Reliability-Studio" ]; then
  echo "✅ Build successful"
  echo ""
  echo "🚀 Starting backend on port 9000..."
  echo "⚠️  Press Ctrl+C to stop"
  echo ""
  ./Reliability-Studio
else
  echo "❌ Build failed"
  exit 1
fi
