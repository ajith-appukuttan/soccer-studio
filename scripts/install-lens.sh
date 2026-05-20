#!/bin/bash

# Install Lens - The Kubernetes IDE
set -e

echo "🔍 Installing Lens - The Kubernetes IDE..."

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

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Check if Lens is already installed
    if [ -d "/Applications/Lens.app" ]; then
        print_status "Lens is already installed!"
        open -a Lens
    else
        print_status "Installing Lens via Homebrew..."
        brew install --cask lens
        
        print_status "🎉 Lens installed successfully!"
        echo ""
        echo -e "${BLUE}To use Lens with your Soccer Training Platform:${NC}"
        echo "1. Open Lens from Applications"
        echo "2. It will auto-detect your Kind cluster"
        echo "3. Browse to the 'soccer-training' namespace"
        echo "4. Monitor your Skaffold deployments in real-time"
        echo ""
        print_status "Opening Lens..."
        open -a Lens
    fi
else
    print_warning "This script is for macOS. For other platforms:"
    echo "Visit: https://k8slens.dev/"
    echo "Download and install Lens manually"
fi

echo ""
echo -e "${BLUE}Lens Features for Skaffold:${NC}"
echo "• Real-time resource monitoring"
echo "• Pod logs streaming"
echo "• Resource editing"
echo "• Terminal access to containers"
echo "• Network policy visualization"
echo "• Helm chart management"