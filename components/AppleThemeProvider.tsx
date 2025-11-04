import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { liquidGlassPresets, refractionModes, LiquidGlassConfig } from '../utils/liquidGlassPresets';

// Apple Design Tokens
export const appleTokens = {
  colors: {
    system: {
      blue: '#007AFF',
      green: '#34C759',
      orange: '#FF9500',
      red: '#FF3B30',
      purple: '#AF52DE',
      pink: '#FF2D92',
      yellow: '#FFCC00',
      indigo: '#5856D6',
      teal: '#5AC8FA',
      mint: '#00C7BE',
      brown: '#A2845E',
      gray: '#8E8E93',
    },
    label: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#3C3C4399',
      quaternary: '#3C3C432E',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F2F2F7',
      tertiary: '#FFFFFF',
      overlay: '#000000',
      grouped: {
        primary: '#F2F2F7',
        secondary: '#FFFFFF',
        tertiary: '#F2F2F7',
      },
    },
    fill: {
      primary: '#78788033',
      secondary: '#78788028',
      tertiary: '#7676801E',
      quaternary: '#74748014',
    },
    separator: {
      opaque: '#C6C6C8',
      nonOpaque: '#3C3C4349',
    },
    border: {
      primary: '#3C3C4349',
      secondary: '#C6C6C8',
    },
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#3C3C4399',
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F2F2F7',
      accent: '#007AFF20',
    },
    accent: {
      primary: '#007AFF',
      secondary: '#5AC8FA',
    },
  },
  typography: {
    families: {
      display: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      text: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
    },
    sizes: {
      largeTitle: 34,
      title1: 28,
      title2: 22,
      title3: 20,
      headline: 17,
      body: 17,
      callout: 16,
      subheadline: 15,
      footnote: 13,
      caption1: 12,
      caption2: 11,
    },
    weights: {
      ultraLight: 100,
      thin: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      heavy: 800,
      black: 900,
    },
    lineHeights: {
      largeTitle: 1.2,
      title1: 1.3,
      title2: 1.3,
      title3: 1.4,
      headline: 1.4,
      body: 1.5,
      callout: 1.4,
      subheadline: 1.4,
      footnote: 1.4,
      caption1: 1.3,
      caption2: 1.2,
    },
    // Structured typography for component usage
    body: {
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      fontSize: 17,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    title2: {
      fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      fontSize: 22,
      fontWeight: 600,
      lineHeight: 1.3,
    },
    caption: {
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.3,
    },
  },
  spacing: {
    baseline: 8,
    micro: [4, 8, 12],
    standard: [16, 24, 32],
    macro: [48, 64, 80],
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 48,
    radius: {
      small: 4,
      medium: 8,
      large: 12,
      xlarge: 16,
      xxlarge: 24,
      full: 9999,
    },
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    xxlarge: 24,
    full: 9999,
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xlarge: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
  materials: {
    glass: {
      ultraThin: {
        opacity: 0.0025,
        blur: 0.5,
        brightness: 1.08,
        saturation: 1.18,
        borderOpacity: 0.012,
        shadowIntensity: 0.08,
      },
      thin: {
        opacity: 0.006,
        blur: 0.5,
        brightness: 1.1,
        saturation: 1.22,
        borderOpacity: 0.015,
        shadowIntensity: 0.1,
      },
      regular: {
        opacity: 0.009,
        blur: 0.5,
        brightness: 1.12,
        saturation: 1.25,
        borderOpacity: 0.018,
        shadowIntensity: 0.12,
      },
      thick: {
        opacity: 0.012,
        blur: 0.5,
        brightness: 1.14,
        saturation: 1.28,
        borderOpacity: 0.02,
        shadowIntensity: 0.14,
      },
      prominent: {
        opacity: 0.015,
        blur: 0.5,
        brightness: 1.15,
        saturation: 1.3,
        borderOpacity: 0.022,
        shadowIntensity: 0.16,
      },
    },
    // Enhanced pill button materials
    pill: {
      primary: {
        background: 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(0.5px) saturate(185%) brightness(1.08) contrast(1.06)',
        border: 'rgba(255, 255, 255, 0.18)',
        borderRadius: '24px', // Rectangular with curvy corners
        shadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
        hover: {
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'rgba(255, 255, 255, 0.26)',
          shadow: '0 10px 32px rgba(0, 0, 0, 0.12)',
        },
        active: {
          background: 'rgba(255, 255, 255, 0.28)',
          border: 'rgba(255, 255, 255, 0.4)',
          shadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
      },
      secondary: {
        background: 'rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(0.5px) saturate(165%) brightness(1.06) contrast(1.04)',
        border: 'rgba(255, 255, 255, 0.14)',
        borderRadius: '24px', // Rectangular with curvy corners
        shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        hover: {
          background: 'rgba(0, 0, 0, 0.12)',
          border: 'rgba(255, 255, 255, 0.22)',
          shadow: '0 8px 28px rgba(0, 0, 0, 0.10)',
        },
        active: {
          background: 'rgba(0, 0, 0, 0.2)',
          border: 'rgba(255, 255, 255, 0.3)',
          shadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        },
      },
      accent: {
        background: 'rgba(0, 122, 255, 0.18)',
        backdropFilter: 'blur(0.5px) saturate(200%) brightness(1.08) contrast(1.06)',
        border: 'rgba(0, 122, 255, 0.28)',
        borderRadius: '24px', // Rectangular with curvy corners
        shadow: '0 8px 24px rgba(0, 122, 255, 0.18)',
        hover: {
          background: 'rgba(0, 122, 255, 0.26)',
          border: 'rgba(0, 122, 255, 0.36)',
          shadow: '0 10px 32px rgba(0, 122, 255, 0.22)',
        },
        active: {
          background: 'rgba(0, 122, 255, 0.32)',
          border: 'rgba(0, 122, 255, 0.42)',
          shadow: '0 4px 16px rgba(0, 122, 255, 0.14)',
        },
      },
    },
  },
  // Enhanced interaction tokens
  interactions: {
    touchTarget: {
      minimum: 44, // Accessibility minimum touch target size
      comfortable: 48,
      spacious: 56,
    },
    transitions: {
      fast: 'cubic-bezier(0.4, 0.0, 0.2, 1) 150ms',
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1) 200ms',
      emphasized: 'cubic-bezier(0.2, 0.0, 0, 1) 250ms',
      elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55) 300ms',
    },
    states: {
      hover: {
        scale: 1.02,
        brightness: 1.1,
      },
      active: {
        scale: 0.98,
        brightness: 0.9,
      },
      focus: {
        outline: '2px solid rgba(0, 122, 255, 0.6)',
        outlineOffset: '2px',
      },
    },
  },
  // Liquid Glass Enhancement Tokens
  liquidGlass: {
    presets: liquidGlassPresets,
    modes: refractionModes,
    // Integration settings
    integration: {
      enableByDefault: true,
      respectUserPreferences: true,
      fallbackToFrostedGlass: true,
      performanceThreshold: 'medium' as const,
    },
    // Animation timing that inherits from Apple design system
    animations: {
      elasticTiming: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      standardTiming: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      duration: {
        fast: '150ms',
        medium: '250ms',
        slow: '350ms',
      },
    },
  },
};

// Dark-mode tokens calibrated for non-frosted iOS glass luminance/contrast
export const appleDarkTokens: typeof appleTokens = {
  ...appleTokens,
  colors: {
    ...appleTokens.colors,
    label: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      tertiary: '#EBEBF599',
      quaternary: '#EBEBF52E',
    },
    background: {
      primary: '#000000',
      secondary: '#111114',
      tertiary: '#1A1A1D',
      overlay: '#000000',
      grouped: {
        primary: '#000000',
        secondary: '#111114',
        tertiary: '#1A1A1D',
      },
    },
    fill: {
      primary: '#FFFFFF22',
      secondary: '#FFFFFF18',
      tertiary: '#FFFFFF12',
      quaternary: '#FFFFFF0E',
    },
    separator: {
      opaque: '#38383A',
      nonOpaque: '#54545899',
    },
    surface: {
      primary: '#0A0A0A',
      secondary: '#121214',
      accent: '#0A84FF20',
    },
    accent: {
      primary: '#0A84FF',
      secondary: '#64D2FF',
    },
  },
};

interface AppleThemeContextType {
  tokens: typeof appleTokens;
  mode: 'light' | 'dark';
  setMode: (m: 'light' | 'dark') => void;
}

const AppleThemeContext = createContext<AppleThemeContextType | undefined>(undefined);

export const useAppleTheme = () => {
  const context = useContext(AppleThemeContext);
  if (context === undefined) {
    // Provide fallback tokens to prevent crashes during development
    console.warn('useAppleTheme must be used within an AppleThemeProvider. Using fallback tokens.');
    return { tokens: appleTokens, mode: 'light', setMode: () => {} } as AppleThemeContextType;
  }
  return context;
};

interface AppleThemeProviderProps {
  children: React.ReactNode;
}

export const AppleThemeProvider: React.FC<AppleThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const activeTokens = useMemo(() => (mode === 'dark' ? appleDarkTokens : appleTokens), [mode]);

  return (
    <AppleThemeContext.Provider value={{ tokens: activeTokens, mode, setMode }}>
      {children}
    </AppleThemeContext.Provider>
  );
};

export default AppleThemeProvider;