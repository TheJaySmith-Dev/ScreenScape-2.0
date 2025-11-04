import React from 'react';
import { motion } from 'framer-motion';
import { Settings, RefreshCw } from 'lucide-react';
import { useAppleTheme } from './AppleThemeProvider';

interface TopNavigationProps {
  onSettingsClick: () => void;
  onSyncClick: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onSettingsClick,
  onSyncClick
}) => {
  const { tokens } = useAppleTheme();

  return (
    <motion.div
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${tokens.spacing.micro[1]}px`,
          padding: `${tokens.spacing.micro[1]}px`,
          borderRadius: '20px',
          background: `rgba(255, 255, 255, ${tokens.materials.glass.prominent.opacity})`,
          backdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
          WebkitBackdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
          border: `1px solid rgba(255, 255, 255, ${tokens.materials.glass.prominent.borderOpacity})`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity})`,
          pointerEvents: 'auto'
        }}
      >
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
            background: `rgba(255, 255, 255, ${tokens.materials.glass.regular.opacity})`,
            backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
            WebkitBackdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
            border: `1px solid rgba(255, 255, 255, ${tokens.materials.glass.regular.borderOpacity})`,
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
            background: `rgba(255, 255, 255, ${tokens.materials.glass.regular.opacity})`,
            backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
            WebkitBackdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
            border: `1px solid rgba(255, 255, 255, ${tokens.materials.glass.regular.borderOpacity})`,
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