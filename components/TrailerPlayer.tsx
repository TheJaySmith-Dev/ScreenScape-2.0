import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useAppleTheme } from './AppleThemeProvider';

interface TrailerPlayerProps {
  trailerUrl: string;
  isVisible: boolean;
  autoplayDelay?: number;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

const TrailerPlayer: React.FC<TrailerPlayerProps> = ({
  trailerUrl,
  isVisible,
  autoplayDelay = 2000,
  onLoad,
  onError,
  className = ''
}) => {
  // Iframe-based embed, so local play/mute controls are not needed
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout>();
  const { tokens } = useAppleTheme();

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = useCallback((url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Handle autoplay with delay; only render iframe once autoplay should start
  useEffect(() => {
    if (isVisible && trailerUrl && !prefersReducedMotion()) {
      autoplayTimeoutRef.current = setTimeout(() => {
        setShouldAutoplay(true);
      }, autoplayDelay);
    } else {
      setShouldAutoplay(false);
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    }

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, [isVisible, trailerUrl, autoplayDelay, prefersReducedMotion]);

  // Mark loaded on iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Soft error detection: if iframe hasn't loaded after 5s
  useEffect(() => {
    if (!isVisible || !shouldAutoplay || !trailerUrl) return;
    const t = setTimeout(() => {
      if (!isLoaded) {
        setHasError(true);
        onError?.();
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [isVisible, shouldAutoplay, trailerUrl, isLoaded, onError]);

  // No interactive controls for iframe hover
  const handleMouseEnter = useCallback(() => {}, []);
  const handleMouseLeave = useCallback(() => {}, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, []);

  if (!trailerUrl || hasError) return null;

  const videoId = getYouTubeVideoId(trailerUrl);
  if (!videoId) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`absolute inset-0 rounded-xl overflow-hidden ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ zIndex: 10 }}
        >
          {/* YouTube Iframe Embed using nocookie domain */}
          {shouldAutoplay && (
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`}
              title="YouTube video player"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={handleIframeLoad}
            />
          )}

          {/* Loading Overlay */}
          {!isLoaded && !hasError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: tokens ?
                  `linear-gradient(135deg, ${tokens.colors.background.secondary}60, ${tokens.colors.background.primary}80)` :
                  'linear-gradient(135deg, rgba(26,26,26,0.6), rgba(0,0,0,0.8))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </motion.div>
          )}

          {/* Controls overlay omitted for iframe embed */}

          {/* Accessibility: Screen reader info */}
          <div className="sr-only">Trailer video iframe embedded</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrailerPlayer;
