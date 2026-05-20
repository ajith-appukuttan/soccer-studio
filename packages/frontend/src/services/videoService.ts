import axios from 'axios';
import type { Video, ApiResponse } from '@shared/types';
import { API_ENDPOINTS } from '@shared/constants';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds for video operations
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('soccer-training-auth');
  if (token) {
    const authData = JSON.parse(token);
    if (authData.state?.token) {
      config.headers.Authorization = `Bearer ${authData.state.token}`;
    }
  }
  return config;
});

export interface UploadVideoData {
  file: File;
  title: string;
  description?: string;
}

export interface VideoSearchFilters {
  search?: string;
  status?: Video['status'];
  uploaderId?: string;
  limit?: number;
  offset?: number;
}

class VideoService {
  async getVideos(filters: VideoSearchFilters = {}): Promise<{ videos: Video[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.uploaderId) params.append('uploaderId', filters.uploaderId);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await api.get<ApiResponse<{ videos: Video[]; total: number }>>(
      `${API_ENDPOINTS.VIDEOS.LIST}?${params}`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch videos');
    }
    
    return response.data.data;
  }

  async getVideo(id: string): Promise<Video> {
    const response = await api.get<ApiResponse<Video>>(
      API_ENDPOINTS.VIDEOS.GET(id)
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch video');
    }
    
    return response.data.data;
  }

  async uploadVideo(data: UploadVideoData, onProgress?: (progress: number) => void): Promise<Video> {
    const formData = new FormData();
    formData.append('video', data.file);
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await api.post<ApiResponse<Video>>(
      API_ENDPOINTS.VIDEOS.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to upload video');
    }
    
    return response.data.data;
  }

  async deleteVideo(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(
      API_ENDPOINTS.VIDEOS.DELETE(id)
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete video');
    }
  }

  getStreamUrl(id: string): string {
    return API_ENDPOINTS.VIDEOS.STREAM(id);
  }

  getThumbnailUrl(id: string): string {
    return API_ENDPOINTS.VIDEOS.THUMBNAIL(id);
  }


}

export const videoService = new VideoService();