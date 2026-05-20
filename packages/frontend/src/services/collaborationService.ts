import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

export interface CollaborationUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: Date;
}

export interface CollaborationEvents {
  // Project events
  'project_joined': (data: { 
    project: any; 
    collaborators: CollaborationUser[]; 
    roomId: string;
  }) => void;
  
  // User events
  'user_joined': (data: { user: CollaborationUser; socketId: string }) => void;
  'user_left': (data: { user: CollaborationUser; socketId: string }) => void;
  
  // Cursor events
  'cursor_moved': (data: { 
    userId: string; 
    socketId: string; 
    user: { firstName: string; lastName: string; color: string }; 
    position: { x: number; y: number } 
  }) => void;
  
  // Annotation events
  'annotation_added': (data: { annotation: any; author: any }) => void;
  'annotation_updated': (data: { annotation: any; updatedBy: any }) => void;
  'annotation_deleted': (data: { annotationId: string; deletedBy: any }) => void;
  
  // Comment events
  'comment_added': (data: { comment: any }) => void;
  
  // Video sync events
  'video_seek': (data: { timestamp: number; user: any }) => void;
  'video_play': (data: { timestamp: number; user: any }) => void;
  'video_pause': (data: { timestamp: number; user: any }) => void;
  
  // Selection events
  'selection_changed': (data: { 
    selectedAnnotations: string[]; 
    user: { id: string; firstName: string; lastName: string; color: string } 
  }) => void;
  
  // Error events
  'error': (data: { message: string }) => void;
}

class CollaborationService {
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private eventHandlers: Map<keyof CollaborationEvents, Function[]> = new Map();

  async connect(): Promise<void> {
    const authStore = useAuthStore.getState();
    
    if (!authStore.token || this.socket?.connected) {
      return;
    }

    this.socket = io(process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      auth: {
        token: authStore.token,
      },
      transports: ['websocket'],
      upgrade: false,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to collaboration server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from collaboration server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });

    // Set up all event listeners
    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentProjectId = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Forward all collaboration events to registered handlers
    const events: Array<keyof CollaborationEvents> = [
      'project_joined',
      'user_joined',
      'user_left',
      'cursor_moved',
      'annotation_added',
      'annotation_updated',
      'annotation_deleted',
      'comment_added',
      'video_seek',
      'video_play',
      'video_pause',
      'selection_changed',
      'error',
    ];

    events.forEach(event => {
      this.socket!.on(event, (data: any) => {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(handler => handler(data));
      });
    });
  }

  // Event subscription methods
  on<K extends keyof CollaborationEvents>(
    event: K,
    handler: CollaborationEvents[K]
  ): () => void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.eventHandlers.get(event) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.eventHandlers.set(event, currentHandlers);
      }
    };
  }

  off<K extends keyof CollaborationEvents>(
    event: K,
    handler: CollaborationEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(event, handlers);
    }
  }

  // Project collaboration methods
  async joinProject(projectId: string): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      await this.connect();
    }

    this.currentProjectId = projectId;
    this.socket?.emit('join_project', { projectId });
  }

  leaveProject(): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('leave_project', { projectId: this.currentProjectId });
      this.currentProjectId = null;
    }
  }

  // Cursor sharing
  moveCursor(position: { x: number; y: number }): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('cursor_moved', {
        projectId: this.currentProjectId,
        position,
      });
    }
  }

  // Annotation collaboration
  addAnnotation(annotation: any): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('annotation_added', {
        projectId: this.currentProjectId,
        annotation,
      });
    }
  }

  updateAnnotation(annotationId: string, annotation: any): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('annotation_updated', {
        projectId: this.currentProjectId,
        annotationId,
        annotation,
      });
    }
  }

  deleteAnnotation(annotationId: string): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('annotation_deleted', {
        projectId: this.currentProjectId,
        annotationId,
      });
    }
  }

  // Comment collaboration
  addComment(comment: any): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('comment_added', {
        projectId: this.currentProjectId,
        comment,
      });
    }
  }

  // Video synchronization
  seekVideo(timestamp: number): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('video_seek', {
        projectId: this.currentProjectId,
        timestamp,
      });
    }
  }

  playVideo(timestamp: number): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('video_play', {
        projectId: this.currentProjectId,
        timestamp,
      });
    }
  }

  pauseVideo(timestamp: number): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('video_pause', {
        projectId: this.currentProjectId,
        timestamp,
      });
    }
  }

  // Selection sharing
  changeSelection(selectedAnnotations: string[]): void {
    if (this.currentProjectId && this.socket) {
      this.socket.emit('selection_changed', {
        projectId: this.currentProjectId,
        selectedAnnotations,
      });
    }
  }

  // Connection status
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get currentProject(): string | null {
    return this.currentProjectId;
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();