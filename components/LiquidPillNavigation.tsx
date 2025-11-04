/**
 * LiquidPillNavigation Component
 * Enhanced PillNavigation with liquid glass effects
 * Maintains existing API while adding liquid glass enhancements
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Search, Home, Tv, Gamepad2, Heart, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { ViewType } from '../App';
import { useAppleTheme } from './AppleThemeProvider';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import { defaultLiquidVisualTuning } from '../utils/liquidGlassUserTuning';
import { useScrollVelocity } from '../utils/useScrollVelocity';
import { useOcclusionTracker } from '../utils/useOcclusionTracker';

interface LiquidPillNavigationProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  // Liquid Glass Enhancement Props
  liquidIntensity?: 'subtle' | 'medium' | 'prominent';
  refractionMode?: 'standard' | 'polar' | 'prominent' | 'shader';
  enableLiquidEffects?: boolean;
  onSearchClick?: () => void;
}

const LiquidPillNavigation: React.FC<LiquidPillNavigationProps> = ({
  view,
  setView,
  liquidIntensity = 'prominent',
  refractionMode = 'shader',
  enableLiquidEffects = true,
  onSearchClick
}) => {
  const { tokens } = useAppleTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { velocityY } = useScrollVelocity();
  const occlusion = useOcclusionTracker(
    containerRef,
    ['img', '.poster', '.MediaRow', '.NetflixView', '.GlassCard', '[data-occlude]'],
    50
  );

  // Map scroll physics and occlusion to PhysicalRefractionParams
  const refractionParams = useMemo(() => {
    const coverage = occlusion?.panelCoverageRatio ?? 0; // 0..1 portion of pill bar covered
    const speed = Math.min(2000, Math.abs(velocityY)); // px/s
    const speed01 = Math.min(1, speed / 1200);
    // Orientation-aware offsets for light angle and camera
    const isPortrait = typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : false;
    const orientationBias = isPortrait ? 4 : -2;

    // Derive physical parameters
    const indexOfRefraction = 1.50 + coverage * 0.05 + speed01 * 0.03; // ~1.50-1.58 for punchier depth
    const surfaceSmoothness = 0.90 + (1 - coverage) * 0.05; // smoother when less covered
    const lightIntensity = Math.min(1, 0.62 + coverage * 0.28); // brighter with coverage
    const lightAngleDeg = 22 + orientationBias + speed01 * 12; // oblique with speed + orientation
    const lightColorTemperatureK = 6500;
    const mediumDensity = 1.0;
    const surroundingComplexity = 0.45 + coverage * 0.45; // more content -> more complexity
    const cameraAngleDeg = 18 + orientationBias + speed01 * 10;
    const cameraDistance = Math.max(0.24, 0.5 - speed01 * 0.16); // near when fast

    return {
      indexOfRefraction,
      surfaceSmoothness,
      lightIntensity,
      lightAngleDeg,
      lightColorTemperatureK,
      mediumDensity,
      surroundingComplexity,
      cameraAngleDeg,
      cameraDistance,
    };
  }, [occlusion?.panelCoverageRatio, velocityY]);

  // Aggressive, dynamic visual tuning driven by occlusion and scroll
  const aggressiveTuning = useMemo(() => {
    const coverage = occlusion?.panelCoverageRatio ?? 0; // 0..1 portion of pill bar covered
    const speed = Math.min(2000, Math.abs(velocityY)); // px/s
    const speed01 = Math.min(1, speed / 1200);
    const isPortrait = typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : false;

    // Push thickness to the upper bound for stronger displacement
    const thickness = (isPortrait ? 42.0 : 44.0) - (1 - coverage) * 2.0; // clamp handled in wrapper

    // Dynamically raise IOR for punchier refraction under motion/coverage
    const refractionFactor = 1.58 + coverage * 0.06 + speed01 * 0.05; // ~1.58-1.69

    // Max out dispersion gain multiplier (wrapper clamps internally)
    const dispersionGain = 18.0 * (0.7 + 0.3 * speed01);

    // Little to no frost: keep blur near zero
    const blurRadius = 0.04;

    return {
      ...defaultLiquidVisualTuning,
      thickness,
      refractionFactor,
      dispersionGain,
      blurRadius,
      glareIntensity: 88.0,
      fresnelIntensity: 42.0,
      tint: '#ffffff00',
      shadowIntensity: 10.0,
    };
  }, [occlusion?.panelCoverageRatio, velocityY]);

  // Subtle underlay tuning for a slight liquid effect behind the bar
  const underlayTuning = useMemo(() => {
    return {
      ...defaultLiquidVisualTuning,
      // Match Liquid Glass Studio reference (clear, non‑frosted but highly liquid)
      thickness: 20.6,
      refractionFactor: 1.39,
      dispersionGain: 10.3,
      fresnelSize: 35.0,
      fresnelHardness: 20.0,
      fresnelIntensity: 100.0,
      glareSize: 30.0,
      glareHardness: 20.0,
      glareIntensity: 45.0,
      glareConvergence: 50.0,
      glareOppositeSide: 80.0,
      glareAngle: 45.0,
      blurRadius: 1.0,
      tint: '#ffffff10',
      shadowExpand: 25.0,
      shadowIntensity: 25.0,
      shadowPosition: { x: 4.76, y: -7.64 },
    };
  }, []);

  const navigationItems = [
    { id: 'screenSearch' as ViewType, icon: Home, label: 'Home' },
    { id: 'search' as ViewType, icon: Search, label: 'Search', isSearchButton: true },
    { id: 'live' as ViewType, icon: Tv, label: 'Live Channels' },
    { id: 'likes' as ViewType, icon: Heart, label: 'Likes' },
    { id: 'game' as ViewType, icon: Gamepad2, label: 'Games' },
    { id: 'settings' as ViewType, icon: SettingsIcon, label: 'Settings' },
    { id: 'sync' as ViewType, icon: RefreshCw, label: 'Sync' },
  ];

  // Enhanced navigation handler with haptic feedback
  const handleNavigation = useCallback((viewType: ViewType) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
    setView(viewType);
  }, [setView]);

  return (
    mounted ? createPortal(
    <motion.div
      ref={containerRef}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 360,
        damping: 30,
        mass: 0.6,
        delay: 0.08
      }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        transform: 'translate3d(0,0,0)',
        padding: `0 ${tokens.spacing.standard[1]}px ${tokens.spacing.standard[1]}px`,
        paddingBottom: `calc(${tokens.spacing.standard[1]}px + env(safe-area-inset-bottom))`,
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}
      >
        {/* Non-frosted container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${tokens.spacing.micro[0]}px`,
            padding: `${tokens.spacing.micro[0]}px`,
            borderRadius: '28px',
            position: 'relative',
            minHeight: '56px',
            width: 'auto',
            maxWidth: 'min(800px, calc(100vw - 24px))',
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            // Remove subtle border to avoid pill-shaped outline glitches
            border: 'none',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
            willChange: 'transform'
          }}
        >
          {/* Subtle liquid underlay behind the pill menu */}
          <LiquidGlassWrapper
            componentType="navigation"
            intensity="medium"
            mode={refractionMode}
            effect="clear"
            enableEffects={enableLiquidEffects}
            mouseContainer={containerRef}
            refractionParams={refractionParams}
            refractionQuality="high"
            artifactReduction="none"
            visualTuning={underlayTuning}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '28px',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <div />
          </LiquidGlassWrapper>
          {/* Navigation Items */}
          <nav 
            role="tablist"
            aria-label="Main navigation"
            style={{
              display: 'flex',
              gap: `${tokens.spacing.micro[0]}px`,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}
          >
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.id;
              
              return (
                  <motion.button
                    onClick={() => {
                      if ((item as any).isSearchButton && onSearchClick) {
                        onSearchClick();
                      } else {
                        handleNavigation(item.id);
                      }
                    }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.965 }}
                    aria-label={`Navigate to ${item.label}`}
                    aria-current={isActive ? 'page' : undefined}
                    role="tab"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: `${tokens.spacing.micro[0]}px`,
                      padding: `${tokens.spacing.micro[0]}px ${tokens.spacing.micro[1]}px`,
                      borderRadius: `${tokens.borderRadius.large}px`,
                      background: isActive 
                        ? `linear-gradient(135deg, ${tokens.colors.system.blue}12 0%, ${tokens.colors.system.indigo}12 100%)`
                        : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    transition: `transform ${tokens.liquidGlass.animations.duration.medium} ${tokens.liquidGlass.animations.elasticTiming},
                                   box-shadow 220ms ease, color 220ms ease`,
                    color: isActive ? 'white' : tokens.colors.label.primary,
                    minWidth: 'clamp(44px, 10vw, 52px)',
                    // Remove default focus outline to prevent visual glitching
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    // Enhanced shadow for active state
                    boxShadow: isActive 
                      ? `0 6px 18px rgba(0, 122, 255, 0.28), 0 2px 10px rgba(0, 0, 0, 0.10)`
                      : 'none',
                    // Text shadow for better readability
                      textShadow: isActive 
                        ? '0 1px 2px rgba(0, 0, 0, 0.2)'
                        : 'none'
                    }}
                  >
                    <Icon 
                      size={18} 
                      strokeWidth={isActive ? 2.5 : 2}
                      style={{
                        filter: isActive 
                          ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                          : 'none'
                      }}
                    />
                    <span style={{
                      fontSize: `${tokens.typography.sizes.caption2}px`,
                      fontWeight: isActive ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                      fontFamily: tokens.typography.families.text,
                      lineHeight: 1
                    }}>
                      {item.label}
                    </span>
                  </motion.button>
              );
            })}
          </nav>
        </div>
      </div>
    </motion.div>, document.body) : null
  );
};

export default LiquidPillNavigation;
export { LiquidPillNavigation };