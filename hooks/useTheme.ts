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
    return 'cyber-blue';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove old theme classes
    Object.keys(themes).forEach(key => root.classList.remove(`theme-${key}`));
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setCurrentTheme = useCallback((newTheme: ThemeKey) => {
    setTheme(newTheme);
  }, []);
  
  return { 
    theme, 
    setCurrentTheme, 
    availableThemes: (Object.keys(themes) as ThemeKey[]).map(key => ({ key, name: themes[key].name })) 
  };
};
