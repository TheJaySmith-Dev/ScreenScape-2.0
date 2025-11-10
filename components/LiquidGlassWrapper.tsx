/**
 * LiquidGlassWrapper Component
 * Base wrapper component for integrating liquid-glass-react with ScreenScape
 */

import React, { useMemo, useEffect, useState } from 'react';
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
import { 
  applyRefractionPhysics, 
  PhysicalRefractionParams, 
  RefractionQuality, 
  ArtifactReduction 
} from '../utils/refractionModel';
import { defaultLiquidVisualTuning, LiquidVisualTuning } from '../utils/liquidGlassUserTuning';
import { getSuperellipseClipPath } from '../utils/superellipse.ts';
// Studio renderer removed per request to use the provided Liquid Glass

export interface LiquidGlassWrapperProps {
  children: React.ReactNode;
  componentType: 'button' | 'card' | 'navigation' | 'panel' | 'hero';
  intensity?: 'subtle' | 'medium' | 'prominent';
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  effect?: 'clear' | 'regular' | 'none';
  tintColor?: string;
  enableEffects?: boolean;
  /** Force-enable liquid effects, bypassing capability and accessibility gating */
  forceRenderEffects?: boolean;
  mouseContainer?: React.RefObject<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  // Physical refraction and quality controls
  refractionParams?: PhysicalRefractionParams;
  refractionQuality?: RefractionQuality; // maps to adaptive quality
  artifactReduction?: ArtifactReduction;
  // Visual tuning controls (Fresnel, Glare, Thickness, Shadow)
  visualTuning?: LiquidVisualTuning;
  // Shape controls
  shape?: 'rounded' | 'pill' | 'circle' | 'superellipse';
  superellipseExponent?: number;
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
  forceRenderEffects = false,
  mouseContainer,
  className,
  style,
  onClick,
  refractionParams,
  refractionQuality,
  artifactReduction = 'none',
  visualTuning,
  shape = 'rounded',
  superellipseExponent = 4,
  ...props
}) => {
  const deviceCapabilities = useDeviceCapabilities();
  const accessibilityPreferences = useAccessibilityPreferences();
  const performanceMetrics = usePerformanceMonitor();
  // Map provided quality to adaptive levels
  const initialQuality = (refractionQuality === 'performance') ? 'low' :
                         (refractionQuality === 'high' || refractionQuality === 'ultra') ? 'high' : 'medium';
  const adaptiveQuality = useAdaptiveQuality(initialQuality);
  const { elementRef, isVisible, isNearViewport } = useIntersectionObserver();
  // Cast the observer ref to a div ref for usage on HTMLDivElement nodes
  const elementDivRef = elementRef as React.RefObject<HTMLDivElement>;

  // Compute clip-path for superellipse shapes once the element layout is known
  const [clipPath, setClipPath] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (shape === 'superellipse' && elementDivRef.current) {
      const rect = elementDivRef.current.getBoundingClientRect();
      const path = getSuperellipseClipPath(rect.width, rect.height, superellipseExponent);
      setClipPath(path);
    } else {
      setClipPath(undefined);
    }
    // Recompute on window resize to keep shape accurate
    const onResize = () => {
      if (shape === 'superellipse' && elementDivRef.current) {
        const rect = elementDivRef.current.getBoundingClientRect();
        const path = getSuperellipseClipPath(rect.width, rect.height, superellipseExponent);
        setClipPath(path);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [shape, superellipseExponent, elementDivRef]);

  // Compute liquid glass support from core capabilities
  const supportsLiquidGlass = useMemo(() => {
    return deviceCapabilities.supportsBackdropFilter && deviceCapabilities.supportsWebGL;
  }, [deviceCapabilities.supportsBackdropFilter, deviceCapabilities.supportsWebGL]);

  // Determine if effects should be enabled based on all factors
  const shouldRenderEffects = useMemo(() => {
    if (forceRenderEffects) return true;
    // Avoid hard toggles: keep effects on, but degrade quality when perf dips.
    // Only fully disable if device is intrinsically low-performance AND perf is low.
    const mustDisableForPerf = performanceMetrics.isLowPerformance && deviceCapabilities.performanceLevel === 'low';

    return (
      enableEffects &&
      supportsLiquidGlass &&
      shouldEnableLiquidEffects(accessibilityPreferences) &&
      isNearViewport &&
      !mustDisableForPerf
    );
  }, [
    enableEffects,
    supportsLiquidGlass,
    accessibilityPreferences,
    isNearViewport,
    performanceMetrics.isLowPerformance,
    deviceCapabilities.performanceLevel,
    forceRenderEffects
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

    // Base presets
    let config = getLiquidGlassConfig(componentType, intensity);

    // Merge user visual tuning
    const tuning = visualTuning ?? defaultLiquidVisualTuning;

    // Build effective refraction params (override indexOfRefraction)
    const effectiveRefractionParams: PhysicalRefractionParams | undefined = {
      ...(refractionParams || {}),
      indexOfRefraction: tuning.refractionFactor,
    };

    // Apply physics-based refraction adjustments
    const physics = applyRefractionPhysics(config, effectiveRefractionParams, {
      quality: refractionQuality ?? 'balanced',
      artifactReduction,
    });
    config = physics.config;
    
    // Apply device-specific scaling
    config = applyDeviceScaling(config, deviceCapabilities.scaleFactor);
    
    // Apply accessibility overrides
    config = applyAccessibilityOverrides(
      config,
      accessibilityPreferences.reducedMotion,
      accessibilityPreferences.reducedTransparency
    );
    
    // Apply performance optimizations (function uses different keys; map afterward)
    const perfConfig = getPerformanceOptimizedConfig(config, adaptiveQuality);
    if (perfConfig?.displacement !== undefined) {
      config.displacementScale = perfConfig.displacement;
    }
    if (perfConfig?.blur !== undefined) {
      config.blurAmount = perfConfig.blur;
    }
    if (perfConfig?.elasticity !== undefined) {
      config.elasticity = perfConfig.elasticity;
    }
    
    // Set refraction mode
    if (mode && config) {
      config.mode = mode;
    }

    // Apply effect adjustments
    if (effect === 'clear') {
      // Reduce blur for a clearer glass look
      config.blurAmount = Math.max(config.blurAmount * 0.5, 0);
    }

    // Apply tuning-derived adjustments
    // Thickness -> displacement scaling relative to baseline 20
    const thicknessFactor = Math.max(0.4, Math.min(2.2, tuning.thickness / 20));
    config.displacementScale = (config.displacementScale ?? 60) * thicknessFactor;

    // Dispersion gain -> moderate chromatic aberration multiplier (clamped)
    const dispersionMul = Math.max(0.6, Math.min(2.0, 0.5 + (tuning.dispersionGain / 10)));
    config.aberrationIntensity = (config.aberrationIntensity ?? 2.0) * dispersionMul;

    // Blur radius -> translate to small float used by presets
    if (typeof tuning.blurRadius === 'number') {
      const mappedBlur = Math.max(0, Math.min(0.2, tuning.blurRadius / 10));
      // Preserve clear effect reduction if applied
      config.blurAmount = Math.max(0, mappedBlur);
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
    adaptiveQuality,
    refractionParams,
    refractionQuality,
    artifactReduction
  ]);

  // Enhanced click handler with accessibility considerations
  const handleGlassClick = useMemo(() => {
    if (!onClick) return undefined;
    return () => {
      if ('vibrate' in navigator && !accessibilityPreferences.reducedMotion) {
        navigator.vibrate(10);
      }
      onClick();
    };
  }, [onClick, accessibilityPreferences.reducedMotion]);

  const handleDivClick: React.MouseEventHandler<HTMLDivElement> = () => {
    if ('vibrate' in navigator && !accessibilityPreferences.reducedMotion) {
      navigator.vibrate(10);
    }
    onClick?.();
  };

  // Merge tint color into style for subtle theme tint
  const mergedStyle: React.CSSProperties = useMemo(() => {
    const tuning = visualTuning ?? defaultLiquidVisualTuning;
    const shadowAlpha = Math.max(0, Math.min(1, (tuning.shadowIntensity ?? 0) / 100));
    const boxShadow = `${tuning.shadowPosition.x}px ${tuning.shadowPosition.y}px ${tuning.shadowExpand}px rgba(0,0,0,${shadowAlpha})`;
    const baseStyle: React.CSSProperties = {
      ...(style || {}),
      ...(tintColor ? { backgroundColor: tintColor } : (tuning.tint ? { backgroundColor: tuning.tint } : {})),
      borderRadius: `${(liquidConfig?.cornerRadius ?? 0) || (style?.borderRadius as any) || 0}px`,
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)',
      willChange: 'transform, filter',
    };
    // Optional Gaussian blur masking to soften edges
    const blurRadius = Math.max(0, Math.min(tuning.blurRadius ?? 0, 24));
    const maskGradient = `radial-gradient(closest-side, rgba(0,0,0,1) ${Math.max(0, 100 - blurRadius * 4)}%, rgba(0,0,0,0) 100%)`;
    (baseStyle as any).WebkitMaskImage = maskGradient;
    (baseStyle as any).maskImage = maskGradient;
    // Superellipse clip-path if requested
    if (shape === 'superellipse' && clipPath) {
      (baseStyle as any).clipPath = `path('${clipPath}')`;
      (baseStyle as any).WebkitClipPath = `path('${clipPath}')`;
    } else if (shape === 'pill') {
      baseStyle.borderRadius = '999px';
    } else if (shape === 'circle') {
      baseStyle.borderRadius = '50%';
    }
    // Merge boxShadow non-destructively
    return {
      ...baseStyle,
      boxShadow: baseStyle.boxShadow ? `${baseStyle.boxShadow}, ${boxShadow}` : boxShadow,
    };
  }, [style, tintColor, visualTuning, shape, clipPath, liquidConfig?.cornerRadius]);

  // If liquid glass should not be rendered, use fallback
  if (!liquidConfig) {
    return (
      <div 
        ref={elementDivRef}
        className={className}
        style={mergedStyle}
        onClick={handleDivClick}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Render with liquid glass effects only when visible and performance allows
  return (
    <div ref={elementDivRef}>
      {isVisible ? (
        (() => {
          const liquidProps: any = {
            elasticity: liquidConfig.elasticity,
            displacementScale: liquidConfig.displacementScale,
            blurAmount: liquidConfig.blurAmount,
            mode: liquidConfig.mode,
            mouseContainer: mouseContainer as React.RefObject<HTMLElement>,
            className,
            style: mergedStyle,
            onClick: handleGlassClick,
            // Enable dispersion and shape hints when supported by library
            aberrationIntensity: liquidConfig.aberrationIntensity,
            cornerRadius: liquidConfig.cornerRadius,
            ...props,
          };
          return (
            <LiquidGlass {...liquidProps}>
              <div style={{ position: 'relative', borderRadius: 'inherit' }}>
                {/** Fresnel overlay ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    opacity: ((visualTuning ?? defaultLiquidVisualTuning).fresnelIntensity ?? 0) / 100,
                    background: `radial-gradient(closest-side,
                      rgba(255,255,255,0) ${Math.max(0, 100 - ((visualTuning ?? defaultLiquidVisualTuning).fresnelSize ?? 30))}%,
                      rgba(255,255,255,1) ${Math.min(100, 100 - ((visualTuning ?? defaultLiquidVisualTuning).fresnelSize ?? 30) + ((visualTuning ?? defaultLiquidVisualTuning).fresnelHardness ?? 20))}%,
                      rgba(255,255,255,0) 100%)`,
                  }}
                />
                {/** Glare overlay band */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    opacity: ((visualTuning ?? defaultLiquidVisualTuning).glareIntensity ?? 0) / 100,
                    background: `linear-gradient(${(visualTuning ?? defaultLiquidVisualTuning).glareAngle ?? 0}deg,
                      transparent ${50 - (((visualTuning ?? defaultLiquidVisualTuning).glareSize ?? 30) / 2)}%,
                      rgba(255,255,255,1) 50%,
                      transparent ${50 + (((visualTuning ?? defaultLiquidVisualTuning).glareSize ?? 30) / 2)}%)`,
                  }}
                />
                {children}
              </div>
            </LiquidGlass>
          );
        })()
      ) : (
        <div 
          className={className}
          style={mergedStyle}
          onClick={handleDivClick}
          {...props}
        >
          <div style={{ position: 'relative', borderRadius: 'inherit' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidGlassWrapper;
