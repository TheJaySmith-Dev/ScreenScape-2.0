import { useState, useEffect, useCallback } from 'react';

export const themes = {
  'cyber-blue': {
    name: 'Cyber Blue',
    colors: {
      '--color-accent-300': '#93d4ff',
      '--color-accent-400': '#64b5f6',
      '--color-accent-500': '#2196f3',
      '--color-accent-600': '#0073e6',
      '--color-accent-700': '#0d47a1',
      '--glow-color': '#0073e6',
    },
  },
  'synthwave-sunset': {
    name: 'Synthwave Sunset',
    colors: {
      '--color-accent-300': '#ff8a80',
      '--color-accent-400': '#ff5252',
      '--color-accent-500': '#e91e63',
      '--color-accent-600': '#c2185b',
      '--color-accent-700': '#880e4f',
      '--glow-color': '#e91e63',
    },
  },
  'emerald-matrix': {
    name: 'Emerald Matrix',
    colors: {
      '--color-accent-300': '#69f0ae',
      '--color-accent-400': '#00e676',
      '--color-accent-500': '#4caf50',
      '--color-accent-600': '#388e3c',
      '--color-accent-700': '#1b5e20',
      '--glow-color': '#00e676',
    },
  },
  'cosmic-ruby': {
    name: 'Cosmic Ruby',
    colors: {
      '--color-accent-300': '#f06292',
      '--color-accent-400': '#ec407a',
      '--color-accent-500': '#d81b60',
      '--color-accent-600': '#c2185b',
      '--color-accent-700': '#ad1457',
      '--glow-color': '#d81b60',
    },
  },
};

export type ThemeKey = keyof typeof themes;

const THEME_STORAGE_KEY = 'screenScapeTheme';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeKey>(() => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey) || 'cyber-blue';
    }
    return 'cyber-blue';
  });

  useEffect(() => {
    const themeData = themes[theme];
    const root = document.documentElement;
    Object.entries(themeData.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setCurrentTheme = useCallback((newTheme: ThemeKey) => {
    setTheme(newTheme);
  }, []);
  
  // FIX: The original implementation using `Object.entries` resulted in the `key` property being typed as a generic `string`, causing a type mismatch with `ThemeKey`.
  // Using `Object.keys` with a type assertion ensures that the `key` in the returned `themes` array is correctly typed as `ThemeKey`.
  return { theme, setCurrentTheme, themes: (Object.keys(themes) as ThemeKey[]).map(key => ({ key, ...themes[key] })) };
};
