#!/bin/bash

# Quick script to open Kubernetes Dashboard
set -e

echo "🌐 Opening Kubernetes Dashboard..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    print_status "Stopping proxy..."
    pkill -f "kubectl proxy" || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start kubectl proxy in background
print_status "Starting kubectl proxy..."
kubectl proxy &
PROXY_PID=$!

# Wait a moment for proxy to start
sleep 2

# Get the token
TOKEN=$(kubectl -n kubernetes-dashboard create token admin-user 2>/dev/null)

echo ""
echo -e "${BLUE}Kubernetes Dashboard Access:${NC}"
echo "URL: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
echo ""
echo -e "${BLUE}Token (copy this):${NC}"
echo "$TOKEN"
echo ""
echo -e "${BLUE}Instructions:${NC}"
echo "1. Copy the token above"
echo "2. Open the URL in your browser"
echo "3. Select 'Token' authentication"
echo "4. Paste the token and sign in"
echo ""
echo "Press Ctrl+C to stop the proxy"
echo ""

# Try to open the dashboard in browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Opening dashboard in browser..."
    open "http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
fi

# Wait for user to stop
wait $PROXY_PID