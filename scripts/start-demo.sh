#!/bin/bash

echo "🚀 Starting Swush Demo Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Build and start chopsticks
echo "🔄 Building and starting chopsticks..."
docker compose -f docker-compose.dev.yml up -d chopsticks

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Demo environment started successfully!"
    echo ""
    echo "🌐 Chopsticks endpoints:"
    echo "   - Asset Hub: ws://localhost:3421"
    echo "   - Hydration:  ws://localhost:3422"
    echo ""
    echo "🖥️  Start the web app with: pnpm dev"
    echo ""
    echo "📊 Check status: docker compose -f docker-compose.dev.yml logs chopsticks"
    echo "🔄 Restart: docker compose -f docker-compose.dev.yml restart chopsticks"
    echo "🛑 Stop: docker compose -f docker-compose.dev.yml down chopsticks"
else
    echo ""
    echo "❌ Failed to start demo environment"
    echo "📋 Check logs: docker compose -f docker-compose.dev.yml logs chopsticks"
    exit 1
fi 