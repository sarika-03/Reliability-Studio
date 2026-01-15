#!/bin/bash

# Stop any existing backend process on port 9000
echo "🛑 Stopping existing backend..."
pkill -f Reliability-Studio 2>/dev/null || echo "No Reliability-Studio process found"
lsof -ti:9000 | xargs kill -9 2>/dev/null || echo "No process on port 9000"

# Wait a moment
sleep 2

# Set environment variables for local development against Docker services
export PROMETHEUS_URL="http://localhost:9091"
export LOKI_URL="http://localhost:3100"
export ENV="development"

# Set default JWT_SECRET for development if not already set
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET="dev-secret-key-change-in-production-min-32-chars"
    echo "⚠️  Using default JWT_SECRET for development"
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Build the backend
echo "🔨 Building backend..."
go build -o Reliability-Studio main.go

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Start the backend server
echo "🚀 Starting backend server on port 9000..."
echo "📝 Note: For production, set JWT_SECRET environment variable"
echo ""
./Reliability-Studio

