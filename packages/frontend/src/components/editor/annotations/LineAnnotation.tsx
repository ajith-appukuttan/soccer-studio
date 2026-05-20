import { Line } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { colorToString } from '@shared/utils';
import type { LineAnnotationSchema } from '@shared/types';
import { z } from 'zod';

interface LineAnnotationProps {
  annotation: z.infer<typeof LineAnnotationSchema>;
}

export function LineAnnotation({ annotation }: LineAnnotationProps) {
  const { selectedAnnotations, selectAnnotation } = useEditorStore();
  
  const isSelected = selectedAnnotations.includes(annotation.id);
  
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectAnnotation(annotation.id, e.evt.ctrlKey || e.evt.metaKey);
  };

  // Flatten points array for Konva
  const points = annotation.points.flatMap(point => [point.x, point.y]);

  return (
    <Line
      points={points}
      stroke={colorToString(annotation.style.strokeColor)}
      strokeWidth={annotation.style.strokeWidth}
      lineCap="round"
      lineJoin="round"
      dash={annotation.style.lineDash}
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