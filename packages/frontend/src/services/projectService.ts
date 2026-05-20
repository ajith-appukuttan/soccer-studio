import axios from 'axios';
import type { Project, ApiResponse } from '@shared/types';
import { API_ENDPOINTS } from '@shared/constants';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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

export interface CreateProjectData {
  title: string;
  description?: string;
  videoId: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  annotations?: Project['annotations'];
  settings?: Project['settings'];
}

class ProjectService {
  async getProjects(): Promise<Project[]> {
    const response = await api.get<ApiResponse<Project[]>>(
      API_ENDPOINTS.PROJECTS.LIST
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch projects');
    }
    
    return response.data.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await api.get<ApiResponse<Project>>(
      API_ENDPOINTS.PROJECTS.GET(id)
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch project');
    }
    
    return response.data.data;
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>(
      API_ENDPOINTS.PROJECTS.CREATE,
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create project');
    }
    
    return response.data.data;
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const response = await api.put<ApiResponse<Project>>(
      API_ENDPOINTS.PROJECTS.UPDATE(id),
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update project');
    }
    
    return response.data.data;
  }

  async deleteProject(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(
      API_ENDPOINTS.PROJECTS.DELETE(id)
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete project');
    }
  }

  // Auto-save functionality
  async autoSave(id: string, data: UpdateProjectData): Promise<void> {
    try {
      await this.updateProject(id, data);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't throw - auto-save should fail silently
    }
  }

  // Export project
  async exportProject(id: string, format: 'json' | 'pdf' | 'video'): Promise<Blob> {
    const response = await api.get(
      `/projects/${id}/export?format=${format}`,
      { responseType: 'blob' }
    );
    
    return response.data;
  }
}

export const projectService = new ProjectService();