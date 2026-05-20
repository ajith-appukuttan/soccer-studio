import { useState } from 'react';
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Group,
  Divider,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCircle as IconAlertCircle } from '@tabler/icons-react';
import { useAuthStore } from '@/stores/authStore';
import { authService, type LoginCredentials } from '@/services/authService';
import classes from './LoginPage.module.css';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loginDev } = useAuthStore();

  // Quick development login
  const handleDevLogin = () => {
    loginDev();
  };

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      organizationName: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 8 ? null : 'Password must be at least 8 characters'),
      firstName: (value) => (!isLogin && value.length < 2 ? 'First name must be at least 2 characters' : null),
      lastName: (value) => (!isLogin && value.length < 2 ? 'Last name must be at least 2 characters' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const credentials: LoginCredentials = {
          email: values.email,
          password: values.password,
        };
        const response = await authService.login(credentials);
        login(response.user, response.organization, response.token);
      } else {
        const registerData = {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          organizationName: values.organizationName,
        };
        const response = await authService.register(registerData);
        login(response.user, response.organization, response.token);
      }
    } catch (err: any) {
      setError(err.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    form.reset();
  };

  return (
    <div className={classes.wrapper}>
      <LoadingOverlay visible={loading} />
      
      <Container size={420} className={classes.container}>
        <Title ta="center" className={classes.title}>
          Soccer Studio
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
            />
            
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              {...form.getInputProps('password')}
            />

            {!isLogin && (
              <>
                <Group grow mt="md">
                  <TextInput
                    label="First Name"
                    placeholder="John"
                    required
                    {...form.getInputProps('firstName')}
                  />
                  <TextInput
                    label="Last Name"
                    placeholder="Doe"
                    required
                    {...form.getInputProps('lastName')}
                  />
                </Group>

                <TextInput
                  label="Organization Name"
                  placeholder="Your club or academy"
                  mt="md"
                  {...form.getInputProps('organizationName')}
                />
              </>
            )}

            <Button type="submit" fullWidth mt="xl" size="md">
              {isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <Divider my="lg" />
          
          {/* Development Quick Login */}
          <Button
            variant="light"
            color="green"
            fullWidth
            size="sm"
            onClick={handleDevLogin}
            mb="md"
          >
            🚀 Test Login (coach@testemail.com)
          </Button>
          
          <Text size="xs" c="dimmed" ta="center" mt="xs">
            One-click login - no password needed
          </Text>

          <Text c="dimmed" size="sm" ta="center">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <Anchor size="sm" component="button" onClick={toggleMode}>
              {isLogin ? 'Create account' : 'Sign in'}
            </Anchor>
          </Text>
        </Paper>
      </Container>
    </div>
  );
}