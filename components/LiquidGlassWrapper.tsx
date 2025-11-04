/**
 * LiquidGlassWrapper Component
 * Base wrapper component for integrating liquid-glass-react with ScreenScape
 */

import React, { useMemo } from 'react';
import LiquidGlass from 'liquid-glass-react';
import { useDeviceCapabilities } from '../utils/deviceCapabilities';
import { 
  getLiquidGlassConfig, 
  applyDeviceScaling, 
  applyAccessibilityOverrides 
} from '../utils/liquidGlassPresets';
import { 
  useAccessibilityPreferences, 
  shouldEnableLiquidEffects,
  getAccessibleAnimationDuration 
} from '../utils/accessibilityUtils';
import { 
  usePerformanceMonitor, 
  useAdaptiveQuality,
  useIntersectionObserver,
  getPerformanceOptimizedConfig 
} from '../utils/performanceMonitor';

export interface LiquidGlassWrapperProps {
  children: React.ReactNode;
  componentType: 'button' | 'card' | 'navigation' | 'panel' | 'hero';
  intensity?: 'subtle' | 'medium' | 'prominent';
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  effect?: 'clear' | 'regular' | 'none';
  tintColor?: string;
  enableEffects?: boolean;
  mouseContainer?: React.RefObject<HTMLElement>;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent) => void;
  onHover?: (isHovered: boolean) => void;
}

/**
 * LiquidGlassWrapper - Progressive enhancement wrapper for liquid glass effects
 */
export const LiquidGlassWrapper: React.FC<LiquidGlassWrapperProps> = ({
  children,
  componentType = 'button',
  intensity = 'medium',
  mode = 'standard',
  effect = 'regular',
  tintColor,
  enableEffects = true,
  mouseContainer,
  className,
  style,
  onClick,
  ...props
}) => {
  const deviceCapabilities = useDeviceCapabilities();
  const accessibilityPreferences = useAccessibilityPreferences();
  const performanceMetrics = usePerformanceMonitor();
  const adaptiveQuality = useAdaptiveQuality('medium');
  const { elementRef, isVisible, isNearViewport } = useIntersectionObserver();

  // Compute liquid glass support from core capabilities
  const supportsLiquidGlass = useMemo(() => {
    return deviceCapabilities.supportsBackdropFilter && deviceCapabilities.supportsWebGL;
  }, [deviceCapabilities.supportsBackdropFilter, deviceCapabilities.supportsWebGL]);

  // Determine if effects should be enabled based on all factors
  const shouldRenderEffects = useMemo(() => {
    return (
      enableEffects &&
      supportsLiquidGlass &&
      shouldEnableLiquidEffects(accessibilityPreferences) &&
      !performanceMetrics.isLowPerformance &&
      isNearViewport
    );
  }, [
    enableEffects,
    supportsLiquidGlass,
    accessibilityPreferences,
    performanceMetrics.isLowPerformance,
    isNearViewport
  ]);

  // Get liquid glass configuration with all optimizations applied
  const liquidConfig = useMemo(() => {
    if (!shouldRenderEffects) {
      return null;
    }

    // Respect explicit effect disable
    if (effect === 'none') {
      return null;
    }

    let config = getLiquidGlassConfig(componentType, intensity);
    
    // Apply device-specific scaling
    config = applyDeviceScaling(config, deviceCapabilities);
    
    // Apply accessibility overrides
    config = applyAccessibilityOverrides(config, accessibilityPreferences);
    
    // Apply performance optimizations
    config = getPerformanceOptimizedConfig(config, adaptiveQuality);
    
    // Set refraction mode
    if (mode && config) {
      config.mode = mode;
    }

    // Apply effect adjustments
    if (effect === 'clear') {
      // Reduce blur for a clearer glass look
      config.blurAmount = Math.max(config.blurAmount * 0.5, 0);
    }

    // Apply accessible animation duration
    if (config && config.animationDuration) {
      config.animationDuration = getAccessibleAnimationDuration(
        config.animationDuration,
        accessibilityPreferences
      );
    }

    return config;
  }, [
    shouldRenderEffects,
    componentType,
    intensity,
    mode,
    effect,
    deviceCapabilities,
    accessibilityPreferences,
    adaptiveQuality
  ]);

  // Enhanced click handler with accessibility considerations
  const handleClick = useMemo(() => {
    if (!onClick) return undefined;

    return (event: React.MouseEvent) => {
      // Add haptic feedback if supported and not reduced motion
      if ('vibrate' in navigator && !accessibilityPreferences.reducedMotion) {
        navigator.vibrate(10);
      }
      
      onClick(event);
    };
  }, [onClick, accessibilityPreferences.reducedMotion]);

  // Merge tint color into style for subtle theme tint
  const mergedStyle: React.CSSProperties = useMemo(() => {
    return {
      ...(style || {}),
      ...(tintColor ? { backgroundColor: tintColor } : {}),
    };
  }, [style, tintColor]);

  // If liquid glass should not be rendered, use fallback
  if (!liquidConfig) {
    return (
      <div 
        ref={elementRef}
        className={className}
        style={mergedStyle}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Render with liquid glass effects only when visible and performance allows
  return (
    <div ref={elementRef}>
      {isVisible ? (
        <LiquidGlass
          elasticity={liquidConfig.elasticity}
          displacement={liquidConfig.displacementScale}
          blur={liquidConfig.blurAmount}
          mode={liquidConfig.mode}
          mouseContainer={mouseContainer}
          className={className}
          style={mergedStyle}
          onClick={handleClick}
          {...props}
        >
          {children}
        </LiquidGlass>
      ) : (
        <div 
          className={className}
          style={mergedStyle}
          onClick={handleClick}
          {...props}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default LiquidGlassWrapper;