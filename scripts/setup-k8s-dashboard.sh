#!/bin/bash

# Setup Kubernetes Dashboard for Soccer Training Platform
set -e

echo "🚀 Setting up Kubernetes Dashboard for Skaffold monitoring..."

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

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

# Install Kubernetes Dashboard
print_status "Installing Kubernetes Dashboard..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Create admin user for dashboard access
print_status "Creating admin user..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF

# Wait for dashboard to be ready
print_status "Waiting for dashboard to be ready..."
kubectl wait --for=condition=ready pod -l k8s-app=kubernetes-dashboard -n kubernetes-dashboard --timeout=300s

# Get admin token
print_status "Getting admin token..."
echo ""
echo -e "${BLUE}Dashboard Access Token:${NC}"
kubectl -n kubernetes-dashboard create token admin-user

echo ""
print_status "🎉 Kubernetes Dashboard is ready!"
echo ""
echo -e "${BLUE}To access the dashboard:${NC}"
echo "1. Run: kubectl proxy"
echo "2. Visit: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
echo "3. Use the token printed above to login"
echo ""
echo -e "${YELLOW}Quick access script:${NC}"
echo "./scripts/open-k8s-dashboard.sh"