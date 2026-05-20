import { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  Text,
  Divider,
  ColorPicker,
  Slider,
  Paper,
  Select,
} from '@mantine/core';
import {
  IconCircle,
  IconArrowRight,
  IconPencil,
  IconSquare,
  IconMinus,
  IconTypography,
  IconPointer,
  IconUser,
  IconUsers,
  IconRectangle,
  IconTarget,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { type DrawingTool } from './AnnotationCanvas';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, isActive, onClick }: ToolButtonProps) {
  return (
    <Tooltip label={label} position="right">
      <ActionIcon
        size="lg"
        variant={isActive ? 'filled' : 'subtle'}
        onClick={onClick}
        color={isActive ? 'blue' : 'gray'}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );
}

interface SoccerToolPaletteProps {
  currentTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
}

export function SoccerToolPalette({ currentTool, onToolChange }: SoccerToolPaletteProps) {
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  const basicTools = [
    { type: 'pen' as const, icon: <IconPencil size={18} />, label: 'Freehand Drawing' },
    { type: 'line' as const, icon: <IconMinus size={18} />, label: 'Line' },
    { type: 'rectangle' as const, icon: <IconSquare size={18} />, label: 'Rectangle' },
    { type: 'circle' as const, icon: <IconCircle size={18} />, label: 'Circle' },
    { type: 'arrow' as const, icon: <IconArrowRight size={18} />, label: 'Arrow' },
    { type: 'text' as const, icon: <IconTypography size={18} />, label: 'Text' },
  ];

  const soccerTools = [
    { type: 'player' as const, icon: <IconUser size={18} />, label: 'Add Player' },
    { type: 'formation' as const, icon: <IconUsers size={18} />, label: 'Team Formation' },
  ];

  const formations = [
    { value: '4-4-2', label: '4-4-2 - Balanced' },
    { value: '4-3-3', label: '4-3-3 - Attacking' },
    { value: '3-5-2', label: '3-5-2 - Wing Play' },
    { value: '5-3-2', label: '5-3-2 - Defensive' },
    { value: '4-2-3-1', label: '4-2-3-1 - Modern' },
  ];

  const teamColors = [
    '#FF0000', // Red
    '#0000FF', // Blue
    '#00FF00', // Green
    '#FFFF00', // Yellow
    '#FF8C00', // Orange
    '#800080', // Purple
    '#000000', // Black
    '#FFFFFF', // White
  ];

  const handleToolSelect = (toolType: DrawingTool['type']) => {
    onToolChange({
      type: toolType,
      color: selectedColor,
      strokeWidth: strokeWidth
    });
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onToolChange({
      ...currentTool,
      color: color
    });
  };

  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width);
    onToolChange({
      ...currentTool,
      strokeWidth: width
    });
  };

  return (
    <Paper p="md" withBorder style={{ width: 280 }}>
      <Stack gap="md">
        <div>
          <Text size="sm" fw={600} c="dimmed" mb="xs">
            Drawing Tools
          </Text>
          <Group gap="xs">
            {basicTools.map((tool) => (
              <ToolButton
                key={tool.type}
                icon={tool.icon}
                label={tool.label}
                isActive={currentTool.type === tool.type}
                onClick={() => handleToolSelect(tool.type)}
              />
            ))}
          </Group>
        </div>

        <Divider />

        <div>
          <Text size="sm" fw={600} c="dimmed" mb="xs">
            Soccer Tools
          </Text>
          <Group gap="xs">
            {soccerTools.map((tool) => (
              <ToolButton
                key={tool.type}
                icon={tool.icon}
                label={tool.label}
                isActive={currentTool.type === tool.type}
                onClick={() => handleToolSelect(tool.type)}
              />
            ))}
          </Group>
        </div>

        <Divider />

        <div>
          <Text size="sm" fw={600} c="dimmed" mb="xs">
            Tool Properties
          </Text>
          
          <Stack gap="sm">
            <div>
              <Text size="xs" c="dimmed" mb={4}>Color</Text>
              <Group gap="xs">
                {teamColors.map((color) => (
                  <ActionIcon
                    key={color}
                    size="sm"
                    variant={selectedColor === color ? 'filled' : 'outline'}
                    style={{ 
                      backgroundColor: color,
                      borderColor: color,
                      opacity: selectedColor === color ? 1 : 0.7
                    }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </Group>
            </div>

            <div>
              <Text size="xs" c="dimmed" mb={4}>
                Stroke Width: {strokeWidth}px
              </Text>
              <Slider
                value={strokeWidth}
                onChange={handleStrokeWidthChange}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
              />
            </div>
          </Stack>
        </div>

        <Divider />

        <div>
          <Text size="sm" fw={600} c="dimmed" mb="xs">
            Quick Formations
          </Text>
          <Select
            placeholder="Choose formation"
            data={formations}
            comboboxProps={{ shadow: 'md' }}
          />
          <Button
            size="sm"
            variant="light"
            leftSection={<IconUsers size={16} />}
            mt="xs"
            fullWidth
          >
            Add Formation
          </Button>
        </div>

        <Divider />

        <Text size="xs" c="dimmed" ta="center">
          Select a tool and click on the video to start annotating
        </Text>
      </Stack>
    </Paper>
  );
}