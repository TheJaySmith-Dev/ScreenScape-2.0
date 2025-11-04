/**
 * Browser Detection and Feature Support Utilities
 * For liquid-glass-react integration with fallback support
 */

export interface BrowserSupport {
  fullSupport: boolean;
  partialSupport: boolean;
  fallbackRequired: boolean;
  features: {
    backdropFilter: boolean;
    advancedBlending: boolean;
    webGL: boolean;
    performanceAPI: boolean;
  };
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  pixelRatio: number;
}

export interface PerformanceLevel {
  level: 'high' | 'medium' | 'low';
  canHandleAdvancedEffects: boolean;
  recommendedEffectScale: number;
}

/**
 * Detect browser support for liquid glass effects
 */
export function detectGlassSupport(): BrowserSupport {
  if (typeof window === 'undefined') {
    return {
      fullSupport: false,
      partialSupport: false,
      fallbackRequired: true,
      features: {
        backdropFilter: false,
        advancedBlending: false,
        webGL: false,
        performanceAPI: false,
      },
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
  const isEdge = userAgent.includes('edge');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  const isFirefox = userAgent.includes('firefox');

  // Feature detection
  const backdropFilter = CSS.supports('backdrop-filter', 'blur(10px)') || 
                        CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
  
  const advancedBlending = CSS.supports('mix-blend-mode', 'multiply');
  
  const webGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  })();

  const performanceAPI = 'performance' in window && 'mark' in performance;

  // Determine support level
  const fullSupport = (isChrome || isEdge) && backdropFilter && webGL;
  const partialSupport = (isSafari || isFirefox) && backdropFilter;
  const fallbackRequired = !backdropFilter;

  return {
    fullSupport,
    partialSupport,
    fallbackRequired,
    features: {
      backdropFilter,
      advancedBlending,
      webGL,
      performanceAPI,
    },
  };
}

/**
 * Detect device type and capabilities
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      pixelRatio: 1,
    };
  }

  const width = window.innerWidth;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const pixelRatio = window.devicePixelRatio || 1;

  let type: 'desktop' | 'tablet' | 'mobile';
  if (width < 768) {
    type = 'mobile';
  } else if (width < 1024) {
    type = 'tablet';
  } else {
    type = 'desktop';
  }

  return {
    type,
    isMobile: type === 'mobile',
    isTablet: type === 'tablet',
    isDesktop: type === 'desktop',
    hasTouch,
    pixelRatio,
  };
}

/**
 * Assess device performance level
 */
export function assessPerformanceLevel(): PerformanceLevel {
  if (typeof window === 'undefined') {
    return {
      level: 'medium',
      canHandleAdvancedEffects: false,
      recommendedEffectScale: 0.7,
    };
  }

  const device = detectDevice();
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  // Performance scoring
  let score = 0;

  // Device type scoring
  if (device.isDesktop) score += 3;
  else if (device.isTablet) score += 2;
  else score += 1;

  // Hardware scoring
  if (hardwareConcurrency >= 8) score += 2;
  else if (hardwareConcurrency >= 4) score += 1;

  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;

  // Pixel ratio penalty for high-DPI displays
  if (device.pixelRatio > 2) score -= 1;

  // Determine performance level
  let level: 'high' | 'medium' | 'low';
  let canHandleAdvancedEffects: boolean;
  let recommendedEffectScale: number;

  if (score >= 6) {
    level = 'high';
    canHandleAdvancedEffects = true;
    recommendedEffectScale = 1.0;
  } else if (score >= 3) {
    level = 'medium';
    canHandleAdvancedEffects = true;
    recommendedEffectScale = 0.8;
  } else {
    level = 'low';
    canHandleAdvancedEffects = false;
    recommendedEffectScale = 0.6;
  }

  return {
    level,
    canHandleAdvancedEffects,
    recommendedEffectScale,
  };
}

/**
 * Get optimal glass configuration based on device and performance
 */
export interface OptimalGlassConfig {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  aberrationIntensity: number;
  elasticity: number;
  mode: 'standard' | 'polar' | 'prominent' | 'shader';
}

export function getOptimalGlassConfig(
  deviceType: 'desktop' | 'tablet' | 'mobile',
  performanceLevel: 'high' | 'medium' | 'low'
): OptimalGlassConfig {
  const baseConfig = {
    displacementScale: 70,
    blurAmount: 0.0625,
    saturation: 140,
    aberrationIntensity: 2,
    elasticity: 0.15,
    mode: 'standard' as const,
  };

  // Performance adjustments
  const performanceMultipliers = {
    high: 1.0,
    medium: 0.8,
    low: 0.6,
  };

  // Device adjustments
  const deviceMultipliers = {
    desktop: 1.0,
    tablet: 0.9,
    mobile: 0.7,
  };

  const performanceMultiplier = performanceMultipliers[performanceLevel];
  const deviceMultiplier = deviceMultipliers[deviceType];
  const totalMultiplier = performanceMultiplier * deviceMultiplier;

  return {
    displacementScale: Math.round(baseConfig.displacementScale * totalMultiplier),
    blurAmount: baseConfig.blurAmount * totalMultiplier,
    saturation: Math.round(baseConfig.saturation * (0.8 + 0.2 * totalMultiplier)),
    aberrationIntensity: baseConfig.aberrationIntensity * totalMultiplier,
    elasticity: baseConfig.elasticity * totalMultiplier,
    mode: performanceLevel === 'high' ? 'prominent' : 'standard',
  };
}

/**
 * Check for accessibility preferences
 */
export interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersReducedTransparency: boolean;
  prefersHighContrast: boolean;
}

export function getAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') {
    return {
      prefersReducedMotion: false,
      prefersReducedTransparency: false,
      prefersHighContrast: false,
    };
  }

  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersReducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
  };
}

/**
 * Performance monitoring utilities
 */
export interface PerformanceMetrics {
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  interactionLatency: number;
}

export function measureGlassPerformance(
  componentId: string,
  callback: (metrics: PerformanceMetrics) => void
): () => void {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return () => {};
  }

  const startMark = `${componentId}-start`;
  const endMark = `${componentId}-end`;
  const measureName = `${componentId}-render`;

  performance.mark(startMark);

  let frameCount = 0;
  let lastTime = performance.now();
  let animationId: number;

  const measureFrame = () => {
    const currentTime = performance.now();
    frameCount++;

    if (currentTime - lastTime >= 1000) {
      const frameRate = frameCount;
      frameCount = 0;
      lastTime = currentTime;

      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      const measure = performance.getEntriesByName(measureName)[0];
      const renderTime = measure ? measure.duration : 0;

      const memoryUsage = (performance as any).memory 
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 
        : 0;

      callback({
        renderTime,
        frameRate,
        memoryUsage,
        interactionLatency: 0, // Will be measured separately for interactions
      });

      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    }

    animationId = requestAnimationFrame(measureFrame);
  };

  animationId = requestAnimationFrame(measureFrame);

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  };
}