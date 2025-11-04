import React, { createContext, useContext, useEffect, useState } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';

// Apple Design Tokens
export interface AppleDesignTokens {
  colors: {
    system: {
      blue: string;
      green: string;
      orange: string;
      red: string;
      purple: string;
      pink: string;
      yellow: string;
      indigo: string;
      teal: string;
      mint: string;
      brown: string;
      gray: string;
    };
    label: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      grouped: {
        primary: string;
        secondary: string;
        tertiary: string;
      };
    };
    fill: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
    };
    separator: {
      opaque: string;
      nonOpaque: string;
    };
  };
  typography: {
    families: {
      display: string;
      text: string;
      mono: string;
    };
    sizes: {
      largeTitle: number;
      title1: number;
      title2: number;
      title3: number;
      headline: number;
      body: number;
      callout: number;
      subheadline: number;
      footnote: number;
      caption1: number;
      caption2: number;
    };
    weights: {
      ultraLight: number;
      thin: number;
      light: number;
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
      heavy: number;
      black: number;
    };
    lineHeights: {
      largeTitle: number;
      title1: number;
      title2: number;
      title3: number;
      headline: number;
      body: number;
      callout: number;
      subheadline: number;
      footnote: number;
      caption1: number;
      caption2: number;
    };
  };
  spacing: {
    baseline: number;
    micro: number[];
    standard: number[];
    macro: number[];
  };
  materials: {
    glass: {
      ultraThin: GlassMaterial;
      thin: GlassMaterial;
      regular: GlassMaterial;
      thick: GlassMaterial;
      prominent: GlassMaterial;
    };
    depth: {
      layer0: DepthLayer;
      layer1: DepthLayer;
      layer2: DepthLayer;
      layer3: DepthLayer;
      layer4: DepthLayer;
    };
  };
  animations: {
    spring: AnimationConfig;
    easeInOut: AnimationConfig;
    gentle: AnimationConfig;
    snappy: AnimationConfig;
  };
}

export interface GlassMaterial {
  opacity: number;
  blur: number;
  borderOpacity: number;
  shadowIntensity: number;
}

export interface DepthLayer {
  elevation: number;
  shadowBlur: number;
  shadowOpacity: number;
  shadowOffset: { x: number; y: number };
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  damping?: number;
  stiffness?: number;
}

// Light Theme Tokens
const lightThemeTokens: AppleDesignTokens = {
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
  },
  spacing: {
    baseline: 8,
    micro: [4, 8, 12],
    standard: [16, 24, 32],
    macro: [48, 64, 80],
  },
  materials: {
    glass: {
      ultraThin: {
        opacity: 0.05,
        blur: 20,
        borderOpacity: 0.1,
        shadowIntensity: 0.1,
      },
      thin: {
        opacity: 0.08,
        blur: 25,
        borderOpacity: 0.12,
        shadowIntensity: 0.12,
      },
      regular: {
        opacity: 0.1,
        blur: 30,
        borderOpacity: 0.15,
        shadowIntensity: 0.15,
      },
      thick: {
        opacity: 0.15,
        blur: 35,
        borderOpacity: 0.18,
        shadowIntensity: 0.18,
      },
      prominent: {
        opacity: 0.2,
        blur: 40,
        borderOpacity: 0.2,
        shadowIntensity: 0.2,
      },
    },
    depth: {
      layer0: {
        elevation: 0,
        shadowBlur: 0,
        shadowOpacity: 0,
        shadowOffset: { x: 0, y: 0 },
      },
      layer1: {
        elevation: 1,
        shadowBlur: 2,
        shadowOpacity: 0.1,
        shadowOffset: { x: 0, y: 1 },
      },
      layer2: {
        elevation: 2,
        shadowBlur: 8,
        shadowOpacity: 0.15,
        shadowOffset: { x: 0, y: 4 },
      },
      layer3: {
        elevation: 3,
        shadowBlur: 16,
        shadowOpacity: 0.2,
        shadowOffset: { x: 0, y: 8 },
      },
      layer4: {
        elevation: 4,
        shadowBlur: 24,
        shadowOpacity: 0.25,
        shadowOffset: { x: 0, y: 12 },
      },
    },
  },
  animations: {
    spring: {
      duration: 0.6,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      damping: 0.6,
      stiffness: 100,
    },
    easeInOut: {
      duration: 0.6,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    gentle: {
      duration: 0.8,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
    snappy: {
      duration: 0.3,
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
};

// Dark Theme Tokens
const darkThemeTokens: AppleDesignTokens = {
  ...lightThemeTokens,
  colors: {
    ...lightThemeTokens.colors,
    label: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      tertiary: '#EBEBF599',
      quaternary: '#EBEBF52E',
    },
    background: {
      primary: '#000000',
      secondary: '#1C1C1E',
      tertiary: '#2C2C2E',
      grouped: {
        primary: '#000000',
        secondary: '#1C1C1E',
        tertiary: '#2C2C2E',
      },
    },
    fill: {
      primary: '#78788066',
      secondary: '#78788052',
      tertiary: '#7676803D',
      quaternary: '#74748029',
    },
    separator: {
      opaque: '#38383A',
      nonOpaque: '#54545899',
    },
  },
};

// Theme Context
interface AppleThemeContextType {
  tokens: AppleDesignTokens;
  colorScheme: 'light' | 'dark' | 'auto';
  setColorScheme: (scheme: 'light' | 'dark' | 'auto') => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  reducedTransparency: boolean;
  setReducedTransparency: (reduced: boolean) => void;
}

const AppleThemeContext = createContext<AppleThemeContextType | undefined>(undefined);

export const useAppleTheme = () => {
  const context = useContext(AppleThemeContext);
  if (!context) {
    throw new Error('useAppleTheme must be used within an AppleDesignSystemProvider');
  }
  return context;
};

// Global Styles with Apple Design System
const AppleGlobalStyles = createGlobalStyle<{ tokens: AppleDesignTokens; reducedMotion: boolean }>`
  /* San Francisco Font Import */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
  
  /* CSS Custom Properties for Design Tokens */
  :root {
    /* Colors */
    --apple-system-blue: ${props => props.tokens.colors.system.blue};
    --apple-system-green: ${props => props.tokens.colors.system.green};
    --apple-system-orange: ${props => props.tokens.colors.system.orange};
    --apple-system-red: ${props => props.tokens.colors.system.red};
    --apple-system-purple: ${props => props.tokens.colors.system.purple};
    --apple-system-pink: ${props => props.tokens.colors.system.pink};
    --apple-system-yellow: ${props => props.tokens.colors.system.yellow};
    --apple-system-indigo: ${props => props.tokens.colors.system.indigo};
    --apple-system-teal: ${props => props.tokens.colors.system.teal};
    --apple-system-mint: ${props => props.tokens.colors.system.mint};
    --apple-system-brown: ${props => props.tokens.colors.system.brown};
    --apple-system-gray: ${props => props.tokens.colors.system.gray};
    
    --apple-label-primary: ${props => props.tokens.colors.label.primary};
    --apple-label-secondary: ${props => props.tokens.colors.label.secondary};
    --apple-label-tertiary: ${props => props.tokens.colors.label.tertiary};
    --apple-label-quaternary: ${props => props.tokens.colors.label.quaternary};
    
    --apple-background-primary: ${props => props.tokens.colors.background.primary};
    --apple-background-secondary: ${props => props.tokens.colors.background.secondary};
    --apple-background-tertiary: ${props => props.tokens.colors.background.tertiary};
    --apple-background-grouped-primary: ${props => props.tokens.colors.background.grouped.primary};
    --apple-background-grouped-secondary: ${props => props.tokens.colors.background.grouped.secondary};
    --apple-background-grouped-tertiary: ${props => props.tokens.colors.background.grouped.tertiary};
    
    /* Typography */
    --apple-font-display: ${props => props.tokens.typography.families.display};
    --apple-font-text: ${props => props.tokens.typography.families.text};
    --apple-font-mono: ${props => props.tokens.typography.families.mono};
    
    /* Spacing */
    --apple-spacing-baseline: ${props => props.tokens.spacing.baseline}px;
    
    /* Glass Materials */
    --apple-glass-ultra-thin-opacity: ${props => props.tokens.materials.glass.ultraThin.opacity};
    --apple-glass-ultra-thin-blur: ${props => props.tokens.materials.glass.ultraThin.blur}px;
    --apple-glass-thin-opacity: ${props => props.tokens.materials.glass.thin.opacity};
    --apple-glass-thin-blur: ${props => props.tokens.materials.glass.thin.blur}px;
    --apple-glass-regular-opacity: ${props => props.tokens.materials.glass.regular.opacity};
    --apple-glass-regular-blur: ${props => props.tokens.materials.glass.regular.blur}px;
    --apple-glass-thick-opacity: ${props => props.tokens.materials.glass.thick.opacity};
    --apple-glass-thick-blur: ${props => props.tokens.materials.glass.thick.blur}px;
    --apple-glass-prominent-opacity: ${props => props.tokens.materials.glass.prominent.opacity};
    --apple-glass-prominent-blur: ${props => props.tokens.materials.glass.prominent.blur}px;
    
    /* Animation Timing */
    --apple-animation-spring: ${props => props.tokens.animations.spring.easing};
    --apple-animation-ease-in-out: ${props => props.tokens.animations.easeInOut.easing};
    --apple-animation-gentle: ${props => props.tokens.animations.gentle.easing};
    --apple-animation-snappy: ${props => props.tokens.animations.snappy.easing};
  }
  
  /* Respect user preferences */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Base styles */
  * {
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.body}px;
    line-height: ${props => props.tokens.typography.lineHeights.body};
    color: var(--apple-label-primary);
    background-color: var(--apple-background-primary);
    overflow-x: hidden;
    
    /* Enable GPU acceleration for smooth animations */
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }
  
  /* Typography Scale */
  .apple-large-title {
    font-family: var(--apple-font-display);
    font-size: ${props => props.tokens.typography.sizes.largeTitle}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.largeTitle};
  }
  
  .apple-title-1 {
    font-family: var(--apple-font-display);
    font-size: ${props => props.tokens.typography.sizes.title1}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.title1};
  }
  
  .apple-title-2 {
    font-family: var(--apple-font-display);
    font-size: ${props => props.tokens.typography.sizes.title2}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.title2};
  }
  
  .apple-title-3 {
    font-family: var(--apple-font-display);
    font-size: ${props => props.tokens.typography.sizes.title3}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.title3};
  }
  
  .apple-headline {
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.headline}px;
    font-weight: ${props => props.tokens.typography.weights.semibold};
    line-height: ${props => props.tokens.typography.lineHeights.headline};
  }
  
  .apple-body {
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.body}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.body};
  }
  
  .apple-callout {
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.callout}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.callout};
  }
  
  .apple-subheadline {
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.subheadline}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.subheadline};
  }
  
  .apple-footnote {
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.footnote}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.footnote};
  }
  
  .apple-caption-1 {
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.caption1}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.caption1};
  }
  
  .apple-caption-2 {
    font-family: var(--apple-font-text);
    font-size: ${props => props.tokens.typography.sizes.caption2}px;
    font-weight: ${props => props.tokens.typography.weights.regular};
    line-height: ${props => props.tokens.typography.lineHeights.caption2};
  }
  
  /* Glass Material Utility Classes */
  /* Enhanced Glass Material Properties for Authentic Apple Experience */
  .apple-glass-ultra-thin {
    background-color: rgba(255, 255, 255, var(--apple-glass-ultra-thin-opacity));
    backdrop-filter: blur(var(--apple-glass-ultra-thin-blur));
    -webkit-backdrop-filter: blur(var(--apple-glass-ultra-thin-blur));
    border: 1px solid rgba(255, 255, 255, ${props => props.tokens.materials.glass.ultraThin.borderOpacity});
    box-shadow: 0 8px 32px rgba(0, 0, 0, ${props => props.tokens.materials.glass.ultraThin.shadowIntensity});
    will-change: backdrop-filter, transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .apple-glass-thin {
    background-color: rgba(255, 255, 255, var(--apple-glass-thin-opacity));
    backdrop-filter: blur(var(--apple-glass-thin-blur));
    -webkit-backdrop-filter: blur(var(--apple-glass-thin-blur));
    border: 1px solid rgba(255, 255, 255, ${props => props.tokens.materials.glass.thin.borderOpacity});
    box-shadow: 0 8px 32px rgba(0, 0, 0, ${props => props.tokens.materials.glass.thin.shadowIntensity});
    will-change: backdrop-filter, transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .apple-glass-regular {
    background-color: rgba(255, 255, 255, var(--apple-glass-regular-opacity));
    backdrop-filter: blur(var(--apple-glass-regular-blur));
    -webkit-backdrop-filter: blur(var(--apple-glass-regular-blur));
    border: 1px solid rgba(255, 255, 255, ${props => props.tokens.materials.glass.regular.borderOpacity});
    box-shadow: 0 8px 32px rgba(0, 0, 0, ${props => props.tokens.materials.glass.regular.shadowIntensity});
    will-change: backdrop-filter, transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .apple-glass-thick {
    background-color: rgba(255, 255, 255, var(--apple-glass-thick-opacity));
    backdrop-filter: blur(var(--apple-glass-thick-blur));
    -webkit-backdrop-filter: blur(var(--apple-glass-thick-blur));
    border: 1px solid rgba(255, 255, 255, ${props => props.tokens.materials.glass.thick.borderOpacity});
    box-shadow: 0 8px 32px rgba(0, 0, 0, ${props => props.tokens.materials.glass.thick.shadowIntensity});
    will-change: backdrop-filter, transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .apple-glass-prominent {
    background-color: rgba(255, 255, 255, var(--apple-glass-prominent-opacity));
    backdrop-filter: blur(var(--apple-glass-prominent-blur));
    -webkit-backdrop-filter: blur(var(--apple-glass-prominent-blur));
    border: 1px solid rgba(255, 255, 255, ${props => props.tokens.materials.glass.prominent.borderOpacity});
    box-shadow: 0 8px 32px rgba(0, 0, 0, ${props => props.tokens.materials.glass.prominent.shadowIntensity});
    will-change: backdrop-filter, transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Depth Layer Utility Classes */
  .apple-depth-0 {
    box-shadow: none;
  }
  
  .apple-depth-1 {
    box-shadow: ${props => props.tokens.materials.depth.layer1.shadowOffset.x}px ${props => props.tokens.materials.depth.layer1.shadowOffset.y}px ${props => props.tokens.materials.depth.layer1.shadowBlur}px rgba(0, 0, 0, ${props => props.tokens.materials.depth.layer1.shadowOpacity});
  }
  
  .apple-depth-2 {
    box-shadow: ${props => props.tokens.materials.depth.layer2.shadowOffset.x}px ${props => props.tokens.materials.depth.layer2.shadowOffset.y}px ${props => props.tokens.materials.depth.layer2.shadowBlur}px rgba(0, 0, 0, ${props => props.tokens.materials.depth.layer2.shadowOpacity});
  }
  
  .apple-depth-3 {
    box-shadow: ${props => props.tokens.materials.depth.layer3.shadowOffset.x}px ${props => props.tokens.materials.depth.layer3.shadowOffset.y}px ${props => props.tokens.materials.depth.layer3.shadowBlur}px rgba(0, 0, 0, ${props => props.tokens.materials.depth.layer3.shadowOpacity});
  }
  
  .apple-depth-4 {
    box-shadow: ${props => props.tokens.materials.depth.layer4.shadowOffset.x}px ${props => props.tokens.materials.depth.layer4.shadowOffset.y}px ${props => props.tokens.materials.depth.layer4.shadowBlur}px rgba(0, 0, 0, ${props => props.tokens.materials.depth.layer4.shadowOpacity});
  }
  
  /* Responsive Grid System */
  .apple-grid {
    display: grid;
    gap: var(--apple-spacing-baseline);
  }
  
  .apple-flex {
    display: flex;
    gap: var(--apple-spacing-baseline);
  }
  
  /* Auto Layout Spacing */
  .apple-spacing-micro-1 { margin: ${props => props.tokens.spacing.micro[0]}px; }
  .apple-spacing-micro-2 { margin: ${props => props.tokens.spacing.micro[1]}px; }
  .apple-spacing-micro-3 { margin: ${props => props.tokens.spacing.micro[2]}px; }
  .apple-spacing-standard-1 { margin: ${props => props.tokens.spacing.standard[0]}px; }
  .apple-spacing-standard-2 { margin: ${props => props.tokens.spacing.standard[1]}px; }
  .apple-spacing-standard-3 { margin: ${props => props.tokens.spacing.standard[2]}px; }
  .apple-spacing-macro-1 { margin: ${props => props.tokens.spacing.macro[0]}px; }
  .apple-spacing-macro-2 { margin: ${props => props.tokens.spacing.macro[1]}px; }
  .apple-spacing-macro-3 { margin: ${props => props.tokens.spacing.macro[2]}px; }
  
  /* Padding variants */
  .apple-padding-micro-1 { padding: ${props => props.tokens.spacing.micro[0]}px; }
  .apple-padding-micro-2 { padding: ${props => props.tokens.spacing.micro[1]}px; }
  .apple-padding-micro-3 { padding: ${props => props.tokens.spacing.micro[2]}px; }
  .apple-padding-standard-1 { padding: ${props => props.tokens.spacing.standard[0]}px; }
  .apple-padding-standard-2 { padding: ${props => props.tokens.spacing.standard[1]}px; }
  .apple-padding-standard-3 { padding: ${props => props.tokens.spacing.standard[2]}px; }
  .apple-padding-macro-1 { padding: ${props => props.tokens.spacing.macro[0]}px; }
  .apple-padding-macro-2 { padding: ${props => props.tokens.spacing.macro[1]}px; }
  .apple-padding-macro-3 { padding: ${props => props.tokens.spacing.macro[2]}px; }
  
  /* Accessibility */
  .apple-focus-ring:focus {
    outline: 2px solid var(--apple-system-blue);
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  .apple-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Responsive Breakpoints */
  @media (max-width: 428px) {
    /* iPhone */
    .apple-responsive-iphone {
      display: block;
    }
    .apple-responsive-ipad,
    .apple-responsive-mac {
      display: none;
    }
  }
  
  @media (min-width: 429px) and (max-width: 1024px) {
    /* iPad */
    .apple-responsive-ipad {
      display: block;
    }
    .apple-responsive-iphone,
    .apple-responsive-mac {
      display: none;
    }
  }
  
  @media (min-width: 1025px) {
    /* Mac */
    .apple-responsive-mac {
      display: block;
    }
    .apple-responsive-iphone,
    .apple-responsive-ipad {
      display: none;
    }
  }
`;

// Apple Design System Provider Component
interface AppleDesignSystemProviderProps {
  children: React.ReactNode;
  initialColorScheme?: 'light' | 'dark' | 'auto';
}

export const AppleDesignSystemProvider: React.FC<AppleDesignSystemProviderProps> = ({
  children,
  initialColorScheme = 'auto',
}) => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'auto'>(initialColorScheme);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reducedTransparency, setReducedTransparency] = useState(false);
  const [currentTokens, setCurrentTokens] = useState<AppleDesignTokens>(lightThemeTokens);

  // Detect system preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');

    const updateTheme = () => {
      if (colorScheme === 'auto') {
        setCurrentTokens(mediaQuery.matches ? darkThemeTokens : lightThemeTokens);
      } else {
        setCurrentTokens(colorScheme === 'dark' ? darkThemeTokens : lightThemeTokens);
      }
    };

    const updateMotion = () => setReducedMotion(motionQuery.matches);
    const updateTransparency = () => setReducedTransparency(transparencyQuery.matches);

    updateTheme();
    updateMotion();
    updateTransparency();

    mediaQuery.addEventListener('change', updateTheme);
    motionQuery.addEventListener('change', updateMotion);
    transparencyQuery.addEventListener('change', updateTransparency);

    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
      motionQuery.removeEventListener('change', updateMotion);
      transparencyQuery.removeEventListener('change', updateTransparency);
    };
  }, [colorScheme]);

  const contextValue: AppleThemeContextType = {
    tokens: currentTokens,
    colorScheme,
    setColorScheme,
    reducedMotion,
    setReducedMotion,
    reducedTransparency,
    setReducedTransparency,
  };

  return (
    <AppleThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={currentTokens}>
        <AppleGlobalStyles tokens={currentTokens} reducedMotion={reducedMotion} />
        {children}
      </ThemeProvider>
    </AppleThemeContext.Provider>
  );
};

export default AppleDesignSystemProvider;