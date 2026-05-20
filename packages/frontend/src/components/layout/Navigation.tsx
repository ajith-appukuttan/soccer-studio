import { NavLink } from 'react-router-dom';
import {
  Group,
  Text,
  ThemeIcon,
  UnstyledButton,
  rem,
  Box,
  Transition,
} from '@mantine/core';
import {
  IconHome,
  IconVideo,
  IconEdit,
  IconSettings,
  IconUsers,
  IconChartLine,
  IconArrowRight,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import classes from './Navigation.module.css';

const navigationItems = [
  { 
    label: 'Dashboard', 
    icon: IconHome, 
    to: '/dashboard',
    description: 'Overview & insights',
    color: 'blue'
  },
  { 
    label: 'Videos', 
    icon: IconVideo, 
    to: '/videos',
    description: 'Video library',
    color: 'violet'
  },
  { 
    label: 'Editor', 
    icon: IconEdit, 
    to: '/editor',
    description: 'Analysis workspace',
    color: 'green'
  },
  { 
    label: 'Team', 
    icon: IconUsers, 
    to: '/team',
    description: 'Collaboration',
    color: 'orange'
  },
  { 
    label: 'Analytics', 
    icon: IconChartLine, 
    to: '/analytics',
    description: 'Performance data',
    color: 'teal'
  },
  { 
    label: 'Settings', 
    icon: IconSettings, 
    to: '/settings',
    description: 'Preferences',
    color: 'gray'
  },
];

export function Navigation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = navigationItems.map((item, index) => (
    <Transition
      key={item.label}
      mounted={mounted}
      transition="slide-right"
      duration={300}
      timingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
      delay={index * 50}
    >
      {(styles) => (
        <UnstyledButton
          className={classes.control}
          component={NavLink}
          to={item.to}
          style={styles}
        >
          {({ isActive }) => (
            <Box className={`${classes.linkWrapper} ${isActive ? classes.active : ''}`}>
              <Group justify="flex-start" gap="sm" w="100%">
                <ThemeIcon
                  variant={isActive ? 'filled' : 'light'}
                  color={isActive ? item.color : 'gray'}
                  size={36}
                  className={classes.linkIcon}
                >
                  <item.icon style={{ width: rem(18), height: rem(18) }} />
                </ThemeIcon>

                <Box style={{ flex: 1 }}>
                  <Text
                    fw={isActive ? 600 : 500}
                    c={isActive ? item.color : undefined}
                    className={classes.linkLabel}
                  >
                    {item.label}
                  </Text>
                  <Text size="xs" c="dimmed" className={classes.linkDescription}>
                    {item.description}
                  </Text>
                </Box>

                <IconArrowRight 
                  size={14} 
                  className={`${classes.linkArrow} ${isActive ? classes.linkArrowActive : ''}`}
                />
              </Group>
            </Box>
          )}
        </UnstyledButton>
      )}
    </Transition>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>{links}</div>
    </nav>
  );
}