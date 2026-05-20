import { useEffect, useRef, useState } from 'react';
import { Box, LoadingOverlay, Group, ActionIcon, Text, Slider, Alert } from '@mantine/core';
import { 
  IconPlayerPlay as IconPlay, 
  IconPlayerPause as IconPause, 
  IconVolume, 
  IconVolumeOff,
  IconAlertCircle,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconPlayerTrackPrev,
  IconPlayerTrackNext
} from '@tabler/icons-react';
import { AnnotationCanvas, type Annotation, type DrawingTool, type AnnotationCanvasRef } from './AnnotationCanvas';
import classes from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  currentTool: DrawingTool;
  annotations: Annotation[];
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onReady?: () => void;
  onPlayingStateChange?: (isPlaying: boolean) => void;
  onFrameStep?: (direction: 'forward' | 'backward') => void;
  onJumpTime?: (seconds: number) => void;
  onAnnotationAdd?: (annotation: Omit<Annotation, 'id'>) => void;
  onAnnotationUpdate?: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationDelete?: (id: string) => void;
}

export function VideoPlayer({ 
  src, 
  currentTool,
  annotations,
  onTimeUpdate, 
  onDurationChange, 
  onReady,
  onPlayingStateChange,
  onFrameStep,
  onJumpTime,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef = useRef<AnnotationCanvasRef>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [videoError, setVideoError] = useState<string | null>(null);
  const [fps, setFps] = useState(30); // Default FPS, will be calculated from video

  // Generate unique IDs for annotations
  const generateAnnotationId = () => {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAnnotationAdd = (annotation: Omit<Annotation, 'id'>) => {
    const annotationWithId = {
      ...annotation,
      id: generateAnnotationId()
    };
    onAnnotationAdd?.(annotationWithId);
  };

  // Initialize video
  useEffect(() => {
    console.log('🎥 VideoPlayer useEffect triggered:', { 
      hasVideoRef: !!videoRef.current, 
      src, 
      videoReadyState: videoRef.current?.readyState 
    });
    
    if (!videoRef.current || !src) {
      console.log('❌ Missing video ref or src');
      return;
    }

    const video = videoRef.current;
    console.log('📹 Video element:', {
      tagName: video.tagName,
      readyState: video.readyState,
      networkState: video.networkState
    });
    
    const handleLoadedData = () => {
      console.log('✅ Video loadeddata event!', {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState
      });
      
      const newDimensions = {
        width: video.videoWidth,
        height: video.videoHeight
      };
      setDimensions(newDimensions);
      setDuration(video.duration);
      setIsLoading(false);
      clearTimeout(loadTimeout);
      
      onDurationChange?.(video.duration);
      onReady?.();
    };

    const handleLoadedMetadata = () => {
      console.log('📋 Video metadata loaded!', {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState
      });
      
      // For metadata, we can also set dimensions
      if (video.videoWidth && video.videoHeight) {
        const newDimensions = {
          width: video.videoWidth,
          height: video.videoHeight
        };
        setDimensions(newDimensions);
      }
      
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlayingStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayingStateChange?.(false);
    };

    const handleLoadStart = () => {
      console.log('Video load started');
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      const errorMsg = `Video failed to load: ${(e.target as HTMLVideoElement)?.error?.message || 'Unknown error'}`;
      console.error('Video error:', errorMsg, e);
      setVideoError(errorMsg);
      setIsLoading(false);
    };



    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('error', handleError);

    // Set video source
    console.log('🎬 Setting video source:', src);
    setVideoError(null); // Clear any previous errors
    
    // Validate blob URL
    if (!src.startsWith('blob:')) {
      setVideoError('Invalid video source format');
      setIsLoading(false);
      return;
    }
    
    // Set video properties for better loading
    video.preload = 'metadata';
    video.src = src;
    
    // Load the video
    video.load();
    
    console.log('📼 Video loading started, networkState:', video.networkState);
    
    // Add timeout to prevent infinite loading
    const loadTimeout = setTimeout(() => {
      console.warn('⏰ Video loading timeout after 15 seconds');
      console.log('Video state at timeout:', {
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error,
        currentSrc: video.currentSrc
      });
      setVideoError('Video loading timeout - the file may be corrupted or unsupported');
      setIsLoading(false);
    }, 15000); // 15 second timeout

    return () => {
      clearTimeout(loadTimeout);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('error', handleError);
    };
  }, [src]); // Only depend on src changes

  // Keyboard controls for frame navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      // Only handle keyboard shortcuts when video is focused or when no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' || 
                            activeElement?.contentEditable === 'true';
      
      if (isInputFocused) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            jumpTime(-10); // 10 seconds back
          } else {
            stepFrame('backward'); // 1 frame back
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            jumpTime(10); // 10 seconds forward
          } else {
            stepFrame('forward'); // 1 frame forward
          }
          break;
        case 'Comma': // < key
          e.preventDefault();
          stepFrame('backward');
          break;
        case 'Period': // > key
          e.preventDefault();
          stepFrame('forward');
          break;
        case 'Home':
          e.preventDefault();
          handleTimeChange(0);
          break;
        case 'End':
          e.preventDefault();
          handleTimeChange(duration);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, fps]);

  const togglePlayPause = async () => {
    if (!videoRef.current) {
      console.log('Video ref not available');
      return;
    }
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
        console.log('Video paused');
      } else {
        await videoRef.current.play();
        console.log('Video playing');
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleTimeChange = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Frame-by-frame navigation
  const stepFrame = (direction: 'forward' | 'backward') => {
    if (!videoRef.current) return;
    
    const frameTime = 1 / fps;
    const newTime = direction === 'forward' 
      ? Math.min(videoRef.current.currentTime + frameTime, duration)
      : Math.max(videoRef.current.currentTime - frameTime, 0);
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onFrameStep?.(direction);
  };

  // Jump by seconds
  const jumpTime = (seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onJumpTime?.(seconds);
  };

  // Precise seeking to specific frame
  const seekToFrame = (frameNumber: number) => {
    if (!videoRef.current) return;
    
    const frameTime = frameNumber / fps;
    const newTime = Math.max(0, Math.min(frameTime, duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Get current frame number
  const getCurrentFrame = () => {
    return Math.floor(currentTime * fps);
  };

  // Get total frames
  const getTotalFrames = () => {
    return Math.floor(duration * fps);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!src) {
    return (
      <Box p="md" ta="center" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text c="dimmed" size="lg">No video loaded. Upload a video from the Videos page to get started.</Text>
      </Box>
    );
  }

  console.log('VideoPlayer rendering with src:', src, 'isLoading:', isLoading, 'isPlaying:', isPlaying);

  return (
    <Box ref={containerRef} className={classes.container} style={{ position: 'relative' }}>
      <LoadingOverlay visible={isLoading} />
      
      {/* Error Display */}
      {videoError && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
          {videoError}
        </Alert>
      )}
      
      {/* Video Element */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '70vh',
          display: 'block'
        }}
        controls={false}
        preload="metadata"
        playsInline
        muted={true}
        onContextMenu={(e) => e.preventDefault()}

      />

      {/* Annotation Canvas Overlay */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <AnnotationCanvas
          ref={annotationCanvasRef}
          width={dimensions.width}
          height={dimensions.height}
          currentTool={currentTool}
          currentTime={currentTime}
          annotations={annotations}
          onAnnotationAdd={handleAnnotationAdd}
          onAnnotationUpdate={onAnnotationUpdate || (() => {})}
          onAnnotationDelete={onAnnotationDelete || (() => {})}
        />
      )}

      {/* Custom Controls */}
      <Box 
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 12px',
          color: 'white'
        }}
      >
        <Group justify="space-between" gap="sm">
          {/* Play/Pause and Frame Controls */}
          <Group gap="sm" style={{ flex: 1 }}>
            {/* Jump back 10 seconds */}
            <ActionIcon 
              variant="subtle" 
              color="white" 
              onClick={() => jumpTime(-10)}
              disabled={!videoRef.current || isLoading || !!videoError}
              title="Jump back 10 seconds (Shift + ←)"
            >
              <IconPlayerTrackPrev size={18} />
            </ActionIcon>

            {/* Previous frame */}
            <ActionIcon 
              variant="subtle" 
              color="white" 
              onClick={() => stepFrame('backward')}
              disabled={!videoRef.current || isLoading || !!videoError}
              title="Previous frame (← or ,)"
            >
              <IconPlayerSkipBack size={18} />
            </ActionIcon>

            {/* Play/Pause */}
            <ActionIcon 
              variant="subtle" 
              color="white" 
              onClick={togglePlayPause}
              disabled={!videoRef.current || isLoading || !!videoError}
              title="Play/Pause (Space)"
            >
              {isPlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
            </ActionIcon>

            {/* Next frame */}
            <ActionIcon 
              variant="subtle" 
              color="white" 
              onClick={() => stepFrame('forward')}
              disabled={!videoRef.current || isLoading || !!videoError}
              title="Next frame (→ or .)"
            >
              <IconPlayerSkipForward size={18} />
            </ActionIcon>

            {/* Jump forward 10 seconds */}
            <ActionIcon 
              variant="subtle" 
              color="white" 
              onClick={() => jumpTime(10)}
              disabled={!videoRef.current || isLoading || !!videoError}
              title="Jump forward 10 seconds (Shift + →)"
            >
              <IconPlayerTrackNext size={18} />
            </ActionIcon>
            
            <Text size="sm" c="white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
            
            <Text size="xs" c="dimmed">
              Frame: {getCurrentFrame()} / {getTotalFrames()}
            </Text>
          </Group>

          {/* Timeline Slider */}
          <Box style={{ flex: 3, marginLeft: 12, marginRight: 12 }}>
            <Slider
              value={currentTime}
              onChange={handleTimeChange}
              min={0}
              max={duration}
              step={0.1}
              size="sm"
              color="blue"
            />
          </Box>

          {/* Volume Controls */}
          <Group gap="sm" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <ActionIcon 
              variant="subtle" 
              color="white" 
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
            </ActionIcon>
            
            <Box style={{ width: 60 }}>
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.05}
                size="sm"
                color="blue"
              />
            </Box>
          </Group>
        </Group>
      </Box>
    </Box>
  );
}