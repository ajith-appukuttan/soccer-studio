import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Group,
  ActionIcon,
  Slider,
  Text,
  Button,
} from '@mantine/core';
import {
  IconArrowRight as IconCaretRight,
  IconSquare,
  IconArrowLeft as IconCaretLeft,
  IconArrowRight as IconCaretRightFilled,
  IconPlus as IconZoomIn,
  IconArrowLeft as IconZoomOut,
  IconRefresh as IconRestore,
} from '@tabler/icons-react';
import { useEditorStore } from '@/stores/editorStore';
import { formatTime } from '@shared/utils';
import classes from './Timeline.module.css';

export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  
  const {
    currentTime,
    duration,
    isPlaying,
    timelineZoom,
    timelineOffset,
    annotations,
    play,
    pause,
    setCurrentTime,
    setTimelineZoom,
    setTimelineOffset,
  } = useEditorStore();

  // Update timeline width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate timeline scale
  const pixelsPerSecond = 50 * timelineZoom;
  const totalTimelineWidth = duration * pixelsPerSecond;
  const currentTimePosition = currentTime * pixelsPerSecond;

  // Handle timeline click
  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left + timelineOffset;
    const clickTime = clickX / pixelsPerSecond;
    
    setCurrentTime(Math.max(0, Math.min(duration, clickTime)));
  }, [pixelsPerSecond, timelineOffset, duration, setCurrentTime]);

  // Render time scale marks
  const renderTimeScale = () => {
    const marks = [];
    const interval = timelineZoom > 2 ? 1 : timelineZoom > 0.5 ? 5 : 10; // seconds
    
    for (let time = 0; time <= duration; time += interval) {
      const x = time * pixelsPerSecond - timelineOffset;
      
      if (x >= -50 && x <= timelineWidth + 50) {
        marks.push(
          <div
            key={time}
            className={classes.timeMark}
            style={{ left: x }}
          >
            <div className={classes.timeMarkLine} />
            <Text size="xs" className={classes.timeMarkLabel}>
              {formatTime(time)}
            </Text>
          </div>
        );
      }
    }
    
    return marks;
  };

  // Render annotation markers
  const renderAnnotationMarkers = () => {
    return annotations.map((annotation) => {
      const x = annotation.timestamp * pixelsPerSecond - timelineOffset;
      
      if (x >= -10 && x <= timelineWidth + 10) {
        return (
          <div
            key={annotation.id}
            className={classes.annotationMarker}
            style={{ 
              left: x,
              backgroundColor: annotation.type === 'comment' ? '#ff6b6b' : '#339af0'
            }}
            title={`${annotation.type} at ${formatTime(annotation.timestamp)}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTime(annotation.timestamp);
            }}
          />
        );
      }
      
      return null;
    });
  };

  // Zoom controls
  const handleZoomIn = () => setTimelineZoom(Math.min(timelineZoom * 1.5, 10));
  const handleZoomOut = () => setTimelineZoom(Math.max(timelineZoom / 1.5, 0.1));
  const handleResetZoom = () => setTimelineZoom(1);

  // Playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSkipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 10));
  };

  // Auto-scroll timeline to follow playhead
  useEffect(() => {
    const playheadPosition = currentTimePosition - timelineOffset;
    const margin = timelineWidth * 0.1;
    
    if (playheadPosition < margin) {
      setTimelineOffset(Math.max(0, currentTimePosition - margin));
    } else if (playheadPosition > timelineWidth - margin) {
      setTimelineOffset(currentTimePosition - timelineWidth + margin);
    }
  }, [currentTime, currentTimePosition, timelineOffset, timelineWidth, setTimelineOffset]);

  return (
    <Paper className={classes.container} p="sm" withBorder>
      {/* Playback Controls */}
      <Group mb="sm" justify="space-between">
        <Group gap="xs">
          <ActionIcon onClick={handleSkipBackward} variant="subtle" size="sm">
            <IconCaretLeft size={16} />
          </ActionIcon>
          
          <ActionIcon onClick={handlePlayPause} variant="filled" size="lg">
            {isPlaying ? <IconSquare size={20} /> : <IconCaretRight size={20} />}
          </ActionIcon>
          
          <ActionIcon onClick={handleSkipForward} variant="subtle" size="sm">
            <IconCaretRightFilled size={16} />
          </ActionIcon>
          
          <Text size="sm" c="dimmed" ml="md">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </Group>
        
        <Group gap="xs">
          <ActionIcon onClick={handleZoomOut} variant="subtle" size="sm">
            <IconZoomOut size={16} />
          </ActionIcon>
          
          <ActionIcon onClick={handleResetZoom} variant="subtle" size="sm">
            <IconRestore size={16} />
          </ActionIcon>
          
          <ActionIcon onClick={handleZoomIn} variant="subtle" size="sm">
            <IconZoomIn size={16} />
          </ActionIcon>
          
          <Text size="xs" c="dimmed" w={60}>
            {Math.round(timelineZoom * 100)}%
          </Text>
        </Group>
      </Group>

      {/* Timeline */}
      <div className={classes.timelineWrapper}>
        <div 
          ref={timelineRef}
          className={classes.timeline}
          onClick={handleTimelineClick}
        >
          {/* Time scale */}
          <div className={classes.timeScale}>
            {renderTimeScale()}
          </div>
          
          {/* Timeline track */}
          <div className={classes.timelineTrack}>
            {/* Background */}
            <div 
              className={classes.timelineBackground}
              style={{ width: Math.max(timelineWidth, totalTimelineWidth) }}
            />
            
            {/* Annotation markers */}
            {renderAnnotationMarkers()}
            
            {/* Current time indicator */}
            <div
              className={classes.playhead}
              style={{ left: currentTimePosition - timelineOffset }}
            />
          </div>
        </div>
        
        {/* Horizontal scroll for timeline */}
        <Slider
          mt="xs"
          min={0}
          max={Math.max(0, totalTimelineWidth - timelineWidth)}
          value={timelineOffset}
          onChange={setTimelineOffset}
          size="xs"
          style={{ 
            opacity: totalTimelineWidth > timelineWidth ? 1 : 0,
            pointerEvents: totalTimelineWidth > timelineWidth ? 'auto' : 'none'
          }}
        />
      </div>
    </Paper>
  );
}