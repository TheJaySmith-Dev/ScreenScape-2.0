/**
 * Device Capabilities Detection for Liquid Glass Effects
 * Provides performance-based rendering decisions and browser compatibility checks
 */

export interface DeviceCapabilities {
  supportsBackdropFilter: boolean;
  supportsWebGL: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  prefersReducedMotion: boolean;
  prefersReducedTransparency: boolean;
  isMobile: boolean;
  browserSupport: 'full' | 'partial' | 'none';
  scaleFactor: number;
}

/**
 * Detects device capabilities for optimal liquid glass rendering
 */
export const detectDeviceCapabilities = (): DeviceCapabilities => {
  // Browser detection
  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
  const isEdge = userAgent.includes('edge');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  const isFirefox = userAgent.includes('firefox');

  // Browser support levels
  let browserSupport: 'full' | 'partial' | 'none' = 'none';
  if (isChrome || isEdge) {
    browserSupport = 'full';
  } else if (isSafari || isFirefox) {
    browserSupport = 'partial';
  }

  // Backdrop filter support
  const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') || 
                                 CSS.supports('-webkit-backdrop-filter', 'blur(1px)');

  // WebGL support detection
  let supportsWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    supportsWebGL = !!gl;
  } catch (e) {
    supportsWebGL = false;
  }

  // Mobile detection
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                   window.innerWidth <= 768;

  // Performance level detection
  let performanceLevel: 'low' | 'medium' | 'high' = 'medium';
  
  // Hardware concurrency as performance indicator
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  
  if (cores >= 8 && memory >= 8 && supportsWebGL && !isMobile) {
    performanceLevel = 'high';
  } else if (cores >= 4 && memory >= 4 && supportsBackdropFilter) {
    performanceLevel = 'medium';
  } else {
    performanceLevel = 'low';
  }

  // User preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;

  // Scale factor based on device type and performance
  let scaleFactor = 1.0;
  if (isMobile) {
    scaleFactor = performanceLevel === 'high' ? 0.7 : performanceLevel === 'medium' ? 0.5 : 0.3;
  } else {
    scaleFactor = performanceLevel === 'high' ? 1.0 : performanceLevel === 'medium' ? 0.9 : 0.7;
  }

  return {
    supportsBackdropFilter,
    supportsWebGL,
    performanceLevel,
    prefersReducedMotion,
    prefersReducedTransparency,
    isMobile,
    browserSupport,
    scaleFactor,
  };
};

/**
 * React hook for device capabilities
 */
export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = React.useState<DeviceCapabilities>(() => 
    detectDeviceCapabilities()
  );

  React.useEffect(() => {
    // Listen for media query changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');

    const handleMotionChange = () => {
      setCapabilities(prev => ({
        ...prev,
        prefersReducedMotion: motionQuery.matches,
      }));
    };

    const handleTransparencyChange = () => {
      setCapabilities(prev => ({
        ...prev,
        prefersReducedTransparency: transparencyQuery.matches,
      }));
    };

    motionQuery.addEventListener('change', handleMotionChange);
    transparencyQuery.addEventListener('change', handleTransparencyChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      transparencyQuery.removeEventListener('change', handleTransparencyChange);
    };
  }, []);

  return capabilities;
};

// Import React for the hook
import React from 'react';