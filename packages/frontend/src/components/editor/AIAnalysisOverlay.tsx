import { useEffect, useRef } from 'react';
import { Stage, Layer, Circle, Text, Group as KonvaGroup, Rect } from 'react-konva';
import Konva from 'konva';
import { useAnalysisStore } from '@/stores/analysisStore';
import { Box, Badge, Group, Text as MantineText } from '@mantine/core';

interface AIAnalysisOverlayProps {
  videoElement: HTMLVideoElement | null;
  containerElement: HTMLDivElement | null;
  currentTime: number;
}

export function AIAnalysisOverlay({ 
  videoElement, 
  containerElement, 
  currentTime 
}: AIAnalysisOverlayProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const { 
    showAnalysisOverlay,
    getAnalysisAtTime,
    getPlayersAtTime,
    getFormationAtTime,
    getInsightsAtTime 
  } = useAnalysisStore();

  const currentAnalysis = getAnalysisAtTime(currentTime);
  const players = getPlayersAtTime(currentTime);
  const insights = getInsightsAtTime(currentTime);

  // Calculate stage dimensions based on video
  const getStageSize = () => {
    if (!videoElement || !containerElement) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }

    const containerRect = containerElement.getBoundingClientRect();
    const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (videoAspectRatio > containerAspectRatio) {
      // Video is wider - fit to width
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / videoAspectRatio;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      // Video is taller - fit to height
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * videoAspectRatio;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }

    return { width: displayWidth, height: displayHeight, offsetX, offsetY };
  };

  const { width: stageWidth, height: stageHeight, offsetX, offsetY } = getStageSize();

  // Don't render if overlay is disabled or no analysis data
  if (!showAnalysisOverlay || !currentAnalysis || !stageWidth || !stageHeight) {
    return null;
  }

  const getPlayerColor = (team: string): string => {
    switch (team) {
      case 'home':
        return '#2563eb'; // Blue
      case 'away':
        return '#dc2626'; // Red
      case 'referee':
        return '#000000'; // Black
      default:
        return '#6b7280'; // Gray
    }
  };

  const getTeamFormation = (team: 'home' | 'away'): string => {
    return getFormationAtTime(currentTime, team) || '';
  };

  return (
    <Box
      style={{
        position: 'absolute',
        top: offsetY,
        left: offsetX,
        width: stageWidth,
        height: stageHeight,
        pointerEvents: 'none',
        zIndex: 15, // Higher than cursor overlay
      }}
    >
      {/* Konva Stage for Player Positions */}
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Layer>
          {/* Render Players */}
          {players.map((player, index) => {
            const x = player.position.x * stageWidth;
            const y = player.position.y * stageHeight;
            const color = getPlayerColor(player.team);
            
            return (
              <KonvaGroup key={index}>
                {/* Player Circle */}
                <Circle
                  x={x}
                  y={y}
                  radius={12}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  opacity={0.8}
                />
                
                {/* Jersey Number */}
                {player.jersey && (
                  <Text
                    x={x - 6}
                    y={y - 6}
                    text={player.jersey.toString()}
                    fontSize={12}
                    fontFamily="Arial"
                    fill="white"
                    fontStyle="bold"
                  />
                )}
                
                {/* Confidence Indicator */}
                {player.confidence < 0.7 && (
                  <Circle
                    x={x + 15}
                    y={y - 15}
                    radius={3}
                    fill="#fbbf24"
                    opacity={0.8}
                  />
                )}
              </KonvaGroup>
            );
          })}
        </Layer>
      </Stage>

      {/* Analysis Information Overlay */}
      <Box
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
        }}
      >
        <Group gap="xs" mb="xs">
          <MantineText size="xs" fw={600}>
            AI Analysis ({Math.round(currentTime)}s)
          </MantineText>
          <Badge
            size="xs"
            color="blue"
            variant="filled"
            style={{ fontSize: '10px' }}
          >
            {Math.round(currentAnalysis.confidence * 100)}%
          </Badge>
        </Group>

        {/* Formation Info */}
        {currentAnalysis.formations.length > 0 && (
          <Group gap="md" mb="xs">
            {currentAnalysis.formations.map((formation, index) => (
              <Group key={index} gap="xs">
                <Badge
                  size="xs"
                  color={formation.team === 'home' ? 'blue' : 'red'}
                  variant="light"
                  style={{ fontSize: '10px' }}
                >
                  {formation.team} {formation.formation}
                </Badge>
              </Group>
            ))}
          </Group>
        )}

        {/* Game Phase and Possession */}
        <Group gap="md" mb="xs">
          <Badge
            size="xs"
            color={
              insights?.phase === 'attacking' ? 'green' :
              insights?.phase === 'defending' ? 'orange' : 'gray'
            }
            variant="light"
            style={{ fontSize: '10px' }}
          >
            {insights?.phase}
          </Badge>
          
          {insights?.possession && (
            <Badge
              size="xs"
              color={insights.possession === 'home' ? 'blue' : 'red'}
              variant="light"
              style={{ fontSize: '10px' }}
            >
              {insights.possession} possession
            </Badge>
          )}
        </Group>

        {/* Player Count */}
        <Group gap="md">
          <MantineText size="xs" c="dimmed">
            Players: {players.length}
          </MantineText>
          <MantineText size="xs" c="dimmed">
            Home: {players.filter(p => p.team === 'home').length}
          </MantineText>
          <MantineText size="xs" c="dimmed">
            Away: {players.filter(p => p.team === 'away').length}
          </MantineText>
        </Group>

        {/* Key Events */}
        {insights?.keyEvents && insights.keyEvents.length > 0 && (
          <Box mt="xs">
            <MantineText size="xs" fw={500} mb="xs">
              Key Events:
            </MantineText>
            {insights.keyEvents.slice(0, 2).map((event, index) => (
              <MantineText key={index} size="xs" c="dimmed" lineClamp={1}>
                • {event}
              </MantineText>
            ))}
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Box
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '11px',
        }}
      >
        <MantineText size="xs" fw={500} mb="xs">
          Players
        </MantineText>
        <Group gap="sm">
          <Group gap="xs">
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#2563eb',
              }}
            />
            <MantineText size="xs">Home</MantineText>
          </Group>
          <Group gap="xs">
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#dc2626',
              }}
            />
            <MantineText size="xs">Away</MantineText>
          </Group>
          <Group gap="xs">
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#000000',
              }}
            />
            <MantineText size="xs">Ref</MantineText>
          </Group>
        </Group>
      </Box>
    </Box>
  );
}