import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { analysisQueueService } from '../services/analysisQueueService';
import { aiAnalysisService } from '../services/aiAnalysisService';
import { prisma } from '../services/database';
import { Request, Response } from 'express';

const router = Router();

// Apply authentication to all analysis routes
router.use(authMiddleware);

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

/**
 * POST /api/analysis/start
 * Start AI analysis for a video
 */
router.post('/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { videoId, settings } = req.body;
    const userId = req.user.id;

    // Validate video exists and user has access
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        organizationId: req.user.organizationId
      }
    });

    if (!video) {
      return res.status(404).json({
        error: 'Video not found or access denied'
      });
    }

    // Check if video is ready for analysis
    if (video.status !== 'PROCESSED') {
      return res.status(400).json({
        error: 'Video must be processed before analysis can begin'
      });
    }

    // Validate settings
    const analysisSettings = {
      interval: settings?.interval || 30, // Analyze every 30 seconds by default
      startTime: settings?.startTime || 0,
      endTime: settings?.endTime || (video.duration || 300),
      analysisType: settings?.analysisType || 'full'
    };

    // Create analysis job
    const jobId = await analysisQueueService.createAnalysisJob(
      videoId,
      userId,
      analysisSettings
    );

    res.status(201).json({
      jobId,
      status: 'pending',
      message: 'Analysis job created successfully'
    });

  } catch (error) {
    console.error('Failed to start analysis:', error);
    res.status(500).json({
      error: 'Failed to start analysis'
    });
  }
});

/**
 * GET /api/analysis/job/:jobId
 * Get analysis job status and results
 */
router.get('/job/:jobId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const job = await analysisQueueService.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        error: 'Analysis job not found'
      });
    }

    // Verify user has access to this job
    const dbJob = await prisma.analysisJob.findFirst({
      where: {
        id: jobId,
        video: {
          organizationId: req.user.organizationId
        }
      }
    });

    if (!dbJob) {
      return res.status(403).json({
        error: 'Access denied to this analysis job'
      });
    }

    res.json({
      job: {
        id: job.id,
        videoId: job.videoId,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        error: job.error,
        settings: job.settings
      },
      results: job.results || []
    });

  } catch (error) {
    console.error('Failed to get analysis job:', error);
    res.status(500).json({
      error: 'Failed to get analysis job'
    });
  }
});

/**
 * GET /api/analysis/jobs
 * Get all analysis jobs for the current user
 */
router.get('/jobs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const jobs = await analysisQueueService.getUserJobs(userId);

    res.json({
      jobs: jobs.map(job => ({
        id: job.id,
        videoId: job.videoId,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        error: job.error,
        settings: job.settings
      }))
    });

  } catch (error) {
    console.error('Failed to get user jobs:', error);
    res.status(500).json({
      error: 'Failed to get analysis jobs'
    });
  }
});

/**
 * DELETE /api/analysis/job/:jobId
 * Cancel an analysis job
 */
router.delete('/job/:jobId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;

    // Verify user has access to this job
    const dbJob = await prisma.analysisJob.findFirst({
      where: {
        id: jobId,
        userId: req.user.id
      }
    });

    if (!dbJob) {
      return res.status(404).json({
        error: 'Analysis job not found or access denied'
      });
    }

    const cancelled = await analysisQueueService.cancelJob(jobId);
    
    if (cancelled) {
      res.json({ message: 'Analysis job cancelled successfully' });
    } else {
      res.status(400).json({ error: 'Job cannot be cancelled' });
    }

  } catch (error) {
    console.error('Failed to cancel analysis job:', error);
    res.status(500).json({
      error: 'Failed to cancel analysis job'
    });
  }
});

/**
 * GET /api/analysis/video/:videoId
 * Get all analysis results for a video
 */
router.get('/video/:videoId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { videoId } = req.params;

    // Verify user has access to this video
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        organizationId: req.user.organizationId
      }
    });

    if (!video) {
      return res.status(404).json({
        error: 'Video not found or access denied'
      });
    }

    const results = await analysisQueueService.getVideoAnalysisResults(videoId);

    res.json({
      videoId,
      jobs: results.jobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        settings: job.settings
      })),
      latestResults: results.latestResults,
      summary: results.summary
    });

  } catch (error) {
    console.error('Failed to get video analysis results:', error);
    res.status(500).json({
      error: 'Failed to get analysis results'
    });
  }
});

/**
 * GET /api/analysis/queue/status
 * Get analysis queue status (admin only)
 */
router.get('/queue/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only admins can view queue status
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    const status = analysisQueueService.getQueueStatus();
    
    res.json({
      queue: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get queue status:', error);
    res.status(500).json({
      error: 'Failed to get queue status'
    });
  }
});

/**
 * POST /api/analysis/test-frame
 * Test AI analysis on a single video frame (development only)
 */
router.post('/test-frame', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Test endpoints not available in production'
      });
    }

    const { videoId, timestamp } = req.body;

    // Verify user has access to this video
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        organizationId: req.user.organizationId
      }
    });

    if (!video || !video.filePath) {
      return res.status(404).json({
        error: 'Video not found or file path unavailable'
      });
    }

    // Extract and analyze single frame
    const framePaths = await aiAnalysisService.extractFrames(
      video.filePath,
      [timestamp || 0]
    );

    if (framePaths.length === 0) {
      return res.status(400).json({
        error: 'Failed to extract frame'
      });
    }

    const analysis = await aiAnalysisService.analyzeFrame(
      framePaths[0],
      timestamp || 0
    );

    // Clean up frame
    require('fs').unlink(framePaths[0], () => {});

    res.json({
      analysis,
      message: 'Single frame analysis completed'
    });

  } catch (error) {
    console.error('Failed to analyze test frame:', error);
    res.status(500).json({
      error: 'Failed to analyze test frame'
    });
  }
});

export { router as analysisRoutes };