import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { useAppleTheme } from './AppleThemeProvider';
import { liquidTokens, glassSurfaceStyle } from '../utils/liquidDesignTokens';
import { useScrollVelocity } from '../utils/useScrollVelocity';

interface GlassNavProps {
  onSearchClick?: () => void;
}

const GlassNav: React.FC<GlassNavProps> = ({ onSearchClick }) => {
  const { tokens } = useAppleTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const { velocityY } = useScrollVelocity(containerRef);
  const [focused, setFocused] = useState(false);

  const compact = useMemo(() => velocityY > 3, [velocityY]);

  const containerStyle = useMemo(() => ({
    position: 'sticky' as const,
    top: 0,
    zIndex: 40,
    padding: `${tokens.spacing.standard[1]}px ${tokens.spacing.standard[2]}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...glassSurfaceStyle({ blur: liquidTokens.blur.medium, tintAlpha: 0.10 }),
    boxShadow: liquidTokens.shadow.card,
    height: compact ? 56 : 68,
    transition: `height ${liquidTokens.motion.fast}, box-shadow ${liquidTokens.motion.fast}`,
  }), [compact, tokens]);

  const searchStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: focused ? '12px 16px' : '10px 14px',
    borderRadius: `${liquidTokens.radii.large}px`,
    background: 'rgba(255,255,255,0.10)',
    border: `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}`,
    backdropFilter: `blur(${liquidTokens.blur.small}px) saturate(${liquidTokens.saturationBoost})`,
    WebkitBackdropFilter: `blur(${liquidTokens.blur.small}px) saturate(${liquidTokens.saturationBoost})`,
    width: focused ? 420 : 320,
    transition: `all ${liquidTokens.motion.fast}`,
    color: tokens.colors.label.primary,
    cursor: 'text',
    filter: focused ? 'brightness(1.06)' : 'brightness(0.95)',
    boxShadow: focused ? '0 0 0 2px rgba(130,170,255,0.6)' : 'none',
  }), [focused, tokens]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={containerStyle}
    >
      {/* Brand / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          height: 28,
          width: 28,
          borderRadius: 8,
          background: 'linear-gradient(180deg, #7fc4ff, #93b6ff)',
          boxShadow: 'inset 0 1px 6px rgba(255,255,255,0.4), 0 10px 24px rgba(0,0,0,0.25)'
        }} />
        <span style={{
          fontFamily: tokens.typography.families.title,
          fontSize: tokens.typography.sizes.title3,
          color: tokens.colors.label.primary,
          letterSpacing: 0.2
        }}>ScreenScape</span>
      </div>

      {/* Search Capsule */}
      <div
        role="search"
        aria-label="Search media"
        onClick={() => onSearchClick?.()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={0}
        style={searchStyle}
      >
        <SearchIcon size={18} color={tokens.colors.label.secondary} />
        <span style={{
          fontFamily: tokens.typography.families.text,
          fontSize: tokens.typography.sizes.callout,
          color: focused ? tokens.colors.label.primary : tokens.colors.label.secondary
        }}>
          Search movies, shows, people…
        </span>
      </div>
    </motion.div>
  );
};

export default GlassNav;
