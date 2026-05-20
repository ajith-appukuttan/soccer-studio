import { useEffect } from 'react';
import { LoadingOverlay } from '@mantine/core';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, token, login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          setLoading(true);
          const { user, organization } = await authService.getMe();
          if (user && organization) {
            login(user, organization, token);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, login, logout, setLoading]);

  if (isLoading) {
    return <LoadingOverlay visible zIndex={1000} />;
  }

  return <>{children}</>;
}