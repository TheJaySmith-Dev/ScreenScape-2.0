/**
 * LiquidGlassPillButton Component
 * Enhanced GlassPillButton with liquid glass effects
 * Maintains existing API while adding liquid glass enhancements
 */

import React from 'react';
import styled from 'styled-components';
import { GlassPillButton } from './GlassPillButton';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import { defaultLiquidVisualTuning } from '../utils/liquidGlassUserTuning';
import { useAppleTheme } from './AppleThemeProvider';

export interface LiquidGlassPillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  material?: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'prominent';
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  // Liquid Glass Enhancement Props
  liquidIntensity?: 'subtle' | 'medium' | 'prominent';
  refractionMode?: 'standard' | 'polar' | 'prominent' | 'shader';
  enableLiquidEffects?: boolean;
  elasticResponse?: boolean;
  mouseContainer?: React.RefObject<HTMLDivElement>;
}

// Styled wrapper for the button content
const ButtonContent = styled.div<{
  $elasticResponse: boolean;
  $tokens: any;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $tokens }) => $tokens.spacing.micro[1]}px;
  width: 100%;
  height: 100%;
  
  /* Enhanced elastic response */
  ${({ $elasticResponse, $tokens }) => $elasticResponse && `
    transition: transform ${$tokens.liquidGlass.animations.duration.fast} ${$tokens.liquidGlass.animations.elasticTiming};
    
    &:active {
      transform: scale(0.96);
    }
  `}
  
  /* Accessibility - Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    
    &:active {
      transform: none;
    }
  }
`;

/**
 * LiquidGlassPillButton - Enhanced button with liquid glass effects
 * Progressive enhancement over the existing GlassPillButton
 */
export const LiquidGlassPillButton: React.FC<LiquidGlassPillButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className,
  material = 'regular',
  icon,
  loading = false,
  fullWidth = false,
  liquidIntensity = 'medium',
  refractionMode,
  enableLiquidEffects = true,
  elasticResponse = true,
  mouseContainer,
  ...props
}) => {
  const { tokens } = useAppleTheme();

  // Map material to liquid intensity if not specified
  const effectiveIntensity = liquidIntensity || (
    material === 'ultraThin' || material === 'thin' ? 'subtle' :
    material === 'prominent' ? 'prominent' : 'medium'
  );

  // Handle click with elastic feedback
  const handleClick = () => {
    if (disabled || loading) return;
    
    // Add haptic feedback for supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick?.();
  };

  // Physical refraction parameters tailored for buttons
  const refractionParams = {
    indexOfRefraction: material === 'prominent' ? 1.52 : 1.49,
    surfaceSmoothness: material === 'ultraThin' || material === 'thin' ? 0.92 : 0.86,
    lightIntensity: 0.6,
    lightAngleDeg: 30,
    lightColorTemperatureK: 6500,
    mediumDensity: 1.0,
    surroundingComplexity: 0.4,
    cameraAngleDeg: 18,
    cameraDistance: 0.5,
  };
  const refractionQuality = effectiveIntensity === 'prominent' ? 'high' : 'balanced';
  const artifactReduction = 'mild' as const;

  return (
    <LiquidGlassWrapper
      componentType="button"
      intensity={effectiveIntensity}
      mode={refractionMode}
      enableEffects={enableLiquidEffects && !disabled && !loading}
      mouseContainer={mouseContainer}
      className={className}
      effect={material === 'ultraThin' || material === 'thin' ? 'clear' : 'regular'}
      tintColor={(tokens.materials.pill as any)[variant]?.background || tokens.materials.pill.secondary.background}
      refractionParams={refractionParams}
      refractionQuality={refractionQuality}
      artifactReduction={artifactReduction}
      visualTuning={defaultLiquidVisualTuning}
      onClick={handleClick}
    >
      <ButtonContent
        $elasticResponse={elasticResponse && enableLiquidEffects}
        $tokens={tokens}
      >
        <GlassPillButton
          variant={variant}
          size={size}
          disabled={disabled}
          material={material}
          icon={icon}
          loading={loading}
          fullWidth={fullWidth}
          onClick={() => {}} // Handled by wrapper
          style={{
            background: 'transparent',
            border: 'none',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            boxShadow: 'none',
          }}
          {...props}
        >
          {children}
        </GlassPillButton>
      </ButtonContent>
    </LiquidGlassWrapper>
  );
};

export default LiquidGlassPillButton;