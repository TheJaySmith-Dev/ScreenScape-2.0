import { useState, useEffect, useCallback } from 'react';

export const themes = {
  'cyber-blue': {
    name: 'Cyber Blue',
  },
  'synthwave-sunset': {
    name: 'Synthwave Sunset',
  },
  'emerald-matrix': {
    name: 'Emerald Matrix',
  },
  'cosmic-ruby': {
    name: 'Cosmic Ruby',
  },
  'light': {
    name: 'Light Mode',
  },
  'dark': {
    name: 'Dark Mode',
  },
  'auto': {
    name: 'System Preference',
  },
};

export type ThemeKey = keyof typeof themes;

const THEME_STORAGE_KEY = 'screenScapeTheme';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeKey>(() => {
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme && Object.keys(themes).includes(storedTheme)) {
            return storedTheme as ThemeKey;
        }
    }
    return 'auto'; // Default to system preference
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    // Set initial value
    updateSystemTheme();

    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, []);

  // Get the effective theme (resolving 'auto' to actual theme)
  const getEffectiveTheme = useCallback((): ThemeKey => {
    if (theme === 'auto') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = getEffectiveTheme();
    
    // Remove old theme classes
    Object.keys(themes).forEach(key => root.classList.remove(`theme-${key}`));
    
    // Add new theme class
    root.classList.add(`theme-${effectiveTheme}`);
    
    // Store the selected theme preference (not the effective theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, getEffectiveTheme]);

  const setCurrentTheme = useCallback((newTheme: ThemeKey) => {
    setTheme(newTheme);
  }, []);
  
  return { 
    theme: getEffectiveTheme(), // Return the effective theme
    selectedTheme: theme, // Return the user's selection
    systemTheme,
    setCurrentTheme, 
    availableThemes: (Object.keys(themes) as ThemeKey[]).map(key => ({ key, name: themes[key].name })) 
  };
};
