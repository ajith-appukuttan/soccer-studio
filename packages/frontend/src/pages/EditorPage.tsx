import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, LoadingOverlay, Notification, Group, Stack, Button, Progress, Text, Modal, Tooltip } from '@mantine/core';
import { IconX, IconDownload, IconVideo, IconPencil, IconMicrophone, IconCheck } from '@tabler/icons-react';
import { useEditorStore } from '@/stores/editorStore';
import { useVideoStore } from '@/stores/videoStore';
import { clientVideoService, type VideoProject } from '@/services/clientVideoService';
import { videoExportService, type ExportProgress, type ExportOptions } from '@/services/videoExportService';
import { VideoPlayer } from '@/components/editor/VideoPlayer';
import { SoccerToolPalette } from '@/components/editor/SoccerToolPalette';
import { VoiceRecorder } from '@/components/editor/VoiceRecorder';
import { FrameNavigator } from '@/components/editor/FrameNavigator';
import { FrameTimeline } from '@/components/editor/FrameTimeline';
import { type DrawingTool, type Annotation } from '@/components/editor/AnnotationCanvas';
import { type AudioCommentary } from '@/services/audioRecordingService';
import { Timeline } from '@/components/editor/Timeline';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';

export function EditorPage() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoProject, setVideoProject] = useState<VideoProject | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#FF0000',
    strokeWidth: 2
  });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [commentaries, setCommentaries] = useState<AudioCommentary[]>([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const videoAreaRef = useRef<HTMLDivElement>(null);

  const { currentProject, setCurrentProject, setCurrentTime } = useEditorStore();
  const { currentVideo, setCurrentVideo } = useVideoStore();

  // Get project ID from URL params or search params
  const actualProjectId = projectId || searchParams.get('project');

  // All useCallback hooks at the top level
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    setCurrentVideoTime(time);
  }, [setCurrentTime]);

  const handlePlayingStateChange = useCallback((playing: boolean) => {
    setIsVideoPlaying(playing);
  }, []);

  // Frame navigation handlers for FrameNavigator
  const handleFrameStep = useCallback((direction: 'forward' | 'backward') => {
    // This will be handled by VideoPlayer's frame stepping logic
    // We can trigger it through time updates
    const fps = 30; // Default FPS, could be dynamic
    const frameTime = 1 / fps;
    const newTime = direction === 'forward'
      ? Math.min(currentVideoTime + frameTime, duration)
      : Math.max(currentVideoTime - frameTime, 0);
    setCurrentTime(newTime);
  }, [currentVideoTime, duration]);

  const handleJumpTime = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(currentVideoTime + seconds, duration));
    setCurrentTime(newTime);
  }, [currentVideoTime, duration]);

  const handleVideoReady = useCallback(() => {
    // Handle when video is ready for playback
    console.log('Video ready for playback');
  }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    // Handle duration changes
    console.log('Duration changed:', newDuration);
    setDuration(newDuration);
  }, []);

  const handleReady = useCallback(() => {
    console.log('Video player ready');
  }, []);

  // Annotation handlers
  const handleAnnotationAdd = useCallback(async (annotation: Omit<Annotation, 'id'>) => {
    const newAnnotation = {
      ...annotation,
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);

    // Save to project
    if (videoProject) {
      const updatedProject = {
        ...videoProject,
        annotations: updatedAnnotations
      };
      setVideoProject(updatedProject);
      try {
        await clientVideoService.updateProject(updatedProject);
      } catch (error) {
        console.error('Failed to update project:', error);
      }
    }
  }, [annotations, videoProject]);

  const handleAnnotationUpdate = useCallback(async (id: string, updates: Partial<Annotation>) => {
    const updatedAnnotations = annotations.map(annotation =>
      annotation.id === id ? { ...annotation, ...updates } : annotation
    );
    setAnnotations(updatedAnnotations);

    // Save to project
    if (videoProject) {
      const updatedProject = {
        ...videoProject,
        annotations: updatedAnnotations
      };
      setVideoProject(updatedProject);
      try {
        await clientVideoService.updateProject(updatedProject);
      } catch (error) {
        console.error('Failed to update project:', error);
      }
    }
  }, [annotations, videoProject]);

  const handleAnnotationDelete = useCallback(async (id: string) => {
    const updatedAnnotations = annotations.filter(annotation => annotation.id !== id);
    setAnnotations(updatedAnnotations);

    // Save to project
    if (videoProject) {
      const updatedProject = {
        ...videoProject,
        annotations: updatedAnnotations
      };
      setVideoProject(updatedProject);
      try {
        await clientVideoService.updateProject(updatedProject);
      } catch (error) {
        console.error('Failed to update project:', error);
      }
    }
  }, [annotations, videoProject]);

  // Commentary handlers
  const handleCommentaryAdd = useCallback(async (commentary: AudioCommentary) => {
    const updatedCommentaries = [...commentaries, commentary];
    setCommentaries(updatedCommentaries);

    // Save to project
    if (videoProject) {
      const updatedProject = {
        ...videoProject,
        commentaries: updatedCommentaries
      };
      setVideoProject(updatedProject);
      try {
        await clientVideoService.updateProject(updatedProject);
      } catch (error) {
        console.error('Failed to update project with commentary:', error);
      }
    }
  }, [commentaries, videoProject]);

  const handleCommentaryDelete = useCallback(async (id: string) => {
    const updatedCommentaries = commentaries.filter(commentary => commentary.id !== id);
    setCommentaries(updatedCommentaries);

    // Save to project
    if (videoProject) {
      const updatedProject = {
        ...videoProject,
        commentaries: updatedCommentaries
      };
      setVideoProject(updatedProject);
      try {
        await clientVideoService.updateProject(updatedProject);
      } catch (error) {
        console.error('Failed to update project after commentary deletion:', error);
      }
    }
  }, [commentaries, videoProject]);

  const handleCommentaryVolumeChange = useCallback(async (id: string, volume: number) => {
    const updatedCommentaries = commentaries.map(commentary =>
      commentary.id === id ? { ...commentary, volume } : commentary
    );
    setCommentaries(updatedCommentaries);

    // Save to project
    if (videoProject) {
      const updatedProject = {
        ...videoProject,
        commentaries: updatedCommentaries
      };
      setVideoProject(updatedProject);
      try {
        await clientVideoService.updateProject(updatedProject);
      } catch (error) {
        console.error('Failed to update project with commentary volume:', error);
      }
    }
  }, [commentaries, videoProject]);

  // Export video with annotations
  const handleExportVideo = useCallback(async () => {
    if (!videoProject || !videoUrl) {
      alert('No video to export');
      return;
    }

    try {
      setIsExporting(true);
      setShowExportModal(true);
      setExportProgress({ stage: 'Starting export', progress: 0 });

      // Get the original video blob
      const response = await fetch(videoUrl);
      const videoBlob = await response.blob();

      const exportOptions: ExportOptions = {
        quality: 0.8,
        format: 'mp4',
        fps: 30,
        includeAudio: true,
        includeCommentary: commentaries.length > 0
      };

      // Export video with annotations and commentary
      const exportedBlob = await videoExportService.exportVideoWithAnnotations(
        videoBlob,
        annotations,
        commentaries,
        exportOptions,
        (progress) => {
          setExportProgress(progress);
        }
      );

      // Download the exported video
      const fileName = `${videoProject.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_annotated`;
      videoExportService.downloadVideo(exportedBlob, fileName);

      setExportProgress({ stage: 'Download started', progress: 100 });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowExportModal(false);
        setIsExporting(false);
        setExportProgress(null);
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsExporting(false);
      setShowExportModal(false);
      setExportProgress(null);
    }
  }, [videoProject, videoUrl, annotations]);

  useEffect(() => {
    const loadProject = async () => {
      if (!actualProjectId) {
        setError('No project ID provided');
        setIsLoading(false);
        return;
      }

      try {
        await clientVideoService.initDB();
        
        // Load the video project
        const project = await clientVideoService.getProject(actualProjectId);
        if (!project) {
          setError('Project not found');
          setIsLoading(false);
          return;
        }

        setVideoProject(project);

        // Get video blob URL for playback
        const blobUrl = await clientVideoService.getVideoBlob(project.video.blobRef);
        console.log('Setting video URL in EditorPage:', blobUrl);
        setVideoUrl(blobUrl);

        // Load existing annotations and commentaries
        setAnnotations(project.annotations || []);
        setCommentaries(project.commentaries || []);

        // Set up editor state (adapt the existing project structure)
        setCurrentProject({
          id: project.id,
          name: project.title,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.lastModified,
          ownerId: 'local-user', // Since this is client-side
          settings: {
            privacy: 'private',
            collaborators: [],
            aiEnabled: true,
          },
        } as any);

        // Set up video state
        setCurrentVideo({
          id: project.video.blobRef,
          title: project.title,
          filename: project.video.name,
          fileSize: project.video.size,
          duration: project.video.duration,
          resolution: project.video.dimensions,
          format: project.video.type,
          status: 'ready',
          thumbnailUrl: '', // We could generate this later
          streamUrl: blobUrl,
          createdAt: project.createdAt,
          updatedAt: project.lastModified,
          uploaderId: 'local-user',
          projectId: project.id,
        } as any);

      } catch (err) {
        console.error('Failed to load project:', err);
        setError('Failed to load project. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [actualProjectId, setCurrentProject, setCurrentVideo]);

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Notification
        color="red"
        title="Error"
        onClose={() => setError(null)}
        icon={<IconX size={16} />}
        m="md"
      >
        {error}
      </Notification>
    );
  }

  if (!currentVideo) {
    return (
      <Box p="md">
        <Notification
          color="yellow"
          title="No Video"
          icon={<IconX size={16} />}
        >
          Please select a video to start editing.
        </Notification>
      </Box>
    );
  }

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with export button */}
      <Box style={{ padding: '12px 16px', borderBottom: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Group justify="space-between">
          <Group>
            <IconVideo size={20} />
            <Text fw={600}>{videoProject?.title || 'Video Editor'}</Text>
            
            {/* Content indicators */}
            {(annotations.length > 0 || commentaries.length > 0) && (
              <Group gap="xs" ml="md">
                {annotations.length > 0 && (
                  <Tooltip label={`${annotations.length} annotations`}>
                    <Group gap={4} style={{ 
                      background: 'var(--mantine-color-blue-1)', 
                      padding: '4px 8px', 
                      borderRadius: 4,
                      fontSize: '11px'
                    }}>
                      <IconPencil size={12} />
                      <Text size="xs" fw={500}>{annotations.length}</Text>
                    </Group>
                  </Tooltip>
                )}
                
                {commentaries.length > 0 && (
                  <Tooltip label={`${commentaries.length} voice commentary tracks`}>
                    <Group gap={4} style={{ 
                      background: 'var(--mantine-color-orange-1)', 
                      padding: '4px 8px', 
                      borderRadius: 4,
                      fontSize: '11px'
                    }}>
                      <IconMicrophone size={12} />
                      <Text size="xs" fw={500}>{commentaries.length}</Text>
                    </Group>
                  </Tooltip>
                )}
                
                <Tooltip label="Ready for export">
                  <IconCheck size={14} color="var(--mantine-color-green-6)" />
                </Tooltip>
              </Group>
            )}
          </Group>
          <Group gap="sm">
            <Tooltip 
              label={
                annotations.length === 0 && commentaries.length === 0
                  ? "Add annotations or record commentary to export video"
                  : `Export video with ${
                      annotations.length > 0 && commentaries.length > 0 
                        ? `${annotations.length} annotations and ${commentaries.length} voice commentary tracks`
                        : annotations.length > 0 
                        ? `${annotations.length} annotations`
                        : `${commentaries.length} voice commentary tracks`
                    }`
              }
              disabled={isExporting}
            >
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleExportVideo}
                disabled={isExporting || (annotations.length === 0 && commentaries.length === 0)}
                variant="filled"
                color="green"
              >
                {isExporting 
                  ? 'Exporting...' 
                  : `Export Video${annotations.length > 0 && commentaries.length > 0 
                      ? ' with Annotations & Commentary'
                      : annotations.length > 0 
                      ? ' with Annotations'
                      : commentaries.length > 0
                      ? ' with Commentary'
                      : ''}`}
              </Button>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Main editor layout */}
      <Group align="flex-start" gap={0} style={{ flex: 1, height: 'calc(100% - 60px)' }}>
        {/* Tool palette - Left sidebar */}
        <Box style={{ width: 280, height: '100vh', overflowY: 'auto', borderRight: '1px solid var(--mantine-color-gray-3)' }}>
          <SoccerToolPalette 
            currentTool={currentTool}
            onToolChange={setCurrentTool}
          />
        </Box>
        
        {/* Main video area */}
        <Box style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Box style={{ flex: 1, padding: 16 }} ref={videoAreaRef}>
            <VideoPlayer
              src={videoUrl || currentVideo.streamUrl || ''}
              currentTool={currentTool}
              annotations={annotations}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onReady={handleVideoReady}
              onPlayingStateChange={handlePlayingStateChange}
              onFrameStep={handleFrameStep}
              onJumpTime={handleJumpTime}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              onAnnotationDelete={handleAnnotationDelete}
            />
          </Box>
          
          {/* Frame-level timeline at bottom */}
          <Box style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <FrameTimeline
              currentTime={currentVideoTime}
              duration={duration}
              fps={30}
              annotations={annotations}
              commentaries={commentaries}
              isVideoLoaded={!!videoProject && !!currentVideo}
              onTimeChange={setCurrentTime}
              onFrameStep={handleFrameStep}
            />
          </Box>
        </Box>
        
        {/* Right sidebar - Properties */}
        <Box style={{ width: 400, height: '100vh', overflowY: 'auto', borderLeft: '1px solid var(--mantine-color-gray-3)' }}>
          <Stack gap="md" p="md">
            <FrameNavigator
              currentTime={currentVideoTime}
              duration={duration}
              fps={30}
              isVideoLoaded={!!videoProject && !!currentVideo}
              onTimeChange={setCurrentTime}
              onFrameStep={handleFrameStep}
              onJumpTime={handleJumpTime}
            />

            <VoiceRecorder
              videoCurrentTime={currentVideoTime}
              isVideoPlaying={isVideoPlaying}
              onCommentaryAdd={handleCommentaryAdd}
              commentaries={commentaries}
              onCommentaryDelete={handleCommentaryDelete}
              onCommentaryVolumeChange={handleCommentaryVolumeChange}
            />
            
            <PropertiesPanel />
          </Stack>
        </Box>
      </Group>

      {/* Export Progress Modal */}
      <Modal
        opened={showExportModal}
        onClose={() => {}}
        title="Exporting Video"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Please wait while we render your video with annotations...
          </Text>
          
          {exportProgress && (
            <>
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>
                    {exportProgress.stage}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {Math.round(exportProgress.progress)}%
                  </Text>
                </Group>
                <Progress value={exportProgress.progress} color="blue" />
              </Box>

              {exportProgress.currentFrame && exportProgress.totalFrames && (
                <Text size="xs" c="dimmed" ta="center">
                  Frame {exportProgress.currentFrame} of {exportProgress.totalFrames}
                </Text>
              )}

              {exportProgress.stage === 'Download started' && (
                <Text size="sm" c="green" ta="center" fw={500}>
                  ✅ Export complete! Download started.
                </Text>
              )}
            </>
          )}
        </Stack>
      </Modal>
    </Box>
  );
}