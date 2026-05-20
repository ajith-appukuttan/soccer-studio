import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Group,
  Text,
  ActionIcon,
  Paper,
  Stack,
  Slider,
  Badge,
  Tooltip,
  ScrollArea
} from '@mantine/core';
import {
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconZoomIn,
  IconZoomOut,
  IconFocus,
  IconBookmark,
  IconBookmarkFilled
} from '@tabler/icons-react';

interface FrameTimelineProps {
  currentTime: number;
  duration: number;
  fps?: number;
  annotations: any[];
  commentaries: any[];
  isVideoLoaded: boolean;
  onTimeChange: (time: number) => void;
  onFrameStep: (direction: 'forward' | 'backward') => void;
}

interface Marker {
  id: string;
  time: number;
  type: 'annotation' | 'commentary' | 'bookmark';
  color: string;
  label?: string;
}

export function FrameTimeline({
  currentTime,
  duration,
  fps = 30,
  annotations,
  commentaries,
  isVideoLoaded,
  onTimeChange,
  onFrameStep
}: FrameTimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewStart, setViewStart] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalFrames = Math.floor(duration * fps);
  const frameTime = 1 / fps;

  // Calculate visible time window based on zoom
  const visibleDuration = duration / zoomLevel;
  const actualViewStart = Math.max(0, Math.min(currentTime - visibleDuration / 2, duration - visibleDuration));
  const actualViewEnd = Math.min(duration, actualViewStart + visibleDuration);

  // Generate markers from annotations and commentaries
  const markers: Marker[] = [
    ...annotations.map(ann => ({
      id: ann.id,
      time: ann.startTime || ann.timestamp || 0,
      type: 'annotation' as const,
      color: ann.color || '#3b82f6',
      label: ann.type
    })),
    ...commentaries.map(comm => ({
      id: comm.id,
      time: comm.startTime,
      type: 'commentary' as const,
      color: '#ef4444',
      label: 'Commentary'
    })),
    ...bookmarks.map(time => ({
      id: `bookmark_${time}`,
      time,
      type: 'bookmark' as const,
      color: '#f59e0b',
      label: 'Bookmark'
    }))
  ];

  // Handle timeline click
  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const timelineWidth = rect.width;
    const clickRatio = clickX / timelineWidth;
    
    const clickedTime = actualViewStart + (clickRatio * (actualViewEnd - actualViewStart));
    onTimeChange(Math.max(0, Math.min(clickedTime, duration)));
  }, [actualViewStart, actualViewEnd, duration, onTimeChange]);

  // Handle drag
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(event);
  }, [handleTimelineClick]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleTimelineClick(event);
    }
  }, [isDragging, handleTimelineClick]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom controls
  const adjustZoom = (factor: number) => {
    setZoomLevel(prev => Math.max(1, Math.min(prev * factor, 100)));
  };

  // Add/remove bookmarks
  const toggleBookmark = () => {
    const currentTimeRounded = Math.round(currentTime * 100) / 100; // Round to 2 decimal places
    
    if (bookmarks.includes(currentTimeRounded)) {
      setBookmarks(prev => prev.filter(time => time !== currentTimeRounded));
    } else {
      setBookmarks(prev => [...prev, currentTimeRounded].sort((a, b) => a - b));
    }
  };

  const isBookmarked = bookmarks.some(time => Math.abs(time - currentTime) < frameTime);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);
    return `${mins}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  if (!isVideoLoaded) {
    return null;
  }

  return (
    <Paper p="sm" withBorder style={{ borderTop: '2px solid var(--mantine-color-blue-5)' }}>
      <Stack gap="sm">
        {/* Header with controls */}
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm" fw={600}>Frame Timeline</Text>
            <Badge variant="light" size="xs">
              {zoomLevel.toFixed(1)}x zoom
            </Badge>
            <Badge variant="light" size="xs" color="gray">
              {fps} FPS
            </Badge>
          </Group>

          <Group gap="xs">
            {/* Bookmark controls */}
            <Tooltip label={isBookmarked ? "Remove bookmark" : "Add bookmark"}>
              <ActionIcon
                size="sm"
                variant="light"
                color={isBookmarked ? "yellow" : "gray"}
                onClick={toggleBookmark}
              >
                {isBookmarked ? <IconBookmarkFilled size={14} /> : <IconBookmark size={14} />}
              </ActionIcon>
            </Tooltip>

            {/* Zoom controls */}
            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => adjustZoom(0.5)}
              disabled={zoomLevel <= 1}
            >
              <IconZoomOut size={14} />
            </ActionIcon>

            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => adjustZoom(2)}
              disabled={zoomLevel >= 100}
            >
              <IconZoomIn size={14} />
            </ActionIcon>

            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => setZoomLevel(1)}
              title="Reset zoom"
            >
              <IconFocus size={14} />
            </ActionIcon>

            {/* Frame navigation */}
            <ActionIcon
              size="sm"
              variant="filled"
              color="blue"
              onClick={() => onFrameStep('backward')}
            >
              <IconPlayerSkipBack size={14} />
            </ActionIcon>

            <ActionIcon
              size="sm"
              variant="filled"
              color="blue"
              onClick={() => onFrameStep('forward')}
            >
              <IconPlayerSkipForward size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Timeline visualization */}
        <Box>
          <Box
            ref={timelineRef}
            style={{
              height: 60,
              position: 'relative',
              background: 'var(--mantine-color-gray-1)',
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 4,
              cursor: 'crosshair',
              overflow: 'hidden'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Time markers */}
            {Array.from({ length: Math.ceil(visibleDuration) + 1 }).map((_, i) => {
              const time = actualViewStart + i;
              if (time > actualViewEnd) return null;
              
              const position = ((time - actualViewStart) / (actualViewEnd - actualViewStart)) * 100;
              
              return (
                <Box
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    top: 0,
                    bottom: 0,
                    borderLeft: '1px solid var(--mantine-color-gray-4)',
                    pointerEvents: 'none'
                  }}
                >
                  <Text
                    size="xs"
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      fontSize: 9,
                      color: 'var(--mantine-color-gray-6)'
                    }}
                  >
                    {formatTime(time)}
                  </Text>
                </Box>
              );
            })}

            {/* Frame markers (when zoomed in enough) */}
            {zoomLevel > 10 && Array.from({ 
              length: Math.ceil((actualViewEnd - actualViewStart) * fps) 
            }).map((_, i) => {
              const frameTime = actualViewStart + (i / fps);
              if (frameTime > actualViewEnd) return null;
              
              const position = ((frameTime - actualViewStart) / (actualViewEnd - actualViewStart)) * 100;
              
              return (
                <Box
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    top: '50%',
                    width: 1,
                    height: '25%',
                    background: 'var(--mantine-color-gray-5)',
                    pointerEvents: 'none'
                  }}
                />
              );
            })}

            {/* Annotation/Commentary markers */}
            {markers
              .filter(marker => marker.time >= actualViewStart && marker.time <= actualViewEnd)
              .map(marker => {
                const position = ((marker.time - actualViewStart) / (actualViewEnd - actualViewStart)) * 100;
                
                return (
                  <Tooltip key={marker.id} label={`${marker.label} at ${formatTime(marker.time)}`}>
                    <Box
                      style={{
                        position: 'absolute',
                        left: `${position}%`,
                        top: 0,
                        width: 3,
                        height: '100%',
                        background: marker.color,
                        opacity: 0.8,
                        cursor: 'pointer',
                        pointerEvents: 'auto'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimeChange(marker.time);
                      }}
                    />
                  </Tooltip>
                );
              })}

            {/* Current time indicator */}
            {currentTime >= actualViewStart && currentTime <= actualViewEnd && (
              <Box
                style={{
                  position: 'absolute',
                  left: `${((currentTime - actualViewStart) / (actualViewEnd - actualViewStart)) * 100}%`,
                  top: 0,
                  width: 2,
                  height: '100%',
                  background: 'var(--mantine-color-red-5)',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                <Box
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: -6,
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '8px solid var(--mantine-color-red-5)'
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Time range display */}
          <Group justify="space-between" mt="xs">
            <Text size="xs" c="dimmed">
              {formatTime(actualViewStart)}
            </Text>
            <Text size="xs" fw={500}>
              Frame: {Math.floor(currentTime * fps)} / {totalFrames}
            </Text>
            <Text size="xs" c="dimmed">
              {formatTime(actualViewEnd)}
            </Text>
          </Group>
        </Box>

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <ScrollArea>
            <Group gap="xs">
              <Text size="xs" c="dimmed">Bookmarks:</Text>
              {bookmarks.map(time => (
                <Badge
                  key={time}
                  size="xs"
                  variant="light"
                  color="yellow"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onTimeChange(time)}
                >
                  {formatTime(time)}
                </Badge>
              ))}
            </Group>
          </ScrollArea>
        )}
      </Stack>
    </Paper>
  );
}