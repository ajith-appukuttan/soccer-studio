import { Group, Line, RegularPolygon } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { colorToString, angle, distance } from '@shared/utils';
import type { ArrowAnnotationSchema } from '@shared/types';
import { z } from 'zod';

interface ArrowAnnotationProps {
  annotation: z.infer<typeof ArrowAnnotationSchema>;
}

export function ArrowAnnotation({ annotation }: ArrowAnnotationProps) {
  const { selectedAnnotations, selectAnnotation } = useEditorStore();
  
  const isSelected = selectedAnnotations.includes(annotation.id);
  
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectAnnotation(annotation.id, e.evt.ctrlKey || e.evt.metaKey);
  };

  const arrowAngle = angle(annotation.start, annotation.end);
  const arrowLength = distance(annotation.start, annotation.end);
  const arrowSize = annotation.style.arrowSize;

  // Calculate arrowhead position
  const headLength = Math.min(arrowSize, arrowLength * 0.3);
  const headX = annotation.end.x - Math.cos(arrowAngle) * headLength * 0.5;
  const headY = annotation.end.y - Math.sin(arrowAngle) * headLength * 0.5;

  return (
    <Group
      draggable={isSelected}
      onClick={handleClick}
    >
      {/* Arrow shaft */}
      <Line
        points={[annotation.start.x, annotation.start.y, headX, headY]}
        stroke={colorToString(annotation.style.strokeColor)}
        strokeWidth={annotation.style.strokeWidth}
        lineCap="round"
        strokeScaleEnabled={false}
        // Highlight when selected
        shadowColor={isSelected ? 'blue' : undefined}
        shadowBlur={isSelected ? 5 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
      />
      
      {/* Arrow head */}
      <RegularPolygon
        x={annotation.end.x}
        y={annotation.end.y}
        sides={3}
        radius={arrowSize}
        fill={colorToString(annotation.style.strokeColor)}
        stroke={colorToString(annotation.style.strokeColor)}
        strokeWidth={annotation.style.strokeWidth}
        rotation={(arrowAngle * 180) / Math.PI + 90}
        strokeScaleEnabled={false}
        // Highlight when selected
        shadowColor={isSelected ? 'blue' : undefined}
        shadowBlur={isSelected ? 5 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
      />
    </Group>
  );
}