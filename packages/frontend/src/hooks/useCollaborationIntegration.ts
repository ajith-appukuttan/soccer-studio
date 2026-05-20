import { useEffect } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useEditorStore } from '@/stores/editorStore';
import { useAuthStore } from '@/stores/authStore';
import { collaborationService } from '@/services/collaborationService';

/**
 * Hook to integrate real-time collaboration events with the editor
 * This sets up event listeners for incoming collaboration events
 */
export function useCollaborationIntegration(projectId?: string) {
  const { user } = useAuthStore();
  const { connect, joinProject, isConnected } = useCollaborationStore();
  const {
    addAnnotationFromCollaboration,
    updateAnnotationFromCollaboration,
    deleteAnnotationFromCollaboration,
  } = useEditorStore();

  useEffect(() => {
    // Auto-connect to collaboration service when user is available
    if (user && !isConnected) {
      connect();
    }
  }, [user, isConnected, connect]);

  useEffect(() => {
    // Auto-join project when projectId changes
    if (projectId && user && isConnected) {
      joinProject(projectId);
    }
  }, [projectId, user, isConnected, joinProject]);

  useEffect(() => {
    // Set up collaboration event listeners
    const unsubscribers: (() => void)[] = [];

    // Handle incoming annotation events from other users
    unsubscribers.push(
      collaborationService.on('annotation_added', (data) => {
        // Only add if it's not from the current user to avoid duplicates
        if (data.author.id !== user?.id) {
          addAnnotationFromCollaboration(data.annotation);
        }
      })
    );

    unsubscribers.push(
      collaborationService.on('annotation_updated', (data) => {
        if (data.updatedBy.id !== user?.id) {
          updateAnnotationFromCollaboration(data.annotation.id, data.annotation);
        }
      })
    );

    unsubscribers.push(
      collaborationService.on('annotation_deleted', (data) => {
        if (data.deletedBy.id !== user?.id) {
          deleteAnnotationFromCollaboration(data.annotationId);
        }
      })
    );

    // Handle video sync events
    unsubscribers.push(
      collaborationService.on('video_seek', (data) => {
        if (data.user.id !== user?.id) {
          // TODO: Sync video player time
          console.log(`Remote user ${data.user.firstName} seeked to ${data.timestamp}s`);
        }
      })
    );

    unsubscribers.push(
      collaborationService.on('video_play', (data) => {
        if (data.user.id !== user?.id) {
          // TODO: Sync video playback
          console.log(`Remote user ${data.user.firstName} played video at ${data.timestamp}s`);
        }
      })
    );

    unsubscribers.push(
      collaborationService.on('video_pause', (data) => {
        if (data.user.id !== user?.id) {
          // TODO: Sync video pause
          console.log(`Remote user ${data.user.firstName} paused video at ${data.timestamp}s`);
        }
      })
    );

    // Handle errors
    unsubscribers.push(
      collaborationService.on('error', (data) => {
        console.error('Collaboration error:', data.message);
        // Could show a notification to the user
      })
    );

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, addAnnotationFromCollaboration, updateAnnotationFromCollaboration, deleteAnnotationFromCollaboration]);

  return {
    isConnected: collaborationService.isConnected,
    currentProject: collaborationService.currentProject,
  };
}