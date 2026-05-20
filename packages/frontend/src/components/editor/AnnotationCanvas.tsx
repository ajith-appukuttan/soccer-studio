import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Line, Circle, Rect, Arrow, Text, Group } from 'react-konva';
import Konva from 'konva';
import { Box } from '@mantine/core';

export interface DrawingTool {
  type: 'pen' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'player' | 'formation';
  color: string;
  strokeWidth: number;
}

export interface Annotation {
  id: string;
  type: DrawingTool['type'];
  points?: number[];
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  color: string;
  strokeWidth: number;
  startTime: number;
  endTime: number;
  visible: boolean;
}

interface AnnotationCanvasProps {
  width: number;
  height: number;
  currentTool: DrawingTool;
  currentTime: number;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Omit<Annotation, 'id'>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationDelete: (id: string) => void;
}

export interface AnnotationCanvasRef {
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

export const AnnotationCanvas = forwardRef<AnnotationCanvasRef, AnnotationCanvasProps>(
  ({ width, height, currentTool, currentTime, annotations, onAnnotationAdd, onAnnotationUpdate, onAnnotationDelete }, ref) => {
    const stageRef = useRef<Konva.Stage>(null);
    const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

    // Filter annotations visible at current time
    const visibleAnnotations = annotations.filter(
      annotation => 
        annotation.visible && 
        currentTime >= annotation.startTime && 
        currentTime <= annotation.endTime
    );

    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        const newAnnotations = annotations.filter(a => 
          !(currentTime >= a.startTime && currentTime <= a.endTime)
        );
        // Clear all annotations visible at current time
        visibleAnnotations.forEach(annotation => {
          onAnnotationDelete(annotation.id);
        });
      },
      undo: () => {
        if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          // Apply previous state
        }
      },
      redo: () => {
        if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
          // Apply next state
        }
      }
    }));

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (selectedId) {
        setSelectedId(null);
        return;
      }

      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      setIsDrawing(true);

      if (currentTool.type === 'pen') {
        setCurrentPoints([pos.x, pos.y]);
      } else if (currentTool.type === 'line') {
        // Start line drawing
        setStartPoint({ x: pos.x, y: pos.y });
      } else if (currentTool.type === 'text') {
        // Handle text tool
        const textInput = prompt('Enter text:');
        if (textInput) {
          onAnnotationAdd({
            type: 'text',
            x: pos.x,
            y: pos.y,
            text: textInput,
            fontSize: 16,
            color: currentTool.color,
            strokeWidth: currentTool.strokeWidth,
            startTime: currentTime,
            endTime: currentTime + 5, // Default 5 second duration
            visible: true
          });
        }
        setIsDrawing(false);
      } else if (currentTool.type === 'player') {
        // Add player marker
        onAnnotationAdd({
          type: 'player',
          x: pos.x,
          y: pos.y,
          radius: 15,
          color: currentTool.color,
          strokeWidth: currentTool.strokeWidth,
          startTime: currentTime,
          endTime: currentTime + 10, // Default 10 second duration
          visible: true
        });
        setIsDrawing(false);
      }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawing) return;

      const stage = e.target.getStage();
      const point = stage?.getPointerPosition();
      if (!point) return;

      if (currentTool.type === 'pen') {
        setCurrentPoints(prev => [...prev, point.x, point.y]);
      } else if (currentTool.type === 'line' && startPoint) {
        // Update line preview - we'll handle this in render
        // Force re-render by updating a state
        setCurrentPoints([startPoint.x, startPoint.y, point.x, point.y]);
      }
    };

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawing) return;
      setIsDrawing(false);

      if (currentTool.type === 'pen' && currentPoints.length > 0) {
        onAnnotationAdd({
          type: 'pen',
          points: currentPoints,
          color: currentTool.color,
          strokeWidth: currentTool.strokeWidth,
          startTime: currentTime,
          endTime: currentTime + 5, // Default 5 second duration
          visible: true
        });
      } else if (currentTool.type === 'line' && startPoint) {
        // Finish line drawing
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
          onAnnotationAdd({
            type: 'line',
            x: startPoint.x,
            y: startPoint.y,
            x2: pos.x,
            y2: pos.y,
            color: currentTool.color,
            strokeWidth: currentTool.strokeWidth,
            startTime: currentTime,
            endTime: currentTime + 5, // Default 5 second duration
            visible: true
          });
        }
        setStartPoint(null);
      }

      setCurrentPoints([]);
    };

    const renderAnnotation = (annotation: Annotation) => {
      const commonProps = {
        key: annotation.id,
        stroke: annotation.color,
        strokeWidth: annotation.strokeWidth,
        onClick: () => setSelectedId(annotation.id),
        draggable: true,
        onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
          onAnnotationUpdate(annotation.id, {
            x: e.target.x(),
            y: e.target.y()
          });
        }
      };

      switch (annotation.type) {
        case 'pen':
          return (
            <Line
              {...commonProps}
              points={annotation.points || []}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          );

        case 'line':
          return (
            <Line
              {...commonProps}
              points={[annotation.x || 0, annotation.y || 0, annotation.x2 || 0, annotation.y2 || 0]}
              lineCap="round"
            />
          );

        case 'rectangle':
          return (
            <Rect
              {...commonProps}
              x={annotation.x || 0}
              y={annotation.y || 0}
              width={annotation.width || 0}
              height={annotation.height || 0}
              fill="transparent"
            />
          );

        case 'circle':
          return (
            <Circle
              {...commonProps}
              x={annotation.x || 0}
              y={annotation.y || 0}
              radius={annotation.radius || 0}
              fill="transparent"
            />
          );

        case 'arrow':
          return (
            <Arrow
              {...commonProps}
              points={annotation.points || []}
              pointerLength={10}
              pointerWidth={10}
            />
          );

        case 'text':
          return (
            <Text
              {...commonProps}
              x={annotation.x || 0}
              y={annotation.y || 0}
              text={annotation.text || ''}
              fontSize={annotation.fontSize || 16}
              fill={annotation.color}
            />
          );

        case 'player':
          return (
            <Group {...commonProps}>
              <Circle
                x={annotation.x || 0}
                y={annotation.y || 0}
                radius={annotation.radius || 15}
                fill={annotation.color}
                stroke={annotation.color}
                strokeWidth={2}
              />
              <Text
                x={(annotation.x || 0) - 5}
                y={(annotation.y || 0) - 8}
                text="P"
                fontSize={12}
                fill="white"
                fontStyle="bold"
              />
            </Group>
          );

        default:
          return null;
      }
    };

    return (
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: currentTool ? 'auto' : 'none'
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
        >
          <Layer>
            {/* Render existing annotations */}
            {visibleAnnotations.map(renderAnnotation)}
            
            {/* Render current drawing */}
            {isDrawing && currentTool.type === 'pen' && currentPoints.length > 0 && (
              <Line
                points={currentPoints}
                stroke={currentTool.color}
                strokeWidth={currentTool.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            )}
            
            {/* Render line preview while drawing */}
            {isDrawing && currentTool.type === 'line' && currentPoints.length === 4 && (
              <Line
                points={currentPoints}
                stroke={currentTool.color}
                strokeWidth={currentTool.strokeWidth}
                lineCap="round"
                opacity={0.7}
              />
            )}
          </Layer>
        </Stage>
      </Box>
    );
  }
);