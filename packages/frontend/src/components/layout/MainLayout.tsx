import { Outlet } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  Text,
  UnstyledButton,
  Avatar,
  Menu,
  rem,
  Transition,
  Box,
  Indicator,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSettings,
  IconLogout,
  IconUser,
  IconChevronDown,
  IconBell,
} from '@tabler/icons-react';
import { Navigation } from './Navigation';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { useAuthStore } from '@/stores/authStore';
import classes from './MainLayout.module.css';

export function MainLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { user, organization, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" align="center">
          <Group align="center" gap="md">
            <Burger 
              opened={opened} 
              onClick={toggle} 
              hiddenFrom="sm" 
              size="sm"
              className={classes.burger}
            />
            <Box className={classes.logo}>
              <Text size="xl" fw={700} c="brand" className={classes.logoText}>
                Soccer Studio
              </Text>
            </Box>
          </Group>

          <Group gap="sm" align="center">
            <Indicator
              inline
              size={8}
              offset={4}
              position="top-end"
              color="red"
              withBorder
              disabled={true} // No notifications for now
            >
              <UnstyledButton className={classes.notificationButton}>
                <IconBell size={18} />
              </UnstyledButton>
            </Indicator>
            
            <ThemeSwitcher variant="menu" />

            {user && (
              <Menu 
                position="bottom-end" 
                shadow="lg" 
                width={220}
                transitionProps={{ 
                  transition: 'scale-y', 
                  duration: 200,
                  timingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <Menu.Target>
                  <UnstyledButton className={classes.userButton}>
                    <Group gap="sm" align="center" wrap="nowrap">
                      <Avatar
                        size={32}
                        radius="xl"
                        color="brand"
                        className={classes.userAvatar}
                      >
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </Avatar>
                      <Box className={classes.userInfo}>
                        <Text size="sm" fw={500} lh={1.2}>
                          {user.firstName} {user.lastName}
                        </Text>
                        <Text c="dimmed" size="xs" lh={1.2}>
                          {organization?.name}
                        </Text>
                      </Box>
                      <IconChevronDown size={14} className={classes.chevron} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown className={classes.menuDropdown}>
                  <Menu.Item 
                    leftSection={<IconUser size={16} />}
                    className={classes.menuItem}
                  >
                    Profile
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconSettings size={16} />}
                    className={classes.menuItem}
                  >
                    Settings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={16} />}
                    onClick={handleLogout}
                    className={classes.logoutItem}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Navigation />
      </AppShell.Navbar>

      <AppShell.Main className={classes.main}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}