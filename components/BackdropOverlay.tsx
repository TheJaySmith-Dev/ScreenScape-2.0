import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppleTheme } from './AppleThemeProvider';

interface BackdropOverlayProps {
  backdropUrl: string;
  isVisible: boolean;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

const BackdropOverlay: React.FC<BackdropOverlayProps> = ({
  backdropUrl,
  isVisible,
  onLoad,
  onError,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { tokens } = useAppleTheme();

  useEffect(() => {
    if (!backdropUrl) return;

    setImageLoaded(false);
    setImageError(false);

    const img = new Image();
    
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
      onError?.();
    };
    
    img.src = backdropUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [backdropUrl, onLoad, onError]);

  if (!backdropUrl || imageError) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ 
            opacity: imageLoaded ? 0.8 : 0, 
            scale: imageLoaded ? 1 : 0.95,
            filter: imageLoaded ? 'blur(0px)' : 'blur(10px)'
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.95, 
            filter: 'blur(10px)',
            transition: { duration: 0.3, ease: 'easeOut' }
          }}
          transition={{ 
            duration: 0.4, 
            ease: 'easeOut',
            opacity: { duration: imageLoaded ? 0.4 : 0.2 }
          }}
          className={`absolute inset-0 -m-5 rounded-2xl overflow-hidden pointer-events-none ${className}`}
          style={{
            zIndex: -1,
            boxShadow: tokens ? `0 20px 40px ${tokens.colors.background.primary}60` : '0 20px 40px rgba(0,0,0,0.6)'
          }}
        >
          {/* Backdrop Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${backdropUrl})`,
              filter: 'brightness(0.7) contrast(1.1)'
            }}
          />
          
          {/* Liquid Glass Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: tokens ? 
                `linear-gradient(135deg, ${tokens.colors.background.primary}20, ${tokens.colors.background.secondary}40)` :
                'linear-gradient(135deg, rgba(0,0,0,0.2), rgba(26,26,26,0.4))',
              backdropFilter: 'blur(20px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
              border: tokens ? 
                `1px solid ${tokens.colors.accent.primary}20` :
                '1px solid rgba(0,122,255,0.2)'
            }}
          />
          
          {/* Gradient Overlay for Better Text Readability */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)'
            }}
          />
          
          {/* Loading Shimmer Effect */}
          {!imageLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{
                background: tokens ?
                  `linear-gradient(90deg, ${tokens.colors.background.secondary}40 0%, ${tokens.colors.background.primary}60 50%, ${tokens.colors.background.secondary}40 100%)` :
                  'linear-gradient(90deg, rgba(26,26,26,0.4) 0%, rgba(0,0,0,0.6) 50%, rgba(26,26,26,0.4) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackdropOverlay;