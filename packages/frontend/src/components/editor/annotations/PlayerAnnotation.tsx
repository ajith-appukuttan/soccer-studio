import { Group, Circle, Text } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { colorToString } from '@shared/utils';
import { DEFAULT_COLORS } from '@shared/constants';
import type { PlayerAnnotationSchema } from '@shared/types';
import { z } from 'zod';

interface PlayerAnnotationProps {
  annotation: z.infer<typeof PlayerAnnotationSchema>;
}

export function PlayerAnnotation({ annotation }: PlayerAnnotationProps) {
  const { selectedAnnotations, selectAnnotation } = useEditorStore();
  
  const isSelected = selectedAnnotations.includes(annotation.id);
  
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectAnnotation(annotation.id, e.evt.ctrlKey || e.evt.metaKey);
  };

  // Use team colors or custom color
  const teamColor = annotation.team === 'home' 
    ? DEFAULT_COLORS.HOME_TEAM 
    : DEFAULT_COLORS.AWAY_TEAM;
  
  const playerColor = annotation.style.color || teamColor;
  const size = annotation.style.size;

  return (
    <Group
      x={annotation.position.x}
      y={annotation.position.y}
      draggable={isSelected}
      onClick={handleClick}
    >
      {/* Player circle */}
      <Circle
        radius={size}
        fill={colorToString(playerColor)}
        stroke={colorToString(DEFAULT_COLORS.WHITE)}
        strokeWidth={2}
        strokeScaleEnabled={false}
        // Highlight when selected
        shadowColor={isSelected ? 'blue' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
      />
      
      {/* Player number */}
      <Text
        text={annotation.playerNumber}
        fontSize={size * 0.8}
        fontFamily="Arial"
        fontStyle="bold"
        fill={colorToString(DEFAULT_COLORS.WHITE)}
        align="center"
        verticalAlign="middle"
        offsetX={annotation.playerNumber.length * (size * 0.4) / 2}
        offsetY={size * 0.4}
        strokeScaleEnabled={false}
      />
    </Group>
  );
}