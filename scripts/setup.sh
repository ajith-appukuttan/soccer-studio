#!/bin/bash

# Soccer Training Platform Setup Script
set -e

echo "🏈 Setting up Soccer Training Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Check prerequisites
print_status "Checking prerequisites..."

MISSING_DEPS=()

if ! check_command "node"; then
    MISSING_DEPS+=("Node.js (v18+)")
fi

if ! check_command "npm"; then
    MISSING_DEPS+=("npm")
fi

if ! check_command "docker"; then
    MISSING_DEPS+=("Docker")
fi

if ! check_command "kind"; then
    MISSING_DEPS+=("Kind")
fi

if ! check_command "tilt"; then
    MISSING_DEPS+=("Tilt")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    print_error "Missing dependencies:"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  - $dep"
    done
    echo
    echo "Please install the missing dependencies and run this script again."
    echo
    echo "Installation guides:"
    echo "  Node.js: https://nodejs.org/"
    echo "  Docker: https://docs.docker.com/get-docker/"
    echo "  Kind: https://kind.sigs.k8s.io/docs/user/quick-start/"
    echo "  Tilt: https://tilt.dev/get-started"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION or higher"
    exit 1
fi

print_success "All prerequisites are met!"

# Create environment file
print_status "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file from template"
    print_warning "Please review and update .env file with your specific configuration"
else
    print_warning ".env file already exists, skipping"
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Build shared package
print_status "Building shared package..."
cd packages/shared
npm run build
cd ../..
print_success "Shared package built"

# Create Kind cluster
print_status "Setting up Kind cluster..."
if kind get clusters | grep -q "soccer-training"; then
    print_warning "Kind cluster 'soccer-training' already exists"
else
    kind create cluster --name soccer-training
    print_success "Kind cluster created"
fi

# Set kubectl context
kubectl config use-context kind-soccer-training
print_success "Kubectl context set to kind-soccer-training"

# Create necessary directories
print_status "Creating directories..."
mkdir -p uploads
mkdir -p logs
print_success "Directories created"

# Start development environment
print_status "Starting development environment with Tilt..."
echo
echo "This will open Tilt in your browser and start all services."
echo "You can also access Tilt at: http://localhost:10350"
echo
echo "Services will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  API: http://localhost:4000"
echo "  API Health: http://localhost:4000/health"
echo
echo "Press Ctrl+C to stop the development environment when you're done."
echo

# Ask user if they want to start Tilt now
read -p "Start Tilt development environment now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    tilt up
else
    print_success "Setup complete!"
    echo
    echo "To start the development environment later, run:"
    echo "  tilt up"
    echo
    echo "To stop everything, run:"
    echo "  tilt down"
    echo
    echo "To delete the Kind cluster:"
    echo "  kind delete cluster --name soccer-training"
fi