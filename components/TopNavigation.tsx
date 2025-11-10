import React from 'react';
import { motion } from 'framer-motion';
import { Settings, RefreshCw } from 'lucide-react';
import { useAppleTheme } from './AppleThemeProvider';

interface TopNavigationProps {
  onSettingsClick: () => void;
  onSyncClick: () => void;
  onImaxClick?: () => void;
  preferPerformance?: boolean;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onSettingsClick,
  onSyncClick,
  onImaxClick,
  preferPerformance = false
}) => {
  const { tokens } = useAppleTheme();

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={preferPerformance ? { type: 'tween', duration: 0.16 } : { 
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${tokens.spacing.micro[1]}px`,
          padding: `${tokens.spacing.micro[1]}px`,
          borderRadius: '20px',
          background: preferPerformance ? 'rgba(255,255,255,0.88)' : `rgba(255, 255, 255, ${tokens.materials.glass.prominent.opacity})`,
          backdropFilter: preferPerformance ? 'none' : `blur(${tokens.materials.glass.prominent.blur}px)`,
          WebkitBackdropFilter: preferPerformance ? 'none' : `blur(${tokens.materials.glass.prominent.blur}px)`,
          border: preferPerformance ? '1px solid rgba(255,255,255,0.66)' : `1px solid rgba(255, 255, 255, ${tokens.materials.glass.prominent.borderOpacity})`,
          boxShadow: preferPerformance ? '0 4px 14px rgba(0,0,0,0.18)' : `0 8px 32px rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity})`,
          pointerEvents: 'auto'
        }}
      >
        {/* IMAX logo (optional) */}
        {onImaxClick && (
          <button
            onClick={onImaxClick}
            aria-label="IMAX"
            title="IMAX"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              marginRight: `${tokens.spacing.micro[1]}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <img
              src={'https://i.ibb.co/G47CHyhg/toppng-com-imax-michael-jackson-thriller-imax-445x87.png'}
              alt="IMAX"
              loading="lazy"
              style={{ height: '20px', width: 'auto' }}
            />
          </button>
        )}
        {/* Sync Button */}
        <motion.button
          onClick={onSyncClick}
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
            background: preferPerformance ? 'rgba(255,255,255,0.9)' : `rgba(255, 255, 255, ${tokens.materials.glass.regular.opacity})`,
            backdropFilter: preferPerformance ? 'none' : `blur(${tokens.materials.glass.regular.blur}px)`,
            WebkitBackdropFilter: preferPerformance ? 'none' : `blur(${tokens.materials.glass.regular.blur}px)`,
            border: preferPerformance ? '1px solid rgba(255,255,255,0.66)' : `1px solid rgba(255, 255, 255, ${tokens.materials.glass.regular.borderOpacity})`,
            cursor: 'pointer',
            color: tokens.colors.label.primary,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <RefreshCw size={20} />
        </motion.button>

        {/* Settings Button */}
        <motion.button
          onClick={onSettingsClick}
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
            background: preferPerformance ? 'rgba(255,255,255,0.9)' : `rgba(255, 255, 255, ${tokens.materials.glass.regular.opacity})`,
            backdropFilter: preferPerformance ? 'none' : `blur(${tokens.materials.glass.regular.blur}px)`,
            WebkitBackdropFilter: preferPerformance ? 'none' : `blur(${tokens.materials.glass.regular.blur}px)`,
            border: preferPerformance ? '1px solid rgba(255,255,255,0.66)' : `1px solid rgba(255, 255, 255, ${tokens.materials.glass.regular.borderOpacity})`,
            cursor: 'pointer',
            color: tokens.colors.label.primary,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Settings size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TopNavigation;
