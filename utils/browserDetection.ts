/**
 * Browser Detection and Glass Support Utility
 * Detects browser capabilities for liquid glass effects and provides optimal configurations
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
    reducedMotion: boolean;
  };
  deviceType: 'desktop' | 'tablet' | 'mobile';
  performanceLevel: 'high' | 'medium' | 'low';
}

export interface OptimalConfig {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  elasticity: number;
  mode: 'standard' | 'polar' | 'prominent' | 'shader';
  performanceMode: 'high' | 'balanced' | 'performance';
}

/**
 * Detects browser support for glass effects
 */
export function detectGlassSupport(): BrowserSupport {
  const features = {
    backdropFilter: checkBackdropFilterSupport(),
    advancedBlending: checkAdvancedBlendingSupport(),
    webGL: checkWebGLSupport(),
    performanceAPI: checkPerformanceAPISupport(),
    reducedMotion: checkReducedMotionPreference(),
  };

  const deviceType = detectDeviceType();
  const performanceLevel = estimatePerformanceLevel();

  // Determine support level based on features
  const fullSupport = features.backdropFilter && features.webGL && !features.reducedMotion;
  const partialSupport = features.backdropFilter && !fullSupport;
  const fallbackRequired = !features.backdropFilter;

  return {
    fullSupport,
    partialSupport,
    fallbackRequired,
    features,
    deviceType,
    performanceLevel,
  };
}

/**
 * Gets optimal glass configuration based on device and performance
 */
export function getOptimalGlassConfig(
  deviceType: 'desktop' | 'tablet' | 'mobile',
  performanceLevel: 'high' | 'medium' | 'low',
  reducedMotion: boolean = false
): OptimalConfig {
  // Base configuration
  let config: OptimalConfig = {
    displacementScale: 1.0,
    blurAmount: 20,
    saturation: 1.8,
    elasticity: 0.8,
    mode: 'standard',
    performanceMode: 'balanced',
  };

  // Adjust for reduced motion
  if (reducedMotion) {
    config.elasticity = 0.2;
    config.displacementScale = 0.3;
    config.performanceMode = 'performance';
  }

  // Adjust for device type
  switch (deviceType) {
    case 'mobile':
      config.displacementScale *= 0.6;
      config.blurAmount *= 0.7;
      config.saturation *= 0.9;
      config.elasticity *= 0.7;
      config.performanceMode = 'performance';
      break;
    case 'tablet':
      config.displacementScale *= 0.8;
      config.blurAmount *= 0.85;
      config.saturation *= 0.95;
      config.elasticity *= 0.85;
      config.performanceMode = 'balanced';
      break;
    case 'desktop':
      // Use full configuration
      config.performanceMode = 'high';
      break;
  }

  // Adjust for performance level
  switch (performanceLevel) {
    case 'low':
      config.displacementScale *= 0.5;
      config.blurAmount *= 0.6;
      config.elasticity *= 0.5;
      config.mode = 'standard';
      config.performanceMode = 'performance';
      break;
    case 'medium':
      config.displacementScale *= 0.75;
      config.blurAmount *= 0.8;
      config.elasticity *= 0.75;
      config.performanceMode = 'balanced';
      break;
    case 'high':
      // Use full configuration
      config.mode = 'shader';
      config.performanceMode = 'high';
      break;
  }

  return config;
}

/**
 * Check if backdrop-filter is supported
 */
function checkBackdropFilterSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  const testElement = document.createElement('div');
  testElement.style.backdropFilter = 'blur(1px)';
  
  return testElement.style.backdropFilter !== '' || 
         testElement.style.webkitBackdropFilter !== '';
}

/**
 * Check if advanced blending modes are supported
 */
function checkAdvancedBlendingSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return false;
  
  try {
    ctx.globalCompositeOperation = 'multiply';
    return ctx.globalCompositeOperation === 'multiply';
  } catch {
    return false;
  }
}

/**
 * Check if WebGL is supported
 */
function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Check if Performance API is supported
 */
function checkPerformanceAPISupport(): boolean {
  return typeof window !== 'undefined' && 
         'performance' in window && 
         'mark' in window.performance;
}

/**
 * Check if user prefers reduced motion
 */
function checkReducedMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Detect device type based on screen size and user agent
 */
function detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for mobile devices
  if (width <= 768 || /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  // Check for tablets
  if (width <= 1024 || /tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }
  
  return 'desktop';
}

/**
 * Estimate performance level based on device capabilities
 */
function estimatePerformanceLevel(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium';
  
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  
  // Check memory (if available)
  const memory = (navigator as any).deviceMemory || 4;
  
  // Check connection speed
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  // Calculate performance score
  let score = 0;
  
  // CPU score
  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else score += 1;
  
  // Memory score
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;
  
  // Connection score
  if (effectiveType === '4g') score += 2;
  else if (effectiveType === '3g') score += 1;
  
  // Determine performance level
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * Get browser name and version
 */
export function getBrowserInfo(): { name: string; version: string } {
  if (typeof window === 'undefined') return { name: 'unknown', version: '0' };
  
  const userAgent = navigator.userAgent;
  
  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'chrome', version: match ? match[1] : '0' };
  }
  
  // Edge
  if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { name: 'edge', version: match ? match[1] : '0' };
  }
  
  // Safari
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: 'safari', version: match ? match[1] : '0' };
  }
  
  // Firefox
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: 'firefox', version: match ? match[1] : '0' };
  }
  
  return { name: 'unknown', version: '0' };
}