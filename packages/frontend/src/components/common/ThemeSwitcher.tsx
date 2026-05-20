import { ActionIcon, useMantineColorScheme, Tooltip, Menu } from '@mantine/core';
import { 
  IconSun, 
  IconMoon, 
  IconSquare as   IconSquare,
  IconCheck,
  IconCircle as IconPalette 
} from '@tabler/icons-react';
import { useThemeStore } from '@/stores/themeStore';

interface ThemeSwitcherProps {
  variant?: 'icon' | 'menu';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function ThemeSwitcher({ variant = 'icon', size = 'md' }: ThemeSwitcherProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { 
    colorScheme: themeStoreScheme, 
    setColorScheme: setThemeStoreScheme,
    setPrimaryColor,
    resetTheme
  } = useThemeStore();

  const handleSchemeChange = (scheme: 'light' | 'dark' | 'auto') => {
    setColorScheme(scheme);
    setThemeStoreScheme(scheme);
  };

  const getIcon = () => {
    switch (themeStoreScheme || colorScheme) {
      case 'dark':
        return <IconMoon size={16} />;
      case 'light':
        return <IconSun size={16} />;
      case 'auto':
        return <IconSquare size={16} />;
      default:
        return <IconSun size={16} />;
    }
  };

  const getLabel = () => {
    switch (themeStoreScheme || colorScheme) {
      case 'dark':
        return 'Dark mode';
      case 'light':
        return 'Light mode';
      case 'auto':
        return 'System theme';
      default:
        return 'Light mode';
    }
  };

  if (variant === 'icon') {
    return (
      <Tooltip label={getLabel()}>
        <ActionIcon
          onClick={() => {
            const schemes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
            const currentIndex = schemes.indexOf(themeStoreScheme || colorScheme as any);
            const nextScheme = schemes[(currentIndex + 1) % schemes.length];
            handleSchemeChange(nextScheme);
          }}
          variant="subtle"
          size={size}
          aria-label="Toggle color scheme"
        >
          {getIcon()}
        </ActionIcon>
      </Tooltip>
    );
  }

  const colorOptions = [
    { name: 'Soccer Green', value: 'brand', color: '#22c55e' },
    { name: 'Blue', value: 'blue', color: '#3b82f6' },
    { name: 'Red', value: 'red', color: '#ef4444' },
    { name: 'Orange', value: 'orange', color: '#f97316' },
    { name: 'Purple', value: 'violet', color: '#8b5cf6' },
    { name: 'Teal', value: 'teal', color: '#14b8a6' },
  ];

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Tooltip label="Theme options">
          <ActionIcon
            variant="subtle"
            size={size}
            aria-label="Theme options"
          >
            <IconPalette size={16} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Color Scheme</Menu.Label>
        
        <Menu.Item
          leftSection={<IconSun size={14} />}
          rightSection={themeStoreScheme === 'light' ? <IconCheck size={14} /> : null}
          onClick={() => handleSchemeChange('light')}
        >
          Light
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconMoon size={14} />}
          rightSection={themeStoreScheme === 'dark' ? <IconCheck size={14} /> : null}
          onClick={() => handleSchemeChange('dark')}
        >
          Dark
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconSquare size={14} />}
          rightSection={themeStoreScheme === 'auto' ? <IconCheck size={14} /> : null}
          onClick={() => handleSchemeChange('auto')}
        >
          System
        </Menu.Item>

        <Menu.Divider />
        <Menu.Label>Primary Color</Menu.Label>
        
        {colorOptions.map((option) => (
          <Menu.Item
            key={option.value}
            leftSection={
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: option.color,
                  border: '1px solid var(--mantine-color-gray-3)',
                }}
              />
            }
            onClick={() => setPrimaryColor(option.value)}
          >
            {option.name}
          </Menu.Item>
        ))}

        <Menu.Divider />
        
        <Menu.Item
          onClick={resetTheme}
          c="dimmed"
        >
          Reset to Default
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}