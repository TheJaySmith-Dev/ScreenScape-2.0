/**
 * LiquidPillNavigation Component
 * Enhanced PillNavigation with liquid glass effects
 * Maintains existing API while adding liquid glass enhancements
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Search, Home, Tv, Gamepad2, Heart, RefreshCw, Tag, Menu, Coins, Image as ImageIcon } from 'lucide-react';
import { ViewType } from '../App';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  // Use portal to ensure global positioning above content
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

  // Moderate, responsive visual tuning to avoid excessive curvature
  const aggressiveTuning = useMemo(() => {
    const coverage = occlusion?.panelCoverageRatio ?? 0; // 0..1 portion of pill bar covered
    const speed = Math.min(2000, Math.abs(velocityY)); // px/s
    const speed01 = Math.min(1, speed / 1200);
    const isPortrait = typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : false;

    const thickness = (isPortrait ? 30.0 : 32.0) + coverage * 4.0 + speed01 * 2.0;
    const refractionFactor = 1.56 + coverage * 0.04 + speed01 * 0.03; // ~1.56-1.63
    const dispersionGain = 12.0 * (0.8 + 0.2 * speed01);
    const blurRadius = 0.03;
    const glareIntensity = 28.0 + coverage * 8.0; // softer glare
    const fresnelIntensity = 18.0 + speed01 * 6.0; // subtle rim

    return {
      ...defaultLiquidVisualTuning,
      thickness,
      refractionFactor,
      dispersionGain,
      blurRadius,
      glareIntensity,
      fresnelIntensity,
      shadowIntensity: 6.0,
      shadowPosition: { x: 0, y: 8 },
      shadowExpand: 14.0,
      glareAngle: 24.0,
      glareSize: 28.0,
      fresnelSize: 26.0,
      fresnelHardness: 16.0,
    };
  }, [occlusion?.panelCoverageRatio, velocityY]);

  // Subtle underlay tuning for a slight liquid effect behind the bar
  const underlayTuning = useMemo(() => {
    return {
      ...defaultLiquidVisualTuning,
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
      shadowExpand: 18.0,
      shadowIntensity: 16.0,
      shadowPosition: { x: 0, y: 10 },
    };
  }, []);
  const HOME_ICON_DATA_URL = useMemo(() => {
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DADADA"/>
            <stop offset="50%" stop-color="#9E9E9E"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
        </defs>
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>`
    );
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  const HEART_ICON_DATA_URL = useMemo(() => {
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#stroke)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <defs>
          <linearGradient id="stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DADADA"/>
            <stop offset="50%" stop-color="#9E9E9E"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F3F3F3"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
        </defs>
        <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" fill="url(#fill)" />
      </svg>`
    );
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  const APPS_ICON_DATA_URL = useMemo(() => {
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#stroke)" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round">
        <defs>
          <linearGradient id="stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DADADA"/>
            <stop offset="50%" stop-color="#9E9E9E"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F3F3F3"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
        </defs>
        <rect x="3" y="3" rx="5" ry="5" width="18" height="18" fill="url(#fill)" stroke="url(#stroke)" />
        <rect x="7" y="7" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="11" y="7" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="15" y="7" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="7" y="11" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="11" y="11" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="15" y="11" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="7" y="15" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="11" y="15" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
        <rect x="15" y="15" rx="2.5" ry="2.5" width="3" height="3" fill="#EDEDED" />
      </svg>`
    );
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  const SYNC_ICON_DATA_URL = useMemo(() => {
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F3F3F3"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
          <linearGradient id="stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DADADA"/>
            <stop offset="50%" stop-color="#9E9E9E"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="url(#fill)" stroke="url(#stroke)" />
        <rect x="6.5" y="8" width="5.2" height="7" rx="1" stroke="#6A6A6A" stroke-width="1.4" />
        <rect x="12.8" y="7" width="4.7" height="8.6" rx="1" stroke="#6A6A6A" stroke-width="1.4" />
        <path d="M12.3 12a3.6 3.6 0 0 1 3.4-2.6" stroke="#6A6A6A" stroke-width="1.4" fill="none"/>
        <path d="M12.3 12a3.6 3.6 0 0 0-3.4 2.6" stroke="#6A6A6A" stroke-width="1.4" fill="none"/>
        <path d="M15.8 9.4l-.9 1.7h2.1" stroke="#6A6A6A" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.2 14.6l.9-1.7H7" stroke="#6A6A6A" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    );
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  const syncIconUrl = useMemo(() => {
    try {
      const runtime = (window as any)?.__attachedSyncIconUrl;
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('syncIconUrl') : null;
      const u = runtime || stored;
      if (typeof u === 'string' && u.length > 0) return u;
    } catch {}
    return SYNC_ICON_DATA_URL;
  }, [SYNC_ICON_DATA_URL]);

  const SETTINGS_ICON_DATA_URL = useMemo(() => {
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="none">
        <defs>
          <linearGradient id="gearStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DADADA"/>
            <stop offset="50%" stop-color="#9E9E9E"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
        </defs>
        <g stroke="url(#gearStroke)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8z" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </g>
      </svg>`
    );
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  const LIVE_ICON_DATA_URL = useMemo(() => {
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DADADA"/>
            <stop offset="50%" stop-color="#9E9E9E"/>
            <stop offset="100%" stop-color="#E6E6E6"/>
          </linearGradient>
        </defs>
        <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>`
    );
    return `data:image/svg+xml;utf8,${svg}`;
  }, []);

  const navigationItems = [
    { id: 'screenSearch' as ViewType, label: 'Home', imageUrl: HOME_ICON_DATA_URL },
    { id: 'live' as ViewType, label: 'Live', imageUrl: LIVE_ICON_DATA_URL },
    { id: 'likes' as ViewType, label: 'Likes', imageUrl: HEART_ICON_DATA_URL },
    { id: 'sync' as ViewType, label: 'Sync', imageUrl: syncIconUrl },
    { id: 'settings' as ViewType, label: 'Settings', imageUrl: SETTINGS_ICON_DATA_URL },
    { id: 'apps' as ViewType, label: 'Apps', imageUrl: APPS_ICON_DATA_URL },
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
    { id: 'choice', label: 'Choice (Text/Image)', Icon: ImageIcon, onClick: () => { try { window.dispatchEvent(new Event('openChoiceGPT')); } catch {} setPanelOpen(false); } },
    { id: 'coffee', label: 'Buy Me A Coffee', Icon: Tag, onClick: () => { try { window.open('https://buymeacoffee.com/jasonforreels', '_blank', 'noopener,noreferrer'); } catch {} setPanelOpen(false); } },
    { id: 'billionaire', label: 'Billionaire Sandbox', Icon: Coins, onClick: () => { try { navigate('/play/billionaire-sandbox'); } catch {} setPanelOpen(false); } },
    { id: 'game', label: 'Games', Icon: Gamepad2, onClick: () => { setView('game'); setPanelOpen(false); } },
    { id: 'live', label: 'Live', Icon: Tv, onClick: () => { setView('live'); setPanelOpen(false); } },
    { id: 'appsPage', label: 'Apps', Icon: Menu, onClick: () => { setView('apps' as ViewType); setPanelOpen(false); } },
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
    createPortal(
    <>
    <motion.div
      ref={containerRef}
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.6, delay: 0.08 }}
      style={{
        position: 'fixed',
        bottom: `calc(${tokens.spacing.standard[2]}px + env(safe-area-inset-bottom, 0px))`,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 200000,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'auto',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px',
            borderRadius: '9999px',
            position: 'relative',
            minHeight: '44px',
            width: 'auto',
            maxWidth: 'min(800px, calc(100vw - 24px))',
            background: 'linear-gradient(180deg, rgba(20,24,32,0.30) 0%, rgba(20,24,32,0.22) 100%)',
            backdropFilter: 'blur(16px) saturate(1.06) brightness(0.98) contrast(1.04)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.06) brightness(0.98) contrast(1.04)',
            border: '1px solid rgba(255,255,255,0.28)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            opacity: 1,
            visibility: 'visible',
          }}
        >
          <motion.div
            ref={navBarRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: 0,
              borderRadius: 'inherit',
              position: 'relative',
              minHeight: '44px',
              width: 'auto',
              maxWidth: 'min(800px, calc(100vw - 24px))',
              transformOrigin: 'center',
              willChange: 'transform',
              scaleX: navScaleX as any
            }}
          >
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
                        borderRadius: isActive ? 'inherit' : '12px',
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
                      <img
                        src={(item as any).imageUrl}
                        alt={item.label}
                        loading="lazy"
                        style={{ height: '24px', width: 'auto' }}
                      />
                    </motion.button>
                  </motion.div>
                );
              }

              return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      const custom = (item as any).onClick as undefined | (() => void);
                      if (typeof custom === 'function') {
                        custom();
                        return;
                      }
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
                        ? 'linear-gradient(180deg, rgba(20,24,32,0.30) 0%, rgba(20,24,32,0.22) 100%)'
                        : 'transparent',
                      backdropFilter: isActive ? 'blur(10px) saturate(1.06) brightness(0.98) contrast(1.04)' : 'none',
                      WebkitBackdropFilter: isActive ? 'blur(10px) saturate(1.06) brightness(0.98) contrast(1.04)' : 'none',
                      border: isActive ? '1px solid rgba(255,255,255,0.28)' : 'none',
                      cursor: 'pointer',
                      transition: 'transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 220ms, color 220ms',
                      color: isActive ? '#FFFFFF' : tokens.colors.label.primary,
                      minWidth: 'clamp(44px, 10vw, 52px)',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      boxShadow: isActive 
                        ? '0 10px 28px rgba(0,0,0,0.18)'
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
                        style={{ height: (item.id === 'screenSearch' || item.id === 'likes' || item.id === 'sync' || item.id === 'settings' || item.id === 'apps') ? '22px' : '18px', width: 'auto', filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none' }}
                      />
                    )}
                    {(item.id !== 'screenSearch' && item.id !== 'likes' && item.id !== 'sync' && item.id !== 'settings' && item.id !== 'apps') && (
                      <span style={{
                        fontSize: `${tokens.typography.sizes.caption2}px`,
                        fontWeight: isActive ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                        fontFamily: tokens.typography.families.text,
                        lineHeight: 1
                      }}>
                        {item.label}
                      </span>
                    )}
                  </motion.button>
              );
            })}
          </nav>
          </motion.div>
        </div>
        
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
            maxWidth: 520,
            width: '100%',
            borderRadius: 24,
            background: 'linear-gradient(180deg, rgba(20,24,32,0.30) 0%, rgba(20,24,32,0.18) 100%), rgba(255,255,255,0.22)',
            backdropFilter: 'blur(40px) saturate(1.10) brightness(0.97) contrast(1.06)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.10) brightness(0.97) contrast(1.06)',
            border: '1px solid rgba(255,255,255,0.26)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 20px 48px rgba(0,0,0,0.28)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            outline: 'none'
          }}
            role="menu"
            aria-label="Navigation menu"
            tabIndex={-1}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#FFFFFF',
                fontFamily: tokens.typography.families.display
              }}>Launchpad</span>
              <button
                onClick={() => setPanelOpen(false)}
                aria-label="Close Launchpad"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 12
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 12px',
                  minHeight: 112,
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.24)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.18)', scale: 1.03 }}
              >
                <row.Icon size={28} strokeWidth={2.2} />
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: tokens.typography.families.text, opacity: 0.9 }}> {row.label} </span>
              </motion.button>
            ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>, document.body)
  );
};

export default LiquidPillNavigation;
export { LiquidPillNavigation };
