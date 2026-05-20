import { Circle } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { colorToString } from '@shared/utils';
import type { CircleAnnotationSchema } from '@shared/types';
import { z } from 'zod';

interface CircleAnnotationProps {
  annotation: z.infer<typeof CircleAnnotationSchema>;
}

export function CircleAnnotation({ annotation }: CircleAnnotationProps) {
  const { selectedAnnotations, selectAnnotation } = useEditorStore();
  
  const isSelected = selectedAnnotations.includes(annotation.id);
  
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectAnnotation(annotation.id, e.evt.ctrlKey || e.evt.metaKey);
  };

  return (
    <Circle
      x={annotation.center.x}
      y={annotation.center.y}
      radius={annotation.radius}
      fill={annotation.style.filled ? colorToString(annotation.style.fillColor || annotation.style.strokeColor) : 'transparent'}
      stroke={colorToString(annotation.style.strokeColor)}
      strokeWidth={annotation.style.strokeWidth}
      draggable={isSelected}
      onClick={handleClick}
      strokeScaleEnabled={false}
      // Highlight when selected
      shadowColor={isSelected ? 'blue' : undefined}
      shadowBlur={isSelected ? 10 : 0}
      shadowOpacity={isSelected ? 0.6 : 0}
    />
  );
}