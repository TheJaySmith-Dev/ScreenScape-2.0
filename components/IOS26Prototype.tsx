import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppleTheme } from './AppleThemeProvider';
import LiquidGlassWrapper from './LiquidGlassWrapper';
import VisualRegressionTester from './VisualRegressionTester';
import LottieDemo from './LottieDemo';

const BaselineGrid: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  const rows = Array.from({ length: 100 }, (_, i) => i);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {rows.map((r) => (
        <div
          key={r}
          style={{
            position: 'absolute',
            top: r * 8,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(127,127,127,0.12)',
          }}
        />
      ))}
    </div>
  );
};

const iosSpring = { type: 'spring', damping: 20, stiffness: 180 } as const;

const PrototypeCard: React.FC<{ title: string; depth?: number }>= ({ title, depth = 2 }) => {
  const { tokens } = useAppleTheme();
  const material = tokens.materials.glass.regular;
  return (
    <LiquidGlassWrapper componentType="card" intensity="prominent" mode="shader" effect="clear">
      <motion.div
        style={{
          borderRadius: tokens.borderRadius.large,
          background: `rgba(255,255,255,${material.opacity})`,
          backdropFilter: `blur(${material.blur}px) saturate(${tokens.materials.glass.regular.saturation}) brightness(${tokens.materials.glass.regular.brightness})`,
          WebkitBackdropFilter: `blur(${material.blur}px) saturate(${tokens.materials.glass.regular.saturation}) brightness(${tokens.materials.glass.regular.brightness})`,
          border: `1px solid rgba(255,255,255,${material.borderOpacity})`,
          boxShadow: `0 ${depth * 4}px ${depth * 8}px rgba(0,0,0,${0.08 + depth * 0.02})`,
          padding: tokens.spacing.standard[1],
          minWidth: 280,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={iosSpring as any}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: tokens.spacing.small }}>
          <h3 style={{
            margin: 0,
            fontFamily: tokens.typography.families.display,
            fontSize: tokens.typography.sizes.title3,
            fontWeight: tokens.typography.weights.semibold,
            lineHeight: tokens.typography.lineHeights.title3,
          }}>{title}</h3>
          <span style={{
            fontFamily: tokens.typography.families.text,
            fontSize: tokens.typography.sizes.caption1,
            color: tokens.colors.label.secondary,
          }}>Non‑frosted</span>
        </div>
        <p style={{
          marginTop: tokens.spacing.small,
          marginBottom: 0,
          fontFamily: tokens.typography.families.text,
          fontSize: tokens.typography.sizes.body,
          lineHeight: tokens.typography.lineHeights.body,
          color: tokens.colors.label.secondary,
        }}>
          Clear glass, minimal blur, calibrated luminance and saturation.
        </p>
      </motion.div>
    </LiquidGlassWrapper>
  );
};

const PrototypePills: React.FC = () => {
  const { tokens } = useAppleTheme();
  const styles = tokens.materials.pill.primary;
  const [active, setActive] = useState(0);
  const items = ['Home', 'Search', 'Live', 'Games', 'Settings'];
  return (
    <div style={{ display: 'flex', gap: tokens.spacing.small }}>
      {items.map((label, i) => (
        <LiquidGlassWrapper key={label} componentType="button" intensity="prominent" mode="shader" effect="clear">
          <motion.button
            onClick={() => setActive(i)}
            style={{
              borderRadius: styles.borderRadius,
              background: i === active ? styles.active.background : styles.background,
              border: `1px solid ${i === active ? styles.active.border : styles.border}`,
              backdropFilter: styles.backdropFilter,
              WebkitBackdropFilter: styles.backdropFilter,
              boxShadow: i === active ? styles.active.shadow : styles.shadow,
              color: tokens.colors.label.primary,
              padding: `${tokens.spacing.small}px ${tokens.spacing.medium}px`,
              fontFamily: tokens.typography.families.text,
              fontSize: tokens.typography.sizes.callout,
              lineHeight: tokens.typography.lineHeights.callout,
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={iosSpring as any}
          >
            {label}
          </motion.button>
        </LiquidGlassWrapper>
      ))}
    </div>
  );
};

const IOS26Prototype: React.FC = () => {
  const { tokens } = useAppleTheme();
  const [showGrid, setShowGrid] = useState(false);

  return (
    <div style={{ position: 'relative', padding: tokens.spacing.standard[1] }}>
      <BaselineGrid show={showGrid} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.standard[1] }}>
        <h1 style={{
          margin: 0,
          fontFamily: tokens.typography.families.display,
          fontSize: tokens.typography.sizes.title1,
          fontWeight: tokens.typography.weights.semibold,
          lineHeight: tokens.typography.lineHeights.title1,
        }}>iOS 26 Non‑Frosted Prototype</h1>
        <button
          onClick={() => setShowGrid((v) => !v)}
          style={{
            borderRadius: tokens.borderRadius.medium,
            padding: `${tokens.spacing.small}px ${tokens.spacing.medium}px`,
            fontFamily: tokens.typography.families.text,
            fontSize: tokens.typography.sizes.subheadline,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.26)',
            cursor: 'pointer',
          }}
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>

      <PrototypePills />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: tokens.spacing.standard[1], marginTop: tokens.spacing.standard[1] }}>
        <PrototypeCard title="Glass Card" depth={2} />
        <PrototypeCard title="Control Panel" depth={3} />
        <PrototypeCard title="Info Panel" depth={1} />
      </div>

      <div style={{ marginTop: tokens.spacing.standard[1] }}>
        <LottieDemo />
      </div>

      {/* In-app visual regression tester */}
      <VisualRegressionTester targetSelector="#root" tolerancePx={1} />
    </div>
  );
};

export default IOS26Prototype;