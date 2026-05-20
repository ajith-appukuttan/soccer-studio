import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MantineColorScheme } from '@mantine/core';

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeState {
  colorScheme: ColorScheme;
  primaryColor: string;
  customTheme: Record<string, any>;
}

interface ThemeActions {
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  setPrimaryColor: (color: string) => void;
  updateCustomTheme: (theme: Record<string, any>) => void;
  resetTheme: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

const defaultTheme = {
  colors: {
    // Soccer field green
    brand: [
      '#e6f7f0',
      '#c7edd9',
      '#9ce0b8',
      '#6bd194',
      '#45c477',
      '#2bb866',
      '#20a056',
      '#1b8847',
      '#177038',
      '#10582a',
    ],
  },
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '600',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.75rem',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    Card: {
      defaultProps: {
        padding: 'md',
        radius: 'md',
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        padding: 'md',
        radius: 'md',
        withBorder: true,
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 3,
        },
      },
    },
    Drawer: {
      defaultProps: {
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 3,
        },
      },
    },
  },
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      colorScheme: 'light',
      primaryColor: 'brand',
      customTheme: defaultTheme,

      // Actions
      setColorScheme: (colorScheme) => {
        set({ colorScheme });
      },

      toggleColorScheme: () => {
        const current = get().colorScheme;
        const schemes: ColorScheme[] = ['light', 'dark', 'auto'];
        const currentIndex = schemes.indexOf(current);
        const newScheme = schemes[(currentIndex + 1) % schemes.length];
        set({ colorScheme: newScheme });
      },

      setPrimaryColor: (primaryColor) => {
        set({ primaryColor });
      },

      updateCustomTheme: (theme) => {
        set((state) => ({
          customTheme: { ...state.customTheme, ...theme },
        }));
      },

      resetTheme: () => {
        set({
          colorScheme: 'auto',
          primaryColor: 'brand',
          customTheme: defaultTheme,
        });
      },
    }),
    {
      name: 'soccer-training-theme',
    }
  )
);