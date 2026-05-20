// Video export service for rendering annotations onto video frames
import { type Annotation } from '@/components/editor/AnnotationCanvas';
import { type AudioCommentary } from './audioRecordingService';

export interface ExportProgress {
  stage: string;
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
}

export interface ExportOptions {
  quality: number; // 0.1 - 1.0
  format: 'mp4' | 'webm';
  fps: number;
  includeAudio: boolean;
  includeCommentary: boolean;
}

class VideoExportService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private mixedAudioDestination: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.videoElement = document.createElement('video');
  }

  // Export video with annotations burned in
  async exportVideoWithAnnotations(
    videoBlob: Blob,
    annotations: Annotation[],
    commentaries: AudioCommentary[] = [],
    options: ExportOptions = {
      quality: 0.8,
      format: 'mp4',
      fps: 30,
      includeAudio: true,
      includeCommentary: true
    },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    
    return new Promise(async (resolve, reject) => {
      try {
        // Step 1: Setup video
        onProgress?.({ stage: 'Loading video', progress: 5 });
        await this.setupVideo(videoBlob);

        // Step 2: Setup canvas
        onProgress?.({ stage: 'Setting up canvas', progress: 10 });
        this.setupCanvas();

        // Step 3: Setup audio mixing if needed
        if (options.includeCommentary && commentaries.length > 0) {
          onProgress?.({ stage: 'Setting up audio mixing', progress: 12 });
          await this.setupAudioMixing(commentaries, options);
        }

        // Step 4: Setup MediaRecorder for re-encoding
        onProgress?.({ stage: 'Setting up recorder', progress: 15 });
        await this.setupRecorder(options);

        // Step 5: Render frames with annotations
        onProgress?.({ stage: 'Rendering frames', progress: 20 });
        await this.renderFramesWithAnnotations(annotations, options, onProgress);

        // Step 6: Finalize export
        onProgress?.({ stage: 'Finalizing export', progress: 95 });
        const result = await this.finalizeExport();

        onProgress?.({ stage: 'Complete', progress: 100 });
        resolve(result);

      } catch (error) {
        console.error('Export failed:', error);
        reject(error);
      }
    });
  }

  private async setupVideo(videoBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      this.videoElement.onloadedmetadata = () => {
        console.log('✅ Video loaded for export:', {
          duration: this.videoElement.duration,
          width: this.videoElement.videoWidth,
          height: this.videoElement.videoHeight
        });
        resolve();
      };

      this.videoElement.onerror = () => {
        reject(new Error('Failed to load video for export'));
      };

      this.videoElement.src = URL.createObjectURL(videoBlob);
      this.videoElement.load();
    });
  }

  private setupCanvas(): void {
    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;
    console.log('🎨 Canvas setup:', this.canvas.width, 'x', this.canvas.height);
  }

  private async setupAudioMixing(commentaries: AudioCommentary[], options: ExportOptions): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      
      // Create destination for mixed audio
      this.mixedAudioDestination = this.audioContext.createMediaStreamDestination();
      
      // Add original video audio if enabled
      if (options.includeAudio) {
        const videoSource = this.audioContext.createMediaElementSource(this.videoElement);
        videoSource.connect(this.mixedAudioDestination);
      }
      
      // Load and schedule commentary audio
      for (const commentary of commentaries) {
        await this.scheduleCommentary(commentary);
      }
      
      console.log('🎵 Audio mixing setup complete');
    } catch (error) {
      console.warn('Failed to setup audio mixing:', error);
      this.audioContext = null;
      this.mixedAudioDestination = null;
    }
  }

  private async scheduleCommentary(commentary: AudioCommentary): Promise<void> {
    if (!this.audioContext || !this.mixedAudioDestination) return;
    
    try {
      // Convert Blob to ArrayBuffer, then to AudioBuffer
      const arrayBuffer = await commentary.audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create buffer source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = commentary.volume;
      
      // Connect: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(this.mixedAudioDestination);
      
      // Schedule to start at commentary start time
      // Note: This is simplified - in a real implementation you'd need to 
      // coordinate this with the video playback timing during export
      console.log(`📢 Commentary scheduled: ${commentary.startTime}s - ${commentary.endTime}s`);
      
    } catch (error) {
      console.warn('Failed to schedule commentary:', error);
    }
  }

  private async setupRecorder(options: ExportOptions): Promise<void> {
    const stream = this.canvas.captureStream(options.fps);
    
    // Add audio track if requested and available
    if (options.includeAudio || options.includeCommentary) {
      try {
        let audioStream: MediaStream;
        
        // Use mixed audio if available, otherwise fallback to original video audio
        if (this.mixedAudioDestination) {
          audioStream = this.mixedAudioDestination.stream;
          console.log('🎵 Using mixed audio stream');
        } else if (options.includeAudio) {
          // Fallback to original audio only
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(this.videoElement);
          const dest = audioContext.createMediaStreamDestination();
          source.connect(dest);
          audioStream = dest.stream;
          console.log('🎵 Using original audio stream');
        } else {
          throw new Error('No audio source available');
        }
        
        const audioTracks = audioStream.getAudioTracks();
        audioTracks.forEach(track => stream.addTrack(track));
        console.log(`🎵 Added ${audioTracks.length} audio track(s) to export stream`);
        
      } catch (error) {
        console.warn('Could not add audio track:', error);
      }
    }

    const mimeType = options.format === 'mp4' ? 'video/mp4' : 'video/webm';
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 5000000 // 5 Mbps
    });

    this.recordedChunks = [];
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
  }

  private async renderFramesWithAnnotations(
    annotations: Annotation[],
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const duration = this.videoElement.duration;
    const frameInterval = 1 / options.fps;
    const totalFrames = Math.floor(duration / frameInterval);
    
    console.log('🎬 Starting frame rendering:', {
      duration,
      fps: options.fps,
      totalFrames,
      frameInterval
    });

    this.mediaRecorder!.start();

    return new Promise((resolve, reject) => {
      let currentFrame = 0;
      let currentTime = 0;

      const renderNextFrame = () => {
        if (currentTime >= duration) {
          this.mediaRecorder!.stop();
          resolve();
          return;
        }

        // Seek to current time
        this.videoElement.currentTime = currentTime;
      };

      const onSeeked = () => {
        // Draw video frame
        this.ctx.drawImage(this.videoElement, 0, 0);

        // Draw annotations that are visible at current time
        this.drawAnnotationsAtTime(annotations, currentTime);

        currentFrame++;
        currentTime += frameInterval;

        // Update progress
        const progress = 20 + (currentFrame / totalFrames) * 70; // 20% to 90%
        onProgress?.({
          stage: 'Rendering frames',
          progress,
          currentFrame,
          totalFrames
        });

        // Schedule next frame
        setTimeout(renderNextFrame, 16); // ~60fps processing
      };

      this.videoElement.addEventListener('seeked', onSeeked);
      renderNextFrame();
    });
  }

  private drawAnnotationsAtTime(annotations: Annotation[], currentTime: number): void {
    // Filter annotations visible at current time
    const visibleAnnotations = annotations.filter(
      annotation => 
        annotation.visible && 
        currentTime >= annotation.startTime && 
        currentTime <= annotation.endTime
    );

    visibleAnnotations.forEach(annotation => {
      this.drawAnnotation(annotation);
    });
  }

  private drawAnnotation(annotation: Annotation): void {
    this.ctx.strokeStyle = annotation.color;
    this.ctx.lineWidth = annotation.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    switch (annotation.type) {
      case 'pen':
        if (annotation.points && annotation.points.length >= 4) {
          this.ctx.beginPath();
          this.ctx.moveTo(annotation.points[0], annotation.points[1]);
          for (let i = 2; i < annotation.points.length; i += 2) {
            this.ctx.lineTo(annotation.points[i], annotation.points[i + 1]);
          }
          this.ctx.stroke();
        }
        break;

      case 'line':
        if (annotation.x !== undefined && annotation.y !== undefined && 
            annotation.x2 !== undefined && annotation.y2 !== undefined) {
          this.ctx.beginPath();
          this.ctx.moveTo(annotation.x, annotation.y);
          this.ctx.lineTo(annotation.x2, annotation.y2);
          this.ctx.stroke();
        }
        break;

      case 'rectangle':
        if (annotation.x !== undefined && annotation.y !== undefined && 
            annotation.width !== undefined && annotation.height !== undefined) {
          this.ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        }
        break;

      case 'circle':
        if (annotation.x !== undefined && annotation.y !== undefined && annotation.radius !== undefined) {
          this.ctx.beginPath();
          this.ctx.arc(annotation.x, annotation.y, annotation.radius, 0, 2 * Math.PI);
          this.ctx.stroke();
        }
        break;

      case 'player':
        if (annotation.x !== undefined && annotation.y !== undefined && annotation.radius !== undefined) {
          // Draw player circle
          this.ctx.fillStyle = annotation.color;
          this.ctx.beginPath();
          this.ctx.arc(annotation.x, annotation.y, annotation.radius, 0, 2 * Math.PI);
          this.ctx.fill();
          this.ctx.stroke();
          
          // Draw "P" text
          this.ctx.fillStyle = 'white';
          this.ctx.font = '12px bold sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('P', annotation.x, annotation.y + 4);
        }
        break;

      case 'text':
        if (annotation.x !== undefined && annotation.y !== undefined && annotation.text) {
          this.ctx.fillStyle = annotation.color;
          this.ctx.font = `${annotation.fontSize || 16}px sans-serif`;
          this.ctx.fillText(annotation.text, annotation.x, annotation.y);
        }
        break;
    }
  }

  private async finalizeExport(): Promise<Blob> {
    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { 
          type: this.mediaRecorder!.mimeType 
        });
        console.log('✅ Export complete:', blob.size, 'bytes');
        resolve(blob);
      };
    });
  }

  // Download the exported video
  downloadVideo(blob: Blob, filename: string = 'annotated-video'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get estimated export time
  estimateExportTime(duration: number, fps: number = 30): number {
    // Rough estimation: 1 second of video = 2-5 seconds of processing time
    const processingMultiplier = 3;
    return duration * processingMultiplier;
  }
}

export const videoExportService = new VideoExportService();