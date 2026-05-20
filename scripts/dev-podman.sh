#!/bin/bash

# Soccer Training Platform - Complete Development Setup with Podman
set -e

echo "🚀 Starting Soccer Training Platform Development Environment with Podman..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    print_status "Shutting down services..."
    pkill -f "npm run dev" || true
    ./scripts/stop-podman.sh
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Tilt is available and user wants to use it
if command -v tilt &> /dev/null && [ "$1" != "--manual" ]; then
    print_status "Starting with Tilt (using Podman backend)..."
    tilt up -f Tiltfile-podman
else
    print_status "Starting manually with Podman..."
    
    # Start Podman services
    ./scripts/start-podman.sh
    
    # Build shared packages
    print_status "Building shared packages..."
    cd packages/shared
    npm install --cache /tmp/npm-cache
    npm run build
    cd ../..
    
    # Start API Gateway in background
    print_status "Starting API Gateway..."
    cd packages/api-gateway
    npm install --cache /tmp/npm-cache &
    API_PID=$!
    
    # Start Frontend in background
    print_status "Starting Frontend..."
    cd ../frontend
    npm install --cache /tmp/npm-cache &
    FRONTEND_PID=$!
    
    # Wait for installations to complete
    wait $API_PID
    wait $FRONTEND_PID
    
    print_status "Starting development servers..."
    
    # Start API Gateway
    cd ../api-gateway
    NODE_ENV=development \
    PORT=6001 \
    JWT_SECRET=dev-secret-key \
    FRONTEND_URL=http://localhost:6000 \
    DATABASE_URL=postgresql://postgres:password123@localhost:6002/soccer_training \
    REDIS_URL=redis://localhost:6003 \
    npm run dev &
    API_SERVER_PID=$!
    
    # Start Frontend
    cd ../frontend
    VITE_API_URL=http://localhost:6001/api npm run dev &
    FRONTEND_SERVER_PID=$!
    
    cd ../..
    
    echo ""
    print_status "🎉 All services started!"
    echo ""
echo -e "${BLUE}Available Services:${NC}"
echo "  🌐 Frontend: http://localhost:6000"
echo "  🔌 API Gateway: http://localhost:6001"
echo "  🏥 API Health: http://localhost:6001/health"
echo "  📊 PostgreSQL: localhost:6002"
echo "  🔄 Redis: localhost:6003"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
    
    # Wait for any of the background processes to exit
    wait $API_SERVER_PID $FRONTEND_SERVER_PID
fi