/**
 * LiquidGlassContainer Component
 * Groups nearby liquid glass elements to reduce overlapping effects and improve performance.
 */

import React from 'react';
import styled from 'styled-components';
import { useAppleTheme } from './AppleThemeProvider';

export interface LiquidGlassContainerProps {
  children: React.ReactNode;
  mergeStrategy?: 'group' | 'isolate' | 'blob';
  className?: string;
  style?: React.CSSProperties;
}

const Container = styled.div<{
  $strategy: 'group' | 'isolate' | 'blob';
  $tokens: any;
}>`
  position: relative;
  display: block;

  /* When grouping, we provide a unified frosted background as a subtle fallback */
  ${({ $strategy, $tokens }) => $strategy === 'group' && `
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(10px) saturate(140%);
    -webkit-backdrop-filter: blur(10px) saturate(140%);
    border-radius: ${$tokens.spacing.radius.large}px;
  `}

  ${({ $strategy }) => $strategy === 'blob' && `
    /* Gooey blob merging filter (requires inline SVG filter definition) */
    filter: url(#gooeyEffect);
  `}

  /* Accessibility: respect reduced-transparency */
  @media (prefers-reduced-transparency: reduce) {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`;

export const LiquidGlassContainer: React.FC<LiquidGlassContainerProps> = ({
  children,
  mergeStrategy = 'group',
  className,
  style,
}) => {
  const { tokens } = useAppleTheme();

  return (
    <>
      {/* Inline SVG filter definition for gooey effect used by blob merge strategy */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="gooeyEffect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>
      <Container $strategy={mergeStrategy} $tokens={tokens} className={className} style={style}>
        {children}
      </Container>
    </>
  );
};

export default LiquidGlassContainer;