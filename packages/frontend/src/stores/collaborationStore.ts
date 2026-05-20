import { create } from 'zustand';
import { collaborationService, type CollaborationUser } from '@/services/collaborationService';

interface CollaborationState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Project collaboration
  currentProjectId: string | null;
  collaborators: Map<string, CollaborationUser>;
  
  // Cursor tracking
  cursors: Map<string, { 
    userId: string; 
    user: { firstName: string; lastName: string; color: string }; 
    position: { x: number; y: number };
    lastMoved: number;
  }>;
  
  // Real-time selections
  remoteSelections: Map<string, {
    userId: string;
    user: { id: string; firstName: string; lastName: string; color: string };
    selectedAnnotations: string[];
  }>;
  
  // Activity feed
  activities: Array<{
    id: string;
    type: 'user_joined' | 'user_left' | 'annotation_added' | 'annotation_updated' | 'annotation_deleted' | 'comment_added';
    user: { firstName: string; lastName: string };
    timestamp: Date;
    message: string;
  }>;
}

interface CollaborationActions {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  setConnectionState: (isConnected: boolean, error?: string | null) => void;
  
  // Project management
  joinProject: (projectId: string) => Promise<void>;
  leaveProject: () => void;
  
  // Collaborator management
  addCollaborator: (socketId: string, user: CollaborationUser) => void;
  removeCollaborator: (socketId: string) => void;
  updateCollaborator: (socketId: string, user: Partial<CollaborationUser>) => void;
  
  // Cursor management
  updateCursor: (socketId: string, userId: string, user: { firstName: string; lastName: string; color: string }, position: { x: number; y: number }) => void;
  clearCursor: (socketId: string) => void;
  cleanupOldCursors: () => void;
  
  // Selection management
  updateRemoteSelection: (userId: string, user: { id: string; firstName: string; lastName: string; color: string }, selectedAnnotations: string[]) => void;
  clearRemoteSelection: (userId: string) => void;
  
  // Activity feed
  addActivity: (type: CollaborationState['activities'][0]['type'], user: { firstName: string; lastName: string }, message: string) => void;
  clearActivities: () => void;
  
  // Cursor sharing
  sendCursorPosition: (position: { x: number; y: number }) => void;
  
  // Video sync
  syncVideoSeek: (timestamp: number) => void;
  syncVideoPlay: (timestamp: number) => void;
  syncVideoPause: (timestamp: number) => void;
  
  // Selection sync
  syncSelection: (selectedAnnotations: string[]) => void;
}

type CollaborationStore = CollaborationState & CollaborationActions;

export const useCollaborationStore = create<CollaborationStore>((set, get) => {
  // Set up event listeners
  const setupEventListeners = () => {
    // Connection events
    collaborationService.on('project_joined', (data) => {
      const collaborators = new Map<string, CollaborationUser>();
      data.collaborators.forEach(user => {
        collaborators.set(`user-${user.id}`, user);
      });
      
      set({ 
        collaborators,
        currentProjectId: data.project.id,
        isConnecting: false,
        isConnected: true,
        connectionError: null,
      });
      
      get().addActivity('user_joined', { firstName: 'You', lastName: '' }, 'joined the project');
    });

    collaborationService.on('user_joined', (data) => {
      get().addCollaborator(data.socketId, data.user);
      get().addActivity('user_joined', data.user, 'joined the project');
    });

    collaborationService.on('user_left', (data) => {
      get().removeCollaborator(data.socketId);
      get().clearCursor(data.socketId);
      if (data.user) {
        get().clearRemoteSelection(data.user.id);
        get().addActivity('user_left', data.user, 'left the project');
      }
    });

    // Cursor events
    collaborationService.on('cursor_moved', (data) => {
      get().updateCursor(data.socketId, data.userId, data.user, data.position);
    });

    // Annotation events
    collaborationService.on('annotation_added', (data) => {
      get().addActivity('annotation_added', data.author, 'added an annotation');
    });

    collaborationService.on('annotation_updated', (data) => {
      get().addActivity('annotation_updated', data.updatedBy, 'updated an annotation');
    });

    collaborationService.on('annotation_deleted', (data) => {
      get().addActivity('annotation_deleted', data.deletedBy, 'deleted an annotation');
    });

    // Comment events
    collaborationService.on('comment_added', (data) => {
      get().addActivity('comment_added', data.comment.author, 'added a comment');
    });

    // Selection events
    collaborationService.on('selection_changed', (data) => {
      get().updateRemoteSelection(data.user.id, data.user, data.selectedAnnotations);
    });

    // Video sync events
    collaborationService.on('video_seek', (data) => {
      // Handle remote video seek
      console.log(`${data.user.firstName} seeked to ${data.timestamp}s`);
    });

    collaborationService.on('video_play', (data) => {
      console.log(`${data.user.firstName} played the video at ${data.timestamp}s`);
    });

    collaborationService.on('video_pause', (data) => {
      console.log(`${data.user.firstName} paused the video at ${data.timestamp}s`);
    });

    // Error events
    collaborationService.on('error', (data) => {
      set({ connectionError: data.message });
    });
  };

  // Initialize event listeners
  setupEventListeners();

  // Cleanup old cursors every 5 seconds
  setInterval(() => {
    get().cleanupOldCursors();
  }, 5000);

  return {
    // Initial state
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    currentProjectId: null,
    collaborators: new Map(),
    cursors: new Map(),
    remoteSelections: new Map(),
    activities: [],

    // Actions
    connect: async () => {
      set({ isConnecting: true, connectionError: null });
      try {
        await collaborationService.connect();
        set({ isConnected: true, isConnecting: false });
      } catch (error) {
        set({ 
          isConnecting: false, 
          connectionError: error instanceof Error ? error.message : 'Connection failed' 
        });
      }
    },

    disconnect: () => {
      collaborationService.disconnect();
      set({ 
        isConnected: false,
        isConnecting: false,
        currentProjectId: null,
        collaborators: new Map(),
        cursors: new Map(),
        remoteSelections: new Map(),
      });
    },

    setConnectionState: (isConnected, error = null) => {
      set({ isConnected, connectionError: error });
    },

    joinProject: async (projectId) => {
      const state = get();
      if (state.currentProjectId !== projectId) {
        if (state.currentProjectId) {
          collaborationService.leaveProject();
        }
        
        set({ 
          isConnecting: true,
          collaborators: new Map(),
          cursors: new Map(),
          remoteSelections: new Map(),
          activities: [],
        });
        
        await collaborationService.joinProject(projectId);
      }
    },

    leaveProject: () => {
      collaborationService.leaveProject();
      set({ 
        currentProjectId: null,
        collaborators: new Map(),
        cursors: new Map(),
        remoteSelections: new Map(),
      });
    },

    addCollaborator: (socketId, user) => {
      set((state) => {
        const newCollaborators = new Map(state.collaborators);
        newCollaborators.set(socketId, user);
        return { collaborators: newCollaborators };
      });
    },

    removeCollaborator: (socketId) => {
      set((state) => {
        const newCollaborators = new Map(state.collaborators);
        newCollaborators.delete(socketId);
        return { collaborators: newCollaborators };
      });
    },

    updateCollaborator: (socketId, userUpdate) => {
      set((state) => {
        const newCollaborators = new Map(state.collaborators);
        const existingUser = newCollaborators.get(socketId);
        if (existingUser) {
          newCollaborators.set(socketId, { ...existingUser, ...userUpdate });
        }
        return { collaborators: newCollaborators };
      });
    },

    updateCursor: (socketId, userId, user, position) => {
      set((state) => {
        const newCursors = new Map(state.cursors);
        newCursors.set(socketId, {
          userId,
          user,
          position,
          lastMoved: Date.now(),
        });
        return { cursors: newCursors };
      });
    },

    clearCursor: (socketId) => {
      set((state) => {
        const newCursors = new Map(state.cursors);
        newCursors.delete(socketId);
        return { cursors: newCursors };
      });
    },

    cleanupOldCursors: () => {
      set((state) => {
        const now = Date.now();
        const fiveSecondsAgo = now - 5000;
        const newCursors = new Map(state.cursors);
        
        for (const [socketId, cursor] of newCursors.entries()) {
          if (cursor.lastMoved < fiveSecondsAgo) {
            newCursors.delete(socketId);
          }
        }
        
        return { cursors: newCursors };
      });
    },

    updateRemoteSelection: (userId, user, selectedAnnotations) => {
      set((state) => {
        const newRemoteSelections = new Map(state.remoteSelections);
        if (selectedAnnotations.length > 0) {
          newRemoteSelections.set(userId, { userId, user, selectedAnnotations });
        } else {
          newRemoteSelections.delete(userId);
        }
        return { remoteSelections: newRemoteSelections };
      });
    },

    clearRemoteSelection: (userId) => {
      set((state) => {
        const newRemoteSelections = new Map(state.remoteSelections);
        newRemoteSelections.delete(userId);
        return { remoteSelections: newRemoteSelections };
      });
    },

    addActivity: (type, user, message) => {
      set((state) => ({
        activities: [
          {
            id: `${Date.now()}-${Math.random()}`,
            type,
            user,
            message,
            timestamp: new Date(),
          },
          ...state.activities.slice(0, 49), // Keep only last 50 activities
        ],
      }));
    },

    clearActivities: () => {
      set({ activities: [] });
    },

    sendCursorPosition: (position) => {
      collaborationService.moveCursor(position);
    },

    syncVideoSeek: (timestamp) => {
      collaborationService.seekVideo(timestamp);
    },

    syncVideoPlay: (timestamp) => {
      collaborationService.playVideo(timestamp);
    },

    syncVideoPause: (timestamp) => {
      collaborationService.pauseVideo(timestamp);
    },

    syncSelection: (selectedAnnotations) => {
      collaborationService.changeSelection(selectedAnnotations);
    },
  };
});