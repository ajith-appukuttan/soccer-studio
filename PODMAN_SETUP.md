# Soccer Training Platform - Podman Setup

This guide explains how to run the Soccer Training Platform using Podman instead of Docker.

## Prerequisites

1. **Podman** installed on your system:
   ```bash
   # macOS (using Homebrew)
   brew install podman
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install podman
   
   # Linux (RHEL/CentOS/Fedora)
   sudo dnf install podman
   ```

2. **Node.js** (v18 or later) and **npm**

3. **Optional: Tilt** for development workflow:
   ```bash
   # macOS
   brew install tilt-dev/tap/tilt
   
   # Linux
   curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
   ```

## Quick Start

### Option 1: Using the Development Script (Recommended)

```bash
# Start everything with Podman
./scripts/dev-podman.sh
```

This will:
- Start PostgreSQL and Redis in Podman containers
- Build the shared packages
- Start the API Gateway on port 4000
- Start the Frontend on port 3000
- Set up all necessary environment variables

### Option 2: Using Tilt with Podman

```bash
# Start with Tilt (using Podman backend)
tilt up -f Tiltfile-podman
```

### Option 3: Manual Step-by-Step

```bash
# 1. Start only the database services
./scripts/start-podman.sh

# 2. In separate terminals, start the applications:

# Terminal 1 - API Gateway
cd packages/api-gateway
npm install
npm run dev

# Terminal 2 - Frontend  
cd packages/frontend
npm install
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `./scripts/start-podman.sh` | Start only database services (PostgreSQL + Redis) |
| `./scripts/stop-podman.sh` | Stop all Podman services |
| `./scripts/stop-podman.sh --cleanup` | Stop services and remove volumes |
| `./scripts/dev-podman.sh` | Start complete development environment |
| `./scripts/dev-podman.sh --manual` | Force manual mode (skip Tilt) |

## Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:6000 | React application |
| API Gateway | http://localhost:6001 | Express.js backend |
| API Health | http://localhost:6001/health | Health endpoint |
| PostgreSQL | localhost:6002 | Database server |
| Redis | localhost:6003 | Cache server |

## Database Configuration

- **Host**: localhost
- **Port**: 6002
- **Database**: soccer_training
- **Username**: postgres
- **Password**: password123
- **Connection URL**: `postgresql://postgres:password123@localhost:6002/soccer_training`

## Redis Configuration

- **Host**: localhost
- **Port**: 6003
- **URL**: `redis://localhost:6003`

## Troubleshooting

### Podman Issues

1. **Port conflicts**: If ports 6002 or 6003 are in use:
   ```bash
   # Check what's using the ports
   lsof -i :6002
   lsof -i :6003
   
   # Stop conflicting services or modify ports in podman-compose-db.yml
   ```

2. **Permission issues**:
   ```bash
   # On some systems, you may need to configure user namespaces
   echo 'user.max_user_namespaces=28633' | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Network issues**:
   ```bash
   # Reset Podman network
   ./scripts/stop-podman.sh --cleanup
   podman network prune
   ./scripts/start-podman.sh
   ```

### Application Issues

1. **Database connection errors**: 
   - Wait for PostgreSQL to be fully ready (the start script includes health checks)
   - Verify the container is running: `podman ps`

2. **Node modules issues**:
   ```bash
   # Clean install
   rm -rf packages/*/node_modules packages/*/package-lock.json
   npm run clean-install  # If available, or manually install in each package
   ```

3. **Build failures**:
   ```bash
   # Rebuild shared packages
   cd packages/shared && npm run build
   ```

## Podman vs Docker Differences

- Podman runs rootless by default (more secure)
- No daemon required (lighter resource usage)
- Compatible with Docker Compose files (via podman-compose)
- Native systemd integration on Linux
- Better security model with user namespaces

## Production Deployment

For production deployment with Podman, consider:

1. Using Podman systemd services
2. Setting up proper secrets management
3. Configuring persistent volumes
4. Setting up Podman quadlet for container management
5. Using Podman pods for multi-container applications

## Advanced Configuration

### Custom Network Configuration

Edit `infrastructure/podman/podman-compose-db.yml` to modify network settings:

```yaml
networks:
  soccer-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Volume Management

```bash
# List volumes
podman volume ls

# Inspect volume
podman volume inspect podman_postgres_data

# Backup volume
podman run --rm -v podman_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volume
podman run --rm -v podman_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

### Performance Tuning

For better performance with Podman:

1. **Use tmpfs for temporary data**:
   ```yaml
   tmpfs:
     - /tmp:noexec,nosuid,size=100m
   ```

2. **Optimize resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 1G
       reservations:
         cpus: '0.5'
         memory: 512M
   ```

## Migration from Docker

To migrate from Docker to Podman:

1. Stop Docker services: `docker-compose down`
2. Export data if needed: `docker run --rm -v docker_volume:/data -v $(pwd):/backup alpine tar czf /backup/data.tar.gz -C /data .`
3. Start Podman services: `./scripts/start-podman.sh`
4. Import data if needed: `podman run --rm -v podman_volume:/data -v $(pwd):/backup alpine tar xzf /backup/data.tar.gz -C /data`

The application should work identically with Podman as it did with Docker.