import { create } from 'zustand';
import { analysisService, type AnalysisJob, type SoccerAnalysis, type AnalysisSummary } from '@/services/analysisService';

interface AnalysisState {
  // Current analysis data
  currentVideoId: string | null;
  jobs: AnalysisJob[];
  activeJob: AnalysisJob | null;
  analysisResults: SoccerAnalysis[];
  summary: AnalysisSummary | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Analysis visualization
  showAnalysisOverlay: boolean;
  selectedTimestamp: number | null;
  playbackSyncEnabled: boolean;
}

interface AnalysisActions {
  // Data loading
  loadVideoAnalysis: (videoId: string) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  clearAnalysis: () => void;
  
  // Job management
  startAnalysis: (videoId: string, settings: {
    interval?: number;
    startTime?: number;
    endTime?: number;
    analysisType?: 'full' | 'formations' | 'events';
  }) => Promise<string>;
  cancelAnalysis: (jobId: string) => Promise<void>;
  pollJobProgress: (jobId: string) => Promise<void>;
  
  // UI actions
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  toggleAnalysisOverlay: () => void;
  setSelectedTimestamp: (timestamp: number | null) => void;
  togglePlaybackSync: () => void;
  
  // Analysis helpers
  getAnalysisAtTime: (timestamp: number) => SoccerAnalysis | null;
  getFormationAtTime: (timestamp: number, team: 'home' | 'away') => string | null;
  getPlayersAtTime: (timestamp: number) => SoccerAnalysis['players'];
  getInsightsAtTime: (timestamp: number) => SoccerAnalysis['insights'] | null;
}

type AnalysisStore = AnalysisState & AnalysisActions;

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  // Initial state
  currentVideoId: null,
  jobs: [],
  activeJob: null,
  analysisResults: [],
  summary: null,
  isLoading: false,
  error: null,
  showAnalysisOverlay: false,
  selectedTimestamp: null,
  playbackSyncEnabled: true,

  // Data loading actions
  loadVideoAnalysis: async (videoId: string) => {
    const state = get();
    
    // Don't reload if it's the same video and we have data
    if (state.currentVideoId === videoId && state.analysisResults.length > 0) {
      return;
    }

    try {
      set({ isLoading: true, error: null, currentVideoId: videoId });

      const results = await analysisService.getVideoAnalysis(videoId);
      
      // Find any active job
      const activeJob = results.jobs.find(job => 
        job.status === 'pending' || job.status === 'processing'
      ) || null;

      set({
        jobs: results.jobs,
        activeJob,
        analysisResults: results.latestResults || [],
        summary: results.summary || null,
        isLoading: false,
      });

      // Start polling if there's an active job
      if (activeJob) {
        get().pollJobProgress(activeJob.id);
      }

    } catch (error) {
      console.error('Failed to load video analysis:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load analysis',
        isLoading: false 
      });
    }
  },

  refreshAnalysis: async () => {
    const { currentVideoId, loadVideoAnalysis } = get();
    if (currentVideoId) {
      await loadVideoAnalysis(currentVideoId);
    }
  },

  clearAnalysis: () => {
    set({
      currentVideoId: null,
      jobs: [],
      activeJob: null,
      analysisResults: [],
      summary: null,
      error: null,
      selectedTimestamp: null,
    });
  },

  // Job management actions
  startAnalysis: async (videoId: string, settings) => {
    try {
      set({ isLoading: true, error: null });

      const response = await analysisService.startAnalysis(videoId, settings);
      
      // Create new job object
      const newJob: AnalysisJob = {
        id: response.jobId,
        videoId,
        status: 'pending',
        progress: 0,
        settings: {
          interval: settings.interval || 30,
          startTime: settings.startTime || 0,
          endTime: settings.endTime || 300,
          analysisType: settings.analysisType || 'full',
        },
      };

      set(state => ({
        activeJob: newJob,
        jobs: [newJob, ...state.jobs],
        isLoading: false,
      }));

      // Start polling for progress
      get().pollJobProgress(response.jobId);

      return response.jobId;

    } catch (error) {
      console.error('Failed to start analysis:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start analysis',
        isLoading: false 
      });
      throw error;
    }
  },

  cancelAnalysis: async (jobId: string) => {
    try {
      await analysisService.cancelJob(jobId);
      
      set(state => ({
        activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
        jobs: state.jobs.filter(job => job.id !== jobId),
      }));

    } catch (error) {
      console.error('Failed to cancel analysis:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to cancel analysis' 
      });
    }
  },

  pollJobProgress: async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { job, results } = await analysisService.getJob(jobId);
        
        set(state => ({
          activeJob: state.activeJob?.id === jobId ? job : state.activeJob,
          jobs: state.jobs.map(j => j.id === jobId ? job : j),
        }));

        if (job.status === 'completed') {
          clearInterval(pollInterval);
          
          set(state => ({
            activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
            analysisResults: results,
          }));

          // Reload to get the summary
          get().refreshAnalysis();
          
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          
          set(state => ({
            activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
            error: job.error || 'Analysis failed',
          }));
        }

      } catch (error) {
        console.warn('Failed to poll job progress:', error);
        // Don't clear interval on polling errors, just log them
      }
    }, 3000); // Poll every 3 seconds

    // Clean up interval after 30 minutes to prevent memory leaks
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  },

  // UI actions
  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  toggleAnalysisOverlay: () => {
    set(state => ({ showAnalysisOverlay: !state.showAnalysisOverlay }));
  },

  setSelectedTimestamp: (timestamp: number | null) => {
    set({ selectedTimestamp: timestamp });
  },

  togglePlaybackSync: () => {
    set(state => ({ playbackSyncEnabled: !state.playbackSyncEnabled }));
  },

  // Analysis helpers
  getAnalysisAtTime: (timestamp: number) => {
    const { analysisResults } = get();
    if (!analysisResults.length) return null;

    // Find the closest analysis result to the given timestamp
    return analysisResults.reduce((closest, analysis) => {
      const currentDiff = Math.abs(analysis.timestamp - timestamp);
      const closestDiff = Math.abs(closest.timestamp - timestamp);
      return currentDiff < closestDiff ? analysis : closest;
    });
  },

  getFormationAtTime: (timestamp: number, team: 'home' | 'away') => {
    const analysis = get().getAnalysisAtTime(timestamp);
    if (!analysis) return null;

    const formation = analysis.formations.find(f => f.team === team);
    return formation?.formation || null;
  },

  getPlayersAtTime: (timestamp: number) => {
    const analysis = get().getAnalysisAtTime(timestamp);
    return analysis?.players || [];
  },

  getInsightsAtTime: (timestamp: number) => {
    const analysis = get().getAnalysisAtTime(timestamp);
    return analysis?.insights || null;
  },
}));