# Soccer Studio - Video Analysis System Specification

## Overview
Complete soccer video analysis platform enabling coaches and analysts to upload videos and create professional tactical annotations with comprehensive drawing tools and analysis features.

## 1. Video Processing & Upload

### Upload Workflow
1. **File Selection**: Drag-and-drop or file picker (supports MP4, MOV, AVI, WebM)
2. **Client-Side Processing**: Extract metadata, generate thumbnails, create blob URLs
3. **Direct Editor Flow**: Immediately redirect to editor with loaded video
4. **Background Processing**: Generate timeline thumbnails while user starts analysis

### Technical Implementation
- **File Handling**: FileReader API for client-side processing
- **Video Metadata**: Extract duration, dimensions, framerate using video element
- **Thumbnail Generation**: Canvas API to capture frames at intervals
- **Storage**: IndexedDB for video blobs and project data
- **Memory Management**: Efficient blob URL cleanup and resource management

### File Support
- **Formats**: MP4 (H.264), MOV, AVI, WebM
- **Size Limits**: Up to 2GB (with storage quota warnings)
- **Quality**: Maintain original quality, optional compression for storage

## 2. Professional Drawing & Annotation Tools

### Core Drawing Tools
- **Freehand Drawing**: Smooth pen tool with pressure sensitivity simulation
- **Geometric Shapes**: Circles, rectangles, arrows, lines with snap-to-grid
- **Formation Tools**: 
  - Pre-defined formations (4-4-2, 4-3-3, 3-5-2, etc.)
  - Custom formation builder
  - Player position markers with numbers/colors
- **Movement Annotations**:
  - Player runs with curved/straight paths
  - Ball movement tracking
  - Passing sequences with timing
  - Off-ball movement patterns

### Advanced Analysis Features
- **Tactical Zones**: Predefined field zones (final third, midfield, etc.)
- **Heat Maps**: Player position frequency visualization
- **Timeline Annotations**: Frame-specific notes and observations
- **Comparison Mode**: Side-by-side analysis of different plays
- **Measurement Tools**: Distance and angle measurements on field

### Tool Properties
- **Color Palette**: Team colors, custom colors, transparency controls
- **Line Styles**: Solid, dashed, dotted with thickness options
- **Text Annotations**: Player names, tactical notes, timestamps
- **Layering**: Multiple annotation layers with show/hide toggles

## 3. Video Player Integration

### Playback Controls
- **Frame-Perfect Scrubbing**: Navigate by individual frames
- **Variable Speed**: 0.25x to 2x playback speed
- **Loop Regions**: Set in/out points for repeated analysis
- **Keyboard Shortcuts**: Space (play/pause), arrows (frame step), J/K/L (rewind/pause/forward)

### Timeline Features
- **Thumbnail Strip**: Visual timeline with frame previews
- **Annotation Markers**: Visual indicators showing when annotations appear
- **Zoom Control**: Detailed view of specific time ranges
- **Chapter Markers**: Key moments in the analysis

### Sync & Timing
- **Real-time Sync**: Annotations appear/disappear based on video time
- **Duration Control**: Set how long annotations remain visible
- **Fade Transitions**: Smooth in/out animations for annotations
- **Time Stamps**: Precise timing display for all annotations

## 4. Data Persistence & Project Management

### Project Structure
```json
{
  "project": {
    "id": "uuid",
    "title": "Match Analysis - Team A vs Team B",
    "description": "First half tactical breakdown",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastModified": "2024-01-15T12:45:00Z",
    "video": {
      "name": "match_footage.mp4",
      "duration": 2700,
      "dimensions": { "width": 1920, "height": 1080 },
      "blobRef": "video-blob-uuid"
    },
    "annotations": [
      {
        "id": "annotation-uuid",
        "type": "formation",
        "startTime": 120.5,
        "endTime": 180.2,
        "layer": "tactical",
        "data": {
          "formation": "4-4-2",
          "players": [
            { "id": 1, "x": 0.1, "y": 0.5, "number": "9" }
          ],
          "color": "#FF0000",
          "opacity": 0.8
        }
      }
    ],
    "settings": {
      "fieldType": "full",
      "defaultColors": ["#FF0000", "#0000FF"],
      "autoSave": true
    }
  }
}
```

### Storage Management
- **IndexedDB Database**: "SoccerStudio" with projects, videos, and thumbnails stores
- **Auto-Save**: Every 30 seconds while editing
- **Manual Save**: Ctrl+S with visual confirmation
- **Storage Monitoring**: Track usage against browser quotas
- **Cleanup**: Automatic removal of unused thumbnails and temporary files

### Import/Export
- **Project Export**: JSON format with embedded video references
- **Frame Export**: High-quality images of annotated frames
- **Report Generation**: Summary documents with key annotations
- **Backup/Restore**: Full project backup with import capabilities

## 5. User Experience & Interface Design

### Layout Structure
- **Header**: Soccer Studio branding, project title, save status
- **Left Sidebar**: Tool palette with organized sections
- **Main Canvas**: Video player with overlay for annotations
- **Right Sidebar**: Layer management, annotation properties
- **Bottom Timeline**: Scrubbing controls, thumbnail strip, annotation markers

### Interaction Patterns
- **Tool Selection**: Click tool from palette, cursor changes to indicate active tool
- **Drawing**: Click-drag for shapes, single-click for markers
- **Selection**: Click annotations to select, drag handles to resize/move
- **Context Menus**: Right-click for tool-specific options
- **Keyboard Shortcuts**: Full keyboard navigation support

### Visual Design
- **Color Scheme**: Consistent with existing Soccer Studio branding
- **Typography**: Mantine's default font stack for readability
- **Animations**: Smooth transitions using cubic-bezier(0.16, 1, 0.3, 1)
- **Responsive**: Desktop-optimized but functional on tablets
- **Accessibility**: Keyboard navigation, screen reader support, color contrast compliance

### Performance Optimizations
- **Canvas Rendering**: Only redraw when necessary
- **Video Optimization**: Efficient blob URL handling
- **Memory Management**: Cleanup unused resources
- **Loading States**: Progress indicators for all operations
- **Error Recovery**: Graceful handling of failures with clear messaging

## 6. Technical Architecture

### Frontend Stack
- **React 18**: Component architecture with hooks
- **TypeScript**: Full type safety throughout
- **Mantine v7**: UI component library
- **Konva.js**: 2D canvas rendering for annotations
- **Zustand**: State management for video and annotation data

### Key Components
```
EditorPage/
├── VideoPlayer/
│   ├── VideoCanvas
│   ├── PlaybackControls
│   └── TimelineControls
├── ToolPalette/
│   ├── DrawingTools
│   ├── FormationTools
│   └── AnnotationTools
├── AnnotationLayer/
│   ├── KonvaStage
│   ├── AnnotationRenderer
│   └── InteractionHandler
└── PropertiesPanel/
    ├── LayerManager
    ├── ToolSettings
    └── AnnotationList
```

### State Management
- **Video Store**: Playback state, current time, loaded video
- **Annotation Store**: All annotations, active tool, selection state
- **Project Store**: Project metadata, save state, settings
- **UI Store**: Sidebar visibility, modal states, loading states

### Data Flow
1. Video upload → Process metadata → Store in IndexedDB → Load in player
2. Tool selection → Update cursor → Enable drawing mode
3. Draw annotation → Create data object → Store in annotation array → Render on canvas
4. Playback → Update current time → Show/hide time-based annotations
5. Save → Serialize all data → Store in IndexedDB → Update save status

## 7. Implementation Roadmap

### Phase 1: Core Video Functionality
- [ ] Video upload with client-side processing
- [ ] Basic video player with frame-perfect controls
- [ ] IndexedDB storage setup
- [ ] Project creation and management

### Phase 2: Basic Drawing Tools
- [ ] Konva.js canvas integration
- [ ] Freehand drawing tool
- [ ] Basic shapes (lines, rectangles, circles)
- [ ] Color and stroke width controls

### Phase 3: Soccer-Specific Tools
- [ ] Formation templates and player markers
- [ ] Movement path annotations
- [ ] Tactical zone overlays
- [ ] Timeline-based annotation system

### Phase 4: Advanced Features
- [ ] Multi-layer annotation system
- [ ] Export and sharing capabilities
- [ ] Advanced analysis tools
- [ ] Performance optimizations

## Success Criteria
- [ ] Upload 100MB+ videos smoothly
- [ ] Frame-perfect annotation timing
- [ ] Responsive drawing with no lag
- [ ] Data persistence across sessions
- [ ] Professional-quality analysis output
- [ ] Intuitive user experience for coaches

This specification provides the complete roadmap for building a professional-grade soccer video analysis platform within the existing Soccer Studio application.