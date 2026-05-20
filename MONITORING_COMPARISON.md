# Skaffold Monitoring Solutions Comparison

## 🔍 **Dashboard Options Overview**

Unlike Tilt which has a built-in web dashboard, Skaffold relies on Kubernetes-native monitoring tools. Here's a comprehensive comparison:

## 📊 **Feature Comparison**

| Feature | Tilt Dashboard | Kubernetes Dashboard | Lens | K9s | CLI Scripts |
|---------|---------------|---------------------|------|-----|-------------|
| **Setup Complexity** | None | Medium | Easy | Easy | None |
| **Real-time Updates** | ✅ | ✅ | ✅ | ✅ | Manual |
| **Resource Monitoring** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Log Streaming** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Port Forwarding** | ✅ | ❌ | ✅ | ❌ | Manual |
| **File Sync Status** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Build Status** | ✅ | ❌ | ❌ | ❌ | Manual |
| **Terminal Access** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Resource Editing** | ❌ | ✅ | ✅ | ✅ | Manual |
| **Metrics & Graphs** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Multi-cluster** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Offline Access** | ❌ | ❌ | ✅ | ✅ | ✅ |

## 🎯 **Recommended Usage**

### **For Development (Choose One)**

#### **🏆 Lens (Recommended for Most Users)**
```bash
./scripts/install-lens.sh
```
**Pros:**
- Beautiful, intuitive interface
- Best-in-class user experience
- Real-time monitoring
- Terminal integration
- Helm chart management

**Cons:**
- Desktop app requirement
- Higher resource usage

**Best for:** Visual learners, comprehensive monitoring

---

#### **⚡ K9s (Recommended for Terminal Users)**
```bash
./scripts/install-k9s.sh
```
**Pros:**
- Lightning-fast terminal UI
- Keyboard-driven navigation
- Low resource usage
- Very responsive

**Cons:**
- Terminal-only interface
- Learning curve for shortcuts

**Best for:** Terminal enthusiasts, quick debugging

---

#### **🌐 Kubernetes Dashboard (Team Sharing)**
```bash
./scripts/setup-k8s-dashboard.sh
./scripts/open-k8s-dashboard.sh
```
**Pros:**
- Web-based, shareable URLs
- Official Kubernetes tool
- Comprehensive feature set
- Team accessibility

**Cons:**
- Complex setup
- Token-based authentication
- Less polished UI

**Best for:** Teams, official environments

---

#### **📋 CLI Scripts (Automation)**
```bash
./scripts/skaffold-monitor.sh
```
**Pros:**
- No additional tools required
- Scriptable and automatable
- Customizable

**Cons:**
- Manual refresh required
- Limited interactivity

**Best for:** CI/CD, scripting, minimalists

## 🚀 **Quick Setup Guide**

### **1. Install Your Preferred Tool**

```bash
# Option A: Lens (Desktop App)
./scripts/install-lens.sh

# Option B: K9s (Terminal UI)  
./scripts/install-k9s.sh

# Option C: Kubernetes Dashboard (Web)
./scripts/setup-k8s-dashboard.sh

# Option D: CLI Monitoring (Built-in)
./scripts/skaffold-monitor.sh
```

### **2. Start Skaffold Development**

```bash
./scripts/skaffold-dev.sh
```

### **3. Monitor Your Application**

Once Skaffold is running, open your chosen monitoring tool:

```bash
# Lens
open -a Lens  # Will auto-detect cluster

# K9s
k9s -n soccer-training

# Kubernetes Dashboard
./scripts/open-k8s-dashboard.sh

# CLI Monitor
./scripts/skaffold-monitor.sh
```

## 🎨 **Interface Screenshots**

### **Lens Interface**
- Modern, VS Code-like interface
- Sidebar navigation with cluster/namespace tree
- Main content area with tabs for different resources
- Integrated terminal at bottom
- Real-time metrics and graphs

### **K9s Interface**
- Terminal-based with color coding
- Top navigation bar with context info
- Main content area showing resource lists
- Bottom command bar with shortcuts
- Real-time updates with animations

### **Kubernetes Dashboard**
- Traditional web dashboard layout
- Left sidebar with resource categories
- Main content area with tables and details
- Top navigation with namespace selector
- Charts and metrics integration

## 🔧 **Advanced Monitoring Setup**

### **Add Prometheus + Grafana (Optional)**

For production-like monitoring:

```bash
# Install monitoring stack
kubectl create namespace monitoring

# Add Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# Port forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Access at http://localhost:3000 (admin/prom-operator)
```

### **Add Jaeger for Tracing (Optional)**

```bash
# Install Jaeger
kubectl create namespace jaeger-system
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.51.0/jaeger-operator.yaml -n jaeger-system

# Deploy Jaeger instance
kubectl apply -f - <<EOF
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger-all-in-one
  namespace: soccer-training
spec:
  strategy: allInOne
EOF
```

## 🎯 **Best Practices**

1. **Start Simple**: Begin with built-in CLI monitoring
2. **Pick One Primary**: Don't run multiple dashboards simultaneously
3. **Learn Shortcuts**: Each tool has keyboard shortcuts for efficiency
4. **Use Namespaces**: Always monitor the correct namespace (`soccer-training`)
5. **Monitor Resources**: Keep an eye on CPU/memory usage
6. **Stream Logs**: Use real-time log streaming for debugging

## 🚨 **Troubleshooting**

### **Dashboard Won't Load**
```bash
# Check if cluster is running
kubectl cluster-info

# Check if pods are running
kubectl get pods -n soccer-training

# Restart port forwarding
pkill kubectl && ./scripts/open-k8s-dashboard.sh
```

### **No Resources Showing**
```bash
# Make sure you're in the right namespace
kubectl config set-context --current --namespace=soccer-training

# Check if Skaffold deployed anything
skaffold status
```

### **Performance Issues**
```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n soccer-training

# Check cluster status
kubectl get events -n soccer-training --sort-by=.metadata.creationTimestamp
```

## 📈 **Summary**

While Skaffold doesn't have a built-in dashboard, the Kubernetes ecosystem provides excellent monitoring solutions:

- **For beginners**: Start with Lens
- **For power users**: Use K9s
- **For teams**: Set up Kubernetes Dashboard
- **For automation**: Use CLI scripts

Each tool provides comprehensive monitoring capabilities that often exceed what Tilt's dashboard offers, especially for production scenarios.