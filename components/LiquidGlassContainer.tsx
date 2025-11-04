/**
 * LiquidGlassContainer Component
 * Groups nearby liquid glass elements to reduce overlapping effects and improve performance.
 */

import React from 'react';
import styled from 'styled-components';
import { useAppleTheme } from './AppleThemeProvider';

export interface LiquidGlassContainerProps {
  children: React.ReactNode;
  mergeStrategy?: 'group' | 'isolate';
  className?: string;
  style?: React.CSSProperties;
}

const Container = styled.div<{
  $strategy: 'group' | 'isolate';
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
    <Container $strategy={mergeStrategy} $tokens={tokens} className={className} style={style}>
      {children}
    </Container>
  );
};

export default LiquidGlassContainer;