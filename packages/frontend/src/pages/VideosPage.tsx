import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  Grid,
  Card,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Progress,
  Pagination,
  Center,
  Loader,
  Alert,
  Notification,
} from '@mantine/core';
import {
  IconSearch,
  IconUpload,
  IconArrowRight as IconCaretRight,
  IconDownload,
  IconTrash,
  IconEdit,
  IconSquare as IconFilter,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useVideoStore } from '@/stores/videoStore';
import { clientVideoService, type VideoProject } from '@/services/clientVideoService';
import { formatFileSize, formatTime } from '@shared/utils';
import classes from './VideosPage.module.css';

export function VideosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; progress: number; stage: string }>>(new Map());
  
  const itemsPerPage = 12;
  const navigate = useNavigate();
  
  const { uploadProgress } = useVideoStore();

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      await clientVideoService.initDB();
      const allProjects = await clientVideoService.getProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load video projects',
        color: 'red',
        icon: <IconX size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      // Validate file
      const validation = clientVideoService.validateVideoFile(file);
      if (!validation.valid) {
        notifications.show({
          title: 'Invalid File',
          message: `${file.name}: ${validation.error}`,
          color: 'red',
          icon: <IconX size={18} />,
        });
        continue;
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to uploading files
      setUploadingFiles(prev => new Map(prev.set(fileId, {
        name: file.name,
        progress: 0,
        stage: 'Starting...'
      })));

      try {
        // Create project with progress tracking
        const project = await clientVideoService.createProject(
          file,
          file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
          undefined, // No description for now
          (stage: string, progress: number) => {
            setUploadingFiles(prev => new Map(prev.set(fileId, {
              name: file.name,
              progress,
              stage
            })));
          }
        );

        // Remove from uploading and refresh projects
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });

        // Refresh projects list
        await loadProjects();

        notifications.show({
          title: 'Upload Complete',
          message: `${file.name} uploaded successfully`,
          color: 'green',
          icon: <IconCheck size={18} />,
        });

        // Navigate to editor for immediate analysis
        navigate(`/editor?project=${project.id}`);

      } catch (error) {
        console.error('Upload failed:', error);
        
        // Remove from uploading files
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });

        notifications.show({
          title: 'Upload Failed',
          message: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          color: 'red',
          icon: <IconX size={18} />,
        });
      }
    }
    
    // Close modal when done
    setUploadModalOpen(false);
  };

  const handleProjectClick = (project: VideoProject) => {
    navigate(`/editor?project=${project.id}`);
  };

  const handleDeleteProject = async (project: VideoProject, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await clientVideoService.deleteProject(project.id);
      await loadProjects();
      
      notifications.show({
        title: 'Project Deleted',
        message: `${project.title} has been deleted`,
        color: 'green',
        icon: <IconCheck size={18} />,
      });
    } catch (error) {
      console.error('Delete failed:', error);
      notifications.show({
        title: 'Delete Failed',
        message: `Failed to delete ${project.title}`,
        color: 'red',
        icon: <IconX size={18} />,
      });
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.video.name.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, treat all projects as 'ready' status
    const matchesStatus = statusFilter === 'all' || statusFilter === 'ready';
    
    return matchesSearch && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'size':
        return b.video.size - a.video.size;
      case 'duration':
        return b.video.duration - a.video.duration;
      case 'created':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const renderProjectCard = (project: VideoProject) => {
    return (
      <Card 
        key={project.id} 
        withBorder 
        className={classes.videoCard}
        style={{ cursor: 'pointer' }}
        onClick={() => handleProjectClick(project)}
      >
        <Card.Section>
          <div className={classes.thumbnail}>
            {/* Placeholder thumbnail - we could generate actual thumbnails later */}
            <div 
              style={{ 
                height: 180, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Text c="white" size="lg" fw={500}>
                {project.video.name.charAt(0).toUpperCase()}
              </Text>
              <div className={classes.playOverlay}>
                <ActionIcon size="lg" variant="filled" radius="xl" color="white">
                  <IconCaretRight size={20} />
                </ActionIcon>
              </div>
            </div>
          </div>
        </Card.Section>
        
        <Stack gap="xs" p="md">
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text fw={500} size="sm" truncate>
                {project.title}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {project.video.name}
              </Text>
            </div>
            
            <Badge size="xs" color="green">
              Ready
            </Badge>
          </Group>

          <Group gap="xs" c="dimmed" fz="xs">
            <Text span>{formatTime(project.video.duration)}</Text>
            <Text span>•</Text>
            <Text span>{project.video.dimensions.width}x{project.video.dimensions.height}</Text>
            <Text span>•</Text>
            <Text span>{formatFileSize(project.video.size)}</Text>
          </Group>

          <Group justify="space-between" mt="auto">
            <Text size="xs" c="dimmed">
              {new Date(project.createdAt).toLocaleDateString()}
            </Text>
            
            <Group gap="xs">
              <ActionIcon 
                size="sm" 
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectClick(project);
                }}
              >
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon 
                size="sm" 
                variant="subtle" 
                color="red"
                onClick={(e) => handleDeleteProject(project, e)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Stack>
      </Card>
    );
  };

  const renderUploadingCard = (fileId: string, uploadInfo: { name: string; progress: number; stage: string }) => {
    return (
      <Card key={`uploading-${fileId}`} withBorder className={classes.videoCard}>
        <Card.Section>
          <div 
            style={{ 
              height: 180, 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Loader color="white" size="lg" />
          </div>
        </Card.Section>
        
        <Stack gap="xs" p="md">
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text fw={500} size="sm" truncate>
                {uploadInfo.name}
              </Text>
              <Text size="xs" c="dimmed">
                {uploadInfo.stage}
              </Text>
            </div>
            
            <Badge size="xs" color="blue">
              Uploading
            </Badge>
          </Group>

          <div>
            <Progress
              value={uploadInfo.progress}
              size="xs"
              color="blue"
            />
            <Text size="xs" ta="center" mt={2}>
              {Math.round(uploadInfo.progress)}%
            </Text>
          </div>
        </Stack>
      </Card>
    );
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Text size="xl" fw={700}>
          Video Library
        </Text>
        <Button
          leftSection={<IconUpload size={16} />}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Videos
        </Button>
      </Group>

      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Search videos..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          w={300}
        />
        
        <Select
          placeholder="Status"
          data={[
            { value: 'all', label: 'All Status' },
            { value: 'ready', label: 'Ready' },
            { value: 'processing', label: 'Processing' },
            { value: 'uploading', label: 'Uploading' },
            { value: 'error', label: 'Error' },
          ]}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value || 'all')}
          w={150}
        />
        
        <Select
          placeholder="Sort by"
          data={[
            { value: 'created', label: 'Date Created' },
            { value: 'title', label: 'Title' },
            { value: 'size', label: 'File Size' },
            { value: 'duration', label: 'Duration' },
          ]}
          value={sortBy}
          onChange={(value) => setSortBy(value || 'created')}
          w={150}
        />
        
        <ActionIcon variant="light">
          <IconFilter size={16} />
        </ActionIcon>
      </Group>

      {/* Projects Grid */}
      {loading ? (
        <Center h={400}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Loading projects...</Text>
          </Stack>
        </Center>
      ) : sortedProjects.length === 0 && uploadingFiles.size === 0 ? (
        <Center h={400}>
          <Stack align="center" gap="md">
            <Text size="lg" c="dimmed">No projects found</Text>
            {searchQuery || statusFilter !== 'all' ? (
              <Text size="sm" c="dimmed">Try adjusting your filters</Text>
            ) : (
              <Text size="sm" c="dimmed">Upload your first video to get started</Text>
            )}
          </Stack>
        </Center>
      ) : (
        <Grid>
          {/* Render uploading files first */}
          {Array.from(uploadingFiles.entries()).map(([fileId, uploadInfo]) =>
            renderUploadingCard(fileId, uploadInfo)
          )}
          {/* Render existing projects */}
          {paginatedProjects.map(renderProjectCard)}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Group>
      )}

      {/* Upload Status */}
      {uploadingFiles.size > 0 && (
        <Alert color="blue" title="Uploading Videos">
          <Stack gap="xs">
            <Text size="sm">
              {uploadingFiles.size} video{uploadingFiles.size > 1 ? 's' : ''} currently uploading...
            </Text>
            {Array.from(uploadingFiles.values()).map((uploadInfo, index) => (
              <Group key={index} gap="xs">
                <Text size="xs" style={{ flex: 1 }}>{uploadInfo.name}</Text>
                <Text size="xs" c="dimmed">{uploadInfo.stage}</Text>
                <Text size="xs" c="dimmed">{Math.round(uploadInfo.progress)}%</Text>
              </Group>
            ))}
          </Stack>
        </Alert>
      )}

      {/* Upload Modal */}
      <Modal
        opened={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Videos"
        size="md"
      >
        <Stack>
          <Dropzone
            onDrop={handleFileUpload}
            accept={{
              'video/mp4': ['.mp4'],
              'video/mov': ['.mov'],
              'video/avi': ['.avi'],
              'video/mkv': ['.mkv'],
            }}
            maxSize={5 * 1024 ** 3} // 5GB
            multiple
          >
            <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
              <div>
                <Text size="xl" inline>
                  Drag videos here or click to select files
                </Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  Attach up to 10 video files, each file should not exceed 5GB
                </Text>
              </div>
            </Group>
          </Dropzone>
          
          <Text size="xs" c="dimmed">
            Supported formats: MP4, MOV, AVI, MKV
          </Text>
        </Stack>
      </Modal>
    </Stack>
  );
}