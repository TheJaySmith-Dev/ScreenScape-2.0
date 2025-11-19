/**
 * LiquidPillNavigation Component
 * Enhanced PillNavigation with liquid glass effects
 * Maintains existing API while adding liquid glass enhancements
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Search, Home, Tv, Gamepad2, Heart, Settings as SettingsIcon, RefreshCw, Tag, Menu, Coins, Image as ImageIcon } from 'lucide-react';
import { ViewType } from '../App';
import { useNavigate } from 'react-router-dom';
import { useAppleTheme } from './AppleThemeProvider';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import FluidCanvasLayer from './FluidCanvasLayer';
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
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { velocityY } = useScrollVelocity();
  const occlusion = useOcclusionTracker(
    containerRef,
    ['img', '.poster', '.MediaRow', '.NetflixView', '.GlassCard', '[data-occlude]'],
    16 // faster sampling for more real-time refraction
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

  // Adaptive refraction quality based on motion and coverage
  const refractionQuality = useMemo(() => {
    const coverage = occlusion?.panelCoverageRatio ?? 0;
    const speed = Math.min(2000, Math.abs(velocityY));
    const speed01 = Math.min(1, speed / 1200);
    if (speed01 > 0.6 || coverage > 0.5) return 'ultra';
    if (speed01 > 0.3 || coverage > 0.25) return 'high';
    return 'balanced';
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
    const dispersionGain = 20.0 * (0.7 + 0.3 * speed01);

    // Little to no frost: keep blur near zero
    const blurRadius = 0.02;

    return {
      ...defaultLiquidVisualTuning,
      thickness,
      refractionFactor: Math.max(refractionFactor, 1.72),
      dispersionGain,
      blurRadius,
      glareIntensity: 92.0,
      fresnelIntensity: 48.0,
      tint: '#ffffff00',
      shadowIntensity: 8.0,
    };
  }, [occlusion?.panelCoverageRatio, velocityY]);

  // Subtle underlay tuning for a slight liquid effect behind the bar
  const underlayTuning = useMemo(() => {
    return {
      ...defaultLiquidVisualTuning,
      // High-impact, clear liquid tuning for visible refraction
      thickness: 58.0,
      refractionFactor: 1.68,
      dispersionGain: 22.0,
      fresnelSize: 36.0,
      fresnelHardness: 18.0,
      fresnelIntensity: 80.0,
      glareSize: 34.0,
      glareHardness: 20.0,
      glareIntensity: 65.0,
      glareConvergence: 50.0,
      glareOppositeSide: 80.0,
      glareAngle: 30.0,
      blurRadius: 0.03,
      tint: '#ffffff00',
      // Soften and reposition shadow to avoid upper-left artifact
      shadowExpand: 18.0,
      shadowIntensity: 16.0,
      shadowPosition: { x: 0, y: 10 },
    };
  }, []);

  const navigationItems = [
    { id: 'screenSearch' as ViewType, icon: Home, label: 'Home' },
    { id: 'search' as ViewType, icon: Search, label: 'Search', isSearchButton: true },
    { id: 'likes' as ViewType, icon: Heart, label: 'Likes' },
    { id: 'prototype' as ViewType, label: 'More', isMenuButton: true },
  ];

  // Menu detachment motion values and glow mapping
  const detachScaleMV = useMotionValue(1);
  const detachYMV = useMotionValue(0);
  const detachOpacityMV = useMotionValue(1);
  const detachScale = useSpring(detachScaleMV, { stiffness: 420, damping: 28, mass: 1.1 });
  const detachY = useSpring(detachYMV, { stiffness: 420, damping: 28, mass: 1.1 });
  const detachOpacity = useSpring(detachOpacityMV, { stiffness: 420, damping: 28, mass: 1.1 });
  const glowOpacity = useTransform(detachOpacityMV, [1, 0.68], [0.8, 1.0]);
  const navScaleXMV = useMotionValue(1);
  const navScaleX = useSpring(navScaleXMV, { stiffness: 420, damping: 28, mass: 1.1 });
  const blurMV = useMotionValue(32);
  const blurBackdrop = useTransform(blurMV, (v) => `blur(${v}px) saturate(1.02)`);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ left: number; bottom: number } | null>(null);
  const menuItemRefs = useRef<HTMLButtonElement[]>([]);
  const panelRows = useMemo(() => ([
    { id: 'boxoffice', label: 'Box Office', Icon: Tag, onClick: () => { try { navigate('/Stats/BoxOffice'); } catch { setView('genres' as ViewType); } setPanelOpen(false); } },
    { id: 'choicegen', label: 'ChoiceGen', Icon: ImageIcon, onClick: () => { try { navigate('/play/choicegen'); } catch {} setPanelOpen(false); } },
    { id: 'billionaire', label: 'Billionaire Sandbox', Icon: Coins, onClick: () => { try { navigate('/play/billionaire-sandbox'); } catch {} setPanelOpen(false); } },
    { id: 'game', label: 'Games', Icon: Gamepad2, onClick: () => { setView('game'); setPanelOpen(false); } },
    { id: 'live', label: 'Live', Icon: Tv, onClick: () => { setView('live'); setPanelOpen(false); } },
  ]), [navigate, setView]);

  useEffect(() => {
    if (!panelOpen) return;
    try {
      const rect = navBarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = 320;
      const gap = 12;
      const left = Math.min(rect.right + gap, (window.innerWidth - panelWidth - gap));
      const bottom = Math.max(12, window.innerHeight - rect.bottom + 72);
      setPanelPos({ left, bottom });
    } catch {}
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    try {
      document.body.style.overflow = 'hidden';
      menuItemRefs.current[0]?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { setPanelOpen(false); return; }
        const idx = menuItemRefs.current.findIndex(el => el === document.activeElement);
        if (e.key === 'ArrowDown') {
          const next = Math.min(panelRows.length - 1, (idx < 0 ? 0 : idx + 1));
          menuItemRefs.current[next]?.focus();
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          const prev = Math.max(0, (idx < 0 ? 0 : idx - 1));
          menuItemRefs.current[prev]?.focus();
          e.preventDefault();
        } else if (e.key === 'Tab') {
          const dir = e.shiftKey ? -1 : 1;
          const next = Math.min(panelRows.length - 1, Math.max(0, (idx < 0 ? 0 : idx + dir)));
          menuItemRefs.current[next]?.focus();
          e.preventDefault();
        } else if (e.key === 'Enter') {
          const i = Math.max(0, idx);
          menuItemRefs.current[i]?.click();
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', handler);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handler);
      };
    } catch {}
  }, [panelOpen, panelRows]);

  const handleMenuPressStart = useCallback(() => {
    try {
      detachScaleMV.set(1.08);
      detachYMV.set(-16);
      detachOpacityMV.set(0.68);
      navScaleXMV.set(0.98);
      blurMV.set(36);
      setTimeout(() => blurMV.set(32), 100);
      setPanelOpen(true);
    } catch {}
  }, []);

  const handleMenuPressEnd = useCallback(() => {
    try {
      detachScaleMV.set(1.0);
      detachYMV.set(0);
      detachOpacityMV.set(1.0);
      navScaleXMV.set(1.0);
    } catch {}
  }, []);

  // Enhanced navigation handler with haptic feedback
  const handleNavigation = useCallback((viewType: ViewType) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
    if (viewType === 'genres') {
      try {
        navigate('/Stats/BoxOffice');
      } catch {
        setView(viewType);
      }
    } else {
      setView(viewType);
    }
  }, [setView, navigate]);

  return (
    mounted ? createPortal(
    <>
    <motion.div
      ref={containerRef}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={enableLiquidEffects ? { 
        type: "spring",
        stiffness: 360,
        damping: 30,
        mass: 0.6,
        delay: 0.08
      } : { type: 'tween', duration: 0.16 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
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
        {/* Navigation container */}
        <motion.div
          ref={navBarRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px',
            borderRadius: '24px',
            position: 'relative',
            minHeight: '44px',
            width: 'auto',
            maxWidth: 'min(800px, calc(100vw - 24px))',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(0.5px) saturate(185%) brightness(1.08) contrast(1.06)',
            WebkitBackdropFilter: 'blur(0.5px) saturate(185%) brightness(1.08) contrast(1.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            transformOrigin: 'right center',
            willChange: 'transform',
            scaleX: navScaleX as any
          }}
        >
          

          {/* CPU-based canvas liquid layer */}
          

          

          

          {/* Ambient occlusion ring for slab read */}
          

          {/* Floor glow below pill for extra depth */}
          
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
              const Icon = (item as any).icon;
              const isActive = view === item.id;
              
              if ((item as any).isMenuButton) {
                return (
                  <motion.div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      position: 'relative',
                      scale: detachScale as any,
                      y: detachY as any,
                      opacity: detachOpacity as any,
                    }}
                    onMouseDown={handleMenuPressStart}
                    onMouseUp={handleMenuPressEnd}
                    onMouseLeave={handleMenuPressEnd}
                    onTouchStart={handleMenuPressStart}
                    onTouchEnd={handleMenuPressEnd}
                    onTouchCancel={handleMenuPressEnd}
                  >
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.965 }}
                      aria-label={`Open ${item.label}`}
                      aria-current={isActive ? 'page' : undefined}
                      role="tab"
                      tabIndex={0}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        height: '44px',
                        padding: '0 8px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.008)',
                        backdropFilter: 'blur(0.5px)',
                        WebkitBackdropFilter: 'blur(0.5px)',
                        border: '1px solid rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 220ms, color 220ms',
                        color: '#FFFFFF',
                        minWidth: 'clamp(44px, 10vw, 52px)',
                        outline: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        boxShadow: 'none',
                        textShadow: 'none'
                      }}
                    >
                      <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <line x1="1" y1="2" x2="19" y2="2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="1" y1="7" x2="19" y2="7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="1" y1="12" x2="19" y2="12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span style={{
                        fontSize: `${tokens.typography.sizes.caption2}px`,
                        fontWeight: isActive ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                        fontFamily: tokens.typography.families.text,
                        lineHeight: 1
                      }}>
                        More
                      </span>
                    </motion.button>
                  </motion.div>
                );
              }

              return (
                  <motion.button
                    key={item.id}
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
                      gap: '4px',
                      height: '44px',
                      padding: '0 8px',
                      borderRadius: '12px',
                      background: isActive 
                        ? 'rgba(0, 114, 206, 0.18)'
                        : 'transparent',
                      backdropFilter: isActive ? 'blur(4px) saturate(1.12) contrast(1.02)' : 'none',
                      WebkitBackdropFilter: isActive ? 'blur(4px) saturate(1.12) contrast(1.02)' : 'none',
                      border: isActive ? '1px solid rgba(0, 114, 206, 0.32)' : 'none',
                      cursor: 'pointer',
                      transition: 'transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 220ms, color 220ms',
                      color: isActive ? '#FFFFFF' : tokens.colors.label.primary,
                      minWidth: 'clamp(44px, 10vw, 52px)',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      boxShadow: isActive 
                        ? '0 8px 24px rgba(0,0,0,0.18)'
                        : 'none',
                      textShadow: isActive 
                        ? '0 1px 2px rgba(0, 0, 0, 0.2)'
                        : 'none'
                    }}
                  >
                    {Icon ? (
                      <Icon 
                        size={18} 
                        strokeWidth={isActive ? 2.5 : 2}
                        style={{
                          filter: isActive 
                            ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                            : 'none'
                        }}
                      />
                    ) : (
                      <img
                        src={(item as any).imageUrl}
                        alt={item.label}
                        loading="lazy"
                        style={{ height: '18px', width: 'auto', filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none' }}
                      />
                    )}
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
        </motion.div>
        
      </div>
    </motion.div>
    <AnimatePresence>
      {panelOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: 'rgba(0,0,0,0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setPanelOpen(false); }}
        >
        <motion.div
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1.0, y: 0, opacity: 1.0 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            maxWidth: 320,
            width: '100%',
            borderRadius: 24,
            background: 'linear-gradient(180deg, rgba(20,24,32,0.30) 0%, rgba(20,24,32,0.18) 100%), rgba(255,255,255,0.22)',
            backdropFilter: 'blur(40px) saturate(1.10) brightness(0.97) contrast(1.06)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.10) brightness(0.97) contrast(1.06)',
            border: '1px solid rgba(255,255,255,0.26)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 20px 48px rgba(0,0,0,0.28)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            position: 'relative',
            outline: 'none'
          }}
            role="menu"
            aria-label="Navigation menu"
            tabIndex={-1}
          >
            {panelRows.map((row, idx) => (
              <motion.button
                key={row.id}
                ref={(el) => { if (el) menuItemRefs.current[idx] = el; }}
                role="menuitem"
                aria-label={row.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); row.onClick(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.24)',
                  background: 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.20)' }}
              >
                <row.Icon size={20} strokeWidth={2} />
                <span style={{ fontSize: 18, fontWeight: 500, fontFamily: tokens.typography.families.text }}> {row.label} </span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>, document.body) : null
  );
};

export default LiquidPillNavigation;
export { LiquidPillNavigation };
