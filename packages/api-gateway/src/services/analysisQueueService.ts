import { EventEmitter } from 'events';
import { AnalysisJob, aiAnalysisService } from './aiAnalysisService';
import { prisma } from './database';
import { generateUUID } from '@shared/utils';

interface QueueEvent {
  jobId: string;
  status: AnalysisJob['status'];
  progress?: number;
  error?: string;
  results?: any;
}

class AnalysisQueueService extends EventEmitter {
  private activeJobs = new Map<string, AnalysisJob>();
  private queue: string[] = [];
  private processing = false;
  private maxConcurrentJobs = 1; // AI analysis is resource-intensive

  constructor() {
    super();
    this.startQueueProcessor();
  }

  /**
   * Create a new analysis job
   */
  async createAnalysisJob(
    videoId: string,
    userId: string,
    settings: AnalysisJob['settings']
  ): Promise<string> {
    const jobId = generateUUID();
    
    const job: AnalysisJob = {
      id: jobId,
      videoId,
      status: 'pending',
      progress: 0,
      settings,
    };

    // Store job in database
    await prisma.analysisJob.create({
      data: {
        id: jobId,
        videoId,
        userId,
        status: 'pending',
        progress: 0,
        settings: JSON.stringify(settings),
        createdAt: new Date(),
      },
    });

    // Add to memory and queue
    this.activeJobs.set(jobId, job);
    this.queue.push(jobId);

    console.log(`📊 Created analysis job ${jobId} for video ${videoId}`);
    this.emit('jobCreated', { jobId, status: 'pending' });

    return jobId;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<AnalysisJob | null> {
    // Check memory first
    const memoryJob = this.activeJobs.get(jobId);
    if (memoryJob) return memoryJob;

    // Check database
    const dbJob = await prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: { results: true }
    });

    if (!dbJob) return null;

    const job: AnalysisJob = {
      id: dbJob.id,
      videoId: dbJob.videoId,
      status: dbJob.status as AnalysisJob['status'],
      progress: dbJob.progress,
      startTime: dbJob.startTime || undefined,
      endTime: dbJob.endTime || undefined,
      error: dbJob.error || undefined,
      settings: JSON.parse(dbJob.settings as string),
      results: dbJob.results.map(r => JSON.parse(r.data as string))
    };

    return job;
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string): Promise<AnalysisJob[]> {
    const dbJobs = await prisma.analysisJob.findMany({
      where: { userId },
      include: { results: true },
      orderBy: { createdAt: 'desc' }
    });

    return dbJobs.map(dbJob => ({
      id: dbJob.id,
      videoId: dbJob.videoId,
      status: dbJob.status as AnalysisJob['status'],
      progress: dbJob.progress,
      startTime: dbJob.startTime || undefined,
      endTime: dbJob.endTime || undefined,
      error: dbJob.error || undefined,
      settings: JSON.parse(dbJob.settings as string),
      results: dbJob.results.map(r => JSON.parse(r.data as string))
    }));
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    if (job.status === 'pending') {
      // Remove from queue
      const queueIndex = this.queue.indexOf(jobId);
      if (queueIndex > -1) {
        this.queue.splice(queueIndex, 1);
      }
    }

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.endTime = new Date();

    // Update database
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: 'Cancelled by user',
        endTime: new Date(),
      },
    });

    this.activeJobs.delete(jobId);
    this.emit('jobCancelled', { jobId, status: 'failed' });

    return true;
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processNextJob();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    const jobId = this.queue.shift();
    if (!jobId) return;

    const job = this.activeJobs.get(jobId);
    if (!job) return;

    this.processing = true;
    console.log(`🔄 Starting analysis job ${jobId}`);

    try {
      job.status = 'processing';
      job.startTime = new Date();

      // Update database
      await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startTime: new Date(),
        },
      });

      this.emit('jobStarted', { jobId, status: 'processing' });

      // Get video file path
      const video = await prisma.video.findUnique({
        where: { id: job.videoId }
      });

      if (!video) {
        throw new Error('Video not found');
      }

      const videoPath = video.filePath;
      if (!videoPath) {
        throw new Error('Video file path not available');
      }

      // Run AI analysis with progress tracking
      const results = await aiAnalysisService.analyzeVideo(
        videoPath,
        job.settings,
        (progress) => {
          job.progress = progress;
          this.updateJobProgress(jobId, progress);
        }
      );

      // Generate summary insights
      const summaryInsights = aiAnalysisService.generateSummaryInsights(results);

      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.results = results;

      // Save results to database
      await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          endTime: new Date(),
        },
      });

      // Save individual analysis results
      await prisma.analysisResult.createMany({
        data: results.map((result, index) => ({
          id: generateUUID(),
          jobId,
          timestamp: result.timestamp,
          data: JSON.stringify(result),
          createdAt: new Date(),
        }))
      });

      // Save summary insights
      await prisma.analysisSummary.create({
        data: {
          id: generateUUID(),
          jobId,
          data: JSON.stringify(summaryInsights),
          createdAt: new Date(),
        },
      });

      console.log(`✅ Analysis job ${jobId} completed successfully`);
      this.emit('jobCompleted', { 
        jobId, 
        status: 'completed', 
        results: results,
        summary: summaryInsights 
      });

    } catch (error) {
      console.error(`❌ Analysis job ${jobId} failed:`, error);

      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();

      await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: job.error,
          endTime: new Date(),
        },
      });

      this.emit('jobFailed', { 
        jobId, 
        status: 'failed', 
        error: job.error 
      });

    } finally {
      this.activeJobs.delete(jobId);
      this.processing = false;

      // Clean up temporary files
      await aiAnalysisService.cleanup();
    }
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(jobId: string, progress: number): Promise<void> {
    try {
      await prisma.analysisJob.update({
        where: { id: jobId },
        data: { progress }
      });

      this.emit('jobProgress', { jobId, progress });
    } catch (error) {
      console.warn('Failed to update job progress:', error);
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    activeJobs: number;
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      activeJobs: this.activeJobs.size,
    };
  }

  /**
   * Get analysis results for a video
   */
  async getVideoAnalysisResults(videoId: string): Promise<{
    jobs: AnalysisJob[];
    latestResults?: any[];
    summary?: any;
  }> {
    const jobs = await prisma.analysisJob.findMany({
      where: { 
        videoId,
        status: 'completed'
      },
      include: {
        results: true,
        summary: true
      },
      orderBy: { endTime: 'desc' }
    });

    const analysisJobs: AnalysisJob[] = jobs.map(job => ({
      id: job.id,
      videoId: job.videoId,
      status: job.status as AnalysisJob['status'],
      progress: job.progress,
      startTime: job.startTime || undefined,
      endTime: job.endTime || undefined,
      error: job.error || undefined,
      settings: JSON.parse(job.settings as string),
      results: job.results.map(r => JSON.parse(r.data as string))
    }));

    const latestJob = jobs[0];
    
    return {
      jobs: analysisJobs,
      latestResults: latestJob?.results.map(r => JSON.parse(r.data as string)),
      summary: latestJob?.summary ? JSON.parse(latestJob.summary.data as string) : undefined
    };
  }
}

export const analysisQueueService = new AnalysisQueueService();