// Client-side video processing service for Soccer Studio
// Handles video upload, metadata extraction, and thumbnail generation

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}

export interface VideoProject {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  lastModified: string;
  video: {
    name: string;
    duration: number;
    dimensions: { width: number; height: number };
    size: number;
    type: string;
    blobRef: string;
  };
  annotations: any[];
  commentaries: any[]; // Audio commentaries
  settings: {
    fieldType: string;
    defaultColors: string[];
    autoSave: boolean;
  };
}

export interface ThumbnailData {
  timestamp: number;
  dataUrl: string;
}

class ClientVideoService {
  private dbName = 'SoccerStudioDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('thumbnails')) {
          const thumbnailStore = db.createObjectStore('thumbnails', { keyPath: 'id' });
          thumbnailStore.createIndex('projectId', 'projectId', { unique: false });
        }
      };
    });
  }

  // Extract video metadata with timeout
  async extractVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      console.log('🔍 Starting metadata extraction for:', file.name, 'Size:', file.size);

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        console.error('❌ Metadata extraction timed out for:', file.name);
        reject(new Error('Video metadata extraction timed out'));
      }, 15000); // 15 second timeout

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        console.log('✅ Metadata extracted successfully:', {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size
        });
        
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          type: file.type,
          name: file.name
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = (e) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        console.error('❌ Video error during metadata extraction:', e);
        reject(new Error('Failed to load video metadata - file may be corrupted or unsupported'));
      };

      video.onloadstart = () => {
        console.log('📥 Video load started for metadata extraction');
      };

      video.onprogress = () => {
        console.log('📊 Video loading progress...');
      };

      // Set video source and trigger load
      video.preload = 'metadata';
      video.src = url;
      video.load();
    });
  }

  // Generate thumbnails at specified intervals (IMPROVED VERSION)
  async generateThumbnails(
    file: File, 
    intervalSeconds: number = 10,
    onProgress?: (progress: number) => void
  ): Promise<ThumbnailData[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const url = URL.createObjectURL(file);
      const thumbnails: ThumbnailData[] = [];
      let seekTimeout: number;

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context not available'));
        return;
      }

      // Overall timeout to prevent infinite hanging
      const overallTimeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        clearTimeout(seekTimeout);
        console.warn('Thumbnail generation timed out, returning partial results');
        resolve(thumbnails); // Return whatever we have so far
      }, 30000); // 30 second max

      video.onloadedmetadata = () => {
        if (video.duration === 0 || !isFinite(video.duration)) {
          clearTimeout(overallTimeout);
          URL.revokeObjectURL(url);
          reject(new Error('Invalid video duration'));
          return;
        }

        canvas.width = 320;
        canvas.height = (video.videoHeight / video.videoWidth) * 320;

        // Limit thumbnails to prevent excessive generation
        const maxThumbnails = 10;
        const actualInterval = Math.max(intervalSeconds, video.duration / maxThumbnails);
        const totalThumbnails = Math.min(maxThumbnails, Math.floor(video.duration / actualInterval));
        let currentThumbnail = 0;

        const generateNextThumbnail = () => {
          if (currentThumbnail >= totalThumbnails) {
            clearTimeout(overallTimeout);
            clearTimeout(seekTimeout);
            URL.revokeObjectURL(url);
            resolve(thumbnails);
            return;
          }

          const timestamp = Math.min(currentThumbnail * actualInterval, video.duration - 0.1);
          
          // Timeout for individual seek operation
          seekTimeout = setTimeout(() => {
            console.warn('Seek operation timed out, skipping thumbnail');
            currentThumbnail++;
            onProgress?.((currentThumbnail / totalThumbnails) * 100);
            generateNextThumbnail();
          }, 5000) as unknown as number;

          video.currentTime = timestamp;
        };

        video.onseeked = () => {
          clearTimeout(seekTimeout);
          
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            thumbnails.push({
              timestamp: video.currentTime,
              dataUrl
            });
          } catch (error) {
            console.warn('Failed to generate thumbnail:', error);
          }

          currentThumbnail++;
          onProgress?.((currentThumbnail / totalThumbnails) * 100);
          generateNextThumbnail();
        };

        generateNextThumbnail();
      };

      video.onerror = () => {
        clearTimeout(overallTimeout);
        clearTimeout(seekTimeout);
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video for thumbnail generation'));
      };

      video.src = url;
    });
  }

  // Store video in IndexedDB
  async storeVideo(file: File, videoId: string): Promise<string> {
    if (!this.db) {
      await this.initDB();
    }

    console.log('Storing video file:', {
      id: videoId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    return new Promise(async (resolve, reject) => {
      try {
        // Convert File to ArrayBuffer for more reliable storage
        const arrayBuffer = await file.arrayBuffer();
        console.log('Converted file to ArrayBuffer, size:', arrayBuffer.byteLength);

        const transaction = this.db!.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');

        const videoData = {
          id: videoId,
          arrayBuffer: arrayBuffer,
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          createdAt: new Date().toISOString()
        };

        const request = store.put(videoData);

        request.onsuccess = () => {
          console.log('Video file stored successfully with ID:', videoId);
          resolve(videoId);
        };

        request.onerror = () => {
          console.error('Failed to store video:', request.error);
          reject(new Error('Failed to store video'));
        };
      } catch (error) {
        console.error('Error converting file to ArrayBuffer:', error);
        reject(error);
      }
    });
  }

  // Store thumbnails
  async storeThumbnails(projectId: string, thumbnails: ThumbnailData[]): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['thumbnails'], 'readwrite');
      const store = transaction.objectStore('thumbnails');

      const promises = thumbnails.map((thumbnail, index) => {
        return new Promise<void>((resolveThumb, rejectThumb) => {
          const thumbnailData = {
            id: `${projectId}_thumb_${index}`,
            projectId,
            timestamp: thumbnail.timestamp,
            dataUrl: thumbnail.dataUrl
          };

          const request = store.put(thumbnailData);
          request.onsuccess = () => resolveThumb();
          request.onerror = () => rejectThumb(new Error('Failed to store thumbnail'));
        });
      });

      Promise.all(promises)
        .then(() => resolve())
        .catch(reject);
    });
  }

  // Create a new project
  async createProject(
    file: File, 
    title: string, 
    description?: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<VideoProject> {
    if (!this.db) {
      await this.initDB();
    }

    const projectId = this.generateId();
    const videoId = this.generateId();

    try {
      // Extract metadata with fallback
      onProgress?.('Extracting video metadata', 10);
      let metadata: VideoMetadata;
      
      try {
        metadata = await this.extractVideoMetadata(file);
      } catch (error) {
        console.warn('⚠️ Metadata extraction failed, using basic file info:', error);
        // Fallback to basic file information
        metadata = {
          duration: 0, // Will be unknown
          width: 1920, // Default assumption
          height: 1080, // Default assumption
          size: file.size,
          type: file.type,
          name: file.name
        };
      }

      // Store video file
      onProgress?.('Storing video file', 30);
      await this.storeVideo(file, videoId);

      // Skip thumbnail generation for now to prevent hanging
      onProgress?.('Skipping thumbnails for faster upload', 70);
      
      // TODO: Re-enable thumbnail generation with better error handling
      // const thumbnails = await this.generateThumbnails(file, 10, (thumbProgress) => {
      //   onProgress?.('Generating thumbnails', 50 + (thumbProgress * 0.3));
      // });
      // await this.storeThumbnails(projectId, thumbnails);

      // Create project
      const project: VideoProject = {
        id: projectId,
        title,
        description,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        video: {
          name: metadata.name,
          duration: metadata.duration,
          dimensions: { width: metadata.width, height: metadata.height },
          size: metadata.size,
          type: metadata.type,
          blobRef: videoId
        },
        annotations: [],
        commentaries: [],
        settings: {
          fieldType: 'full',
          defaultColors: ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'],
          autoSave: true
        }
      };

      // Store project
      await this.storeProject(project);
      
      onProgress?.('Complete', 100);
      return project;

    } catch (error) {
      // Cleanup on error
      await this.deleteVideo(videoId);
      await this.deleteThumbnails(projectId);
      throw error;
    }
  }

  // Store project in IndexedDB
  async storeProject(project: VideoProject): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');

      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store project'));
    });
  }

  // Get video blob URL for playback
  async getVideoBlob(videoId: string): Promise<string> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videos'], 'readonly');
      const store = transaction.objectStore('videos');

      const request = store.get(videoId);

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          console.error('Video not found in database for ID:', videoId);
          reject(new Error('Video not found'));
          return;
        }

        console.log('Found video data:', {
          id: result.id,
          name: result.name,
          type: result.type,
          size: result.size,
          hasArrayBuffer: !!result.arrayBuffer,
          hasFile: !!result.file
        });

        // Handle both old format (File) and new format (ArrayBuffer)
        if (result.arrayBuffer) {
          // New format: ArrayBuffer
          try {
            const blob = new Blob([result.arrayBuffer], { type: result.type });
            console.log('Created blob from ArrayBuffer:', blob.size, 'bytes');
            
            if (blob.size === 0) {
              console.error('Created blob is empty!');
              reject(new Error('Video data is empty'));
              return;
            }
            
            const url = URL.createObjectURL(blob);
            console.log('Created blob URL:', url);
            resolve(url);
          } catch (error) {
            console.error('Error creating blob from ArrayBuffer:', error);
            reject(new Error('Failed to create video blob'));
          }
        } else if (result.file) {
          // Old format: File object (for backward compatibility)
          console.log('Using legacy File object format');
          const url = URL.createObjectURL(result.file);
          resolve(url);
        } else {
          console.error('No video data found (neither ArrayBuffer nor File)');
          reject(new Error('Invalid video data format'));
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve video'));
      };
    });
  }

  // Get all projects
  async getProjects(): Promise<VideoProject[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve projects'));
      };
    });
  }

  // Get project by ID
  async getProject(projectId: string): Promise<VideoProject | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');

      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve project'));
      };
    });
  }

  // Update project
  async updateProject(project: VideoProject): Promise<void> {
    project.lastModified = new Date().toISOString();
    return this.storeProject(project);
  }

  // Delete project and associated data
  async deleteProject(projectId: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const project = await this.getProject(projectId);
    if (!project) return;

    // Delete video file
    await this.deleteVideo(project.video.blobRef);
    
    // Delete thumbnails
    await this.deleteThumbnails(projectId);

    // Delete project
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');

      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete project'));
    });
  }

  // Cleanup methods
  private async deleteVideo(videoId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const request = store.delete(videoId);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // Don't fail on cleanup errors
    });
  }

  private async deleteThumbnails(projectId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['thumbnails'], 'readwrite');
      const store = transaction.objectStore('thumbnails');
      const index = store.index('projectId');
      const request = index.openCursor(projectId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve(); // Don't fail on cleanup errors
    });
  }

  // Utility method to generate unique IDs
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get storage usage information
  async getStorageInfo(): Promise<{ used: number; quota: number; projects: number }> {
    const projects = await this.getProjects();
    const totalSize = projects.reduce((sum, project) => sum + project.video.size, 0);
    
    let quota = 0;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      quota = estimate.quota || 0;
    }

    return {
      used: totalSize,
      quota,
      projects: projects.length
    };
  }

  // Validate video file
  validateVideoFile(file: File): { valid: boolean; error?: string } {
    console.log('🔍 Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    const supportedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'];

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty or corrupted.'
      };
    }

    // Check file extension as fallback
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const supportedExtensions = ['mp4', 'mov', 'avi', 'webm'];
    
    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension || '')) {
      return {
        valid: false,
        error: `Unsupported video format: ${file.type || 'unknown'}. Please use MP4, MOV, AVI, or WebM.`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 2GB.`
      };
    }

    // Additional validation for small files that might be corrupted
    const minSize = 1024; // 1KB minimum
    if (file.size < minSize) {
      return {
        valid: false,
        error: 'File too small - may be corrupted or not a valid video file.'
      };
    }

    console.log('✅ File validation passed');
    return { valid: true };
  }
}

export const clientVideoService = new ClientVideoService();