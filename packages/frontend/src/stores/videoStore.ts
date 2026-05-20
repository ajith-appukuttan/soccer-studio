import { create } from 'zustand';
import type { Video } from '@shared/types';

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  selectedVideos: string[];
  isLoading: boolean;
  uploadProgress: Record<string, number>; // fileId -> progress percentage
}

interface VideoActions {
  setVideos: (videos: Video[]) => void;
  addVideo: (video: Video) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  removeVideo: (id: string) => void;
  setCurrentVideo: (video: Video | null) => void;
  toggleVideoSelection: (id: string) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  clearUploadProgress: (fileId: string) => void;
}

type VideoStore = VideoState & VideoActions;

export const useVideoStore = create<VideoStore>((set, get) => ({
  // Initial state
  videos: [],
  currentVideo: null,
  selectedVideos: [],
  isLoading: false,
  uploadProgress: {},

  // Actions
  setVideos: (videos) => {
    set({ videos });
  },

  addVideo: (video) => {
    set((state) => ({
      videos: [...state.videos, video],
    }));
  },

  updateVideo: (id, updates) => {
    set((state) => ({
      videos: state.videos.map((video) =>
        video.id === id ? { ...video, ...updates } : video
      ),
      currentVideo:
        state.currentVideo?.id === id
          ? { ...state.currentVideo, ...updates }
          : state.currentVideo,
    }));
  },

  removeVideo: (id) => {
    set((state) => ({
      videos: state.videos.filter((video) => video.id !== id),
      currentVideo: state.currentVideo?.id === id ? null : state.currentVideo,
      selectedVideos: state.selectedVideos.filter((videoId) => videoId !== id),
    }));
  },

  setCurrentVideo: (video) => {
    set({ currentVideo: video });
  },

  toggleVideoSelection: (id) => {
    set((state) => ({
      selectedVideos: state.selectedVideos.includes(id)
        ? state.selectedVideos.filter((videoId) => videoId !== id)
        : [...state.selectedVideos, id],
    }));
  },

  clearSelection: () => {
    set({ selectedVideos: [] });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setUploadProgress: (fileId, progress) => {
    set((state) => ({
      uploadProgress: {
        ...state.uploadProgress,
        [fileId]: progress,
      },
    }));
  },

  clearUploadProgress: (fileId) => {
    set((state) => {
      const { [fileId]: removed, ...rest } = state.uploadProgress;
      return { uploadProgress: rest };
    });
  },
}));