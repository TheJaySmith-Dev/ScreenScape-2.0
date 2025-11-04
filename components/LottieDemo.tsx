import React from 'react';
import Lottie from 'lottie-react';
import ios26Wisp from '../assets/animations/ios26-wisp';
import { useAppleTheme } from './AppleThemeProvider';
import LiquidGlassWrapper from './LiquidGlassWrapper';

const LottieDemo: React.FC = () => {
  const { tokens } = useAppleTheme();

  const material = tokens.materials.glass.thin;

  return (
    <LiquidGlassWrapper componentType="panel" intensity="medium" mode="shader" effect="clear">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.standard[0],
          padding: tokens.spacing.standard[0],
          borderRadius: tokens.borderRadius.large,
          background: `rgba(255,255,255,${material.opacity})`,
          backdropFilter: `blur(${material.blur}px) saturate(${tokens.materials.glass.regular.saturation}) brightness(${tokens.materials.glass.regular.brightness})`,
          WebkitBackdropFilter: `blur(${material.blur}px) saturate(${tokens.materials.glass.regular.saturation}) brightness(${tokens.materials.glass.regular.brightness})`,
          border: `1px solid rgba(255,255,255,${material.borderOpacity})`,
          boxShadow: `0 8px 24px rgba(0,0,0,${tokens.materials.glass.thin.shadowIntensity})`,
        }}
      >
        <div style={{ width: 180, height: 180 }}>
          <Lottie animationData={ios26Wisp} loop style={{ width: '100%', height: '100%' }} />
        </div>
        <div>
          <h3 style={{
            margin: 0,
            fontFamily: tokens.typography.families.display,
            fontSize: tokens.typography.sizes.title3,
            fontWeight: tokens.typography.weights.semibold,
            lineHeight: tokens.typography.lineHeights.title3,
          }}>Lottie Demo</h3>
          <p style={{
            marginTop: tokens.spacing.small,
            marginBottom: 0,
            fontFamily: tokens.typography.families.text,
            fontSize: tokens.typography.sizes.body,
            lineHeight: tokens.typography.lineHeights.body,
            color: tokens.colors.label.secondary,
            maxWidth: 420,
          }}>
            Demonstrates pixel-precise animation integration with a non‑frosted glass panel. Replace with production assets as needed.
          </p>
        </div>
      </div>
    </LiquidGlassWrapper>
  );
};

export default LottieDemo;