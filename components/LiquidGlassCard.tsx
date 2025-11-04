/**
 * LiquidGlassCard Component
 * Enhanced GlassCard with liquid glass effects
 * Maintains existing API while adding liquid glass enhancements
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';
import { GlassCard } from './GlassCard';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
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
  mouseContainer?: React.RefObject<HTMLElement>;
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

  // Handle click with enhanced feedback
  const handleClick = useCallback((event: React.MouseEvent) => {
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