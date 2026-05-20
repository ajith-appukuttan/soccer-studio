import { useEffect, useRef, useState } from 'react';
import { Box, Text, Button, Group } from '@mantine/core';

interface SimpleVideoPlayerProps {
  src: string;
}

export function SimpleVideoPlayer({ src }: SimpleVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;
    console.log('🎬 Simple player loading:', src);

    const handleLoadedData = () => {
      console.log('✅ Video loaded successfully!');
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      console.error('❌ Video failed to load');
      setError('Failed to load video');
      setIsLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    video.src = src;
    video.load();

    // Timeout
    const timeout = setTimeout(() => {
      if (video.readyState === 0) {
        setError('Video loading timed out');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [src]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  };

  if (!src) {
    return <Text>No video source</Text>;
  }

  return (
    <Box>
      {isLoading && <Text>Loading video...</Text>}
      {error && <Text c="red">Error: {error}</Text>}
      
      <video
        ref={videoRef}
        style={{
          width: '100%',
          maxHeight: '400px',
          display: 'block',
          backgroundColor: '#000'
        }}
        controls
        muted
        playsInline
      />
      
      <Group mt="sm">
        <Button onClick={togglePlay} disabled={isLoading || !!error}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Text size="sm">
          Ready State: {videoRef.current?.readyState || 0}
        </Text>
      </Group>
    </Box>
  );
}