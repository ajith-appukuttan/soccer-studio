#!/bin/bash

# Soccer Training Platform - Podman Stop Script
set -e

echo "🛑 Stopping Soccer Training Platform Podman services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    print_warning "podman-compose not found, trying to use 'podman compose' instead"
    COMPOSE_CMD="podman compose"
else
    COMPOSE_CMD="podman-compose"
fi

# Stop containers
print_status "Stopping containers..."
$COMPOSE_CMD -f infrastructure/podman/podman-compose-db.yml down

# Stop any remaining containers
print_status "Stopping any remaining soccer training containers..."
podman stop soccer-postgres-dev soccer-redis-dev 2>/dev/null || true
podman rm soccer-postgres-dev soccer-redis-dev 2>/dev/null || true

# Remove network (optional)
if [ "$1" == "--cleanup" ]; then
    print_status "Removing network and volumes..."
    podman network rm soccer-network 2>/dev/null || true
    podman volume rm podman_postgres_data podman_redis_data 2>/dev/null || true
fi

print_status "All services stopped!"

if [ "$1" != "--cleanup" ]; then
    echo ""
    echo "📝 Note: Data volumes are preserved."
    echo "    To clean up everything: ./scripts/stop-podman.sh --cleanup"
fi