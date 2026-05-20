import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from './database';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  bitrate: number;
  codec: string;
  fileSize: number;
}

export interface ProcessingOptions {
  generateThumbnails?: boolean;
  createPreview?: boolean;
  optimizeForWeb?: boolean;
  generateHLS?: boolean;
  qualities?: Array<'360p' | '480p' | '720p' | '1080p'>;
}

export class VideoProcessor {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    this.ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
  }

  /**
   * Extract detailed metadata from video file using ffprobe
   */
  async extractMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const ffprobe = spawn(this.ffprobePath, args);
      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        console.error('ffprobe stderr:', data.toString());
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}`));
          return;
        }

        try {
          const metadata = JSON.parse(output);
          const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
          
          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          resolve({
            duration: parseFloat(metadata.format.duration),
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
            format: metadata.format.format_name,
            bitrate: parseInt(metadata.format.bit_rate || '0'),
            codec: videoStream.codec_name,
            fileSize: parseInt(metadata.format.size),
          });
        } catch (error) {
          reject(new Error(`Failed to parse metadata: ${error}`));
        }
      });
    });
  }

  /**
   * Generate thumbnail images at specific timestamps
   */
  async generateThumbnails(
    inputPath: string,
    outputDir: string,
    timestamps: number[] = [10, 30, 60]
  ): Promise<string[]> {
    await fs.mkdir(outputDir, { recursive: true });
    const thumbnailPaths: string[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputPath = path.join(outputDir, `thumb_${i}_${timestamp}s.jpg`);
      
      await this.extractFrame(inputPath, outputPath, timestamp);
      thumbnailPaths.push(outputPath);
    }

    return thumbnailPaths;
  }

  /**
   * Extract a single frame at specific timestamp
   */
  private async extractFrame(inputPath: string, outputPath: string, timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-q:v', '2',
        '-y', // Overwrite output file
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);

      ffmpeg.stderr.on('data', (data) => {
        // FFmpeg outputs progress to stderr
        const message = data.toString();
        if (message.includes('frame=')) {
          // Progress update
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Create optimized versions for different qualities
   */
  async createMultiQuality(
    inputPath: string,
    outputDir: string,
    qualities: Array<'360p' | '480p' | '720p' | '1080p'> = ['720p', '480p']
  ): Promise<Record<string, string>> {
    await fs.mkdir(outputDir, { recursive: true });
    const outputs: Record<string, string> = {};

    const qualitySettings = {
      '360p': { width: 640, height: 360, bitrate: '1M' },
      '480p': { width: 854, height: 480, bitrate: '2M' },
      '720p': { width: 1280, height: 720, bitrate: '4M' },
      '1080p': { width: 1920, height: 1080, bitrate: '8M' },
    };

    for (const quality of qualities) {
      const settings = qualitySettings[quality];
      const outputPath = path.join(outputDir, `video_${quality}.mp4`);
      
      await this.transcodeVideo(inputPath, outputPath, settings);
      outputs[quality] = outputPath;
    }

    return outputs;
  }

  /**
   * Transcode video with specific settings
   */
  private async transcodeVideo(
    inputPath: string,
    outputPath: string,
    settings: { width: number; height: number; bitrate: string }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-vf', `scale=${settings.width}:${settings.height}`,
        '-b:v', settings.bitrate,
        '-b:a', '128k',
        '-preset', 'fast',
        '-movflags', '+faststart', // Optimize for web streaming
        '-y', // Overwrite output file
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);

      ffmpeg.stderr.on('data', (data) => {
        // Log progress (could emit events for real-time updates)
        const message = data.toString();
        if (message.includes('frame=')) {
          // Progress update - could emit to client via WebSocket
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Generate HLS (HTTP Live Streaming) playlist for adaptive bitrate streaming
   */
  async generateHLS(inputPath: string, outputDir: string): Promise<string> {
    await fs.mkdir(outputDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      const playlistPath = path.join(outputDir, 'playlist.m3u8');
      
      const args = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-hls_time', '10',
        '-hls_playlist_type', 'vod',
        '-hls_flags', 'single_file',
        '-hls_segment_filename', path.join(outputDir, 'segment%d.ts'),
        '-y',
        playlistPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);

      ffmpeg.stderr.on('data', (data) => {
        // Log progress
        console.log('HLS progress:', data.toString());
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(playlistPath);
        } else {
          reject(new Error(`FFmpeg HLS generation failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Create a preview/trailer version of the video
   */
  async createPreview(
    inputPath: string,
    outputPath: string,
    segments: Array<{ start: number; duration: number }> = [
      { start: 0, duration: 10 },
      { start: 300, duration: 10 },
      { start: 600, duration: 10 }
    ]
  ): Promise<void> {
    // Create individual segments
    const tempDir = path.join(path.dirname(outputPath), 'temp_preview');
    await fs.mkdir(tempDir, { recursive: true });

    const segmentPaths: string[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentPath = path.join(tempDir, `segment_${i}.mp4`);
      
      await this.extractSegment(inputPath, segmentPath, segment.start, segment.duration);
      segmentPaths.push(segmentPath);
    }

    // Concatenate segments
    await this.concatenateVideos(segmentPaths, outputPath);

    // Cleanup temp files
    await fs.rmdir(tempDir, { recursive: true });
  }

  /**
   * Extract a segment from video
   */
  private async extractSegment(
    inputPath: string,
    outputPath: string,
    start: number,
    duration: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-ss', start.toString(),
        '-t', duration.toString(),
        '-c', 'copy',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Segment extraction failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Concatenate multiple video files
   */
  private async concatenateVideos(inputPaths: string[], outputPath: string): Promise<void> {
    const listFile = path.join(path.dirname(outputPath), 'concat_list.txt');
    const listContent = inputPaths.map(p => `file '${p}'`).join('\n');
    
    await fs.writeFile(listFile, listContent);

    return new Promise((resolve, reject) => {
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn(this.ffmpegPath, args);

      ffmpeg.on('close', async (code) => {
        // Cleanup list file
        await fs.unlink(listFile).catch(() => {});

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Video concatenation failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Process video with all optimizations
   */
  async processVideo(
    videoId: string,
    inputPath: string,
    options: ProcessingOptions = {}
  ): Promise<void> {
    try {
      // Update status to processing
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'PROCESSING' },
      });

      const video = await prisma.video.findUnique({ where: { id: videoId } });
      if (!video) throw new Error('Video not found');

      // Extract metadata
      const metadata = await this.extractMetadata(inputPath);
      
      // Update video with metadata
      await prisma.video.update({
        where: { id: videoId },
        data: {
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          fps: metadata.fps,
          format: metadata.format,
          fileSize: BigInt(metadata.fileSize),
        },
      });

      const outputDir = path.join(path.dirname(inputPath), `processed_${videoId}`);
      await fs.mkdir(outputDir, { recursive: true });

      const results: any = {};

      // Generate thumbnails
      if (options.generateThumbnails !== false) {
        const thumbnailDir = path.join(outputDir, 'thumbnails');
        const thumbnails = await this.generateThumbnails(inputPath, thumbnailDir);
        results.thumbnails = thumbnails;
      }

      // Create multi-quality versions
      if (options.qualities && options.qualities.length > 0) {
        const qualityDir = path.join(outputDir, 'qualities');
        const qualities = await this.createMultiQuality(inputPath, qualityDir, options.qualities);
        results.qualities = qualities;
      }

      // Generate HLS
      if (options.generateHLS) {
        const hlsDir = path.join(outputDir, 'hls');
        const playlist = await this.generateHLS(inputPath, hlsDir);
        results.hls = playlist;
      }

      // Create preview
      if (options.createPreview) {
        const previewPath = path.join(outputDir, 'preview.mp4');
        await this.createPreview(inputPath, previewPath);
        results.preview = previewPath;
      }

      // Update video with processing results
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'READY',
          streamUrl: results.qualities?.['720p'] || `/api/videos/${videoId}/stream`,
          thumbnailUrl: results.thumbnails?.[0] ? `/api/videos/${videoId}/thumbnail` : undefined,
          processingLogs: results,
        },
      });

      console.log(`✅ Video processing completed for ${videoId}`);

    } catch (error) {
      console.error(`❌ Video processing failed for ${videoId}:`, error);
      
      // Update status to error
      await prisma.video.update({
        where: { id: videoId },
        data: { 
          status: 'ERROR',
          processingLogs: { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
        },
      });

      throw error;
    }
  }
}

// Export singleton instance
export const videoProcessor = new VideoProcessor();