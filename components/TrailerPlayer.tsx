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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout>();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
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

  // Handle autoplay with delay
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

  // Handle video play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldAutoplay) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        onLoad?.();
      } catch (error) {
        console.warn('Autoplay failed:', error);
        setHasError(true);
        onError?.();
      }
    };

    if (isLoaded && shouldAutoplay) {
      playVideo();
    }
  }, [isLoaded, shouldAutoplay, onLoad, onError]);

  // Handle video events
  const handleVideoLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleVideoError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  }, [onError]);

  const handlePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.warn('Play/pause failed:', error);
    }
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
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
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            style={{
              filter: 'brightness(0.8) contrast(1.1)',
            }}
          >
            <source 
              src={`https://www.youtube.com/watch?v=${videoId}`} 
              type="video/mp4" 
            />
            {/* Fallback for browsers that don't support video */}
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Play className="w-12 h-12 text-white opacity-50" />
            </div>
          </video>

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

          {/* Controls Overlay */}
          <AnimatePresence>
            {showControls && isLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)'
                }}
              >
                {/* Play/Pause Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayPause}
                  className="p-3 rounded-full"
                  style={{
                    background: tokens ?
                      `rgba(${tokens.colors.background.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(',') || '0,0,0'}, 0.7)` :
                      'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" />
                  )}
                </motion.button>

                {/* Bottom Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  {/* Mute Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMuteToggle}
                    className="p-2 rounded-full"
                    style={{
                      background: tokens ?
                        `rgba(${tokens.colors.background.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(',') || '0,0,0'}, 0.7)` :
                        'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </motion.button>

                  {/* Fullscreen Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }}
                    className="p-2 rounded-full"
                    style={{
                      background: tokens ?
                        `rgba(${tokens.colors.background.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(',') || '0,0,0'}, 0.7)` :
                        'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    aria-label="Enter fullscreen"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Accessibility: Screen reader info */}
          <div className="sr-only">
            {isPlaying ? 'Video is playing' : 'Video is paused'}
            {isMuted ? ', muted' : ', unmuted'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrailerPlayer;