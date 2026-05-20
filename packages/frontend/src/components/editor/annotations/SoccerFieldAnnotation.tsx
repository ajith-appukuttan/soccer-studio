import { Group, Rect, Line, Circle, Text } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';

interface SoccerFieldProps {
  width: number;
  height: number;
  visible: boolean;
}

export function SoccerFieldAnnotation({ width, height, visible }: SoccerFieldProps) {
  if (!visible) return null;

  // Soccer field dimensions (scaled to canvas)
  const fieldWidth = width * 0.9;
  const fieldHeight = height * 0.9;
  const offsetX = (width - fieldWidth) / 2;
  const offsetY = (height - fieldHeight) / 2;

  // Field measurements (proportional to FIFA standards)
  const goalWidth = fieldHeight * 0.08;
  const goalDepth = fieldWidth * 0.06;
  const penaltyAreaWidth = fieldHeight * 0.4;
  const penaltyAreaDepth = fieldWidth * 0.16;
  const goalAreaWidth = fieldHeight * 0.18;
  const goalAreaDepth = fieldWidth * 0.05;
  const centerCircleRadius = Math.min(fieldWidth, fieldHeight) * 0.1;
  const penaltySpotDistance = fieldWidth * 0.11;

  const lineColor = '#ffffff';
  const lineWidth = 2;

  return (
    <Group>
      {/* Field background */}
      <Rect
        x={offsetX}
        y={offsetY}
        width={fieldWidth}
        height={fieldHeight}
        fill="rgba(34, 197, 94, 0.1)" // Light green with transparency
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Center line */}
      <Line
        points={[
          offsetX + fieldWidth / 2, offsetY,
          offsetX + fieldWidth / 2, offsetY + fieldHeight
        ]}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Center circle */}
      <Circle
        x={offsetX + fieldWidth / 2}
        y={offsetY + fieldHeight / 2}
        radius={centerCircleRadius}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Center spot */}
      <Circle
        x={offsetX + fieldWidth / 2}
        y={offsetY + fieldHeight / 2}
        radius={3}
        fill={lineColor}
      />

      {/* Left goal area */}
      <Rect
        x={offsetX}
        y={offsetY + (fieldHeight - goalAreaWidth) / 2}
        width={goalAreaDepth}
        height={goalAreaWidth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Right goal area */}
      <Rect
        x={offsetX + fieldWidth - goalAreaDepth}
        y={offsetY + (fieldHeight - goalAreaWidth) / 2}
        width={goalAreaDepth}
        height={goalAreaWidth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Left penalty area */}
      <Rect
        x={offsetX}
        y={offsetY + (fieldHeight - penaltyAreaWidth) / 2}
        width={penaltyAreaDepth}
        height={penaltyAreaWidth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Right penalty area */}
      <Rect
        x={offsetX + fieldWidth - penaltyAreaDepth}
        y={offsetY + (fieldHeight - penaltyAreaWidth) / 2}
        width={penaltyAreaDepth}
        height={penaltyAreaWidth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Left penalty spot */}
      <Circle
        x={offsetX + penaltySpotDistance}
        y={offsetY + fieldHeight / 2}
        radius={3}
        fill={lineColor}
      />

      {/* Right penalty spot */}
      <Circle
        x={offsetX + fieldWidth - penaltySpotDistance}
        y={offsetY + fieldHeight / 2}
        radius={3}
        fill={lineColor}
      />

      {/* Left penalty arc */}
      <Circle
        x={offsetX + penaltySpotDistance}
        y={offsetY + fieldHeight / 2}
        radius={centerCircleRadius}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clipX={offsetX + penaltyAreaDepth}
        clipY={offsetY}
        clipWidth={fieldWidth - penaltyAreaDepth}
        clipHeight={fieldHeight}
      />

      {/* Right penalty arc */}
      <Circle
        x={offsetX + fieldWidth - penaltySpotDistance}
        y={offsetY + fieldHeight / 2}
        radius={centerCircleRadius}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clipX={offsetX}
        clipY={offsetY}
        clipWidth={fieldWidth - penaltyAreaDepth}
        clipHeight={fieldHeight}
      />

      {/* Left goal */}
      <Rect
        x={offsetX - goalDepth}
        y={offsetY + (fieldHeight - goalWidth) / 2}
        width={goalDepth}
        height={goalWidth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Right goal */}
      <Rect
        x={offsetX + fieldWidth}
        y={offsetY + (fieldHeight - goalWidth) / 2}
        width={goalDepth}
        height={goalWidth}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Corner arcs */}
      {/* Top-left corner */}
      <Circle
        x={offsetX}
        y={offsetY}
        radius={fieldWidth * 0.01}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clipX={offsetX}
        clipY={offsetY}
        clipWidth={fieldWidth * 0.02}
        clipHeight={fieldHeight * 0.02}
      />

      {/* Top-right corner */}
      <Circle
        x={offsetX + fieldWidth}
        y={offsetY}
        radius={fieldWidth * 0.01}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clipX={offsetX + fieldWidth - fieldWidth * 0.02}
        clipY={offsetY}
        clipWidth={fieldWidth * 0.02}
        clipHeight={fieldHeight * 0.02}
      />

      {/* Bottom-left corner */}
      <Circle
        x={offsetX}
        y={offsetY + fieldHeight}
        radius={fieldWidth * 0.01}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clipX={offsetX}
        clipY={offsetY + fieldHeight - fieldHeight * 0.02}
        clipWidth={fieldWidth * 0.02}
        clipHeight={fieldHeight * 0.02}
      />

      {/* Bottom-right corner */}
      <Circle
        x={offsetX + fieldWidth}
        y={offsetY + fieldHeight}
        radius={fieldWidth * 0.01}
        stroke={lineColor}
        strokeWidth={lineWidth}
        clipX={offsetX + fieldWidth - fieldWidth * 0.02}
        clipY={offsetY + fieldHeight - fieldHeight * 0.02}
        clipWidth={fieldWidth * 0.02}
        clipHeight={fieldHeight * 0.02}
      />

      {/* Field labels */}
      <Text
        x={offsetX + 10}
        y={offsetY + 10}
        text="Home"
        fontSize={16}
        fill={lineColor}
        fontFamily="Arial"
        fontStyle="bold"
      />

      <Text
        x={offsetX + fieldWidth - 60}
        y={offsetY + 10}
        text="Away"
        fontSize={16}
        fill={lineColor}
        fontFamily="Arial"
        fontStyle="bold"
      />
    </Group>
  );
}