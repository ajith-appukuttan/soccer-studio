import { Group, Text, Rect } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { colorToString } from '@shared/utils';
import type { TextAnnotationSchema } from '@shared/types';
import { z } from 'zod';

interface TextAnnotationProps {
  annotation: z.infer<typeof TextAnnotationSchema>;
}

export function TextAnnotation({ annotation }: TextAnnotationProps) {
  const { selectedAnnotations, selectAnnotation } = useEditorStore();
  
  const isSelected = selectedAnnotations.includes(annotation.id);
  
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectAnnotation(annotation.id, e.evt.ctrlKey || e.evt.metaKey);
  };

  const textStyle = annotation.style;
  const fontStyle = `${textStyle.bold ? 'bold ' : ''}${textStyle.italic ? 'italic ' : ''}${textStyle.fontSize}px ${textStyle.fontFamily}`;

  return (
    <Group
      x={annotation.position.x}
      y={annotation.position.y}
      draggable={isSelected}
      onClick={handleClick}
    >
      {/* Background rectangle if backgroundColor is specified */}
      {textStyle.backgroundColor && (
        <Rect
          x={-5}
          y={-textStyle.fontSize - 5}
          width={annotation.content.length * textStyle.fontSize * 0.6 + 10}
          height={textStyle.fontSize + 10}
          fill={colorToString(textStyle.backgroundColor)}
          cornerRadius={3}
          strokeScaleEnabled={false}
        />
      )}
      
      {/* Text */}
      <Text
        text={annotation.content}
        fontSize={textStyle.fontSize}
        fontFamily={textStyle.fontFamily}
        fontStyle={`${textStyle.bold ? 'bold' : ''} ${textStyle.italic ? 'italic' : ''}`}
        fill={colorToString(textStyle.color)}
        strokeScaleEnabled={false}
        // Highlight when selected
        shadowColor={isSelected ? 'blue' : undefined}
        shadowBlur={isSelected ? 5 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
      />
    </Group>
  );
}