import {
  Stack,
  Paper,
  Text,
  Button,
  Group,
  NumberInput,
  TextInput,
  Switch,
  Divider,
  ScrollArea,
  Badge,
  ActionIcon,
} from '@mantine/core';
import { IconTrash, IconEdit, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useEditorStore } from '@/stores/editorStore';
import { formatTime } from '@shared/utils';
import classes from './PropertiesPanel.module.css';

export function PropertiesPanel() {
  const {
    selectedAnnotations,
    annotations,
    currentProject,
    updateAnnotation,
    deleteAnnotation,
    clearAnnotationSelection,
  } = useEditorStore();

  const selectedAnnotationObjects = annotations.filter(a => 
    selectedAnnotations.includes(a.id)
  );

  const handleDeleteSelected = () => {
    selectedAnnotations.forEach(id => deleteAnnotation(id));
    clearAnnotationSelection();
  };

  const renderAnnotationProperties = (annotation: any) => {
    return (
      <div key={annotation.id} className={classes.annotationItem}>
        <Group justify="space-between" mb="xs">
          <Badge variant="light" size="sm">
            {annotation.type}
          </Badge>
          <Group gap="xs">
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => {
                // Toggle visibility
                updateAnnotation(annotation.id, {
                  visible: !annotation.visible
                });
              }}
            >
              {annotation.visible !== false ? <IconEye size={14} /> : <IconEyeOff size={14} />}
            </ActionIcon>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => deleteAnnotation(annotation.id)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        </Group>

        <Text size="xs" c="dimmed" mb="sm">
          Time: {formatTime(annotation.timestamp)}
        </Text>

        {/* Type-specific properties */}
        {annotation.type === 'circle' && (
          <Stack gap="xs">
            <NumberInput
              label="Radius"
              size="xs"
              value={annotation.radius}
              onChange={(value) => updateAnnotation(annotation.id, { radius: value })}
            />
            <NumberInput
              label="Stroke Width"
              size="xs"
              value={annotation.style?.strokeWidth || 2}
              onChange={(value) => updateAnnotation(annotation.id, {
                style: { ...annotation.style, strokeWidth: value }
              })}
            />
            <Switch
              label="Filled"
              size="xs"
              checked={annotation.style?.filled || false}
              onChange={(event) => updateAnnotation(annotation.id, {
                style: { ...annotation.style, filled: event.currentTarget.checked }
              })}
            />
          </Stack>
        )}

        {annotation.type === 'line' && (
          <Stack gap="xs">
            <NumberInput
              label="Stroke Width"
              size="xs"
              value={annotation.style?.strokeWidth || 2}
              onChange={(value) => updateAnnotation(annotation.id, {
                style: { ...annotation.style, strokeWidth: value }
              })}
            />
          </Stack>
        )}

        {annotation.type === 'arrow' && (
          <Stack gap="xs">
            <NumberInput
              label="Stroke Width"
              size="xs"
              value={annotation.style?.strokeWidth || 2}
              onChange={(value) => updateAnnotation(annotation.id, {
                style: { ...annotation.style, strokeWidth: value }
              })}
            />
            <NumberInput
              label="Arrow Size"
              size="xs"
              value={annotation.style?.arrowSize || 10}
              onChange={(value) => updateAnnotation(annotation.id, {
                style: { ...annotation.style, arrowSize: value }
              })}
            />
          </Stack>
        )}

        {annotation.type === 'text' && (
          <Stack gap="xs">
            <TextInput
              label="Text"
              size="xs"
              value={annotation.content || ''}
              onChange={(event) => updateAnnotation(annotation.id, {
                content: event.currentTarget.value
              })}
            />
            <NumberInput
              label="Font Size"
              size="xs"
              value={annotation.style?.fontSize || 16}
              onChange={(value) => updateAnnotation(annotation.id, {
                style: { ...annotation.style, fontSize: value }
              })}
            />
          </Stack>
        )}

        {annotation.type === 'player' && (
          <Stack gap="xs">
            <TextInput
              label="Player Number"
              size="xs"
              value={annotation.playerNumber || ''}
              onChange={(event) => updateAnnotation(annotation.id, {
                playerNumber: event.currentTarget.value
              })}
            />
            <NumberInput
              label="Size"
              size="xs"
              value={annotation.style?.size || 20}
              onChange={(value) => updateAnnotation(annotation.id, {
                style: { ...annotation.style, size: value }
              })}
            />
          </Stack>
        )}
      </div>
    );
  };

  return (
    <Paper className={classes.container} p="sm" withBorder>
      <Text size="sm" fw={600} mb="sm">
        Properties
      </Text>

      {selectedAnnotationObjects.length === 0 ? (
        <Text size="xs" c="dimmed" ta="center" mt="md">
          Select an annotation to edit its properties
        </Text>
      ) : (
        <>
          {selectedAnnotationObjects.length > 1 && (
            <Group mb="sm">
              <Text size="xs" c="dimmed">
                {selectedAnnotationObjects.length} annotations selected
              </Text>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={handleDeleteSelected}
              >
                Delete All
              </Button>
            </Group>
          )}

          <ScrollArea className={classes.scrollArea}>
            <Stack gap="md">
              {selectedAnnotationObjects.map(renderAnnotationProperties)}
            </Stack>
          </ScrollArea>
        </>
      )}

      <Divider my="sm" />

      {/* Project Settings */}
      <Text size="sm" fw={600} mb="sm">
        Project
      </Text>

      {currentProject && (
        <Stack gap="xs">
          <TextInput
            label="Title"
            size="xs"
            value={currentProject.title}
            onChange={(event) => {
              // Update project title
              // updateProject({ title: event.currentTarget.value });
            }}
          />
          
          <Text size="xs" c="dimmed">
            Annotations: {annotations.length}
          </Text>
          
          <Text size="xs" c="dimmed">
            Last saved: {new Date(currentProject.updatedAt).toLocaleString()}
          </Text>
        </Stack>
      )}
    </Paper>
  );
}