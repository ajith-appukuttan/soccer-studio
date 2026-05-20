#!/bin/bash

# Soccer Training Platform - Podman Startup Script
set -e

echo "🚀 Starting Soccer Training Platform with Podman..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    print_error "Podman is not installed. Please install Podman first."
    exit 1
fi

# Initialize and start Podman machine on macOS if needed
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! podman machine list | grep -q "Currently running"; then
        print_status "Starting Podman machine..."
        podman machine start || {
            print_status "Initializing Podman machine..."
            podman machine init
            podman machine start
        }
    fi
fi

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    print_warning "podman-compose not found, trying to use 'podman compose' instead"
    COMPOSE_CMD="podman compose"
else
    COMPOSE_CMD="podman-compose"
fi

# Stop any running containers first
print_status "Stopping any existing containers..."
$COMPOSE_CMD -f infrastructure/podman/podman-compose-db.yml down || true

# Create network if it doesn't exist
print_status "Creating Podman network..."
podman network create soccer-network || true

# Start the database services
print_status "Starting database services with Podman..."
$COMPOSE_CMD -f infrastructure/podman/podman-compose-db.yml up -d

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if podman exec soccer-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
        print_status "PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Wait for Redis to be ready
print_status "Waiting for Redis to be ready..."
for i in {1..30}; do
    if podman exec soccer-redis-dev redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Redis failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Build shared packages
print_status "Building shared packages..."
cd packages/shared
npm install --cache /tmp/npm-cache
npm run build
cd ../..

print_status "Running database migrations..."
cd packages/api-gateway
npm install --cache /tmp/npm-cache
# Run migrations
npx prisma migrate deploy || true
npx prisma generate || true
cd ../..

echo ""
echo "🎉 Services started successfully!"
echo ""
echo -e "${BLUE}Available Services:${NC}"
echo "  📊 PostgreSQL: localhost:6002"
echo "  🔄 Redis: localhost:6003"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start the API gateway: cd packages/api-gateway && npm run dev"
echo "  2. Start the frontend: cd packages/frontend && npm run dev"
echo ""
echo -e "${BLUE}Or use Tilt for development:${NC}"
echo "  tilt up"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "  ./scripts/stop-podman.sh"
echo ""