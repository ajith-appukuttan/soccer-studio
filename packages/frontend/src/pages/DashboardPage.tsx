import {
  Grid,
  Card,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Paper,
  RingProgress,
  ThemeIcon,
  Badge,
  Title,
  Transition,
  Box,
} from '@mantine/core';
import {
  IconVideo,
  IconEdit,
  IconUsers,
  IconChartLine,
  IconPlus,
  IconClock,
  IconStar,
  IconTrendingUp,
  IconArrowRight,
  IconSparkles,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';
import classes from './DashboardPage.module.css';

const stats = [
  { label: 'Total Videos', value: 0, icon: IconVideo, color: 'blue', trend: '+0%' },
  { label: 'Active Projects', value: 0, icon: IconEdit, color: 'green', trend: '+0%' },
  { label: 'Team Members', value: 1, icon: IconUsers, color: 'orange', trend: '+100%' },
  { label: 'Hours Analyzed', value: 0, icon: IconClock, color: 'purple', trend: '+0%' },
];

const recentProjects: any[] = [];

export function DashboardPage() {
  const { user, organization } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Progressive disclosure: show quick actions after a brief delay
    const timer = setTimeout(() => setShowQuickActions(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const currentTime = new Date().getHours();
  const greeting = currentTime < 12 ? 'Good morning' : currentTime < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Stack gap="xl" className={classes.container}>
      {/* Header with staggered animation */}
      <Transition
        mounted={mounted}
        transition="slide-down"
        duration={400}
        timingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
      >
        {(styles) => (
          <Group justify="space-between" style={styles}>
            <Box>
              <Title order={1} size="h2" className={classes.welcomeTitle}>
                {greeting}, {user?.firstName}! 
                <IconSparkles size={24} className={classes.sparkle} />
              </Title>
              <Text c="dimmed" size="sm" className={classes.subtitle}>
                {organization?.name} • {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </Box>
            
            <Transition
              mounted={showQuickActions}
              transition="scale"
              duration={300}
              timingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
            >
              {(actionStyles) => (
                <Group style={actionStyles}>
                  <Button
                    component={Link}
                    to="/videos"
                    variant="light"
                    leftSection={<IconVideo size={16} />}
                    className={classes.actionButton}
                  >
                    Upload Video
                  </Button>
                  <Button
                    component={Link}
                    to="/editor"
                    leftSection={<IconPlus size={16} />}
                    className={classes.primaryActionButton}
                  >
                    New Project
                  </Button>
                </Group>
              )}
            </Transition>
          </Group>
        )}
      </Transition>

      {/* Stats Grid with staggered animation */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {stats.map((stat, index) => (
          <Transition
            key={stat.label}
            mounted={mounted}
            transition="slide-up"
            duration={400}
            timingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
            delay={index * 100}
          >
            {(styles) => (
              <Paper 
                p="md" 
                withBorder 
                className={classes.statCard}
                style={styles}
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="xs" justify="space-between">
                      <Text c="dimmed" size="sm" tt="uppercase" fw={500} lh={1}>
                        {stat.label}
                      </Text>
                      <Group gap={4}>
                        <IconTrendingUp size={12} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="green" fw={500}>
                          {stat.trend}
                        </Text>
                      </Group>
                    </Group>
                    <Text fw={700} size="xl" className={classes.statValue}>
                      {stat.value.toLocaleString()}
                    </Text>
                  </Stack>
                  <ThemeIcon 
                    size={44} 
                    radius="md" 
                    variant="light" 
                    color={stat.color}
                    className={classes.statIcon}
                  >
                    <stat.icon size={24} />
                  </ThemeIcon>
                </Group>
              </Paper>
            )}
          </Transition>
        ))}
      </SimpleGrid>

      <Grid>
        {/* Recent Projects */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card withBorder h="100%">
            <Card.Section p="md" withBorder>
              <Group justify="space-between">
                <Text fw={600}>Recent Projects</Text>
                <Button
                  variant="subtle"
                  size="sm"
                  component={Link}
                  to="/projects"
                >
                  View All
                </Button>
              </Group>
            </Card.Section>
            
            <Card.Section p="md">
              {recentProjects.length > 0 ? (
                <Stack gap="md">
                  {recentProjects.map((project, index) => (
                    <Transition
                      key={project.id}
                      mounted={mounted}
                      transition="slide-right"
                      duration={300}
                      timingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
                      delay={500 + index * 100}
                    >
                      {(styles) => (
                        <Paper 
                          p="sm" 
                          withBorder 
                          radius="sm" 
                          className={classes.projectCard}
                          style={styles}
                        >
                          <Group justify="space-between" align="flex-start">
                            <div style={{ flex: 1 }}>
                              <Group gap="xs" mb="xs">
                                <Text fw={500} size="sm">
                                  {project.title}
                                </Text>
                                <Badge size="xs" variant="light">
                                  {project.progress}%
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed" mb="xs">
                                {project.videoTitle}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Last modified {project.lastModified}
                              </Text>
                              
                              <RingProgress
                                mt="xs"
                                size={60}
                                thickness={4}
                                sections={[{ value: project.progress, color: 'blue' }]}
                                label={
                                  <Text size="xs" ta="center" fw={500}>
                                    {project.progress}%
                                  </Text>
                                }
                              />
                            </div>
                            
                            <Button
                              variant="light"
                              size="xs"
                              component={Link}
                              to={`/editor/${project.id}`}
                              className={classes.openButton}
                              rightSection={<IconArrowRight size={12} />}
                            >
                              Open
                            </Button>
                          </Group>
                        </Paper>
                      )}
                    </Transition>
                  ))}
                </Stack>
              ) : (
                <Transition
                  mounted={mounted}
                  transition="fade"
                  duration={600}
                  timingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
                  delay={600}
                >
                  {(styles) => (
                    <Stack align="center" gap="lg" py="xl" style={styles} className={classes.emptyState}>
                      <Box className={classes.emptyStateIcon}>
                        <IconEdit size={48} stroke={1} />
                      </Box>
                      <Stack align="center" gap="xs">
                        <Text fw={500} size="lg">
                          Ready to analyze your first match?
                        </Text>
                        <Text size="sm" c="dimmed" ta="center" maw={300}>
                          Upload a video and start creating professional soccer analysis with AI-powered insights
                        </Text>
                      </Stack>
                      <Button
                        size="lg"
                        component={Link}
                        to="/videos"
                        leftSection={<IconPlus size={20} />}
                        className={classes.ctaButton}
                      >
                        Upload Your First Video
                      </Button>
                    </Stack>
                  )}
                </Transition>
              )}
            </Card.Section>
          </Card>
        </Grid.Col>

        {/* Quick Actions */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder h="100%">
            <Card.Section p="md" withBorder>
              <Text fw={600}>Quick Actions</Text>
            </Card.Section>
            
            <Card.Section p="md">
              <Stack gap="sm">
                  <Button
                    variant="light"
                    fullWidth
                    leftSection={<IconVideo size={16} />}
                    component={Link}
                    to="/videos"
                  >
                    Upload New Video
                  </Button>
                
                <Button
                  variant="light"
                  fullWidth
                  leftSection={<IconEdit size={16} />}
                  component={Link}
                  to="/editor"
                >
                  Create Project
                </Button>
                
                <Button
                  variant="light"
                  fullWidth
                  leftSection={<IconUsers size={16} />}
                  component={Link}
                  to="/team"
                >
                  Manage Team
                </Button>
                
                        <Button
                          variant="light"
                          fullWidth
                          leftSection={<IconChartLine size={16} />}
                          component={Link}
                          to="/analytics"
                        >
                          View Analytics
                        </Button>
              </Stack>
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Tips & Tutorials */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon variant="light" size="md">
              <IconStar size={18} />
            </ThemeIcon>
            <Text fw={600}>Getting Started</Text>
          </Group>
        </Group>
        
        <Text size="sm" c="dimmed" mb="md">
          New to the platform? Check out these helpful resources to get started with video analysis.
        </Text>
        
        <Group>
          <Button variant="subtle" size="sm">
            Quick Tour
          </Button>
          <Button variant="subtle" size="sm">
            Video Tutorials
          </Button>
          <Button variant="subtle" size="sm">
            Documentation
          </Button>
        </Group>
      </Card>
    </Stack>
  );
}