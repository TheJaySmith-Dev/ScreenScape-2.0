import React from 'react';
import { motion } from 'framer-motion';
import { Settings, RefreshCw } from 'lucide-react';
import { useAppleTheme } from './AppleThemeProvider';

interface TopNavigationProps {
  onSettingsClick: () => void;
  onSyncClick: () => void;
  onImaxClick?: () => void;
  onChoiceBotClick?: () => void;
  onBoxOfficeClick?: () => void;
  preferPerformance?: boolean;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onSettingsClick,
  onSyncClick,
  onImaxClick,
  onChoiceBotClick,
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
          flexWrap: 'wrap',
          rowGap: `${tokens.spacing.micro[1]}px`,
          padding: `${tokens.spacing.micro[1]}px`,
          borderRadius: '24px',
          background: preferPerformance ? 'rgba(255,255,255,0.88)' : tokens.materials.pill.primary.background,
          backdropFilter: preferPerformance ? 'none' : tokens.materials.pill.primary.backdropFilter,
          WebkitBackdropFilter: preferPerformance ? 'none' : tokens.materials.pill.primary.backdropFilter,
          border: preferPerformance ? '1px solid rgba(255,255,255,0.66)' : `1px solid ${tokens.materials.pill.primary.border}`,
          boxShadow: preferPerformance ? '0 4px 14px rgba(0,0,0,0.18)' : tokens.materials.pill.primary.shadow,
          pointerEvents: 'auto',
          maxWidth: 'calc(100vw - 32px)'
        }}
      >
        {/* IMAX logo (optional) */}
        {onImaxClick && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '44px',
              padding: `0 ${tokens.spacing.micro[1]}px`,
              borderRadius: `${tokens.borderRadius.large}px`,
              background: 'rgba(0, 114, 206, 0.18)',
              backdropFilter: preferPerformance ? 'none' : 'blur(4px) saturate(1.12) contrast(1.02)',
              WebkitBackdropFilter: preferPerformance ? 'none' : 'blur(4px) saturate(1.12) contrast(1.02)',
              border: '1px solid rgba(0, 114, 206, 0.32)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              boxSizing: 'border-box'
            }}
          >
            <button
              onClick={onImaxClick}
              aria-label="IMAX"
              title="IMAX"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
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
          </div>
        )}


        

        
      </div>
    </motion.div>
  );
};

export default TopNavigation;
