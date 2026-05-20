import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Paper,
  ScrollArea,
  Progress,
  Modal,
  Select,
  NumberInput,
  Alert,
  ActionIcon,
  Tooltip,
  Divider,
  List,
  ThemeIcon,
  Card,
  Grid,
  RingProgress,
} from '@mantine/core';
import {
  IconUser as IconRobot,
  IconArrowRight as IconCaretRight,
  IconRefresh,
  IconSettings,
  IconSquare as IconGraph,
  IconCircle as IconTarget,
  IconCircle as IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconDownload,
  IconSquare as IconFileText,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { analysisService, type AnalysisJob, type SoccerAnalysis, type AnalysisSummary } from '@/services/analysisService';
import { useAnalysisStore } from '@/stores/analysisStore';
import { exportAnalysisToCSV, exportAnalysisToJSON, exportTacticalReport } from '@/utils/analysisExport';
import { formatDistanceToNow } from 'date-fns';

interface AIInsightsPanelProps {
  videoId?: string;
  currentTime?: number;
  onSeekToTimestamp?: (timestamp: number) => void;
}

export function AIInsightsPanel({ videoId, currentTime = 0, onSeekToTimestamp }: AIInsightsPanelProps) {
  const {
    jobs,
    activeJob,
    analysisResults,
    summary,
    isLoading: loading,
    error,
    showAnalysisOverlay,
    toggleAnalysisOverlay,
    loadVideoAnalysis,
    startAnalysis,
    cancelAnalysis,
    setError,
  } = useAnalysisStore();
  
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false);
  const [analysisSettings, setAnalysisSettings] = useState({
    interval: 30,
    startTime: 0,
    endTime: 300,
    analysisType: 'full' as 'full' | 'formations' | 'events',
  });

  // Load existing analysis results when videoId changes
  useEffect(() => {
    if (videoId) {
      loadVideoAnalysis(videoId);
    }
  }, [videoId, loadVideoAnalysis]);

  const handleStartAnalysis = async () => {
    if (!videoId) return;

    try {
      await startAnalysis(videoId, analysisSettings);
      closeSettings();
    } catch (err) {
      // Error is handled by the store
      console.error('Failed to start analysis:', err);
    }
  };

  const handleCancelAnalysis = async () => {
    if (!activeJob) return;
    await cancelAnalysis(activeJob.id);
  };

  const handleExport = (format: 'csv' | 'json' | 'report') => {
    if (!analysisResults.length) return;

    const videoTitle = videoId || 'Soccer Analysis';
    
    try {
      switch (format) {
        case 'csv':
          exportAnalysisToCSV(analysisResults, summary, videoTitle);
          break;
        case 'json':
          exportAnalysisToJSON(analysisResults, summary, videoTitle);
          break;
        case 'report':
          exportTacticalReport(analysisResults, summary, videoTitle);
          break;
      }
      closeExport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Get analysis for current time from store
  const currentAnalysis = analysisResults.length > 0 ? 
    analysisResults.reduce((closest, analysis) => {
      const currentDiff = Math.abs(analysis.timestamp - currentTime);
      const closestDiff = Math.abs(closest.timestamp - currentTime);
      return currentDiff < closestDiff ? analysis : closest;
    }) : null;

  return (
    <Stack gap="md" style={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Paper p="sm" withBorder>
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <IconRobot size={16} color="blue" />
            <Text size="sm" fw={500}>
              AI Analysis
            </Text>
          </Group>
          
          <Group gap="xs">
            <Tooltip label="Refresh results">
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => videoId && loadVideoAnalysis(videoId)}
                loading={loading}
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label={showAnalysisOverlay ? "Hide overlay" : "Show overlay"}>
              <ActionIcon
                size="sm"
                variant={showAnalysisOverlay ? "filled" : "subtle"}
                color={showAnalysisOverlay ? "blue" : undefined}
                onClick={toggleAnalysisOverlay}
                disabled={!analysisResults.length}
              >
                {showAnalysisOverlay ? <IconEye size={14} /> : <IconEyeOff size={14} />}
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Export results">
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={openExport}
                disabled={!analysisResults.length}
              >
                <IconDownload size={14} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Analysis settings">
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={openSettings}
                disabled={!!activeJob}
              >
                <IconSettings size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Active Job Progress */}
        {activeJob && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {activeJob.status === 'pending' ? 'Queued' : 'Analyzing'}
              </Text>
              <Badge size="xs" color={activeJob.status === 'processing' ? 'blue' : 'gray'}>
                {activeJob.progress}%
              </Badge>
            </Group>
            
            <Progress value={activeJob.progress} size="xs" />
            
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {activeJob.status === 'pending' ? 'Waiting in queue...' : 'Processing frames...'}
              </Text>
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={handleCancelAnalysis}
              >
                Cancel
              </Button>
            </Group>
          </Stack>
        )}

        {/* Error Display */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Start Analysis Button */}
        {!activeJob && !analysisResults.length && (
          <Button
            fullWidth
              leftSection={<IconCaretRight size={16} />}
            onClick={openSettings}
            disabled={!videoId}
          >
            Start AI Analysis
          </Button>
        )}
      </Paper>

      {/* Current Frame Analysis */}
      {currentAnalysis && (
        <Paper p="sm" withBorder>
          <Group justify="space-between" mb="sm">
            <Text size="sm" fw={500}>
              Current Frame ({Math.round(currentAnalysis.timestamp)}s)
            </Text>
            <Badge size="xs" color="green" variant="light">
              {Math.round(currentAnalysis.confidence * 100)}% confidence
            </Badge>
          </Group>

          <Stack gap="xs">
            {/* Game Phase */}
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Phase:</Text>
              <Badge
                size="xs"
                color={
                  currentAnalysis.insights.phase === 'attacking' ? 'red' :
                  currentAnalysis.insights.phase === 'defending' ? 'blue' : 'gray'
                }
              >
                {currentAnalysis.insights.phase}
              </Badge>
            </Group>

            {/* Possession */}
            {currentAnalysis.insights.possession && (
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Possession:</Text>
                <Badge
                  size="xs"
                  color={currentAnalysis.insights.possession === 'home' ? 'blue' : 'red'}
                >
                  {currentAnalysis.insights.possession}
                </Badge>
              </Group>
            )}

            {/* Players Detected */}
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Players:</Text>
              <Text size="xs">{currentAnalysis.players.length}</Text>
            </Group>

            {/* Formations */}
            {currentAnalysis.formations.length > 0 && (
              <div>
                <Text size="xs" c="dimmed" mb="xs">Formations:</Text>
                {currentAnalysis.formations.map((formation, index) => (
                  <Group key={index} justify="space-between">
                    <Badge size="xs" variant="light">
                      {formation.team} {formation.formation}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {Math.round(formation.confidence * 100)}%
                    </Text>
                  </Group>
                ))}
              </div>
            )}
          </Stack>
        </Paper>
      )}

      {/* Analysis Summary */}
      {summary && (
        <Paper p="sm" withBorder>
          <Text size="sm" fw={500} mb="sm">
            Analysis Summary
          </Text>

          <Stack gap="sm">
            {/* Possession Stats */}
            <div>
              <Text size="xs" c="dimmed" mb="xs">Possession</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Card withBorder p="xs">
                    <Group justify="space-between">
                      <Text size="xs">Home</Text>
                      <Text size="sm" fw={600} c="blue">
                        {summary.possessionStats.home}%
                      </Text>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Card withBorder p="xs">
                    <Group justify="space-between">
                      <Text size="xs">Away</Text>
                      <Text size="sm" fw={600} c="red">
                        {summary.possessionStats.away}%
                      </Text>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>
            </div>

            {/* Dominant Formations */}
            {Object.keys(summary.dominantFormations).length > 0 && (
              <div>
                <Text size="xs" c="dimmed" mb="xs">Dominant Formations</Text>
                <Stack gap="xs">
                  {Object.entries(summary.dominantFormations).map(([team, formation]) => (
                    <Group key={team} justify="space-between">
                      <Badge size="xs" variant="light" color={team === 'home' ? 'blue' : 'red'}>
                        {team}
                      </Badge>
                      <Text size="xs">{formation}</Text>
                    </Group>
                  ))}
                </Stack>
              </div>
            )}

            {/* Key Moments */}
            {summary.keyMoments.length > 0 && (
              <div>
                <Text size="xs" c="dimmed" mb="xs">Key Moments</Text>
                <ScrollArea style={{ height: 120 }}>
                  <Stack gap="xs">
                    {summary.keyMoments.slice(0, 5).map((moment, index) => (
                      <Paper key={index} p="xs" withBorder>
                        <Group justify="space-between">
                          <Text size="xs" lineClamp={2} style={{ flex: 1 }}>
                            {moment.event}
                          </Text>
                          <Button
                            size="xs"
                            variant="subtle"
                            onClick={() => onSeekToTimestamp?.(moment.timestamp)}
                          >
                            {Math.round(moment.timestamp)}s
                          </Button>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea>
              </div>
            )}

            {/* Tactical Trends */}
            {summary.tacticalTrends.length > 0 && (
              <div>
                <Text size="xs" c="dimmed" mb="xs">Tactical Insights</Text>
                <List size="xs" spacing="xs">
                  {summary.tacticalTrends.slice(0, 4).map((trend, index) => (
                    <List.Item key={index} icon={
                      <ThemeIcon size="xs" color="blue" variant="light">
                        <IconTarget size={10} />
                      </ThemeIcon>
                    }>
                      <Text size="xs">{trend}</Text>
                    </List.Item>
                  ))}
                </List>
              </div>
            )}
          </Stack>
        </Paper>
      )}

      {/* Analysis History */}
      {jobs.length > 0 && (
        <Paper p="sm" withBorder>
          <Text size="sm" fw={500} mb="sm">
            Analysis History
          </Text>

          <ScrollArea style={{ height: 150 }}>
            <Stack gap="xs">
              {jobs.map((job) => (
                <Group key={job.id} justify="space-between">
                  <Stack gap={0}>
                    <Text size="xs" fw={500}>
                      {job.settings.analysisType} analysis
                    </Text>
                    <Text size="xs" c="dimmed">
                      {job.endTime && formatDistanceToNow(new Date(job.endTime), { addSuffix: true })}
                    </Text>
                  </Stack>
                  
                  <Group gap="xs">
                    <Badge
                      size="xs"
                      color={
                        job.status === 'completed' ? 'green' :
                        job.status === 'failed' ? 'red' :
                        job.status === 'processing' ? 'blue' : 'gray'
                      }
                    >
                      {job.status}
                    </Badge>
                    
                    {job.status === 'completed' && (
                      <ActionIcon size="xs" variant="subtle">
                        <IconGraph size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              ))}
            </Stack>
          </ScrollArea>
        </Paper>
      )}

      {/* Analysis Settings Modal */}
      <Modal
        opened={settingsOpened}
        onClose={closeSettings}
        title="AI Analysis Settings"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Analysis Type"
            placeholder="Select analysis type"
            data={[
              { value: 'full', label: 'Full Analysis (Players + Formations + Events)' },
              { value: 'formations', label: 'Formations Only' },
              { value: 'events', label: 'Key Events Only' },
            ]}
            value={analysisSettings.analysisType}
            onChange={(value) => setAnalysisSettings(prev => ({ 
              ...prev, 
              analysisType: value as 'full' | 'formations' | 'events' 
            }))}
          />

          <NumberInput
            label="Analysis Interval (seconds)"
            description="Analyze every N seconds of video"
            placeholder="30"
            min={5}
            max={300}
            value={analysisSettings.interval}
            onChange={(value) => setAnalysisSettings(prev => ({ 
              ...prev, 
              interval: Number(value) || 30 
            }))}
          />

          <Group grow>
            <NumberInput
              label="Start Time (seconds)"
              placeholder="0"
              min={0}
              value={analysisSettings.startTime}
              onChange={(value) => setAnalysisSettings(prev => ({ 
                ...prev, 
                startTime: Number(value) || 0 
              }))}
            />

            <NumberInput
              label="End Time (seconds)"
              placeholder="300"
              min={0}
              value={analysisSettings.endTime}
              onChange={(value) => setAnalysisSettings(prev => ({ 
                ...prev, 
                endTime: Number(value) || 300 
              }))}
            />
          </Group>

          <Alert
            icon={<IconRobot size={16} />}
            title="AI Analysis"
            color="blue"
            variant="light"
          >
            Analysis uses Claude Vision AI to detect players, identify formations, and provide tactical insights. 
            Processing time depends on video length and interval settings.
          </Alert>

          <Group justify="flex-end">
            <Button variant="light" onClick={closeSettings}>
              Cancel
            </Button>
            <Button
            leftSection={<IconCaretRight size={16} />}
              onClick={handleStartAnalysis}
              loading={loading}
            >
              Start Analysis
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Export Modal */}
      <Modal
        opened={exportOpened}
        onClose={closeExport}
        title="Export Analysis Results"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Export your AI analysis results in various formats for further analysis or reporting.
          </Text>

          <Stack gap="sm">
            <Button
              fullWidth
              variant="light"
              leftSection={<IconFileText size={16} />}
              onClick={() => handleExport('csv')}
            >
              Export as CSV
              <Text size="xs" c="dimmed" ml="auto">
                Spreadsheet compatible
              </Text>
            </Button>

            <Button
              fullWidth
              variant="light"
              leftSection={<IconFileText size={16} />}
              onClick={() => handleExport('json')}
            >
              Export as JSON
              <Text size="xs" c="dimmed" ml="auto">
                Developer friendly
              </Text>
            </Button>

            <Button
              fullWidth
              variant="light"
              leftSection={<IconFileText size={16} />}
              onClick={() => handleExport('report')}
            >
              Export Tactical Report
              <Text size="xs" c="dimmed" ml="auto">
                Formatted analysis report
              </Text>
            </Button>
          </Stack>

          <Alert
            icon={<IconTarget size={16} />}
            title="Export Contents"
            color="blue"
            variant="light"
          >
            Exports include player positions, formations, tactical insights, 
            possession statistics, and key moments from the analysis.
          </Alert>

          <Group justify="flex-end">
            <Button variant="light" onClick={closeExport}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}