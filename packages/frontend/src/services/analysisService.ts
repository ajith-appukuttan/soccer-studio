import { apiClient } from './apiClient';

export interface PlayerPosition {
  playerId?: string;
  jersey?: number;
  team: 'home' | 'away' | 'referee';
  position: {
    x: number; // 0-1 normalized coordinates
    y: number; // 0-1 normalized coordinates
  };
  confidence: number; // 0-1
}

export interface TacticalFormation {
  formation: string; // e.g., "4-4-2", "4-3-3", "3-5-2"
  team: 'home' | 'away';
  players: PlayerPosition[];
  confidence: number;
}

export interface SoccerAnalysis {
  timestamp: number; // Video timestamp in seconds
  frameUrl?: string; // URL to the analyzed frame
  players: PlayerPosition[];
  formations: TacticalFormation[];
  insights: {
    possession?: 'home' | 'away';
    phase: 'attacking' | 'defending' | 'transition';
    keyEvents: string[];
    tacticalNotes: string[];
  };
  confidence: number;
}

export interface AnalysisJob {
  id: string;
  videoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  error?: string;
  settings: {
    interval: number; // Analyze every N seconds
    startTime: number; // Start analysis at timestamp
    endTime: number; // End analysis at timestamp
    analysisType: 'full' | 'formations' | 'events';
  };
}

export interface AnalysisSummary {
  dominantFormations: { [team: string]: string };
  possessionStats: { home: number; away: number };
  keyMoments: Array<{ timestamp: number; event: string; importance: number }>;
  tacticalTrends: string[];
}

export interface VideoAnalysisResults {
  videoId: string;
  jobs: AnalysisJob[];
  latestResults?: SoccerAnalysis[];
  summary?: AnalysisSummary;
}

class AnalysisService {
  /**
   * Start AI analysis for a video
   */
  async startAnalysis(
    videoId: string,
    settings: {
      interval?: number;
      startTime?: number;
      endTime?: number;
      analysisType?: 'full' | 'formations' | 'events';
    }
  ): Promise<{ jobId: string; status: string; message: string }> {
    const response = await apiClient.post('/analysis/start', {
      videoId,
      settings: {
        interval: settings.interval || 30,
        startTime: settings.startTime || 0,
        endTime: settings.endTime || 300,
        analysisType: settings.analysisType || 'full',
      },
    });
    
    return response.data;
  }

  /**
   * Get analysis job status and results
   */
  async getJob(jobId: string): Promise<{
    job: AnalysisJob;
    results: SoccerAnalysis[];
  }> {
    const response = await apiClient.get(`/analysis/job/${jobId}`);
    return response.data;
  }

  /**
   * Get all analysis jobs for the current user
   */
  async getUserJobs(): Promise<{ jobs: AnalysisJob[] }> {
    const response = await apiClient.get('/analysis/jobs');
    return response.data;
  }

  /**
   * Cancel an analysis job
   */
  async cancelJob(jobId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/analysis/job/${jobId}`);
    return response.data;
  }

  /**
   * Get all analysis results for a video
   */
  async getVideoAnalysis(videoId: string): Promise<VideoAnalysisResults> {
    const response = await apiClient.get(`/analysis/video/${videoId}`);
    return response.data;
  }

  /**
   * Get analysis queue status (admin only)
   */
  async getQueueStatus(): Promise<{
    queue: {
      queueLength: number;
      processing: boolean;
      activeJobs: number;
    };
    timestamp: string;
  }> {
    const response = await apiClient.get('/analysis/queue/status');
    return response.data;
  }

  /**
   * Test AI analysis on a single frame (development only)
   */
  async testFrameAnalysis(
    videoId: string,
    timestamp?: number
  ): Promise<{ analysis: SoccerAnalysis; message: string }> {
    const response = await apiClient.post('/analysis/test-frame', {
      videoId,
      timestamp: timestamp || 0,
    });
    return response.data;
  }

  /**
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<SoccerAnalysis[]> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const { job, results } = await this.getJob(jobId);
          
          onProgress?.(job.progress, job.status);

          if (job.status === 'completed') {
            resolve(results);
          } else if (job.status === 'failed') {
            reject(new Error(job.error || 'Analysis failed'));
          } else {
            // Continue polling
            setTimeout(poll, 2000); // Poll every 2 seconds
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const analysisService = new AnalysisService();