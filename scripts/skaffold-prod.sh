#!/bin/bash

# Soccer Training Platform - Skaffold Production Deployment Script
set -e

echo "🚀 Deploying Soccer Training Platform to Production with Skaffold..."

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

# Check if we're in the right environment
if [ "$NODE_ENV" != "production" ]; then
    print_warning "NODE_ENV is not set to production"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build shared packages
print_status "Building shared packages..."
cd packages/shared
npm install --cache /tmp/npm-cache
npm run build
cd ../..

# Run tests before deployment
print_status "Running tests..."
skaffold test --profile=test || {
    print_error "Tests failed. Aborting deployment."
    exit 1
}

# Build and tag images for production
print_status "Building production images..."
skaffold build --profile=prod --tag latest

# Deploy to production
print_status "Deploying to production..."
skaffold deploy --profile=prod

print_status "🎉 Deployment completed successfully!"
echo ""
echo -e "${BLUE}Production services:${NC}"
echo "  🌐 Frontend: Check your ingress configuration"
echo "  🔌 API Gateway: Check your ingress configuration"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  - Verify deployment: kubectl get pods -n soccer-training-prod"
echo "  - Check logs: skaffold logs --profile=prod"
echo "  - Monitor health: kubectl get services -n soccer-training-prod"