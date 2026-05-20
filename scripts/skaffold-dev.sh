#!/bin/bash

# Soccer Training Platform - Skaffold Development Script
set -e

echo "🚀 Starting Soccer Training Platform with Skaffold..."

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

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Skaffold is installed
if ! command -v skaffold &> /dev/null; then
    print_error "Skaffold is not installed. Please install it first:"
    echo "  brew install skaffold"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install it first:"
    echo "  brew install kubectl"
    exit 1
fi

# Check if Kind is installed and cluster is running
if ! command -v kind &> /dev/null; then
    print_error "Kind is not installed. Please install it first:"
    echo "  brew install kind"
    exit 1
fi

# Check if Kind cluster exists
if ! kind get clusters | grep -q "kind"; then
    print_status "Creating Kind cluster..."
    kind create cluster --config infrastructure/k8s/kind-config.yaml || {
        print_warning "Using default Kind cluster configuration..."
        kind create cluster
    }
else
    print_status "Kind cluster already exists"
fi

# Set kubectl context
kubectl cluster-info --context kind-kind > /dev/null 2>&1 || {
    print_error "Cannot connect to Kind cluster"
    exit 1
}

# Build shared packages
print_status "Building shared packages..."
cd packages/shared
npm install --cache /tmp/npm-cache
npm run build
cd ../..

# Function to cleanup on exit
cleanup() {
    echo ""
    print_status "Shutting down Skaffold..."
    # Skaffold will cleanup automatically when interrupted
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start development with Skaffold
print_status "Starting development environment with Skaffold..."
print_status "This will:"
print_status "  - Build and deploy all services to Kind cluster"
print_status "  - Set up hot reloading for frontend and API"
print_status "  - Forward ports to localhost"
print_status "  - Watch for file changes"

echo ""
print_status "🎉 Starting Skaffold development mode..."
print_status "Press Ctrl+C to stop"
echo ""
echo -e "${BLUE}Services will be available at:${NC}"
echo "  🌐 Frontend: http://localhost:6000"
echo "  🔌 API Gateway: http://localhost:6001"
echo "  🏥 API Health: http://localhost:6001/health"
echo "  📊 PostgreSQL: localhost:6002"
echo "  🔄 Redis: localhost:6003"
echo ""

# Start Skaffold in development mode
skaffold dev --profile=dev --port-forward --cleanup=true