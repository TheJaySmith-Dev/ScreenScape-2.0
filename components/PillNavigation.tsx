import React from 'react';
import { motion } from 'framer-motion';
import { Search, Home, Tv, Gamepad2, Heart, Settings, RefreshCw } from 'lucide-react';
import { ViewType } from '../App';
import { useAppleTheme } from './AppleThemeProvider';

interface PillNavigationProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onSearchClick?: () => void;
}

const PillNavigation: React.FC<PillNavigationProps> = ({
  view,
  setView,
  onSearchClick
}) => {
  const { tokens } = useAppleTheme();

  const navigationItems = [
    { id: 'screenSearch' as ViewType, icon: Home, label: 'Home' },
    { id: 'search' as ViewType, icon: Search, label: 'Search', isSearchButton: true },
    { id: 'live' as ViewType, icon: Tv, label: 'Live' },
    { id: 'likes' as ViewType, icon: Heart, label: 'Likes' },
    { id: 'game' as ViewType, icon: Gamepad2, label: 'Games' },
    { id: 'settings' as ViewType, icon: Settings, label: 'Settings' },
    { id: 'sync' as ViewType, icon: RefreshCw, label: 'Sync' },
    { id: 'prototype' as ViewType, icon: RefreshCw, label: 'Prototype' },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: 0.1 
      }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: `0 ${tokens.spacing.standard[1]}px ${tokens.spacing.standard[1]}px`,
        paddingBottom: `calc(${tokens.spacing.standard[1]}px + env(safe-area-inset-bottom))`,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'min(800px, calc(100vw - 16px))',
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
            gap: `${tokens.spacing.micro[1]}px`,
            padding: `${tokens.spacing.micro[1]}px`,
            borderRadius: `${tokens.borderRadius.xxlarge}px`,
            background: `rgba(255, 255, 255, ${tokens.materials.glass.prominent.opacity})`,
            backdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
            WebkitBackdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
            border: `1px solid rgba(255, 255, 255, ${tokens.materials.glass.prominent.borderOpacity})`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity})`,
            minHeight: '64px',
            width: 'auto',
            maxWidth: '600px'
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
              alignItems: 'center'
            }}
          >
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    if (item.isSearchButton && onSearchClick) {
                      onSearchClick();
                    } else {
                      setView(item.id);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                    padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.micro[2]}px`,
                    borderRadius: '50%',
                    background: isActive 
                      ? `linear-gradient(135deg, ${tokens.colors.system.blue}E6 0%, ${tokens.colors.system.indigo}E6 100%)`
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: 'white',
                    minWidth: 'clamp(48px, 12vw, 56px)',
                    // Enhanced Material Design with blur effect
                    backdropFilter: isActive ? 'blur(2px)' : 'none',
                    WebkitBackdropFilter: isActive ? 'blur(2px)' : 'none',
                    boxShadow: isActive 
                      ? `0 4px 20px rgba(${tokens.colors.system.blue.replace('#', '')}, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                      : 'none',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Material Design Ripple Effect */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 0.3 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)`,
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                  
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{
                      filter: isActive ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' : 'none',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                  <span style={{
                    fontSize: `${tokens.typography.sizes.caption2}px`,
                    fontWeight: isActive ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                    fontFamily: tokens.typography.families.text,
                    lineHeight: 1,
                    textShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>
    </motion.div>
  );
};

export default PillNavigation;