/**
 * Browser Compatibility Utilities for Liquid Glass Integration
 * Provides fallbacks and compatibility checks for different browsers
 */

export interface BrowserInfo {
  name: string;
  version: number;
  engine: string;
  supportsBackdropFilter: boolean;
  supportsWebGL: boolean;
  supportsIntersectionObserver: boolean;
  supportsResizeObserver: boolean;
  supportsMatchMedia: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
}

/**
 * Detects browser information and capabilities
 */
export const detectBrowser = (): BrowserInfo => {
  const userAgent = navigator.userAgent;
  let name = 'unknown';
  let version = 0;
  let engine = 'unknown';

  // Detect browser name and version
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
    engine = 'blink';
  } else if (userAgent.includes('Firefox')) {
    name = 'firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
    engine = 'gecko';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
    engine = 'webkit';
  } else if (userAgent.includes('Edg')) {
    name = 'edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
    engine = 'blink';
  }

  // Check feature support
  const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') || 
                                 CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  
  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  })();

  const supportsIntersectionObserver = 'IntersectionObserver' in window;
  const supportsResizeObserver = 'ResizeObserver' in window;
  const supportsMatchMedia = 'matchMedia' in window;

  // Determine performance level based on browser and version
  let performanceLevel: 'low' | 'medium' | 'high' = 'medium';
  
  if (name === 'chrome' && version >= 90) {
    performanceLevel = 'high';
  } else if (name === 'firefox' && version >= 85) {
    performanceLevel = 'medium';
  } else if (name === 'safari' && version >= 14) {
    performanceLevel = 'medium';
  } else if (name === 'edge' && version >= 90) {
    performanceLevel = 'high';
  } else {
    performanceLevel = 'low';
  }

  return {
    name,
    version,
    engine,
    supportsBackdropFilter,
    supportsWebGL,
    supportsIntersectionObserver,
    supportsResizeObserver,
    supportsMatchMedia,
    performanceLevel
  };
};

/**
 * Gets browser-specific CSS fallbacks
 */
export const getBrowserFallbacks = (browserInfo: BrowserInfo) => {
  const fallbacks: Record<string, any> = {};

  // Backdrop filter fallbacks
  if (!browserInfo.supportsBackdropFilter) {
    fallbacks.backdropFilter = {
      background: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    };
  }

  // Firefox-specific adjustments
  if (browserInfo.name === 'firefox') {
    fallbacks.firefox = {
      // Firefox has different backdrop-filter behavior
      backdropFilter: 'blur(8px)',
      background: 'rgba(255, 255, 255, 0.7)'
    };
  }

  // Safari-specific adjustments
  if (browserInfo.name === 'safari') {
    fallbacks.safari = {
      // Safari needs -webkit prefix for some properties
      WebkitBackdropFilter: 'blur(10px)',
      background: 'rgba(255, 255, 255, 0.75)'
    };
  }

  // Low performance browser adjustments
  if (browserInfo.performanceLevel === 'low') {
    fallbacks.lowPerformance = {
      transition: 'none',
      animation: 'none',
      backdropFilter: 'none',
      background: 'rgba(255, 255, 255, 0.9)'
    };
  }

  return fallbacks;
};

/**
 * Applies browser-specific optimizations to liquid glass config
 */
export const applyBrowserOptimizations = (
  config: any,
  browserInfo: BrowserInfo
): any => {
  if (!config) return config;

  const optimizedConfig = { ...config };

  switch (browserInfo.name) {
    case 'firefox':
      // Firefox has limited backdrop-filter support
      optimizedConfig.blur = Math.min(optimizedConfig.blur || 0, 0.05);
      optimizedConfig.displacement = Math.min(optimizedConfig.displacement || 0, 30);
      optimizedConfig.enableComplexEffects = false;
      break;

    case 'safari':
      // Safari has good backdrop-filter support but different behavior
      optimizedConfig.blur = Math.min(optimizedConfig.blur || 0, 0.15);
      optimizedConfig.elasticity = Math.min(optimizedConfig.elasticity || 0, 0.25);
      break;

    case 'chrome':
    case 'edge':
      // Chromium browsers have the best support
      if (browserInfo.version >= 90) {
        // Full feature support
        break;
      } else {
        // Older versions need reduced effects
        optimizedConfig.displacement = Math.min(optimizedConfig.displacement || 0, 50);
        optimizedConfig.enableComplexEffects = false;
      }
      break;

    default:
      // Unknown browser - use conservative settings
      optimizedConfig.elasticity = Math.min(optimizedConfig.elasticity || 0, 0.1);
      optimizedConfig.displacement = Math.min(optimizedConfig.displacement || 0, 20);
      optimizedConfig.blur = Math.min(optimizedConfig.blur || 0, 0.05);
      optimizedConfig.enableComplexEffects = false;
  }

  // Performance-based adjustments
  if (browserInfo.performanceLevel === 'low') {
    optimizedConfig.elasticity = 0;
    optimizedConfig.displacement = 0;
    optimizedConfig.blur = 0;
    optimizedConfig.enableEffects = false;
  }

  return optimizedConfig;
};

/**
 * Polyfill for IntersectionObserver if not supported
 */
export const polyfillIntersectionObserver = (): void => {
  if ('IntersectionObserver' in window) return;

  // Simple polyfill that assumes everything is visible
  (window as any).IntersectionObserver = class {
    constructor(callback: Function) {
      this.callback = callback;
    }

    observe(element: Element) {
      // Immediately call callback with visible state
      setTimeout(() => {
        this.callback([{
          isIntersecting: true,
          intersectionRatio: 1,
          target: element
        }]);
      }, 0);
    }

    unobserve() {}
    disconnect() {}
  };
};

/**
 * Polyfill for ResizeObserver if not supported
 */
export const polyfillResizeObserver = (): void => {
  if ('ResizeObserver' in window) return;

  // Simple polyfill using window resize events
  (window as any).ResizeObserver = class {
    constructor(callback: Function) {
      this.callback = callback;
      this.elements = new Set();
    }

    observe(element: Element) {
      this.elements.add(element);
      if (this.elements.size === 1) {
        window.addEventListener('resize', this.handleResize);
      }
    }

    unobserve(element: Element) {
      this.elements.delete(element);
      if (this.elements.size === 0) {
        window.removeEventListener('resize', this.handleResize);
      }
    }

    disconnect() {
      this.elements.clear();
      window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => {
      this.elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        this.callback([{
          target: element,
          contentRect: rect
        }]);
      });
    };
  };
};

/**
 * Initializes all necessary polyfills
 */
export const initializePolyfills = (): void => {
  polyfillIntersectionObserver();
  polyfillResizeObserver();
};

/**
 * Gets CSS properties with browser prefixes
 */
export const getPrefixedCSS = (property: string, value: string): Record<string, string> => {
  const prefixed: Record<string, string> = {};

  switch (property) {
    case 'backdrop-filter':
      prefixed['backdrop-filter'] = value;
      prefixed['-webkit-backdrop-filter'] = value;
      break;
    
    case 'user-select':
      prefixed['user-select'] = value;
      prefixed['-webkit-user-select'] = value;
      prefixed['-moz-user-select'] = value;
      prefixed['-ms-user-select'] = value;
      break;

    case 'transform':
      prefixed['transform'] = value;
      prefixed['-webkit-transform'] = value;
      prefixed['-moz-transform'] = value;
      prefixed['-ms-transform'] = value;
      break;

    default:
      prefixed[property] = value;
  }

  return prefixed;
};

/**
 * Checks if the current browser supports liquid glass effects
 */
export const supportsLiquidGlass = (): boolean => {
  const browserInfo = detectBrowser();
  
  return (
    browserInfo.supportsBackdropFilter &&
    browserInfo.supportsWebGL &&
    browserInfo.performanceLevel !== 'low'
  );
};

/**
 * Gets recommended settings for the current browser
 */
export const getRecommendedSettings = () => {
  const browserInfo = detectBrowser();
  
  return {
    enableLiquidGlass: supportsLiquidGlass(),
    maxIntensity: browserInfo.performanceLevel === 'high' ? 'prominent' : 
                  browserInfo.performanceLevel === 'medium' ? 'medium' : 'subtle',
    enableAnimations: browserInfo.performanceLevel !== 'low',
    enableComplexEffects: browserInfo.name === 'chrome' || browserInfo.name === 'edge',
    fallbackToGlass: !browserInfo.supportsBackdropFilter
  };
};