import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useAppleTheme } from './AppleDesignSystem';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive';
  material?: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'prominent';
  size?: 'small' | 'medium' | 'large' | 'full';
  padding?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  elevated?: boolean;
}

// Simple frosted glass animations
const loadingPulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

const StyledPanel = styled.div<{
  $variant: 'primary' | 'secondary' | 'accent' | 'destructive';
  $material: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'prominent';
  $size: 'small' | 'medium' | 'large' | 'full';
  $padding: 'none' | 'small' | 'medium' | 'large';
  $borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  $interactive: boolean;
  $loading: boolean;
  $disabled: boolean;
  $elevated: boolean;
  $tokens: any;
}>`
  /* Apple Design Foundation */
  position: relative;
  overflow: hidden;
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
  
  /* Size Variants */
  ${({ $size }) => {
    switch ($size) {
      case 'small':
        return css`
          width: 200px;
          min-height: 120px;
        `;
      case 'large':
        return css`
          width: 600px;
          min-height: 400px;
        `;
      case 'full':
        return css`
          width: 100%;
          min-height: 300px;
        `;
      default:
        return css`
          width: 400px;
          min-height: 250px;
        `;
    }
  }}
  
  /* Padding Variants */
  ${({ $padding, $tokens }) => {
    switch ($padding) {
      case 'none':
        return css`
          padding: 0;
        `;
      case 'small':
        return css`
          padding: ${$tokens.spacing.standard[1]}px;
        `;
      case 'large':
        return css`
          padding: ${$tokens.spacing.standard[3]}px;
        `;
      default:
        return css`
          padding: ${$tokens.spacing.standard[2]}px;
        `;
    }
  }}
  
  /* Border Radius Variants */
  ${({ $borderRadius }) => {
    switch ($borderRadius) {
      case 'none':
        return css`
          border-radius: 0;
        `;
      case 'small':
        return css`
          border-radius: 8px;
        `;
      case 'large':
        return css`
          border-radius: 24px;
        `;
      case 'full':
        return css`
          border-radius: 50%;
        `;
      default:
        return css`
          border-radius: 16px;
        `;
    }
  }}
  
  /* Apple Animation System */
  transition: all ${({ $tokens }) => $tokens.animations.softSpring.duration}s ${({ $tokens }) => $tokens.animations.softSpring.easing};
  will-change: transform, backdrop-filter, background, box-shadow, opacity;
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
      transform: scale(1.02) translateZ(0);
      box-shadow: 
        0 30px 60px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.2) inset,
        inset 0 1px 0 rgba(255, 255, 255, 0.4),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2);
      z-index: 10;
    }
    
    &:active {
      transform: scale(0.98) translateZ(0);
      box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset,
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    }
    
    &:focus-visible {
      outline: 2px solid ${$tokens.colors.system.blue};
      outline-offset: 2px;
    }
  `}

  /* Open/Close Animations */
  &.panel-enter {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  
  &.panel-enter-active {
    opacity: 1;
    transform: translateY(0) scale(1);
    transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  &.panel-exit {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  
  &.panel-exit-active {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
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
    ${({ $size }) => $size === 'large' && css`
      width: 100%;
      min-height: 300px;
    `}
    
    ${({ $size }) => $size === 'medium' && css`
      width: 100%;
      min-height: 200px;
    `}
    
    ${({ $padding, $tokens }) => {
    switch ($padding) {
      case 'small':
        return css`
            padding: ${$tokens.spacing.micro[2]}px;
          `;
      case 'large':
        return css`
            padding: ${$tokens.spacing.standard[2]}px;
          `;
      default:
        return css`
            padding: ${$tokens.spacing.standard[1]}px;
          `;
    }
  }}
  }
`;

const PanelContent = styled.div`
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  variant = 'primary',
  material = 'regular',
  size = 'medium',
  padding = 'medium',
  borderRadius = 'medium',
  className,
  interactive = false,
  onClick,
  loading = false,
  disabled = false,
  elevated = false,
  ...props
}) => {
  const theme = useAppleTheme();

  return (
    <StyledPanel
      $variant={variant}
      $material={material}
      $size={size}
      $padding={padding}
      $borderRadius={borderRadius}
      $interactive={interactive}
      $loading={loading}
      $disabled={disabled}
      $elevated={elevated}
      $tokens={theme.tokens}
      onClick={onClick}
      className={className}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      aria-label={loading ? 'Loading...' : undefined}
      aria-disabled={disabled}
      {...props}
    >
      <PanelContent>{children}</PanelContent>
    </StyledPanel>
  );
};

export default GlassPanel;