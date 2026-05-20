import { useEffect } from 'react';
import {
  Stack,
  Group,
  Avatar,
  Text,
  Badge,
  Paper,
  ScrollArea,
  Indicator,
  Tooltip,
  ActionIcon,
  Button,
  Divider,
} from '@mantine/core';
import {
  IconUsers,
  IconEye,
  IconEdit as IconPencil,
  IconUser as IconCrown,
  IconCircle as IconWifi,
  IconX as IconWifiOff,
  IconRefresh,
} from '@tabler/icons-react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';

interface CollaborationPanelProps {
  projectId?: string;
}

export function CollaborationPanel({ projectId }: CollaborationPanelProps) {
  const { user } = useAuthStore();
  const {
    isConnected,
    isConnecting,
    connectionError,
    collaborators,
    activities,
    remoteSelections,
    connect,
    disconnect,
    joinProject,
    leaveProject,
  } = useCollaborationStore();

  // Auto-join project when component mounts or projectId changes
  useEffect(() => {
    if (projectId && user && isConnected) {
      joinProject(projectId);
    }
    
    return () => {
      if (projectId) {
        leaveProject();
      }
    };
  }, [projectId, user, isConnected]);

  // Auto-connect when component mounts
  useEffect(() => {
    if (user && !isConnected && !isConnecting) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [user]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <IconCrown size={12} />;
      case 'COACH':
        return <IconPencil size={12} />;
      default:
        return <IconEye size={12} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'grape';
      case 'COACH':
        return 'blue';
      case 'ANALYST':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const collaboratorArray = Array.from(collaborators.values());
  const currentUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    color: '#22c55e', // You color
  } : null;

  return (
    <Stack gap="md" style={{ width: 280, height: '100%' }}>
      {/* Connection Status */}
      <Paper p="sm" withBorder>
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            {isConnected ? (
              <IconWifi size={16} color="green" />
            ) : (
              <IconWifiOff size={16} color="red" />
            )}
            <Text size="sm" fw={500}>
              Collaboration
            </Text>
          </Group>
          
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={connect}
            loading={isConnecting}
            disabled={isConnected}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Group>

        {connectionError && (
          <Text size="xs" c="red" mb="xs">
            {connectionError}
          </Text>
        )}

        <Text size="xs" c="dimmed">
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </Text>
      </Paper>

      {/* Active Users */}
      <Paper p="sm" withBorder>
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <IconUsers size={16} />
            <Text size="sm" fw={500}>
              Active Users
            </Text>
          </Group>
          <Badge size="sm" variant="outline">
            {collaboratorArray.length + (currentUser ? 1 : 0)}
          </Badge>
        </Group>

        <Stack gap="xs">
          {/* Current User */}
          {currentUser && (
            <Group gap="sm">
              <Indicator
                inline
                size={8}
                offset={-2}
                position="bottom-end"
                color="green"
                withBorder
              >
                <Avatar
                  size="sm"
                  color="green"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {getInitials(currentUser.firstName, currentUser.lastName)}
                </Avatar>
              </Indicator>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap="xs">
                  <Text size="sm" fw={500} truncate>
                    You ({currentUser.firstName})
                  </Text>
                  <Tooltip label={currentUser.role}>
                    <Badge 
                      size="xs" 
                      color={getRoleColor(currentUser.role)}
                      leftSection={getRoleIcon(currentUser.role)}
                    >
                      {currentUser.role}
                    </Badge>
                  </Tooltip>
                </Group>
              </div>
            </Group>
          )}

          {/* Other Users */}
          {collaboratorArray.map((collaborator) => {
            const isSelected = remoteSelections.has(collaborator.id);
            
            return (
              <Group key={collaborator.id} gap="sm">
                <Indicator
                  inline
                  size={8}
                  offset={-2}
                  position="bottom-end"
                  color="green"
                  withBorder
                >
                  <Avatar
                    size="sm"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {getInitials(collaborator.firstName, collaborator.lastName)}
                  </Avatar>
                </Indicator>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs">
                    <Text size="sm" fw={500} truncate>
                      {collaborator.firstName} {collaborator.lastName}
                    </Text>
                    <Tooltip label={collaborator.role}>
                      <Badge 
                        size="xs" 
                        color={getRoleColor(collaborator.role)}
                        leftSection={getRoleIcon(collaborator.role)}
                      >
                        {collaborator.role}
                      </Badge>
                    </Tooltip>
                  </Group>
                  
                  {isSelected && (
                    <Text size="xs" c="dimmed" truncate>
                      Selecting annotations
                    </Text>
                  )}
                </div>
              </Group>
            );
          })}

          {collaboratorArray.length === 0 && !currentUser && (
            <Text size="sm" c="dimmed" ta="center">
              No active users
            </Text>
          )}
        </Stack>
      </Paper>

      {/* Activity Feed */}
      <Paper p="sm" withBorder style={{ flex: 1 }}>
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <Text size="sm" fw={500}>
              Recent Activity
            </Text>
          </Group>
          <Badge size="sm" variant="outline">
            {activities.length}
          </Badge>
        </Group>

        <ScrollArea style={{ height: 200 }}>
          <Stack gap="xs">
            {activities.slice(0, 20).map((activity) => (
              <Group key={activity.id} gap="sm" align="flex-start">
                <Avatar size="xs" color="gray">
                  {getInitials(activity.user.firstName, activity.user.lastName)}
                </Avatar>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" lineClamp={2}>
                    <Text span fw={500}>
                      {activity.user.firstName} {activity.user.lastName}
                    </Text>
                    {' '}
                    {activity.message}
                  </Text>
                  
                  <Text size="xs" c="dimmed">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </Text>
                </div>
              </Group>
            ))}

            {activities.length === 0 && (
              <Text size="sm" c="dimmed" ta="center">
                No recent activity
              </Text>
            )}
          </Stack>
        </ScrollArea>
      </Paper>

      {!isConnected && (
        <Button
          size="sm"
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={connect}
          loading={isConnecting}
        >
          Connect
        </Button>
      )}
    </Stack>
  );
}