#!/bin/bash

# Install K9s - Terminal UI for Kubernetes
set -e

echo "🔥 Installing K9s - Terminal UI for Kubernetes..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if K9s is already installed
if command -v k9s &> /dev/null; then
    print_status "K9s is already installed!"
    echo "Version: $(k9s version --short)"
    echo ""
    echo -e "${BLUE}Starting K9s for soccer-training namespace...${NC}"
    k9s -n soccer-training
else
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Installing K9s via Homebrew..."
        brew install k9s
    else
        print_warning "For non-macOS systems, install K9s manually:"
        echo "Visit: https://k9scli.io/topics/install/"
        exit 0
    fi
    
    print_status "🎉 K9s installed successfully!"
    echo ""
    echo -e "${BLUE}K9s Features for Skaffold:${NC}"
    echo "• Interactive terminal UI"
    echo "• Real-time resource monitoring"
    echo "• Log streaming"
    echo "• Resource editing"
    echo "• Shell access to pods"
    echo "• Resource searching and filtering"
    echo ""
    print_status "Starting K9s..."
    k9s -n soccer-training
fi

echo ""
echo -e "${BLUE}K9s Quick Commands:${NC}"
echo "• :pod - View pods"
echo "• :svc - View services"
echo "• :deploy - View deployments"
echo "• :logs - View logs"
echo "• :describe - Describe resource"
echo "• :edit - Edit resource"
echo "• / - Search"
echo "• ? - Help"
echo "• :quit - Exit"