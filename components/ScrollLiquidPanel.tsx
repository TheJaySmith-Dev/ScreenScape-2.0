/**
 * ScrollLiquidPanel
 * A designated panel area that applies a liquid refraction effect only to occluded pixels
 * as content scrolls behind it. Uses LiquidGlassWrapper and hooks for physics-driven updates.
 */
import React, { useMemo, useRef } from 'react';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import { defaultLiquidVisualTuning } from '../utils/liquidGlassUserTuning';
import { useAppleTheme } from './AppleThemeProvider';
import { useScrollVelocity } from '../utils/useScrollVelocity';
import { useOcclusionTracker } from '../utils/useOcclusionTracker';

export interface ScrollLiquidPanelProps {
  className?: string;
  style?: React.CSSProperties;
  // Panel shape
  borderRadius?: number;
  // Where to mount the panel
  position?: 'fixed' | 'sticky';
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  width?: number | string;
  height?: number | string;
  // Liquid configuration hints
  intensity?: 'subtle' | 'medium' | 'prominent';
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  enableEffects?: boolean;
  // Content selectors to watch for occlusion geometry
  targetSelectors?: string[];
}

export const ScrollLiquidPanel: React.FC<ScrollLiquidPanelProps> = ({
  className,
  style,
  borderRadius,
  position = 'fixed',
  top,
  left,
  right,
  bottom,
  width = 'min(500px, 80vw)',
  height = 'min(350px, 55vh)',
  intensity = 'prominent',
  mode = 'prominent',
  enableEffects = true,
  targetSelectors = ['img', '.poster', '[data-poster]', '.card', '.media', '[data-liquid-target]'],
}) => {
  const { tokens } = useAppleTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  // Track scroll physics and occlusion geometry
  const { velocityY, directionY } = useScrollVelocity(window);
  const occlusion = useOcclusionTracker(panelRef, targetSelectors, 50);

  // Map physics to refraction params
  const refractionParams = useMemo(() => {
    // Convert velocity to camera distance and light angle bias
    // Clamp and scale for subtle, physically-plausible adjustments
    const speed = Math.min(2000, Math.abs(velocityY)); // px/s
    const speed01 = Math.min(1, speed / 1200); // normalize
    const sign = directionY; // -1 up, +1 down

    // Occlusion-driven prominence: when more of the panel is covered, amplify refraction slightly
    const coverage = occlusion.panelCoverageRatio; // 0..1

    const cameraDistance = 0.35 + (1 - speed01) * 0.25; // faster scroll feels closer
    const cameraAngleDeg = 18 + speed01 * 10 * (sign === 0 ? 1 : sign); // tilt with scroll direction
    const lightAngleDeg = mode === 'polar' ? 32 + speed01 * 10 : 24 + speed01 * 12; // more oblique with speed
    const surroundingComplexity = 0.5 + Math.min(0.4, coverage * 0.4); // more content behind -> more aberration

    return {
      indexOfRefraction: 1.50,
      surfaceSmoothness: 0.88,
      lightIntensity: 0.65,
      lightAngleDeg,
      lightColorTemperatureK: 6500,
      mediumDensity: 1.0,
      surroundingComplexity,
      cameraAngleDeg,
      cameraDistance,
    };
  }, [velocityY, directionY, occlusion.panelCoverageRatio, mode]);

  // Style merges and clipping to panel contour
  const panelStyle: React.CSSProperties = {
    position,
    top,
    left,
    right,
    bottom,
    width,
    height,
    borderRadius: borderRadius ?? tokens.borderRadius.xxlarge,
    overflow: 'hidden',
    pointerEvents: 'none', // allow interactions with underlying content
    zIndex: 40,
    ...style,
  };

  return (
    <div ref={panelRef} className={className} style={panelStyle} aria-hidden>
      {/* Liquid effect is strictly confined to the panel bounds; only occluded pixels are refracted */}
      <LiquidGlassWrapper
        componentType="panel"
        intensity={intensity}
        mode={mode}
        enableEffects={enableEffects}
        visualTuning={defaultLiquidVisualTuning}
        refractionParams={refractionParams}
        refractionQuality={intensity === 'prominent' ? 'high' : 'balanced'}
        artifactReduction={'mild'}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          // Fallback for non-liquid browsers; kept minimal
          background: `rgba(255, 255, 255, ${tokens.materials.glass.prominent.opacity})`,
          backdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
          WebkitBackdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
          border: `1px solid rgba(255, 255, 255, ${tokens.materials.glass.prominent.borderOpacity})`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity})`,
        }}
      >
        {/* Empty child: we only need the panel to refract background content */}
        <div />
      </LiquidGlassWrapper>
    </div>
  );
};

export default ScrollLiquidPanel;