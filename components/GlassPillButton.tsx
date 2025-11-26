import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useAppleTheme } from './AppleThemeProvider';

interface GlassPillButtonProps {
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
  style?: React.CSSProperties;
}

// Simple frosted glass animations
const loadingSpinner = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const StyledButton = styled.button<{
  $variant: 'primary' | 'secondary' | 'accent' | 'destructive';
  $size: 'small' | 'medium' | 'large';
  $material: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'prominent';
  $loading: boolean;
  $fullWidth: boolean;
  $hasIcon: boolean;
  $tokens: any;
}>`
  /* Apple Design System Foundation */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $tokens }) => $tokens.spacing.micro[1]}px;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-family: ${({ $tokens }) => $tokens.typography.families.text};
  font-weight: ${({ $tokens }) => $tokens.typography.weights.medium};
  letter-spacing: -0.003em;
  outline: none;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  /* Apple Glass Material System */
  ${({ $material, $tokens }) => {
    const material = $tokens.materials.glass[$material];
    const depth = $tokens.materials.depth.layer1;
    return css`
      background-color: rgba(255, 255, 255, ${material.opacity});
      backdrop-filter: blur(${material.blur}px) brightness(${material.brightness}) saturate(${material.saturation});
      -webkit-backdrop-filter: blur(${material.blur}px) brightness(${material.brightness}) saturate(${material.saturation});
      border: 0.5px solid rgba(255, 255, 255, ${material.borderOpacity});
      box-shadow: ${depth.shadowOffset.x}px ${depth.shadowOffset.y}px ${depth.shadowBlur}px rgba(0, 0, 0, ${depth.shadowOpacity});
    `;
  }}
  
  /* Apple Core Animation Timing */
  transition: all ${({ $tokens }) => $tokens.animations.easeInOut.duration}s ${({ $tokens }) => $tokens.animations.easeInOut.easing};
  
  /* Performance Optimization */
  will-change: transform, backdrop-filter, background-color, box-shadow;
  transform: translateZ(0);
  backface-visibility: hidden;
  
  /* Typography & Color */
  color: ${({ $tokens }) => $tokens.colors.label.primary};
  
  /* Size Variants */
  ${({ $size, $tokens }) => {
    switch ($size) {
      case 'small':
        return css`
          height: ${$tokens.spacing.standard[2]}px;
          padding: 0 ${$tokens.spacing.standard[1]}px;
          font-size: ${$tokens.typography.sizes.caption1}px;
          line-height: ${$tokens.typography.lineHeights.caption1};
          border-radius: 9999px;
        `;
      case 'medium':
        return css`
          height: ${$tokens.spacing.standard[2] + $tokens.spacing.micro[2]}px;
          padding: 0 ${$tokens.spacing.standard[2]}px;
          font-size: ${$tokens.typography.sizes.body}px;
          line-height: ${$tokens.typography.lineHeights.body};
          border-radius: 9999px;
        `;
      case 'large':
        return css`
          height: ${$tokens.spacing.standard[3]}px;
          padding: 0 ${$tokens.spacing.standard[3]}px;
          font-size: ${$tokens.typography.sizes.title3}px;
          line-height: ${$tokens.typography.lineHeights.title3};
          border-radius: 9999px;
        `;
      default:
        return '';
    }
  }}
  
  /* Full Width */
  ${({ $fullWidth }) => $fullWidth && css`
    width: 100%;
  `}
  
  /* Variant Styles */
  ${({ $variant, $tokens }) => {
    switch ($variant) {
      case 'primary':
        return css`
          background-color: ${$tokens.colors.system.blue};
          color: white;
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${$tokens.colors.system.blue}dd;
            transform: translateY(-1px) translateZ(0);
          }
          
          &:active:not(:disabled) {
            background-color: ${$tokens.colors.system.blue}bb;
            transform: translateY(0) scale(0.98) translateZ(0);
          }
        `;
      case 'secondary':
        return css`
          background-color: ${$tokens.colors.fill.secondary};
          color: ${$tokens.colors.label.primary};
          border-color: ${$tokens.colors.separator.nonOpaque};
          
          &:hover:not(:disabled) {
            background-color: ${$tokens.colors.fill.primary};
            border-color: ${$tokens.colors.separator.opaque};
          }
          
          &:active:not(:disabled) {
            background-color: ${$tokens.colors.fill.tertiary};
          }
        `;
      case 'accent':
        return css`
          background-color: ${$tokens.colors.system.purple};
          color: white;
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${$tokens.colors.system.purple}dd;
            transform: translateY(-1px) translateZ(0);
          }
          
          &:active:not(:disabled) {
            background-color: ${$tokens.colors.system.purple}bb;
            transform: translateY(0) scale(0.98) translateZ(0);
          }
        `;
      case 'destructive':
        return css`
          background-color: ${$tokens.colors.system.red};
          color: white;
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${$tokens.colors.system.red}dd;
            transform: translateY(-1px) translateZ(0);
          }
          
          &:active:not(:disabled) {
            background-color: ${$tokens.colors.system.red}bb;
            transform: translateY(0) scale(0.98) translateZ(0);
          }
        `;
      default:
        return '';
    }
  }}
  
  /* Focus State */
  &:focus-visible {
    outline: 2px solid ${({ $tokens }) => $tokens.colors.system.blue};
    outline-offset: 2px;
    box-shadow: 
      0 0 0 4px ${({ $tokens }) => $tokens.colors.system.blue}33,
      ${({ $tokens }) => $tokens.materials.depth.layer2.shadowOffset.x}px 
      ${({ $tokens }) => $tokens.materials.depth.layer2.shadowOffset.y}px 
      ${({ $tokens }) => $tokens.materials.depth.layer2.shadowBlur}px 
      rgba(0, 0, 0, ${({ $tokens }) => $tokens.materials.depth.layer2.shadowOpacity});
  }
  
  /* Disabled State */
  &:disabled {
    opacity: 0.4;
    transform: none;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
    }
  }
  
  /* Loading State */
  ${({ $loading, $tokens }) => $loading && css`
    color: transparent;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      margin: -8px 0 0 -8px;
      border: 2px solid ${$tokens.colors.label.quaternary};
      border-top-color: ${$tokens.colors.label.primary};
      border-radius: 50%;
      animation: ${loadingSpinner} 0.8s linear infinite;
    }
  `}
  
  /* Icon Styling */
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: currentColor;
    opacity: 0.8;
  }
  
  /* Accessibility - Reduced Transparency */
  @media (prefers-reduced-transparency: reduce) {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background-color: ${({ $tokens }) => $tokens.colors.background.secondary};
    border-color: ${({ $tokens }) => $tokens.colors.separator.opaque};
  }
  
  /* Accessibility - Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    transition: background-color 0.2s ease, border-color 0.2s ease;
    
    &:hover:not(:disabled) {
      transform: none;
    }
    
    &:active:not(:disabled) {
      transform: none;
    }
    
    &::after {
      display: none;
    }
  }
  
  /* Responsive Design */
  @media (max-width: 428px) {
    /* iPhone adjustments */
    ${({ $size, $tokens }) => $size === 'small' && css`
      min-height: ${$tokens.spacing.standard[2] + $tokens.spacing.micro[1]}px;
      padding: ${$tokens.spacing.micro[2]}px ${$tokens.spacing.standard[0] + $tokens.spacing.micro[1]}px;
    `}
  }
  
  @media (min-width: 429px) and (max-width: 1024px) {
    /* iPad adjustments */
    touch-action: manipulation;
  }
  
  /* Browser Support */
  @supports not (backdrop-filter: blur(0px)) {
    background-color: ${({ $tokens }) => $tokens.colors.fill.primary};
    border-color: ${({ $tokens }) => $tokens.colors.separator.opaque};
  }
`;



export const GlassPillButton: React.FC<GlassPillButtonProps> = ({
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
  ...props
}) => {
  const theme = useAppleTheme();
  
  // Add null check for theme.tokens
  if (!theme?.tokens) {
    return (
      <button
        disabled={disabled || loading}
        onClick={onClick}
        className={`${className || ''} px-4 py-2 rounded-lg bg-blue-500 text-white`}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {!loading && children}
      </button>
    );
  }
  
  const hasIcon = Boolean(icon);
  
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $material={material}
      $loading={loading}
      $fullWidth={fullWidth}
      $hasIcon={hasIcon}
      $tokens={theme.tokens}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      {...props}
    >
      {icon && (
        <span className="icon">{icon}</span>
      )}
      {!loading && children}
    </StyledButton>
  );
};

export default GlassPillButton;