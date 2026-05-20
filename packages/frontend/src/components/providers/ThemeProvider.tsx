import { useEffect, ReactNode } from 'react';
import { MantineProvider, ColorSchemeScript, MantineColorScheme } from '@mantine/core';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { organization } = useAuthStore();
  const { colorScheme, customTheme, setColorScheme, updateCustomTheme } = useThemeStore();

  // Apply organization theme when organization changes
  useEffect(() => {
    if (organization?.settings?.theme) {
      updateCustomTheme(organization.settings.theme);
    }
  }, [organization, updateCustomTheme]);

  // Handle system color scheme changes
  useEffect(() => {
    if (colorScheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Auto mode will be handled by Mantine automatically
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [colorScheme]);

  const resolvedColorScheme: MantineColorScheme = 
    colorScheme === 'auto' ? 'auto' : colorScheme;

  return (
    <>
      <ColorSchemeScript defaultColorScheme={resolvedColorScheme} />
      <MantineProvider 
        theme={customTheme} 
        defaultColorScheme={resolvedColorScheme}
      >
        {children}
      </MantineProvider>
    </>
  );
}