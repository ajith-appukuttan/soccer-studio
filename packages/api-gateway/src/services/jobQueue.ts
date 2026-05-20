import { EventEmitter } from 'events';
import { videoProcessor } from './videoProcessor';
import { prisma } from './database';

export interface Job {
  id: string;
  type: 'video_processing' | 'thumbnail_generation' | 'hls_conversion';
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export class JobQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private isProcessing = false;
  private concurrency: number;
  private currentlyProcessing = 0;

  constructor(concurrency = 2) {
    super();
    this.concurrency = concurrency;
    this.startProcessing();
  }

  /**
   * Add a new job to the queue
   */
  addJob(
    type: Job['type'],
    data: any,
    priority: number = 0,
    maxAttempts: number = 3
  ): string {
    const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      type,
      data,
      priority,
      attempts: 0,
      maxAttempts,
      status: 'pending',
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.emit('job:added', job);
    
    console.log(`🎯 Job added: ${jobId} (${type})`);
    
    // Trigger processing
    this.processNextJob();
    
    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs with optional filtering
   */
  getJobs(filter?: { status?: Job['status']; type?: Job['type'] }): Job[] {
    let jobs = Array.from(this.jobs.values());
    
    if (filter?.status) {
      jobs = jobs.filter(job => job.status === filter.status);
    }
    
    if (filter?.type) {
      jobs = jobs.filter(job => job.type === filter.type);
    }
    
    return jobs.sort((a, b) => {
      // Sort by priority (higher first), then by creation time
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Remove completed or failed jobs older than specified time
   */
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let cleaned = 0;
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.createdAt.getTime() < cutoff
      ) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleaned} old jobs`);
    return cleaned;
  }

  /**
   * Start the job processing loop
   */
  private startProcessing(): void {
    this.isProcessing = true;
    
    // Process jobs every second
    setInterval(() => {
      this.processNextJob();
    }, 1000);
    
    // Cleanup old jobs every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
    
    console.log(`🚀 Job queue started with concurrency: ${this.concurrency}`);
  }

  /**
   * Process the next available job
   */
  private async processNextJob(): Promise<void> {
    if (this.currentlyProcessing >= this.concurrency) {
      return;
    }

    const pendingJobs = this.getJobs({ status: 'pending' });
    if (pendingJobs.length === 0) {
      return;
    }

    const job = pendingJobs[0];
    await this.processJob(job);
  }

  /**
   * Process a specific job
   */
  private async processJob(job: Job): Promise<void> {
    this.currentlyProcessing++;
    job.status = 'processing';
    job.processedAt = new Date();
    job.attempts++;

    console.log(`⚙️ Processing job: ${job.id} (${job.type}) - Attempt ${job.attempts}`);
    this.emit('job:started', job);

    try {
      await this.executeJob(job);
      
      job.status = 'completed';
      console.log(`✅ Job completed: ${job.id}`);
      this.emit('job:completed', job);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.error = errorMessage;
      
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending'; // Retry
        console.log(`🔄 Job failed, retrying: ${job.id} - ${errorMessage}`);
        this.emit('job:retry', job);
      } else {
        job.status = 'failed';
        console.log(`❌ Job failed permanently: ${job.id} - ${errorMessage}`);
        this.emit('job:failed', job);
      }
    } finally {
      this.currentlyProcessing--;
    }
  }

  /**
   * Execute the actual job work
   */
  private async executeJob(job: Job): Promise<void> {
    switch (job.type) {
      case 'video_processing':
        await this.processVideoJob(job);
        break;
        
      case 'thumbnail_generation':
        await this.generateThumbnailJob(job);
        break;
        
      case 'hls_conversion':
        await this.convertToHLSJob(job);
        break;
        
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Process a video with full processing pipeline
   */
  private async processVideoJob(job: Job): Promise<void> {
    const { videoId, inputPath, options } = job.data;
    await videoProcessor.processVideo(videoId, inputPath, options);
  }

  /**
   * Generate thumbnails for a video
   */
  private async generateThumbnailJob(job: Job): Promise<void> {
    const { videoId, inputPath } = job.data;
    const outputDir = `uploads/thumbnails/${videoId}`;
    
    const thumbnails = await videoProcessor.generateThumbnails(inputPath, outputDir);
    
    // Update video with thumbnail URL
    await prisma.video.update({
      where: { id: videoId },
      data: {
        thumbnailUrl: `/api/videos/${videoId}/thumbnail`,
        processingLogs: { thumbnails },
      },
    });
  }

  /**
   * Convert video to HLS format
   */
  private async convertToHLSJob(job: Job): Promise<void> {
    const { videoId, inputPath } = job.data;
    const outputDir = `uploads/hls/${videoId}`;
    
    const playlist = await videoProcessor.generateHLS(inputPath, outputDir);
    
    // Update video with HLS URL
    await prisma.video.update({
      where: { id: videoId },
      data: {
        streamUrl: `/api/videos/${videoId}/hls/playlist.m3u8`,
        processingLogs: { hls: playlist },
      },
    });
  }

  /**
   * Add video processing job
   */
  addVideoProcessingJob(videoId: string, inputPath: string, options: any = {}): string {
    return this.addJob('video_processing', {
      videoId,
      inputPath,
      options: {
        generateThumbnails: true,
        createPreview: false,
        optimizeForWeb: true,
        generateHLS: false,
        qualities: ['720p', '480p'],
        ...options,
      },
    }, 10); // High priority
  }

  /**
   * Add thumbnail generation job
   */
  addThumbnailJob(videoId: string, inputPath: string): string {
    return this.addJob('thumbnail_generation', {
      videoId,
      inputPath,
    }, 5); // Medium priority
  }

  /**
   * Add HLS conversion job
   */
  addHLSJob(videoId: string, inputPath: string): string {
    return this.addJob('hls_conversion', {
      videoId,
      inputPath,
    }, 3); // Low priority
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    currentlyProcessing: number;
    concurrency: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      currentlyProcessing: this.currentlyProcessing,
      concurrency: this.concurrency,
    };
  }
}

// Export singleton instance
export const jobQueue = new JobQueue(
  parseInt(process.env.VIDEO_PROCESSING_CONCURRENCY || '2')
);