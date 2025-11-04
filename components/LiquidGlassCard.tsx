/**
 * LiquidGlassCard Component
 * Enhanced GlassCard with liquid glass effects
 * Maintains existing API while adding liquid glass enhancements
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';
import { GlassCard } from './GlassCard';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import { defaultLiquidVisualTuning } from '../utils/liquidGlassUserTuning';
import { useAppleTheme } from './AppleThemeProvider';

export interface LiquidGlassCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive';
  material?: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'prominent';
  size?: 'small' | 'medium' | 'large';
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'wide';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  backgroundImage?: string;
  loading?: boolean;
  disabled?: boolean;
  // Liquid Glass Enhancement Props
  liquidIntensity?: 'subtle' | 'medium' | 'prominent';
  refractionMode?: 'standard' | 'polar' | 'prominent' | 'shader';
  enableLiquidEffects?: boolean;
  mouseContainer?: React.RefObject<HTMLDivElement>;
  chromaticAberration?: number;
}

// Styled wrapper for enhanced card interactions
const CardWrapper = styled.div<{
  $interactive: boolean;
  $tokens: any;
}>`
  position: relative;
  display: inline-block;
  
  /* Enhanced hover effects for interactive cards */
  ${({ $interactive, $tokens }) => $interactive && `
    transition: transform ${$tokens.liquidGlass.animations.duration.medium} ${$tokens.liquidGlass.animations.standardTiming};
    
    &:hover {
      transform: translateY(-4px);
    }
    
    &:active {
      transform: translateY(-2px) scale(0.98);
      transition: transform ${$tokens.liquidGlass.animations.duration.fast} ${$tokens.liquidGlass.animations.elasticTiming};
    }
  `}
  
  /* Accessibility - Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    
    &:hover,
    &:active {
      transform: none;
    }
  }
`;

// Content wrapper to handle liquid glass transparency
const CardContent = styled.div<{
  $hasBackgroundImage: boolean;
  $tokens: any;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  
  /* Enhance content visibility over liquid glass */
  ${({ $hasBackgroundImage, $tokens }) => $hasBackgroundImage && `
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  `}
  
  /* Ensure text remains readable */
  color: ${({ $tokens }) => $tokens.colors.label.primary};
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

/**
 * LiquidGlassCard - Enhanced card with liquid glass effects
 * Progressive enhancement over the existing GlassCard
 */
export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  variant = 'primary',
  material = 'regular',
  size = 'medium',
  aspectRatio = 'square',
  className,
  interactive = false,
  onClick,
  backgroundImage,
  loading = false,
  disabled = false,
  liquidIntensity = 'medium',
  refractionMode,
  enableLiquidEffects = true,
  mouseContainer,
  chromaticAberration,
  ...props
}) => {
  const { tokens } = useAppleTheme();

  // Map material to liquid intensity if not specified
  const effectiveIntensity = liquidIntensity || (
    material === 'ultraThin' || material === 'thin' ? 'subtle' :
    material === 'prominent' ? 'prominent' : 'medium'
  );

  // Determine refraction mode based on aspect ratio if not specified
  const effectiveMode = refractionMode || (
    aspectRatio === 'square' ? 'polar' : 'prominent'
  );

  // Derive physical refraction parameters from material and layout
  const refractionParams = {
    indexOfRefraction: material === 'prominent' || material === 'thick' ? 1.52 :
                       material === 'regular' ? 1.5 :
                       material === 'thin' ? 1.48 : 1.47,
    surfaceSmoothness: material === 'ultraThin' || material === 'thin' ? 0.9 :
                       material === 'regular' ? 0.85 : 0.8,
    lightIntensity: 0.65,
    lightAngleDeg: effectiveMode === 'polar' ? 35 : 25,
    lightColorTemperatureK: 6500,
    mediumDensity: 1.0,
    surroundingComplexity: 0.6,
    cameraAngleDeg: aspectRatio === 'portrait' ? 25 : 20,
    cameraDistance: size === 'large' ? 0.35 : 0.45,
  };

  const refractionQuality = effectiveIntensity === 'prominent' ? 'high' : 'balanced';
  const artifactReduction = 'mild' as const;

  // Handle click with enhanced feedback
  const handleClick = useCallback(() => {
    if (loading || disabled) return;
    
    // Add haptic feedback for supported devices
    if ('vibrate' in navigator && interactive) {
      navigator.vibrate(15);
    }
    
    onClick?.();
  }, [onClick, loading, disabled, interactive]);

  return (
    <CardWrapper
      $interactive={interactive && !disabled && !loading}
      $tokens={tokens}
    >
      <LiquidGlassWrapper
        componentType="card"
        intensity={effectiveIntensity}
        mode={effectiveMode}
        enableEffects={enableLiquidEffects && !disabled && !loading}
        mouseContainer={mouseContainer}
        className={className}
        effect={material === 'ultraThin' || material === 'thin' ? 'clear' : 'regular'}
        tintColor={undefined}
        visualTuning={defaultLiquidVisualTuning}
        refractionParams={refractionParams}
        refractionQuality={refractionQuality}
        artifactReduction={artifactReduction}
        onClick={handleClick}
      >
        <CardContent
          $hasBackgroundImage={!!backgroundImage}
          $tokens={tokens}
        >
          <GlassCard
            variant={variant}
            material={material}
            size={size}
            aspectRatio={aspectRatio}
            interactive={interactive}
            onClick={() => {}} // Handled by wrapper
            backgroundImage={backgroundImage}
            loading={loading}
            disabled={disabled}
            style={{
              background: backgroundImage ? 'transparent' : undefined,
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              boxShadow: 'none',
              border: 'none',
            }}
            {...props}
          >
            {children}
          </GlassCard>
        </CardContent>
      </LiquidGlassWrapper>
    </CardWrapper>
  );
};

export default LiquidGlassCard;