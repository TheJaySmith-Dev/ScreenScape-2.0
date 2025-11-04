import { useMemo } from 'react';
import { useTheme } from './useTheme';

/**
 * Apple Design System Tokens
 * Based on Apple's Human Interface Guidelines and Liquid Glass design language
 */
export interface AppleDesignTokens {
  colors: {
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };
    accent: {
      primary: string;
      secondary: string;
    };
    destructive: {
      primary: string;
      secondary: string;
    };
    success: {
      primary: string;
      secondary: string;
    };
    warning: {
      primary: string;
      secondary: string;
    };
    separator: string;
    overlay: string;
    border: {
      primary: string;
      secondary: string;
    };
    glass: {
      ultraThin: string;
      thin: string;
    };
  };
  typography: {
    fontFamily: {
      system: string;
      monospace: string;
      primary: string;
    };
    fontSize: {
      largeTitle: string;
      title1: string;
      title2: string;
      title3: string;
      headline: string;
      body: string;
      callout: string;
      subheadline: string;
      footnote: string;
      caption: string;
      small: string;
      h1: string;
    };
    fontWeight: {
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
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
      body: number;
    };
  };
  spacing: {
    base: number[];
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    radius: {
      small: string;
      medium: string;
      large: string;
      extraLarge: string;
      full: string;
    };
  };
  materials: {
    glass: {
      ultraThin: {
        background: string;
        backdropFilter: string;
        border: string;
      };
      thin: {
        background: string;
        backdropFilter: string;
        border: string;
      };
      regular: {
        background: string;
        backdropFilter: string;
        border: string;
      };
      thick: {
        background: string;
        backdropFilter: string;
        border: string;
      };
      prominent: {
        background: string;
        backdropFilter: string;
        border: string;
      };
    };
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
    extraLarge: string;
  };
  animation: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      standard: string;
      decelerate: string;
      accelerate: string;
      sharp: string;
    };
  };
  effects: {
    backdropBlur: {
      regular: {
        backdropFilter: string;
      };
      prominent: {
        backdropFilter: string;
      };
    };
  };
}

/**
 * Apple Theme Hook
 * Provides Apple design system tokens based on current theme
 */
export const useAppleTheme = () => {
  const { theme } = useTheme();

  const tokens = useMemo<AppleDesignTokens>(() => {
    const isDark = theme === 'dark';

    return {
      colors: {
        text: {
          primary: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
          secondary: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
          tertiary: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          quaternary: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
        },
        background: {
          primary: isDark ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
          secondary: isDark ? 'rgba(28, 28, 30, 1)' : 'rgba(242, 242, 247, 1)',
          tertiary: isDark ? 'rgba(44, 44, 46, 1)' : 'rgba(255, 255, 255, 1)',
          elevated: isDark ? 'rgba(58, 58, 60, 1)' : 'rgba(255, 255, 255, 1)',
        },
        accent: {
          primary: 'rgba(0, 122, 255, 1)',
          secondary: isDark ? 'rgba(0, 122, 255, 0.8)' : 'rgba(0, 122, 255, 0.9)',
        },
        destructive: {
          primary: 'rgba(255, 59, 48, 1)',
          secondary: isDark ? 'rgba(255, 59, 48, 0.8)' : 'rgba(255, 59, 48, 0.9)',
        },
        success: {
          primary: 'rgba(52, 199, 89, 1)',
          secondary: isDark ? 'rgba(52, 199, 89, 0.8)' : 'rgba(52, 199, 89, 0.9)',
        },
        warning: {
          primary: 'rgba(255, 149, 0, 1)',
          secondary: isDark ? 'rgba(255, 149, 0, 0.8)' : 'rgba(255, 149, 0, 0.9)',
        },
        separator: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        overlay: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
        border: {
          primary: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          secondary: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        glass: {
          ultraThin: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
          thin: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.8)',
        },
      },
      typography: {
        fontFamily: {
          system: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          monospace: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          primary: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
        },
        fontSize: {
          largeTitle: '34px',
          title1: '28px',
          title2: '22px',
          title3: '20px',
          headline: '17px',
          body: '17px',
          callout: '16px',
          subheadline: '15px',
          footnote: '13px',
          caption: '12px',
          small: '11px',
          h1: '28px',
        },
        fontWeight: {
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
        lineHeight: {
          tight: 1.2,
          normal: 1.4,
          relaxed: 1.6,
          body: 1.4,
        },
      },
      spacing: {
        base: [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960],
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
        radius: {
          small: '4px',
          medium: '8px',
          large: '12px',
          extraLarge: '16px',
          full: '9999px',
        },
      },
      materials: {
        glass: {
          ultraThin: {
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
          },
          thin: {
            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(30px) saturate(180%)',
            border: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)',
          },
          regular: {
            background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)',
          },
          thick: {
            background: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(50px) saturate(180%)',
            border: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.6)',
          },
          prominent: {
            background: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(60px) saturate(180%)',
            border: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.7)',
          },
        },
      },
      shadows: {
        small: isDark 
          ? '0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)' 
          : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        medium: isDark 
          ? '0 4px 6px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)' 
          : '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        large: isDark 
          ? '0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.3)' 
          : '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        extraLarge: isDark 
          ? '0 25px 50px rgba(0, 0, 0, 0.6), 0 12px 24px rgba(0, 0, 0, 0.4)' 
          : '0 25px 50px rgba(0, 0, 0, 0.15), 0 12px 24px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        duration: {
          fast: '0.15s',
          normal: '0.3s',
          slow: '0.5s',
        },
        easing: {
          standard: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
          accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
          sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
        },
      },
      effects: {
         backdropBlur: {
           regular: {
             backdropFilter: 'blur(40px) saturate(180%)',
           },
           prominent: {
             backdropFilter: 'blur(60px) saturate(180%)',
           },
         },
       },
    };
  }, [theme]);

  return {
    tokens,
    theme,
  };
};

export default useAppleTheme;