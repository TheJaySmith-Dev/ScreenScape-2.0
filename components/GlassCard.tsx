import React, { useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useAppleTheme } from './AppleThemeProvider';

interface GlassCardProps {
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
  style?: React.CSSProperties;
}

// Simple frosted glass animation
const loadingPulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
`;

const StyledCard = styled.div<{
  $variant: 'primary' | 'secondary' | 'accent' | 'destructive';
  $material: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'prominent';
  $size: 'small' | 'medium' | 'large';
  $aspectRatio: 'square' | 'portrait' | 'landscape' | 'wide';
  $interactive: boolean;
  $backgroundImage?: string;
  $loading: boolean;
  $disabled: boolean;
  $tokens: any;
}>`
  /* Apple Design Foundation */
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  cursor: ${({ $interactive, $disabled }) => 
    $disabled ? 'not-allowed' : 
    $interactive ? 'pointer' : 'default'
  };
  
  /* Apple Material System */
  ${({ $material, $tokens }) => {
    const material = $tokens.materials.glass[$material];
    const depth = $tokens.materials.depth.layer2;
    
    return css`
      background: rgba(255, 255, 255, ${material.opacity});
      backdrop-filter: blur(${material.blur}px) brightness(${material.brightness}) saturate(${material.saturation});
      -webkit-backdrop-filter: blur(${material.blur}px) brightness(${material.brightness}) saturate(${material.saturation});
      border: 1px solid rgba(255, 255, 255, ${material.borderOpacity});
      box-shadow: ${depth.shadowOffset.x}px ${depth.shadowOffset.y}px ${depth.shadowBlur}px rgba(0, 0, 0, ${depth.shadowOpacity});
    `;
  }}
  
  /* Background Image */
  ${({ $backgroundImage }) => $backgroundImage && css`
    background-image: url(${$backgroundImage});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  `}
  
  /* Size and Aspect Ratio */
  ${({ $size, $aspectRatio, $tokens }) => {
    const getSize = () => {
      switch ($size) {
        case 'small':
          return { base: 200, padding: $tokens.spacing.micro[2] };
        case 'large':
          return { base: 400, padding: $tokens.spacing.standard[2] };
        default:
          return { base: 300, padding: $tokens.spacing.standard[1] };
      }
    };
    
    const { base, padding } = getSize();
    
    switch ($aspectRatio) {
      case 'square':
        return css`
          width: ${base}px;
          height: ${base}px;
          padding: ${padding}px;
        `;
      case 'portrait':
        return css`
          width: ${base}px;
          height: ${base * 1.4}px;
          padding: ${padding}px;
        `;
      case 'landscape':
        return css`
          width: ${base * 1.4}px;
          height: ${base}px;
          padding: ${padding}px;
        `;
      case 'wide':
        return css`
          width: ${base * 1.8}px;
          height: ${base}px;
          padding: ${padding}px;
        `;
      default:
        return css`
          width: ${base}px;
          height: ${base}px;
          padding: ${padding}px;
        `;
    }
  }}
  
  /* Apple Animation System */
  transition: all ${({ $tokens }) => $tokens.animations.snappy.duration}s ${({ $tokens }) => $tokens.animations.snappy.easing};
  will-change: transform, backdrop-filter, background, box-shadow;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  /* Variant Colors */
  ${({ $variant, $tokens }) => {
    switch ($variant) {
      case 'secondary':
        return css`
          color: ${$tokens.colors.label.secondary};
        `;
      case 'accent':
        return css`
          color: ${$tokens.colors.system.blue};
          border-color: ${$tokens.colors.system.blue}40;
        `;
      case 'destructive':
        return css`
          color: ${$tokens.colors.system.red};
          border-color: ${$tokens.colors.system.red}40;
        `;
      default:
        return css`
          color: ${$tokens.colors.label.primary};
        `;
    }
  }}
  
  /* Interactive States */
  ${({ $interactive, $disabled, $tokens }) => $interactive && !$disabled && css`
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${$tokens.materials.depth.layer3.shadowOffset.x}px ${$tokens.materials.depth.layer3.shadowOffset.y}px ${$tokens.materials.depth.layer3.shadowBlur}px rgba(0, 0, 0, ${$tokens.materials.depth.layer3.shadowOpacity});
    }
    
    &:active {
      transform: translateY(-1px) scale(0.98);
      transition: all ${$tokens.animations.snappy.duration}s ${$tokens.animations.snappy.easing};
    }
    
    &:focus-visible {
      outline: 2px solid ${$tokens.colors.system.blue};
      outline-offset: 2px;
    }
  `}
  
  /* Loading State */
  ${({ $loading }) => $loading && css`
    animation: ${loadingPulse} 2s ease-in-out infinite;
    pointer-events: none;
  `}
  
  /* Disabled State */
  ${({ $disabled, $tokens }) => $disabled && css`
    opacity: 0.5;
    pointer-events: none;
    color: ${$tokens.colors.label.quaternary};
  `}
  
  /* Accessibility - Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
    
    &:hover {
      transform: none !important;
    }
    
    &:active {
      transform: none !important;
    }
  }
  
  /* Accessibility - Reduced Transparency */
  @media (prefers-reduced-transparency: reduce) {
    ${({ $tokens }) => css`
      background: ${$tokens.colors.background.primary};
      backdrop-filter: none;
      border: 1px solid ${$tokens.colors.separator.opaque};
    `}
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    ${({ $size, $aspectRatio, $tokens }) => {
      const getMobileSize = () => {
        switch ($size) {
          case 'small':
            return { base: 150, padding: $tokens.spacing.micro[1] };
          case 'large':
            return { base: 280, padding: $tokens.spacing.standard[1] };
          default:
            return { base: 220, padding: $tokens.spacing.micro[2] };
        }
      };
      
      const { base, padding } = getMobileSize();
      
      switch ($aspectRatio) {
        case 'square':
          return css`
            width: ${base}px;
            height: ${base}px;
            padding: ${padding}px;
          `;
        case 'portrait':
          return css`
            width: ${base}px;
            height: ${base * 1.3}px;
            padding: ${padding}px;
          `;
        case 'landscape':
          return css`
            width: 100%;
            max-width: ${base * 1.3}px;
            height: ${base}px;
            padding: ${padding}px;
          `;
        case 'wide':
          return css`
            width: 100%;
            max-width: ${base * 1.6}px;
            height: ${base}px;
            padding: ${padding}px;
          `;
        default:
          return css`
            width: ${base}px;
            height: ${base}px;
            padding: ${padding}px;
          `;
      }
    }}
  }
`;

const CardContent = styled.div`
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
`;



export const GlassCard: React.FC<GlassCardProps> = ({
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
  ...props
}) => {
  const { tokens } = useAppleTheme();

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (loading || disabled) return;
    onClick?.();
  }, [onClick, loading, disabled]);

  return (
    <StyledCard
      $variant={variant}
      $material={material}
      $size={size}
      $aspectRatio={aspectRatio}
      $interactive={interactive}
      $backgroundImage={backgroundImage}
      $loading={loading}
      $disabled={disabled}
      $tokens={tokens}
      onClick={handleClick}
      className={className}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      aria-label={loading ? 'Loading...' : undefined}
      aria-disabled={disabled}
      {...props}
    >
      <CardContent>{children}</CardContent>
    </StyledCard>
  );
};

export default GlassCard;