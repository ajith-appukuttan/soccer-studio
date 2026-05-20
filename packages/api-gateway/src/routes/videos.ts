import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { prisma } from '../services/database';
import { jobQueue } from '../services/jobQueue';
import { videoProcessor } from '../services/videoProcessor';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// ================================
// FILE UPLOAD CONFIGURATION
// ================================

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for video uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120'), // 5GB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/x-matroska', // .mkv
      'video/webm',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only video files (MP4, MOV, AVI, MKV, WebM) are allowed.');
      (error as any).code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  },
});

// ================================
// VALIDATION SCHEMAS
// ================================

const videoMetadataSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

const videoQuerySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('12'),
  search: z.string().optional(),
  status: z.enum(['UPLOADING', 'PROCESSING', 'READY', 'ERROR']).optional(),
  uploader: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'duration', 'fileSize']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ================================
// UTILITY FUNCTIONS
// ================================

async function getBasicVideoInfo(filePath: string) {
  try {
    return await videoProcessor.extractMetadata(filePath);
  } catch (error) {
    console.error('Failed to extract video metadata:', error);
    // Return basic info if FFmpeg is not available
    const stats = await fs.stat(filePath);
    return {
      duration: 300, // 5 minutes default
      width: 1920,
      height: 1080,
      fps: 30,
      format: 'mp4',
      bitrate: 0,
      codec: 'unknown',
      fileSize: stats.size,
    };
  }
}

async function generateThumbnail(videoPath: string, outputPath: string) {
  // In a real implementation, use ffmpeg to generate thumbnail
  // For now, this is a placeholder
  console.log(`Generating thumbnail for ${videoPath} -> ${outputPath}`);
}

// ================================
// ROUTES
// ================================

/**
 * GET /api/videos
 * List videos with pagination, filtering, and search
 */
router.get('/', authMiddleware, asyncHandler(async (req: any, res) => {
  const query = videoQuerySchema.parse(req.query);
  const organizationId = req.organizationId;

  const skip = (query.page - 1) * query.limit;

  // Build where clause
  const where: any = {
    organizationId,
  };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { filename: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.uploader) {
    where.uploaderId = query.uploader;
  }

  // Execute query with pagination
  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    }),
    prisma.video.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      videos,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    },
  });
}));

/**
 * GET /api/videos/:id
 * Get video by ID
 */
router.get('/:id', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;

  const video = await prisma.video.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      projects: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  res.json({
    success: true,
    data: video,
  });
}));

/**
 * POST /api/videos/upload
 * Upload a new video file
 */
router.post('/upload', authMiddleware, upload.single('video'), asyncHandler(async (req: any, res) => {
  if (!req.file) {
    throw new HttpError(400, 'No video file provided');
  }

  const metadata = videoMetadataSchema.parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  // Get basic video info (quick extraction)
  const videoInfo = await getBasicVideoInfo(req.file.path);

  // Create video record
  const video = await prisma.video.create({
    data: {
      title: metadata.title,
      description: metadata.description,
      filename: req.file.originalname,
      fileSize: BigInt(req.file.size),
      duration: videoInfo.duration,
      width: videoInfo.width,
      height: videoInfo.height,
      fps: videoInfo.fps,
      format: videoInfo.format,
      uploaderId: userId,
      organizationId,
      status: 'PROCESSING',
      originalUrl: req.file.path,
    },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Add video processing job to queue
  const processingOptions = {
    generateThumbnails: true,
    createPreview: false,
    optimizeForWeb: true,
    generateHLS: videoInfo.fileSize > 100 * 1024 * 1024, // HLS for files > 100MB
    qualities: videoInfo.width >= 1920 ? ['1080p', '720p', '480p'] : ['720p', '480p'],
  };

  const jobId = jobQueue.addVideoProcessingJob(
    video.id,
    req.file.path,
    processingOptions
  );

  console.log(`🎬 Video processing job queued: ${jobId} for video ${video.id}`);

  res.status(201).json({
    success: true,
    data: video,
  });
}));

/**
 * GET /api/videos/:id/stream
 * Stream video file
 */
router.get('/:id/stream', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;

  const video = await prisma.video.findFirst({
    where: {
      id,
      organizationId,
      status: 'READY',
    },
  });

  if (!video || !video.originalUrl) {
    throw new HttpError(404, 'Video not found or not ready for streaming');
  }

  try {
    const stat = await fs.stat(video.originalUrl);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support for range requests (seeking)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });

      const stream = await fs.open(video.originalUrl, 'r');
      const buffer = Buffer.alloc(chunksize);
      await stream.read(buffer, 0, chunksize, start);
      await stream.close();
      res.end(buffer);
    } else {
      // Full file response
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      const fileBuffer = await fs.readFile(video.originalUrl);
      res.end(fileBuffer);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    throw new HttpError(500, 'Error streaming video');
  }
}));

/**
 * GET /api/videos/:id/thumbnail
 * Get video thumbnail
 */
router.get('/:id/thumbnail', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;

  const video = await prisma.video.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  // Check if thumbnail file exists
  const thumbnailPath = path.join(process.env.UPLOAD_PATH || './uploads', 'thumbnails', `${video.id}.jpg`);
  
  try {
    await fs.access(thumbnailPath);
    res.sendFile(path.resolve(thumbnailPath));
  } catch (error) {
    res.status(404).json({ 
      error: 'Thumbnail not found', 
      message: 'Thumbnail generation is not yet implemented' 
    });
  }
}));

/**
 * PUT /api/videos/:id
 * Update video metadata
 */
router.put('/:id', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.user.id;
  const userRole = req.user.role;

  const metadata = videoMetadataSchema.parse(req.body);

  // Find video and check permissions
  const video = await prisma.video.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  // Check if user can edit (owner or admin)
  if (video.uploaderId !== userId && !['ADMIN', 'COACH'].includes(userRole)) {
    throw new HttpError(403, 'Permission denied');
  }

  // Update video
  const updatedVideo = await prisma.video.update({
    where: { id },
    data: {
      title: metadata.title,
      description: metadata.description,
    },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: updatedVideo,
  });
}));

/**
 * DELETE /api/videos/:id
 * Delete video
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Find video and check permissions
  const video = await prisma.video.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      projects: true,
    },
  });

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  // Check if user can delete (owner or admin)
  if (video.uploaderId !== userId && !['ADMIN'].includes(userRole)) {
    throw new HttpError(403, 'Permission denied');
  }

  // Check if video is used in projects
  if (video.projects.length > 0) {
    throw new HttpError(400, 'Cannot delete video that is used in projects');
  }

  // Delete physical file
  if (video.originalUrl) {
    try {
      await fs.unlink(video.originalUrl);
    } catch (error) {
      console.error('Error deleting video file:', error);
      // Continue with database deletion even if file deletion fails
    }
  }

  // Delete from database
  await prisma.video.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Video deleted successfully',
  });
}));

/**
 * GET /api/videos/stats
 * Get video statistics for the organization
 */
router.get('/stats', authMiddleware, asyncHandler(async (req: any, res) => {
  const organizationId = req.organizationId;

  const stats = await prisma.video.groupBy({
    by: ['status'],
    where: {
      organizationId,
    },
    _count: true,
    _sum: {
      fileSize: true,
      duration: true,
    },
  });

  const totalStats = await prisma.video.aggregate({
    where: {
      organizationId,
    },
    _count: true,
    _sum: {
      fileSize: true,
      duration: true,
    },
  });

  res.json({
    success: true,
    data: {
      total: {
        count: totalStats._count,
        fileSize: totalStats._sum.fileSize,
        duration: totalStats._sum.duration,
      },
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count,
          fileSize: stat._sum.fileSize,
          duration: stat._sum.duration,
        };
        return acc;
      }, {} as any),
    },
  });
}));

/**
 * GET /api/videos/processing/queue
 * Get video processing queue status
 */
router.get('/processing/queue', authMiddleware, asyncHandler(async (req: any, res) => {
  // Only admins can view queue stats
  if (req.user.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required');
  }

  const queueStats = jobQueue.getStats();
  const recentJobs = jobQueue.getJobs().slice(0, 10); // Last 10 jobs

  res.json({
    success: true,
    data: {
      stats: queueStats,
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt,
        processedAt: job.processedAt,
        error: job.error,
      })),
    },
  });
}));

/**
 * GET /api/videos/:id/processing
 * Get processing status for a specific video
 */
router.get('/:id/processing', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;

  const video = await prisma.video.findFirst({
    where: {
      id,
      organizationId,
    },
    select: {
      id: true,
      status: true,
      processingLogs: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  // Get related jobs from queue
  const jobs = jobQueue.getJobs({ type: 'video_processing' })
    .filter(job => job.data.videoId === id);

  res.json({
    success: true,
    data: {
      video,
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt,
        processedAt: job.processedAt,
        error: job.error,
      })),
    },
  });
}));

/**
 * POST /api/videos/:id/reprocess
 * Reprocess a video (Admin only)
 */
router.post('/:id/reprocess', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const organizationId = req.organizationId;

  // Check admin permission
  if (!['ADMIN', 'COACH'].includes(req.user.role)) {
    throw new HttpError(403, 'Insufficient permissions');
  }

  const video = await prisma.video.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!video || !video.originalUrl) {
    throw new HttpError(404, 'Video not found or original file missing');
  }

  // Reset video status
  await prisma.video.update({
    where: { id },
    data: {
      status: 'PROCESSING',
      processingLogs: null,
    },
  });

  // Add new processing job
  const jobId = jobQueue.addVideoProcessingJob(video.id, video.originalUrl, {
    generateThumbnails: true,
    createPreview: true,
    optimizeForWeb: true,
    generateHLS: true,
    qualities: ['1080p', '720p', '480p'],
  });

  res.json({
    success: true,
    data: {
      jobId,
      message: 'Video reprocessing started',
    },
  });
}));

export default router;