# Soccer Training Platform - Skaffold Setup

This guide explains how to use Skaffold for developing and deploying the Soccer Training Platform with Kubernetes-native development workflow.

## 🎯 **Why Skaffold?**

- **Hot Reload**: Instant code changes without rebuilds
- **Kubernetes Native**: Develops against real Kubernetes environment
- **CI/CD Ready**: Same tool for development and production
- **File Sync**: Ultra-fast file synchronization
- **Multi-Service**: Handles complex microservice architectures
- **Cloud Ready**: Works with any Kubernetes cluster

## 🛠️ **Prerequisites**

1. **Skaffold** (v2.0+):
   ```bash
   # macOS
   brew install skaffold
   
   # Linux
   curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
   sudo install skaffold /usr/local/bin/
   ```

2. **kubectl**:
   ```bash
   brew install kubectl
   ```

3. **Kind** (Kubernetes in Docker):
   ```bash
   brew install kind
   ```

4. **Docker Desktop** or **Podman**

5. **Node.js** (v18+) and **npm**

## 🚀 **Quick Start**

### **Option 1: Automated Development Setup**

```bash
# Start complete development environment
./scripts/skaffold-dev.sh
```

This will:
- Create Kind cluster if needed
- Build shared packages
- Deploy all services to Kubernetes
- Set up hot reloading
- Forward ports to localhost
- Watch for file changes

### **Option 2: Manual Skaffold Commands**

```bash
# 1. Create Kind cluster
kind create cluster --config infrastructure/k8s/kind-config.yaml

# 2. Build shared packages
cd packages/shared && npm install && npm run build && cd ../..

# 3. Start development
skaffold dev --profile=dev --port-forward
```

### **Option 3: Production Deployment**

```bash
# Deploy to production cluster
./scripts/skaffold-prod.sh
```

## 📋 **Available Commands**

| Command | Description |
|---------|-------------|
| `skaffold dev` | Start development with hot reload |
| `skaffold run` | Build and deploy once |
| `skaffold build` | Build all images |
| `skaffold deploy` | Deploy pre-built images |
| `skaffold delete` | Delete deployed resources |
| `skaffold test` | Run tests |
| `skaffold logs` | Stream logs |

## 🖥️ **Dashboard & Monitoring Options**

Since Skaffold doesn't have a built-in dashboard like Tilt, you can use these monitoring solutions:

### **Option 1: Kubernetes Dashboard (Web UI)**
```bash
# Setup (one-time)
./scripts/setup-k8s-dashboard.sh

# Open dashboard
./scripts/open-k8s-dashboard.sh
```
- **Access**: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
- **Features**: Full web UI, resource management, logs, metrics

### **Option 2: Lens - Kubernetes IDE (Desktop App)**
```bash
# Install Lens
./scripts/install-lens.sh
```
- **Features**: Beautiful desktop app, real-time monitoring, terminal access
- **Best for**: Visual monitoring and debugging

### **Option 3: K9s - Terminal UI**
```bash
# Install and run K9s
./scripts/install-k9s.sh
```
- **Features**: Terminal-based UI, fast navigation, interactive
- **Best for**: Terminal lovers and quick debugging

### **Option 4: Built-in CLI Monitoring**
```bash
# Interactive monitoring dashboard
./scripts/skaffold-monitor.sh
```
- **Features**: Menu-driven monitoring, logs streaming, resource inspection
- **Best for**: Script-based monitoring and automation

## 🎮 **Development Profiles**

### **dev** (Default Development)
```bash
skaffold dev --profile=dev
```
- Uses development Docker targets
- Enables file sync for hot reload
- Sets up port forwarding
- Uses Kind cluster namespace

### **prod** (Production)
```bash
skaffold run --profile=prod
```
- Uses production Docker targets
- Optimized builds
- Production namespace
- No file sync

### **test** (Testing)
```bash
skaffold test --profile=test
```
- Runs all test suites
- Validates builds
- Can be used in CI/CD

## 🔧 **Configuration Files**

| File | Purpose |
|------|---------|
| `skaffold.yaml` | Main Skaffold configuration |
| `packages/*/Dockerfile` | Multi-stage Docker builds |
| `infrastructure/k8s/skaffold/` | Kubernetes manifests |
| `infrastructure/k8s/kind-config.yaml` | Kind cluster configuration |

## 🌐 **Service Endpoints**

When running `skaffold dev`, services are available at:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:6000 | React application |
| API Gateway | http://localhost:6001 | Express.js backend |
| API Health | http://localhost:6001/health | Health check |
| PostgreSQL | localhost:6002 | Database (forwarded from K8s) |
| Redis | localhost:6003 | Cache (forwarded from K8s) |

## ⚡ **Hot Reload Features**

Skaffold provides instant hot reload for:

### **Frontend (React)**
- JavaScript/TypeScript files → File sync
- CSS/SCSS files → File sync
- Public assets → File sync
- Package.json changes → Image rebuild

### **API Gateway (Node.js)**
- Source files → File sync + nodemon restart
- Prisma schema → Image rebuild
- Package.json → Image rebuild

## 🐳 **Docker Multi-Stage Builds**

Our Dockerfiles use multi-stage builds:

```dockerfile
# Development stage (used by Skaffold dev)
FROM node:18-alpine AS development
# ... development setup with hot reload

# Production stage (used by Skaffold prod)
FROM nginx:alpine AS production
# ... optimized production build
```

## 🔄 **File Sync Configuration**

Skaffold syncs files without rebuilding containers:

```yaml
sync:
  manual:
  - src: "src/**/*"
    dest: /app/src
  - src: "package.json"
    dest: /app/package.json
```

## 📊 **Monitoring & Debugging**

### **View Logs**
```bash
# All services
skaffold logs

# Specific service
skaffold logs --since=1h -f frontend

# Kubernetes logs
kubectl logs -f deployment/frontend -n soccer-training

# Interactive monitoring
./scripts/skaffold-monitor.sh
```

### **Debug Pods**
```bash
# List pods
kubectl get pods -n soccer-training

# Exec into pod
kubectl exec -it <pod-name> -n soccer-training -- /bin/sh

# Port forward specific pod
kubectl port-forward pod/<pod-name> 8080:3000 -n soccer-training
```

### **Check Resource Status**
```bash
# All resources
kubectl get all -n soccer-training

# Detailed pod information
kubectl describe pod/<pod-name> -n soccer-training

# Events
kubectl get events -n soccer-training --sort-by=.metadata.creationTimestamp
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port conflicts**:
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :4000
   
   # Kill processes if needed
   kill -9 <PID>
   ```

2. **Kind cluster issues**:
   ```bash
   # Delete and recreate cluster
   kind delete cluster --name soccer-training-dev
   kind create cluster --config infrastructure/k8s/kind-config.yaml
   ```

3. **Image build failures**:
   ```bash
   # Clean build
   skaffold delete
   docker system prune -a
   skaffold dev --no-prune
   ```

4. **File sync not working**:
   ```bash
   # Check sync status
   skaffold dev --verbosity=debug
   
   # Force rebuild
   skaffold dev --force-rebuild
   ```

5. **Database connection issues**:
   ```bash
   # Check postgres pod
   kubectl logs deployment/postgres -n soccer-training
   
   # Test connection
   kubectl exec -it deployment/postgres -n soccer-training -- psql -U postgres -d soccer_training
   ```

### **Performance Optimization**

1. **Speed up builds**:
   ```bash
   # Use local Docker daemon
   eval $(minikube docker-env)  # If using minikube
   
   # Enable BuildKit
   export DOCKER_BUILDKIT=1
   ```

2. **Reduce file sync overhead**:
   ```yaml
   # In skaffold.yaml, exclude unnecessary files
   sync:
     manual:
     - src: "src/**/*"
       dest: /app/src
     ignore:
     - "**/*.test.js"
     - "**/node_modules"
   ```

## 🔐 **Security Best Practices**

1. **Use non-root containers**:
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nodejs -u 1001
   USER nodejs
   ```

2. **Secure secrets**:
   ```bash
   # Create secrets properly
   kubectl create secret generic api-secrets \
     --from-literal=jwt-secret=<your-secret> \
     -n soccer-training
   ```

3. **Resource limits**:
   ```yaml
   resources:
     requests:
       cpu: 100m
       memory: 128Mi
     limits:
       cpu: 500m
       memory: 512Mi
   ```

## 🚀 **CI/CD Integration**

Skaffold works great with CI/CD pipelines:

### **GitHub Actions Example**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Skaffold
      run: |
        curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
        sudo install skaffold /usr/local/bin/
    
    - name: Build and Test
      run: |
        skaffold build --profile=prod
        skaffold test --profile=test
    
    - name: Deploy
      run: skaffold deploy --profile=prod
```

## 📈 **Advanced Features**

### **Multi-Cluster Development**
```bash
# Switch contexts
kubectl config use-context production-cluster
skaffold run --profile=prod

kubectl config use-context staging-cluster  
skaffold run --profile=staging
```

### **Custom Build Scripts**
```yaml
build:
  artifacts:
  - image: soccer-training/frontend
    custom:
      buildCommand: ./scripts/custom-build.sh
      dependencies:
        paths: ["packages/frontend"]
```

### **Helm Integration**
```yaml
deploy:
  helm:
    releases:
    - name: soccer-training
      chartPath: ./helm-chart
      values:
        image.tag: latest
```

This Skaffold setup provides a production-ready, Kubernetes-native development experience with hot reload, automatic deployments, and seamless CI/CD integration!