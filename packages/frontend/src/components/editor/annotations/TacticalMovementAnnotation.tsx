import { Group, Arrow, Line, Circle, Text } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';

export interface TacticalMovement {
  id: string;
  type: 'run' | 'pass' | 'shot' | 'tackle' | 'interception';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  playerNumber?: string;
  team: 'home' | 'away';
  timestamp: number;
  style: {
    color: { r: number; g: number; b: number; a: number };
    strokeWidth: number;
    animated?: boolean;
  };
}

interface TacticalMovementAnnotationProps {
  movement: TacticalMovement;
  isSelected?: boolean;
}

export function TacticalMovementAnnotation({ 
  movement, 
  isSelected = false 
}: TacticalMovementAnnotationProps) {
  const { selectAnnotation } = useEditorStore();

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectAnnotation(movement.id, e.evt.ctrlKey || e.evt.metaKey);
  };

  const colorString = `rgba(${movement.style.color.r}, ${movement.style.color.g}, ${movement.style.color.b}, ${movement.style.color.a})`;

  // Different styling based on movement type
  const getMovementStyle = () => {
    switch (movement.type) {
      case 'run':
        return {
          stroke: colorString,
          strokeWidth: movement.style.strokeWidth,
          dash: [5, 5],
        };
      case 'pass':
        return {
          stroke: colorString,
          strokeWidth: movement.style.strokeWidth + 1,
          dash: undefined,
        };
      case 'shot':
        return {
          stroke: '#ef4444', // Red for shots
          strokeWidth: movement.style.strokeWidth + 2,
          dash: [2, 2],
        };
      case 'tackle':
        return {
          stroke: '#f59e0b', // Orange for tackles
          strokeWidth: movement.style.strokeWidth,
          dash: [3, 3, 1, 3],
        };
      case 'interception':
        return {
          stroke: '#8b5cf6', // Purple for interceptions
          strokeWidth: movement.style.strokeWidth,
          dash: [1, 3],
        };
      default:
        return {
          stroke: colorString,
          strokeWidth: movement.style.strokeWidth,
          dash: undefined,
        };
    }
  };

  const style = getMovementStyle();
  const isArrowType = ['pass', 'shot', 'run'].includes(movement.type);

  return (
    <Group onClick={handleClick}>
      {/* Main movement line/arrow */}
      {isArrowType ? (
        <Arrow
          points={[
            movement.startPosition.x,
            movement.startPosition.y,
            movement.endPosition.x,
            movement.endPosition.y,
          ]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          fill={style.stroke}
          dash={style.dash}
          pointerLength={10}
          pointerWidth={8}
          // Highlight when selected
          shadowColor={isSelected ? 'blue' : undefined}
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={isSelected ? 0.8 : 0}
        />
      ) : (
        <Line
          points={[
            movement.startPosition.x,
            movement.startPosition.y,
            movement.endPosition.x,
            movement.endPosition.y,
          ]}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          dash={style.dash}
          lineCap="round"
          // Highlight when selected
          shadowColor={isSelected ? 'blue' : undefined}
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={isSelected ? 0.8 : 0}
        />
      )}

      {/* Start position indicator */}
      <Circle
        x={movement.startPosition.x}
        y={movement.startPosition.y}
        radius={4}
        fill={style.stroke}
        stroke="#ffffff"
        strokeWidth={1}
      />

      {/* Player number at start position */}
      {movement.playerNumber && (
        <Group
          x={movement.startPosition.x}
          y={movement.startPosition.y - 20}
        >
          <Circle
            radius={10}
            fill={movement.team === 'home' ? '#22c55e' : '#ef4444'}
            stroke="#ffffff"
            strokeWidth={1}
          />
          <Text
            text={movement.playerNumber}
            fontSize={8}
            fontFamily="Arial"
            fontStyle="bold"
            fill="#ffffff"
            align="center"
            verticalAlign="middle"
            offsetX={movement.playerNumber.length * 2}
            offsetY={3}
          />
        </Group>
      )}

      {/* Movement type label */}
      <Text
        x={movement.endPosition.x + 10}
        y={movement.endPosition.y - 5}
        text={movement.type.toUpperCase()}
        fontSize={10}
        fontFamily="Arial"
        fontStyle="bold"
        fill={style.stroke}
        visible={isSelected}
      />

      {/* End position indicator for non-arrow types */}
      {!isArrowType && (
        <Circle
          x={movement.endPosition.x}
          y={movement.endPosition.y}
          radius={3}
          fill={style.stroke}
          stroke="#ffffff"
          strokeWidth={1}
        />
      )}
    </Group>
  );
}