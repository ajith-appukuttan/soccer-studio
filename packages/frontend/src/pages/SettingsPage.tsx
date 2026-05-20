import {
  Stack,
  Card,
  Text,
  Button,
  Group,
  Switch,
  Select,
  NumberInput,
  ColorInput,
  Divider,
  Tabs,
  TextInput,
  PasswordInput,
  Alert,
} from '@mantine/core';
import {
  IconUser,
  IconCircle as IconPalette,
  IconSettings,
  IconSquare as IconLock,
  IconCircle as IconBell,
  IconCircle as IconInfoCircle,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

export function SettingsPage() {
  const { user, organization } = useAuthStore();
  const { colorScheme, toggleColorScheme, primaryColor, setPrimaryColor } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Stack gap="lg">
      <Text size="xl" fw={700}>
        Settings
      </Text>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'profile')}>
        <Tabs.List>
          <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
            Profile
          </Tabs.Tab>
          <Tabs.Tab value="appearance" leftSection={<IconPalette size={16} />}>
            Appearance
          </Tabs.Tab>
          <Tabs.Tab value="preferences" leftSection={<IconSettings size={16} />}>
            Preferences
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconLock size={16} />}>
            Security
          </Tabs.Tab>
          <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
            Notifications
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" mt="md">
          <Card withBorder>
            <Card.Section p="md" withBorder>
              <Text fw={600}>Profile Information</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="First Name"
                    value={user?.firstName || ''}
                    placeholder="John"
                  />
                  <TextInput
                    label="Last Name"
                    value={user?.lastName || ''}
                    placeholder="Doe"
                  />
                </Group>
                
                <TextInput
                  label="Email"
                  value={user?.email || ''}
                  placeholder="john@example.com"
                />
                
                <Select
                  label="Role"
                  value={user?.role || ''}
                  data={[
                    { value: 'admin', label: 'Administrator' },
                    { value: 'coach', label: 'Coach' },
                    { value: 'analyst', label: 'Analyst' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                  disabled
                />
                
                <Group justify="flex-end" mt="md">
                  <Button variant="light">Cancel</Button>
                  <Button>Save Changes</Button>
                </Group>
              </Stack>
            </Card.Section>
          </Card>

          <Card withBorder mt="md">
            <Card.Section p="md" withBorder>
              <Text fw={600}>Organization</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <TextInput
                  label="Organization Name"
                  value={organization?.name || ''}
                  placeholder="Your club or academy"
                />
                
                <TextInput
                  label="Subdomain"
                  value={organization?.subdomain || ''}
                  placeholder="yourclub"
                  description="yourclub.soccertraining.app"
                />
                
                <Select
                  label="Plan"
                  value={organization?.plan || ''}
                  data={[
                    { value: 'free', label: 'Free' },
                    { value: 'pro', label: 'Pro' },
                    { value: 'enterprise', label: 'Enterprise' },
                  ]}
                  disabled
                />
              </Stack>
            </Card.Section>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="appearance" mt="md">
          <Card withBorder>
            <Card.Section p="md" withBorder>
              <Text fw={600}>Theme Settings</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Dark Mode</Text>
                    <Text size="xs" c="dimmed">Toggle between light and dark themes</Text>
                  </div>
                  <Switch
                    checked={colorScheme === 'dark'}
                    onChange={toggleColorScheme}
                  />
                </Group>
                
                <ColorInput
                  label="Primary Color"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  description="Choose your brand color"
                />
                
                <Select
                  label="Interface Density"
                  value="comfortable"
                  data={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'spacious', label: 'Spacious' },
                  ]}
                />
                
                <NumberInput
                  label="Font Size"
                  value={14}
                  min={12}
                  max={18}
                  description="Base font size in pixels"
                />
              </Stack>
            </Card.Section>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="preferences" mt="md">
          <Card withBorder>
            <Card.Section p="md" withBorder>
              <Text fw={600}>Editor Preferences</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Auto-save</Text>
                    <Text size="xs" c="dimmed">Automatically save changes every few minutes</Text>
                  </div>
                  <Switch defaultChecked />
                </Group>
                
                <NumberInput
                  label="Auto-save Interval (minutes)"
                  value={5}
                  min={1}
                  max={30}
                />
                
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Snap to Grid</Text>
                    <Text size="xs" c="dimmed">Snap annotations to grid when drawing</Text>
                  </div>
                  <Switch />
                </Group>
                
                <NumberInput
                  label="Grid Size"
                  value={20}
                  min={5}
                  max={50}
                  description="Grid spacing in pixels"
                />
                
                <Select
                  label="Default Tool"
                  value="select"
                  data={[
                    { value: 'select', label: 'Select' },
                    { value: 'circle', label: 'Circle' },
                    { value: 'line', label: 'Line' },
                    { value: 'arrow', label: 'Arrow' },
                  ]}
                />
              </Stack>
            </Card.Section>
          </Card>

          <Card withBorder mt="md">
            <Card.Section p="md" withBorder>
              <Text fw={600}>Video Playback</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <NumberInput
                  label="Default Playback Speed"
                  value={1}
                  min={0.25}
                  max={2}
                  step={0.25}
                  description="Default video playback speed"
                />
                
                <NumberInput
                  label="Skip Interval (seconds)"
                  value={10}
                  min={1}
                  max={60}
                  description="Time to skip when using arrow keys"
                />
                
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Loop Playback</Text>
                    <Text size="xs" c="dimmed">Loop video when it reaches the end</Text>
                  </div>
                  <Switch />
                </Group>
              </Stack>
            </Card.Section>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="security" mt="md">
          <Card withBorder>
            <Card.Section p="md" withBorder>
              <Text fw={600}>Change Password</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <PasswordInput
                  label="Current Password"
                  placeholder="Enter current password"
                />
                
                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
                />
                
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                />
                
                <Group justify="flex-end" mt="md">
                  <Button>Update Password</Button>
                </Group>
              </Stack>
            </Card.Section>
          </Card>

          <Card withBorder mt="md">
            <Card.Section p="md" withBorder>
              <Text fw={600}>Two-Factor Authentication</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Enable 2FA</Text>
                    <Text size="xs" c="dimmed">Add an extra layer of security to your account</Text>
                  </div>
                  <Switch />
                </Group>
                
                <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                  Two-factor authentication is not yet enabled. Set it up to secure your account.
                </Alert>
              </Stack>
            </Card.Section>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="notifications" mt="md">
          <Card withBorder>
            <Card.Section p="md" withBorder>
              <Text fw={600}>Email Notifications</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Project Updates</Text>
                    <Text size="xs" c="dimmed">When someone comments on your projects</Text>
                  </div>
                  <Switch defaultChecked />
                </Group>
                
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>New Team Members</Text>
                    <Text size="xs" c="dimmed">When new members join your organization</Text>
                  </div>
                  <Switch defaultChecked />
                </Group>
                
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>System Updates</Text>
                    <Text size="xs" c="dimmed">Important system announcements</Text>
                  </div>
                  <Switch defaultChecked />
                </Group>
                
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Marketing</Text>
                    <Text size="xs" c="dimmed">Tips, tutorials, and product updates</Text>
                  </div>
                  <Switch />
                </Group>
              </Stack>
            </Card.Section>
          </Card>

          <Card withBorder mt="md">
            <Card.Section p="md" withBorder>
              <Text fw={600}>Browser Notifications</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Desktop Notifications</Text>
                    <Text size="xs" c="dimmed">Show notifications in your browser</Text>
                  </div>
                  <Switch />
                </Group>
                
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Sound</Text>
                    <Text size="xs" c="dimmed">Play sound for notifications</Text>
                  </div>
                  <Switch />
                </Group>
              </Stack>
            </Card.Section>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}