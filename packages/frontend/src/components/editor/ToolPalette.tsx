import {
  Stack,
  Button,
  Paper,
  Text,
  Tooltip,
  ActionIcon,
  ColorPicker,
  Popover,
  Slider,
  NumberInput,
  Select,
} from '@mantine/core';
import {
  IconCircle as IconPointer,
  IconCircle,
  IconSquare as IconLine,
  IconArrowRight,
  IconSquare as IconTypography,
  IconUser,
  IconSquare as IconTactics,
  IconCircle as IconPalette,
} from '@tabler/icons-react';
import { useEditorStore } from '@/stores/editorStore';
import { colorToString, stringToColor } from '@shared/utils';
import { DRAWING_TOOLS } from '@shared/constants';
import classes from './ToolPalette.module.css';

const tools = [
  { id: DRAWING_TOOLS.SELECT, icon: IconPointer, label: 'Select', shortcut: 'V' },
  { id: DRAWING_TOOLS.CIRCLE, icon: IconCircle, label: 'Circle', shortcut: 'C' },
  { id: DRAWING_TOOLS.LINE, icon: IconLine, label: 'Line', shortcut: 'L' },
  { id: DRAWING_TOOLS.ARROW, icon: IconArrowRight, label: 'Arrow', shortcut: 'A' },
  { id: DRAWING_TOOLS.TEXT, icon: IconTypography, label: 'Text', shortcut: 'T' },
  { id: DRAWING_TOOLS.PLAYER, icon: IconUser, label: 'Player', shortcut: 'P' },
  { id: DRAWING_TOOLS.FORMATION, icon: IconTactics, label: 'Formation', shortcut: 'F' },
];

export function ToolPalette() {
  const {
    selectedTool,
    toolSettings,
    setSelectedTool,
    updateToolSettings,
  } = useEditorStore();

  return (
    <Paper className={classes.container} p="sm" withBorder>
      <Text size="sm" fw={600} mb="sm">
        Tools
      </Text>
      
      <Stack gap="xs">
        {/* Drawing Tools */}
        {tools.map((tool) => (
          <Tooltip
            key={tool.id}
            label={`${tool.label} (${tool.shortcut})`}
            position="right"
          >
            <Button
              variant={selectedTool === tool.id ? 'filled' : 'subtle'}
              size="sm"
              leftSection={<tool.icon size={16} />}
              onClick={() => setSelectedTool(tool.id as any)}
              fullWidth
              justify="flex-start"
            >
              {tool.label}
            </Button>
          </Tooltip>
        ))}
        
        <div className={classes.divider} />
        
        {/* Tool Settings */}
        <Text size="sm" fw={600} mb="xs">
          Settings
        </Text>
        
        {/* Stroke Color */}
        <div className={classes.settingRow}>
          <Text size="xs" c="dimmed">
            Stroke Color
          </Text>
          <Popover position="right" shadow="md">
            <Popover.Target>
              <ActionIcon
                variant="outline"
                style={{
                  backgroundColor: colorToString(toolSettings.strokeColor),
                  borderColor: colorToString(toolSettings.strokeColor),
                }}
              >
                <IconPalette size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <ColorPicker
                format="rgba"
                value={colorToString(toolSettings.strokeColor)}
                onChange={(color) => {
                  updateToolSettings({ strokeColor: stringToColor(color) });
                }}
              />
            </Popover.Dropdown>
          </Popover>
        </div>
        
        {/* Fill Color */}
        <div className={classes.settingRow}>
          <Text size="xs" c="dimmed">
            Fill Color
          </Text>
          <Popover position="right" shadow="md">
            <Popover.Target>
              <ActionIcon
                variant="outline"
                style={{
                  backgroundColor: colorToString(toolSettings.fillColor),
                  borderColor: colorToString(toolSettings.fillColor),
                }}
              >
                <IconPalette size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <ColorPicker
                format="rgba"
                value={colorToString(toolSettings.fillColor)}
                onChange={(color) => {
                  updateToolSettings({ fillColor: stringToColor(color) });
                }}
              />
            </Popover.Dropdown>
          </Popover>
        </div>
        
        {/* Stroke Width */}
        <div className={classes.settingGroup}>
          <Text size="xs" c="dimmed" mb="xs">
            Stroke Width
          </Text>
          <Slider
            min={1}
            max={20}
            value={toolSettings.strokeWidth}
            onChange={(value) => updateToolSettings({ strokeWidth: value })}
            size="sm"
            mb="xs"
          />
          <NumberInput
            size="xs"
            min={1}
            max={20}
            value={toolSettings.strokeWidth}
            onChange={(value) => updateToolSettings({ strokeWidth: value || 1 })}
          />
        </div>
        
        {/* Font Settings (for text tool) */}
        {selectedTool === 'text' && (
          <>
            <div className={classes.settingGroup}>
              <Text size="xs" c="dimmed" mb="xs">
                Font Size
              </Text>
              <NumberInput
                size="xs"
                min={8}
                max={72}
                value={toolSettings.fontSize}
                onChange={(value) => updateToolSettings({ fontSize: value || 16 })}
              />
            </div>
            
            <div className={classes.settingGroup}>
              <Text size="xs" c="dimmed" mb="xs">
                Font Family
              </Text>
              <Select
                size="xs"
                value={toolSettings.fontFamily}
                onChange={(value) => updateToolSettings({ fontFamily: value || 'Arial' })}
                data={[
                  'Arial',
                  'Helvetica',
                  'Times New Roman',
                  'Courier New',
                  'Georgia',
                  'Verdana',
                ]}
              />
            </div>
          </>
        )}
      </Stack>
    </Paper>
  );
}