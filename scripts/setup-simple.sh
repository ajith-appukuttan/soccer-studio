#!/bin/bash

# Soccer Training Platform Setup Script (Simplified)
set -e

echo "🏈 Setting up Soccer Training Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if npm cache has permission issues
if [ -d "$HOME/.npm" ]; then
    if [ ! -w "$HOME/.npm" ]; then
        print_warning "npm cache permission issue detected"
        print_status "Trying to use alternative npm cache location..."
        export npm_config_cache="$PWD/.npm-cache"
        mkdir -p .npm-cache
    fi
fi

# Create environment file
print_status "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file from template"
else
    print_warning ".env file already exists"
fi

# Use the simple package.json
print_status "Using simplified package.json..."
if [ -f package-simple.json ]; then
    cp package-simple.json package.json
    print_success "Switched to simplified package.json"
fi

# Install dependencies step by step
print_status "Installing dependencies (this may take a few minutes)..."

# Install root dependencies
print_status "Installing root dependencies..."
npm install --cache="$PWD/.npm-cache" || {
    print_warning "Root install failed, continuing with packages..."
}

# Install shared package dependencies
print_status "Installing shared package dependencies..."
cd packages/shared
npm install --cache="$PWD/../../.npm-cache" || {
    print_error "Failed to install shared dependencies"
    exit 1
}

# Build shared package
print_status "Building shared package..."
npm run build || {
    print_error "Failed to build shared package"
    exit 1
}

cd ../..
print_success "Shared package ready"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd packages/frontend
npm install --cache="$PWD/../../.npm-cache" || {
    print_error "Failed to install frontend dependencies"
    exit 1
}
cd ../..
print_success "Frontend dependencies installed"

# Install API gateway dependencies
print_status "Installing API gateway dependencies..."
cd packages/api-gateway
npm install --cache="$PWD/../../.npm-cache" || {
    print_error "Failed to install API gateway dependencies"
    exit 1
}
cd ../..
print_success "API gateway dependencies installed"

# Create necessary directories
print_status "Creating directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p .npm-cache
print_success "Directories created"

print_success "Setup complete!"
echo
echo "🚀 To start the development environment:"
echo
echo "Option 1 - Frontend only:"
echo "  cd packages/frontend && npm run dev"
echo "  Then open: http://localhost:3000"
echo
echo "Option 2 - Full stack (manual):"
echo "  Terminal 1: cd packages/api-gateway && npm run dev"
echo "  Terminal 2: cd packages/frontend && npm run dev"
echo
echo "Option 3 - Docker (recommended):"
echo "  npm run docker:up"
echo "  Then open: http://localhost:3000"
echo
echo "🛑 To stop Docker:"
echo "  npm run docker:down"
echo