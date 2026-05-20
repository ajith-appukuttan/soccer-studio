import { useState, useEffect } from 'react';
import {
  Box,
  Group,
  Text,
  ActionIcon,
  NumberInput,
  Slider,
  Paper,
  Stack,
  Divider,
  Badge,
  Tooltip
} from '@mantine/core';
import {
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconPlayerTrackPrev,
  IconPlayerTrackNext,

  IconZoomIn,
  IconZoomOut
} from '@tabler/icons-react';

interface FrameNavigatorProps {
  currentTime: number;
  duration: number;
  fps?: number;
  isVideoLoaded: boolean;
  onTimeChange: (time: number) => void;
  onFrameStep: (direction: 'forward' | 'backward') => void;
  onJumpTime: (seconds: number) => void;
}

export function FrameNavigator({
  currentTime,
  duration,
  fps = 30,
  isVideoLoaded,
  onTimeChange,
  onFrameStep,
  onJumpTime
}: FrameNavigatorProps) {
  const [frameNumber, setFrameNumber] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(duration);

  // Update frame number when time changes
  useEffect(() => {
    setFrameNumber(Math.floor(currentTime * fps));
  }, [currentTime, fps]);

  // Update view window when duration changes
  useEffect(() => {
    setViewEnd(duration);
  }, [duration]);

  const totalFrames = Math.floor(duration * fps);
  const frameTime = 1 / fps;

  const handleFrameNumberChange = (value: number | string) => {
    if (typeof value === 'number' && !isNaN(value)) {
      const clampedFrame = Math.max(0, Math.min(value, totalFrames));
      const time = clampedFrame * frameTime;
      onTimeChange(time);
    }
  };

  const handleTimeSliderChange = (time: number) => {
    onTimeChange(time);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);
    return `${mins}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  const formatTimeCode = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // Calculate zoom window
  const zoomDuration = duration / zoomLevel;
  const zoomStart = Math.max(0, Math.min(currentTime - zoomDuration / 2, duration - zoomDuration));
  const zoomEnd = Math.min(duration, zoomStart + zoomDuration);

  const adjustZoom = (newZoomLevel: number) => {
    setZoomLevel(Math.max(1, Math.min(newZoomLevel, 50)));
  };

  if (!isVideoLoaded) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed" ta="center">Load a video to enable frame navigation</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Text fw={600}>Frame Navigator</Text>
          <Badge variant="light" color="blue">
            {fps} FPS
          </Badge>
        </Group>

        {/* Frame Controls */}
        <Group justify="center" gap="xs">
          <Tooltip label="Jump back 10s (Shift + ←)">
            <ActionIcon onClick={() => onJumpTime(-10)} variant="light">
              <IconPlayerTrackPrev size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Jump back 1s">
            <ActionIcon onClick={() => onJumpTime(-1)} variant="light" size="sm">
              <IconPlayerSkipBack size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Previous frame (← or ,)">
            <ActionIcon 
              onClick={() => onFrameStep('backward')} 
              variant="filled" 
              color="blue"
            >
              <IconPlayerSkipBack size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Next frame (→ or .)">
            <ActionIcon 
              onClick={() => onFrameStep('forward')} 
              variant="filled" 
              color="blue"
            >
              <IconPlayerSkipForward size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Jump forward 1s">
            <ActionIcon onClick={() => onJumpTime(1)} variant="light" size="sm">
              <IconPlayerSkipForward size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Jump forward 10s (Shift + →)">
            <ActionIcon onClick={() => onJumpTime(10)} variant="light">
              <IconPlayerTrackNext size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        {/* Time Information */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Time Code</Text>
            <Text size="sm" c="blue" fw={600} family="monospace">
              {formatTimeCode(currentTime)}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm" fw={500}>Frame</Text>
            <Group gap="xs">
              <NumberInput
                value={frameNumber}
                onChange={handleFrameNumberChange}
                min={0}
                max={totalFrames}
                size="xs"
                w={80}
                hideControls
              />
              <Text size="sm" c="dimmed">/ {totalFrames}</Text>
            </Group>
          </Group>

          <Group justify="space-between">
            <Text size="sm" fw={500}>Time</Text>
            <Text size="sm" c="dimmed" family="monospace">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </Group>
        </Stack>

        <Divider />

        {/* Timeline Zoom Controls */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Timeline Zoom</Text>
            <Group gap="xs">
              <ActionIcon 
                size="xs" 
                variant="light" 
                onClick={() => adjustZoom(zoomLevel / 2)}
                disabled={zoomLevel <= 1}
              >
                <IconZoomOut size={12} />
              </ActionIcon>
              <Text size="xs" c="dimmed" w={30} ta="center">
                {zoomLevel.toFixed(1)}x
              </Text>
              <ActionIcon 
                size="xs" 
                variant="light" 
                onClick={() => adjustZoom(zoomLevel * 2)}
                disabled={zoomLevel >= 50}
              >
                <IconZoomIn size={12} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Zoomed Timeline Slider */}
          <Box>
            <Slider
              value={currentTime}
              onChange={handleTimeSliderChange}
              min={zoomLevel > 1 ? zoomStart : 0}
              max={zoomLevel > 1 ? zoomEnd : duration}
              step={frameTime}
              size="lg"
              color="blue"
              marks={zoomLevel > 1 ? [
                { value: zoomStart, label: formatTime(zoomStart) },
                { value: zoomEnd, label: formatTime(zoomEnd) }
              ] : [
                { value: 0, label: '0:00' },
                { value: duration, label: formatTime(duration) }
              ]}
            />
          </Box>
        </Stack>

        {/* Precise Navigation Shortcuts */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>Keyboard Shortcuts</Text>
          <Box>
            <Group gap="md" style={{ fontSize: '11px', color: 'var(--mantine-color-dimmed)' }}>
              <Text size="xs">← / , : Prev frame</Text>
              <Text size="xs">→ / . : Next frame</Text>
              <Text size="xs">Shift + ← : -10s</Text>
              <Text size="xs">Shift + → : +10s</Text>
              <Text size="xs">Space : Play/Pause</Text>
            </Group>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}