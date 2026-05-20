# Soccer Studio

A professional soccer video analysis platform with frame-by-frame navigation, drawing annotations, voice commentary, and export functionality.

## 🚀 Live Demo

**Try it now:** [soccer-studio.vercel.app](https://soccer-studio.vercel.app)

*Note: Demo deployment in progress. See [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting instructions.*

## 🏆 Features

### Core Functionality
- ✅ **Frame-Perfect Navigation**: Use ← → arrow keys for frame navigation, Shift + ← → for 10-second jumps
- ✅ **Professional Drawing Tools**: Pen, line, rectangle, circle, arrow, text, and player markers
- ✅ **Voice Commentary**: Record voice annotations synchronized with video timeline
- ✅ **Interactive Timeline**: 1x-100x zoom with bookmarks and annotation markers
- ✅ **Smart Export System**: Export videos with annotations and mixed audio commentary
- ✅ **Client-Side Storage**: All data stored in browser IndexedDB (no backend required)
- ✅ **Project Management**: Save/load projects with auto-save functionality

### Technical Highlights  
- ✅ **Zero Backend Dependencies**: Fully client-side application
- ✅ **Canvas-Based Annotations**: High-performance drawing with Konva.js
- ✅ **Audio Recording**: MediaRecorder API for voice commentary
- ✅ **Video Processing**: Browser-native video manipulation
- ✅ **Responsive Design**: Works on desktop and tablet devices

## 🏗 Architecture

```
┌─────────────────────────────────────┐
│           Soccer Studio             │
│        (Client-Side React App)      │
├─────────────────────────────────────┤
│  🎥 Video Player    📝 Annotations  │
│  🎙️  Voice Recorder  ⏱️  Timeline    │
│  🎨 Drawing Tools   📁 Projects     │
└─────────────────────────────────────┘
           │              │
    ┌──────────────┐ ┌──────────────┐
    │   Browser    │ │  IndexedDB   │
    │   Web APIs   │ │   Storage    │
    └──────────────┘ └──────────────┘
```

**No Backend Required** - Everything runs in your browser!

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Mantine v7 components and styling
- **Canvas**: Konva.js for high-performance drawing annotations
- **State Management**: Zustand for lightweight state management  
- **Audio**: MediaRecorder API for voice commentary recording
- **Storage**: IndexedDB for client-side project persistence
- **Video**: HTML5 Video API for playback and frame navigation
- **Export**: Canvas API + MediaRecorder for video rendering

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/ajith-appukuttan/soccer-studio.git
cd soccer-studio

# Install dependencies
npm install
cd packages/frontend && npm install

# Start development server
npm run dev

# Open browser to http://localhost:8000
```

### Production Build

```bash
# Build for production
cd packages/frontend
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Upload a video**: Click "Upload Video" and select an MP4/MOV file
2. **Navigate frames**: Use ← → arrow keys for frame-by-frame, Shift + ← → for 10-second jumps
3. **Draw annotations**: Select tools from the toolbar and draw on the video
4. **Record voice commentary**: Use the microphone button to record synchronized audio
5. **Add bookmarks**: Click on the timeline to mark important moments
6. **Export video**: Click export when you have annotations or voice commentary

### Deployment

Ready to deploy to Vercel, Netlify, or any static hosting platform.
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

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
soccer-studio/
├── packages/frontend/         # React application (main app)
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── editor/      # Video editor components
│   │   │   └── layout/      # Layout components
│   │   ├── services/        # Browser APIs and utilities
│   │   ├── stores/          # Zustand state management
│   │   └── types/           # TypeScript definitions
│   ├── dist/               # Built application
│   └── public/             # Static assets
├── docs/                   # Documentation
├── scripts/               # Development scripts
└── vercel.json            # Deployment configuration
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