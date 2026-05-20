#!/bin/bash

# Skaffold Monitoring Dashboard (CLI-based)
set -e

echo "📊 Skaffold Monitoring Dashboard for Soccer Training Platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to show menu
show_menu() {
    echo ""
    print_header "Skaffold Monitoring Options"
    echo "1. 📊 View All Resources"
    echo "2. 🔍 Stream Logs"
    echo "3. 📈 Resource Status"
    echo "4. 🚀 Pod Details"
    echo "5. 🌐 Service Endpoints"
    echo "6. ⚡ Events"
    echo "7. 🔧 Debug Pod"
    echo "8. 📋 Skaffold Status"
    echo "9. 🔄 Port Forward Status"
    echo "0. ❌ Exit"
    echo ""
}

# Function to show all resources
show_resources() {
    print_header "All Resources in soccer-training Namespace"
    kubectl get all -n soccer-training
}

# Function to stream logs
stream_logs() {
    print_header "Available Deployments"
    kubectl get deployments -n soccer-training
    echo ""
    echo "Enter deployment name (or 'back' to return):"
    read deployment
    if [ "$deployment" != "back" ]; then
        print_status "Streaming logs for $deployment..."
        kubectl logs -f deployment/$deployment -n soccer-training
    fi
}

# Function to show resource status
show_status() {
    print_header "Resource Status"
    echo -e "${CYAN}Pods:${NC}"
    kubectl get pods -n soccer-training -o wide
    echo ""
    echo -e "${CYAN}Services:${NC}"
    kubectl get services -n soccer-training
    echo ""
    echo -e "${CYAN}Deployments:${NC}"
    kubectl get deployments -n soccer-training
}

# Function to show pod details
show_pod_details() {
    print_header "Pod Details"
    kubectl get pods -n soccer-training
    echo ""
    echo "Enter pod name (or 'back' to return):"
    read pod
    if [ "$pod" != "back" ]; then
        kubectl describe pod $pod -n soccer-training
    fi
}

# Function to show service endpoints
show_endpoints() {
    print_header "Service Endpoints"
    echo -e "${CYAN}Port Forwards (if running):${NC}"
    ps aux | grep "kubectl.*port-forward" | grep -v grep || echo "No port forwards running"
    echo ""
    echo -e "${CYAN}Services:${NC}"
    kubectl get services -n soccer-training -o wide
    echo ""
    echo -e "${CYAN}Ingresses:${NC}"
    kubectl get ingress -n soccer-training 2>/dev/null || echo "No ingresses found"
}

# Function to show events
show_events() {
    print_header "Recent Events"
    kubectl get events -n soccer-training --sort-by=.metadata.creationTimestamp
}

# Function to debug pod
debug_pod() {
    print_header "Debug Pod"
    kubectl get pods -n soccer-training
    echo ""
    echo "Enter pod name (or 'back' to return):"
    read pod
    if [ "$pod" != "back" ]; then
        print_status "Opening shell in $pod..."
        kubectl exec -it $pod -n soccer-training -- /bin/sh
    fi
}

# Function to show Skaffold status
show_skaffold_status() {
    print_header "Skaffold Status"
    if pgrep -f "skaffold dev" > /dev/null; then
        echo -e "${GREEN}✅ Skaffold is running${NC}"
        echo ""
        echo "Skaffold processes:"
        ps aux | grep skaffold | grep -v grep
    else
        echo -e "${RED}❌ Skaffold is not running${NC}"
        echo ""
        echo "To start Skaffold:"
        echo "./scripts/skaffold-dev.sh"
    fi
}

# Function to show port forward status
show_port_forwards() {
    print_header "Port Forward Status"
    echo -e "${CYAN}Active Port Forwards:${NC}"
    ps aux | grep "kubectl.*port-forward" | grep -v grep || echo "No port forwards active"
    echo ""
    echo -e "${CYAN}Expected Services:${NC}"
    echo "Frontend: http://localhost:6000"
    echo "API Gateway: http://localhost:6001"
    echo "PostgreSQL: localhost:6002"
    echo "Redis: localhost:6003"
}

# Main loop
while true; do
    show_menu
    echo -n "Choose option [0-9]: "
    read choice
    
    case $choice in
        1) show_resources ;;
        2) stream_logs ;;
        3) show_status ;;
        4) show_pod_details ;;
        5) show_endpoints ;;
        6) show_events ;;
        7) debug_pod ;;
        8) show_skaffold_status ;;
        9) show_port_forwards ;;
        0) 
            print_status "Goodbye!"
            exit 0
            ;;
        *)
            print_warning "Invalid option. Please choose 0-9."
            ;;
    esac
    
    echo ""
    echo "Press Enter to continue..."
    read
done