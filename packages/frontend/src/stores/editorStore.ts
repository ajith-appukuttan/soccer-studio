import { create } from 'zustand';
import type { 
  DrawingTool, 
  Annotation, 
  Comment, 
  Project, 
  Color,
  Vector2 
} from '@shared/types';
import { DEFAULT_COLORS } from '@shared/constants';

interface EditorState {
  // Project
  currentProject: Project | null;
  
  // Video playback
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  
  // Canvas and viewport
  canvasSize: { width: number; height: number };
  zoom: number;
  panOffset: Vector2;
  
  // Drawing tools
  selectedTool: DrawingTool;
  toolSettings: {
    strokeColor: Color;
    fillColor: Color;
    strokeWidth: number;
    fontSize: number;
    fontFamily: string;
  };
  
  // Annotations
  annotations: Annotation[];
  selectedAnnotations: string[];
  isDrawing: boolean;
  
  // Comments
  comments: Comment[];
  selectedComment: string | null;
  
  // Timeline
  timelineZoom: number;
  timelineOffset: number;
  
  // UI state
  selectedPanel: 'tools' | 'properties' | 'timeline' | 'comments';
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

interface EditorActions {
  // Project actions
  setCurrentProject: (project: Project | null) => void;
  updateProject: (updates: Partial<Project>) => void;
  
  // Playback actions
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Canvas actions
  setCanvasSize: (size: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Vector2) => void;
  resetView: () => void;
  
  // Tool actions
  setSelectedTool: (tool: DrawingTool) => void;
  updateToolSettings: (settings: Partial<EditorState['toolSettings']>) => void;
  
  // Annotation actions
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  addAnnotationFromCollaboration: (annotation: Annotation) => void;
  updateAnnotationFromCollaboration: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotationFromCollaboration: (id: string) => void;
  selectAnnotation: (id: string, multiSelect?: boolean) => void;
  clearAnnotationSelection: () => void;
  setIsDrawing: (isDrawing: boolean) => void;
  
  // Comment actions
  addComment: (comment: Comment) => void;
  updateComment: (id: string, updates: Partial<Comment>) => void;
  deleteComment: (id: string) => void;
  selectComment: (id: string | null) => void;
  
  // Timeline actions
  setTimelineZoom: (zoom: number) => void;
  setTimelineOffset: (offset: number) => void;
  
  // UI actions
  setSelectedPanel: (panel: EditorState['selectedPanel']) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
}

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  currentProject: null,
  
  // Video playback
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackSpeed: 1,
  volume: 1,
  isMuted: false,
  
  // Canvas and viewport
  canvasSize: { width: 1920, height: 1080 },
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  
  // Drawing tools
  selectedTool: 'select',
  toolSettings: {
    strokeColor: DEFAULT_COLORS.HOME_TEAM,
    fillColor: { ...DEFAULT_COLORS.HOME_TEAM, a: 0.3 },
    strokeWidth: 2,
    fontSize: 16,
    fontFamily: 'Arial',
  },
  
  // Annotations
  annotations: [],
  selectedAnnotations: [],
  isDrawing: false,
  
  // Comments
  comments: [],
  selectedComment: null,
  
  // Timeline
  timelineZoom: 1,
  timelineOffset: 0,
  
  // UI state
  selectedPanel: 'tools',
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,

  // Project actions
  setCurrentProject: (project) => {
    set({
      currentProject: project,
      annotations: project?.annotations || [],
      currentTime: 0,
    });
  },

  updateProject: (updates) => {
    const currentProject = get().currentProject;
    if (currentProject) {
      set({
        currentProject: { ...currentProject, ...updates },
      });
    }
  },

  // Playback actions
  setCurrentTime: (currentTime) => {
    set({ currentTime });
  },

  setDuration: (duration) => {
    set({ duration });
  },

  play: () => {
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  togglePlayback: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setPlaybackSpeed: (playbackSpeed) => {
    set({ playbackSpeed });
  },

  setVolume: (volume) => {
    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  // Canvas actions
  setCanvasSize: (canvasSize) => {
    set({ canvasSize });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  setPanOffset: (panOffset) => {
    set({ panOffset });
  },

  resetView: () => {
    set({
      zoom: 1,
      panOffset: { x: 0, y: 0 },
    });
  },

  // Tool actions
  setSelectedTool: (selectedTool) => {
    set({ 
      selectedTool,
      selectedAnnotations: [], // Clear selection when changing tools
    });
  },

  updateToolSettings: (settings) => {
    set((state) => ({
      toolSettings: { ...state.toolSettings, ...settings },
    }));
  },

  // Annotation actions
  addAnnotation: (annotation) => {
    set((state) => ({
      annotations: [...state.annotations, annotation],
    }));
  },

  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map((annotation) =>
        annotation.id === id ? { ...annotation, ...updates } : annotation
      ),
    }));
    
    // Broadcast update to collaborators
    const state = get();
    const updatedAnnotation = state.annotations.find(a => a.id === id);
    if (updatedAnnotation) {
      // Import dynamically to avoid circular dependency
      import('@/services/collaborationService').then(({ collaborationService }) => {
        collaborationService.updateAnnotation(id, updatedAnnotation);
      });
    }
  },

  deleteAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((annotation) => annotation.id !== id),
      selectedAnnotations: state.selectedAnnotations.filter((selectedId) => selectedId !== id),
    }));
    
    // Broadcast deletion to collaborators
    import('@/services/collaborationService').then(({ collaborationService }) => {
      collaborationService.deleteAnnotation(id);
    });
  },

  // Collaboration-specific annotation methods (don't trigger broadcasts)
  addAnnotationFromCollaboration: (annotation) => {
    set((state) => ({
      annotations: [...state.annotations, annotation],
    }));
  },

  updateAnnotationFromCollaboration: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map((annotation) =>
        annotation.id === id ? { ...annotation, ...updates } : annotation
      ),
    }));
  },

  deleteAnnotationFromCollaboration: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((annotation) => annotation.id !== id),
      selectedAnnotations: state.selectedAnnotations.filter((selectedId) => selectedId !== id),
    }));
  },

  selectAnnotation: (id, multiSelect = false) => {
    set((state) => ({
      selectedAnnotations: multiSelect
        ? state.selectedAnnotations.includes(id)
          ? state.selectedAnnotations.filter((selectedId) => selectedId !== id)
          : [...state.selectedAnnotations, id]
        : [id],
    }));
  },

  clearAnnotationSelection: () => {
    set({ selectedAnnotations: [] });
  },

  setIsDrawing: (isDrawing) => {
    set({ isDrawing });
  },

  // Comment actions
  addComment: (comment) => {
    set((state) => ({
      comments: [...state.comments, comment],
    }));
  },

  updateComment: (id, updates) => {
    set((state) => ({
      comments: state.comments.map((comment) =>
        comment.id === id ? { ...comment, ...updates } : comment
      ),
    }));
  },

  deleteComment: (id) => {
    set((state) => ({
      comments: state.comments.filter((comment) => comment.id !== id),
      selectedComment: state.selectedComment === id ? null : state.selectedComment,
    }));
  },

  selectComment: (selectedComment) => {
    set({ selectedComment });
  },

  // Timeline actions
  setTimelineZoom: (timelineZoom) => {
    set({ timelineZoom: Math.max(0.1, Math.min(10, timelineZoom)) });
  },

  setTimelineOffset: (timelineOffset) => {
    set({ timelineOffset });
  },

  // UI actions
  setSelectedPanel: (selectedPanel) => {
    set({ selectedPanel });
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  setGridSize: (gridSize) => {
    set({ gridSize: Math.max(5, Math.min(100, gridSize)) });
  },
}));