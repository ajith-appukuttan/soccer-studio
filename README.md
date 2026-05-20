# Soccer Studio

An enterprise-grade SaaS solution for soccer match analysis and training video editing with AI-powered insights.

## 🏆 Features

### Phase 1: Core Platform
- ✅ **Video Editor**: Professional-grade video editing with timeline, annotations, and drawing tools
- ✅ **Real-time Collaboration**: Multiple users can edit simultaneously with live cursor sharing
- ✅ **Drawing Tools**: Circle, line, arrow, text, player markers, and formation diagrams
- ✅ **Timeline Management**: Keyframe-based annotation system with zoom and scrubbing
- ✅ **Comment System**: Timestamped comments with threading and replies
- ✅ **Theme System**: Dark/light modes with custom branding support
- ✅ **Multi-tenant SaaS**: Organization-based isolation and subscription management

### Phase 2: AI Analysis (Coming Soon)
- 🔄 **Jersey Detection**: OpenCV.js-powered player identification
- 🔄 **Tactical Analysis**: Claude Vision API for formation and movement analysis
- 🔄 **Auto-highlights**: Intelligent moment detection and summarization
- 🔄 **Performance Metrics**: Player tracking and statistical analysis

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Auth Service   │
│   React + TS    │◄──►│   Express.js    │◄──►│   Express.js    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       │                 │
            ┌─────────────────┐    ┌─────────────────┐
            │ Video Service   │    │  User Service   │
            │  + FFmpeg       │    │   + Prisma      │
            └─────────────────┘    └─────────────────┘
                       │                 │
            ┌─────────────────┐    ┌─────────────────┐
            │  MinIO Storage  │    │   PostgreSQL    │
            │  (S3-compat)    │    │   Database      │
            └─────────────────┘    └─────────────────┘
```

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Mantine UI, Zustand, Konva.js, Video.js
- **Backend**: Express.js, TypeScript, Prisma, PostgreSQL, Redis
- **Storage**: MinIO (S3-compatible), Video streaming
- **DevOps**: Docker, Kubernetes, Kind, Tilt, Prometheus, Grafana
- **AI/ML**: Claude API, OpenCV.js, FFmpeg

## 🚀 Quick Start

### Container Runtime Options

Choose your preferred container runtime:

#### Option A: Skaffold + Kubernetes (Recommended for Production-Ready Development)
- **Skaffold** - Kubernetes-native development with hot reload
- **Kind** - Kubernetes in Docker for local development
- See [SKAFFOLD_SETUP.md](./SKAFFOLD_SETUP.md) for detailed instructions

Quick start with Skaffold:
```bash
# Install prerequisites
brew install skaffold kubectl kind

# Start development environment
./scripts/skaffold-dev.sh

# Optional: Install monitoring dashboard
./scripts/install-lens.sh        # Desktop app (recommended)
./scripts/install-k9s.sh         # Terminal UI
./scripts/setup-k8s-dashboard.sh # Web dashboard
```

#### Option B: Podman (Recommended for Security)
- **Podman** - Rootless, daemonless container runtime
- See [PODMAN_SETUP.md](./PODMAN_SETUP.md) for detailed instructions

Quick start with Podman:
```bash
# Install Podman (if not already installed)
brew install podman  # macOS

# Start development environment
./scripts/dev-podman.sh
```

#### Option C: Docker + Tilt (Legacy)
- **Docker Desktop**
- **Kind** (Kubernetes in Docker)
- **Tilt**

### Prerequisites (Docker Setup)

- Node.js 18+
- Docker Desktop
- Kind (Kubernetes in Docker)
- Tilt

### Automated Setup (Docker)

```bash
# Clone the repository
git clone <repository-url>
cd soccer-training-react

# Run the setup script
./scripts/setup.sh
```

The setup script will:
1. Check prerequisites
2. Install dependencies
3. Create Kind cluster
4. Start development environment with Tilt

### Manual Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create Kind cluster**:
   ```bash
   kind create cluster --name soccer-training
   ```

4. **Start development environment**:
   ```bash
   tilt up
   ```

### Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Tilt Dashboard**: http://localhost:10350
- **Grafana**: http://localhost:3001 (admin/admin123)

## 📁 Project Structure

```
soccer-training-platform/
├── packages/
│   ├── frontend/          # React application
│   ├── api-gateway/       # API gateway service
│   ├── auth-service/      # Authentication microservice
│   ├── video-service/     # Video processing service
│   ├── user-service/      # User management service
│   └── shared/           # Shared types and utilities
├── infrastructure/
│   ├── docker/           # Docker configurations
│   ├── k8s/             # Kubernetes manifests
│   └── monitoring/      # Monitoring setup
├── scripts/             # Development scripts
└── docs/               # Documentation
```

## 🎮 Usage

### Creating a Project

1. Upload a soccer match video
2. Create a new project
3. Use drawing tools to annotate plays
4. Add comments for tactical analysis
5. Share with team members
6. Export annotated video

### Drawing Tools

- **Select Tool (V)**: Select and move annotations
- **Circle Tool (C)**: Highlight areas or players
- **Line Tool (L)**: Draw tactical lines
- **Arrow Tool (A)**: Show movement directions
- **Text Tool (T)**: Add explanatory text
- **Player Tool (P)**: Mark individual players
- **Formation Tool (F)**: Create formation diagrams

### Collaboration

- Real-time editing with multiple users
- Live cursor sharing
- Comment threads on specific moments
- Role-based permissions (Admin, Coach, Analyst, Viewer)

## 🔧 Development

### Running Tests

```bash
npm run test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

## 📊 Monitoring

The platform includes comprehensive monitoring:

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Application logs**: Structured logging with different levels
- **Health checks**: Service health monitoring

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Organization-level data isolation
- File upload validation
- Rate limiting
- Security headers (Helmet.js)

## 🌍 Deployment

### Development
- Kind + Tilt for local development
- Hot reloading for all services
- Integrated debugging

### Production
- Kubernetes manifests included
- Docker multi-stage builds
- Health checks and monitoring
- Horizontal pod autoscaling ready

## 📝 API Documentation

### Authentication
```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Get current user
GET /api/auth/me
Authorization: Bearer <token>
```

### Videos
```bash
# Upload video
POST /api/videos/upload
Content-Type: multipart/form-data

# Get videos
GET /api/videos?page=1&limit=12&search=champions

# Stream video
GET /api/videos/:id/stream
```

### Projects
```bash
# Create project
POST /api/projects
{
  "title": "Match Analysis",
  "videoId": "video-uuid",
  "description": "Tactical analysis"
}

# Update annotations
PUT /api/projects/:id
{
  "annotations": [...]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all code
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📋 Roadmap

### Phase 1: Foundation ✅
- [x] Core video editor
- [x] Drawing and annotation tools
- [x] Real-time collaboration
- [x] User authentication
- [x] Multi-tenant architecture

### Phase 2: AI Integration 🔄
- [ ] Claude Vision API integration
- [ ] Jersey detection with OpenCV.js
- [ ] Automated tactical analysis
- [ ] Player tracking

### Phase 3: Advanced Features 📋
- [ ] Video analysis automation
- [ ] Advanced statistics
- [ ] Mobile app
- [ ] Integration APIs
- [ ] Advanced export options

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mantine](https://mantine.dev) - UI component library
- [Konva.js](https://konvajs.org) - Canvas library for annotations
- [Video.js](https://videojs.com) - Video player
- [Prisma](https://prisma.io) - Database toolkit
- [Tilt](https://tilt.dev) - Development environment

## 📞 Support

For support, please:
1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/your-org/soccer-training-platform/issues)
3. Create a new issue if needed

---

Made with ⚽️ for the soccer community