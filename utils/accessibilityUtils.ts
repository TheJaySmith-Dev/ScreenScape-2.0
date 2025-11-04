/**
 * Accessibility Utilities for Liquid Glass Integration
 * Handles user preferences for reduced motion and transparency
 */

import { useEffect, useState, useCallback } from 'react';

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  reducedTransparency: boolean;
  highContrast: boolean;
  forcedColors: boolean;
}

/**
 * Detects user accessibility preferences from system settings
 */
export const detectAccessibilityPreferences = (): AccessibilityPreferences => {
  const preferences: AccessibilityPreferences = {
    reducedMotion: false,
    reducedTransparency: false,
    highContrast: false,
    forcedColors: false
  };

  if (typeof window === 'undefined') {
    return preferences;
  }

  try {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    preferences.reducedMotion = reducedMotionQuery.matches;

    // Check for reduced transparency preference (Safari/macOS)
    const reducedTransparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');
    preferences.reducedTransparency = reducedTransparencyQuery.matches;

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    preferences.highContrast = highContrastQuery.matches;

    // Check for forced colors (Windows High Contrast mode)
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
    preferences.forcedColors = forcedColorsQuery.matches;
  } catch (error) {
    console.warn('Error detecting accessibility preferences:', error);
  }

  return preferences;
};

/**
 * React hook for accessibility preferences with real-time updates
 */
export const useAccessibilityPreferences = (): AccessibilityPreferences => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    detectAccessibilityPreferences
  );

  const updatePreferences = useCallback(() => {
    setPreferences(detectAccessibilityPreferences());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-reduced-transparency: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(forced-colors: active)')
    ];

    // Add listeners for all media queries
    mediaQueries.forEach(query => {
      if (query.addEventListener) {
        query.addEventListener('change', updatePreferences);
      } else {
        // Fallback for older browsers
        query.addListener(updatePreferences);
      }
    });

    return () => {
      // Cleanup listeners
      mediaQueries.forEach(query => {
        if (query.removeEventListener) {
          query.removeEventListener('change', updatePreferences);
        } else {
          // Fallback for older browsers
          query.removeListener(updatePreferences);
        }
      });
    };
  }, [updatePreferences]);

  return preferences;
};

/**
 * Applies accessibility overrides to liquid glass configuration
 */
export const applyAccessibilityOverrides = (
  config: any,
  preferences: AccessibilityPreferences
): any => {
  if (!config) return config;

  const overriddenConfig = { ...config };

  // Disable liquid effects for reduced motion
  if (preferences.reducedMotion) {
    overriddenConfig.elasticity = 0;
    overriddenConfig.displacement = 0;
    overriddenConfig.animationDuration = 0;
    overriddenConfig.enableAnimations = false;
  }

  // Reduce transparency for reduced transparency preference
  if (preferences.reducedTransparency) {
    overriddenConfig.opacity = Math.min(overriddenConfig.opacity || 1, 0.95);
    overriddenConfig.blur = Math.max((overriddenConfig.blur || 0) * 0.5, 0);
    overriddenConfig.enableTransparency = false;
  }

  // High contrast adjustments
  if (preferences.highContrast) {
    overriddenConfig.contrast = Math.max(overriddenConfig.contrast || 1, 1.2);
    overriddenConfig.saturation = Math.max(overriddenConfig.saturation || 1, 1.1);
    overriddenConfig.enableHighContrast = true;
  }

  // Forced colors mode (Windows High Contrast)
  if (preferences.forcedColors) {
    // Disable all visual effects in forced colors mode
    overriddenConfig.elasticity = 0;
    overriddenConfig.displacement = 0;
    overriddenConfig.blur = 0;
    overriddenConfig.opacity = 1;
    overriddenConfig.enableEffects = false;
  }

  return overriddenConfig;
};

/**
 * Checks if liquid glass effects should be enabled based on accessibility preferences
 */
export const shouldEnableLiquidEffects = (preferences: AccessibilityPreferences): boolean => {
  // Disable effects if user prefers reduced motion or forced colors
  if (preferences.reducedMotion || preferences.forcedColors) {
    return false;
  }

  return true;
};

/**
 * Gets accessible animation duration based on user preferences
 */
export const getAccessibleAnimationDuration = (
  baseDuration: number,
  preferences: AccessibilityPreferences
): number => {
  if (preferences.reducedMotion) {
    return 0;
  }

  // Slightly reduce animation duration for high contrast users
  if (preferences.highContrast) {
    return baseDuration * 0.8;
  }

  return baseDuration;
};

/**
 * Provides accessible focus styles for liquid glass components
 */
export const getAccessibleFocusStyles = (
  preferences: AccessibilityPreferences,
  tokens: any
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    outline: `2px solid ${tokens.colors.system.blue}`,
    outlineOffset: '2px'
  };

  if (preferences.highContrast || preferences.forcedColors) {
    return {
      ...baseStyles,
      outline: '3px solid currentColor',
      outlineOffset: '3px',
      boxShadow: '0 0 0 1px currentColor'
    };
  }

  return baseStyles;
};

/**
 * Logs accessibility preference changes for debugging
 */
export const logAccessibilityChange = (
  preference: keyof AccessibilityPreferences,
  value: boolean
): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Accessibility preference changed: ${preference} = ${value}`);
  }
};