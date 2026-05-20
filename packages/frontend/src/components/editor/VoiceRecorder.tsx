import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Group,
  Text,
  Progress,
  ActionIcon,
  Paper,
  Stack,
  Alert,
  Slider
} from '@mantine/core';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlayerPause,
  IconTrash,
  IconVolume,
  IconAlertCircle
} from '@tabler/icons-react';
import { audioRecordingService, type AudioCommentary, type RecordingState } from '@/services/audioRecordingService';

interface VoiceRecorderProps {
  videoCurrentTime: number;
  isVideoPlaying: boolean;
  onCommentaryAdd: (commentary: AudioCommentary) => void;
  commentaries: AudioCommentary[];
  onCommentaryDelete: (id: string) => void;
  onCommentaryVolumeChange: (id: string, volume: number) => void;
}

export function VoiceRecorder({
  videoCurrentTime,
  isVideoPlaying,
  onCommentaryAdd,
  commentaries,
  onCommentaryDelete,
  onCommentaryVolumeChange
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    volume: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingCommentary, setPlayingCommentary] = useState<string | null>(null);
  const intervalRef = useRef<number>();

  // Initialize audio recording when component mounts
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (audioRecordingService.isRecordingSupported()) {
          await audioRecordingService.initializeRecording();
          setIsInitialized(true);
          setError(null);
        } else {
          setError('Audio recording not supported in this browser');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize recording');
      }
    };

    initAudio();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      audioRecordingService.cleanup();
    };
  }, []);

  // Update recording state periodically
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      intervalRef.current = setInterval(() => {
        const state = audioRecordingService.getRecordingState();
        setRecordingState(state);
      }, 100) as unknown as number;

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startRecording = async () => {
    try {
      audioRecordingService.startRecording(videoCurrentTime);
      setRecordingState(prev => ({ ...prev, isRecording: true, isPaused: false }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      const commentary = await audioRecordingService.stopRecording();
      onCommentaryAdd(commentary);
      setRecordingState(prev => ({ ...prev, isRecording: false, isPaused: false }));
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  const pauseRecording = () => {
    audioRecordingService.pauseRecording();
    setRecordingState(prev => ({ ...prev, isPaused: true }));
  };

  const resumeRecording = () => {
    audioRecordingService.resumeRecording();
    setRecordingState(prev => ({ ...prev, isPaused: false }));
  };

  const playCommentary = async (commentary: AudioCommentary) => {
    try {
      setPlayingCommentary(commentary.id);
      await audioRecordingService.playCommentary(commentary);
      setPlayingCommentary(null);
    } catch (err) {
      console.error('Failed to play commentary:', err);
      setPlayingCommentary(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get commentaries visible at current time
  const visibleCommentaries = commentaries.filter(
    commentary => 
      videoCurrentTime >= commentary.startTime && 
      videoCurrentTime <= commentary.endTime
  );

  if (!isInitialized) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group>
            <IconMicrophone size={20} />
            <Text fw={600}>Voice Commentary</Text>
          </Group>
          
          {error ? (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error}
            </Alert>
          ) : (
            <Text size="sm" c="dimmed">Initializing microphone...</Text>
          )}
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconMicrophone size={20} />
            <Text fw={600}>Voice Commentary</Text>
          </Group>
          <Text size="xs" c="dimmed">
            {formatTime(videoCurrentTime)}
          </Text>
        </Group>

        {/* Recording Controls */}
        <Box>
          {!recordingState.isRecording ? (
            <Button
              leftSection={<IconMicrophone size={16} />}
              onClick={startRecording}
              color="red"
              variant="filled"
              size="sm"
              disabled={!isInitialized}
              fullWidth
            >
              Start Recording Commentary
            </Button>
          ) : (
            <Stack gap="sm">
              <Group justify="space-between">
                <Group gap="xs">
                  {recordingState.isPaused ? (
                    <ActionIcon onClick={resumeRecording} color="green" size="sm">
                      <IconPlayerPlay size={14} />
                    </ActionIcon>
                  ) : (
                    <ActionIcon onClick={pauseRecording} color="yellow" size="sm">
                      <IconPlayerPause size={14} />
                    </ActionIcon>
                  )}
                  <ActionIcon onClick={stopRecording} color="red" size="sm">
                    <IconPlayerStop size={14} />
                  </ActionIcon>
                </Group>
                
                <Text size="sm" fw={500}>
                  {formatTime(recordingState.currentTime)}
                </Text>
              </Group>

              {/* Volume meter */}
              <Box>
                <Text size="xs" c="dimmed" mb={4}>Recording level</Text>
                <Progress
                  value={recordingState.volume * 100}
                  color={recordingState.volume > 0.8 ? 'red' : recordingState.volume > 0.5 ? 'yellow' : 'green'}
                  size="sm"
                />
              </Box>

              {recordingState.isPaused && (
                <Alert color="yellow">
                  Recording paused - click play to continue
                </Alert>
              )}
            </Stack>
          )}
        </Box>

        {/* Current Commentaries */}
        {visibleCommentaries.length > 0 && (
          <Box>
            <Text size="sm" fw={600} mb="xs">
              Active Commentary
            </Text>
            {visibleCommentaries.map((commentary) => (
              <Paper key={commentary.id} p="xs" withBorder bg="blue.0">
                <Group justify="space-between">
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="light"
                      onClick={() => playCommentary(commentary)}
                      loading={playingCommentary === commentary.id}
                    >
                      <IconPlayerPlay size={12} />
                    </ActionIcon>
                    <Text size="xs">
                      {formatTime(commentary.duration)} at {formatTime(commentary.startTime)}
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <IconVolume size={12} />
                    <Box w={40}>
                      <Slider
                        value={commentary.volume}
                        onChange={(volume) => onCommentaryVolumeChange(commentary.id, volume)}
                        min={0}
                        max={1}
                        step={0.1}
                        size="xs"
                      />
                    </Box>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="red"
                      onClick={() => onCommentaryDelete(commentary.id)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Box>
        )}

        {/* All Commentaries List */}
        {commentaries.length > 0 && (
          <Box>
            <Text size="sm" fw={600} mb="xs">
              All Commentary ({commentaries.length})
            </Text>
            <Stack gap="xs">
              {commentaries.map((commentary) => (
                <Paper key={commentary.id} p="xs" withBorder>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => playCommentary(commentary)}
                        loading={playingCommentary === commentary.id}
                      >
                        <IconPlayerPlay size={12} />
                      </ActionIcon>
                      <Stack gap={0}>
                        <Text size="xs" fw={500}>
                          {formatTime(commentary.startTime)} - {formatTime(commentary.endTime)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatTime(commentary.duration)} duration
                        </Text>
                      </Stack>
                    </Group>
                    
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="red"
                      onClick={() => onCommentaryDelete(commentary.id)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}