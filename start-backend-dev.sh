#!/bin/bash

# Development script to start backend with default JWT_SECRET

echo "🚀 Starting Reliability Studio Backend (Development Mode)..."

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
echo "✅ Starting backend server on port 9000..."
echo "📝 Note: For production, set JWT_SECRET environment variable"
echo ""
./Reliability-Studio

