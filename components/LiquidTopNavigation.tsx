/**
 * LiquidTopNavigation Component
 * Enhanced TopNavigation with liquid glass effects
 * Maintains existing API while adding liquid glass enhancements
 */

import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, RefreshCw } from 'lucide-react';
import { useAppleTheme } from './AppleThemeProvider';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import { defaultLiquidVisualTuning } from '../utils/liquidGlassUserTuning';

interface LiquidTopNavigationProps {
  onSettingsClick: () => void;
  onSyncClick: () => void;
  // Liquid Glass Enhancement Props
  liquidIntensity?: 'subtle' | 'medium' | 'prominent';
  refractionMode?: 'standard' | 'polar' | 'prominent' | 'shader';
  enableLiquidEffects?: boolean;
}

const LiquidTopNavigation: React.FC<LiquidTopNavigationProps> = ({
  onSettingsClick,
  onSyncClick,
  liquidIntensity = 'prominent',
  refractionMode = 'standard',
  enableLiquidEffects = true
}) => {
  const { tokens } = useAppleTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced click handlers with haptic feedback
  const handleSettingsClick = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onSettingsClick();
  }, [onSettingsClick]);

  const handleSyncClick = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onSyncClick();
  }, [onSyncClick]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: 0.1 
      }}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 50,
        padding: `${tokens.spacing.standard[1]}px`,
        paddingTop: `calc(${tokens.spacing.standard[1]}px + env(safe-area-inset-top))`,
        pointerEvents: 'none'
      }}
    >
      <LiquidGlassWrapper
        componentType="navigation"
        intensity={liquidIntensity}
        mode={refractionMode}
        enableEffects={enableLiquidEffects}
        mouseContainer={containerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${tokens.spacing.micro[1]}px`,
          padding: `${tokens.spacing.micro[1]}px`,
          borderRadius: '20px',
          pointerEvents: 'auto',
          // Fallback styles for non-liquid glass browsers
          background: `rgba(255, 255, 255, ${tokens.materials.glass.prominent.opacity})`,
          backdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
          WebkitBackdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
          border: `1px solid rgba(255, 255, 255, ${tokens.materials.glass.prominent.borderOpacity})`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity})`
        }}
      >
        {/* Sync Button */}
        <LiquidGlassWrapper
          componentType="button"
          intensity="medium"
          mode="polar"
          enableEffects={enableLiquidEffects}
          mouseContainer={containerRef}
          visualTuning={defaultLiquidVisualTuning}
        >
          <motion.button
            onClick={handleSyncClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Sync settings"
            title="Sync settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: `${tokens.borderRadius.large}px`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tokens.colors.label.primary,
              transition: `all ${tokens.liquidGlass.animations.duration.medium} ${tokens.liquidGlass.animations.elasticTiming}`,
              // Fallback for non-liquid glass
              backgroundColor: `rgba(255, 255, 255, ${tokens.materials.glass.regular.opacity})`,
              backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
              WebkitBackdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`
            }}
          >
            <RefreshCw size={20} />
          </motion.button>
        </LiquidGlassWrapper>

        {/* Settings Button */}
        <LiquidGlassWrapper
          componentType="button"
          intensity="medium"
          mode="polar"
          enableEffects={enableLiquidEffects}
          mouseContainer={containerRef}
          visualTuning={defaultLiquidVisualTuning}
        >
          <motion.button
            onClick={handleSettingsClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open settings"
            title="Open settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: `${tokens.borderRadius.large}px`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tokens.colors.label.primary,
              transition: `all ${tokens.liquidGlass.animations.duration.medium} ${tokens.liquidGlass.animations.elasticTiming}`,
              // Fallback for non-liquid glass
              backgroundColor: `rgba(255, 255, 255, ${tokens.materials.glass.regular.opacity})`,
              backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
              WebkitBackdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`
            }}
          >
            <Settings size={20} />
          </motion.button>
        </LiquidGlassWrapper>
      </LiquidGlassWrapper>
    </motion.div>
  );
};

export default LiquidTopNavigation;
export { LiquidTopNavigation };