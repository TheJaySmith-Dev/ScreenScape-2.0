/**
 * Mobile Optimization Utility for Glass Effects
 * Provides optimized configurations and performance enhancements for mobile devices
 */

export interface MobileOptimizationConfig {
  enableTouchOptimization: boolean;
  reduceAnimationComplexity: boolean;
  enableBatteryOptimization: boolean;
  useReducedEffects: boolean;
  enableVirtualization: boolean;
  maxConcurrentEffects: number;
}

export interface TouchOptimizationConfig {
  touchDelay: number;
  tapThreshold: number;
  swipeThreshold: number;
  enableHapticFeedback: boolean;
}

export interface BatteryOptimizationConfig {
  lowBatteryThreshold: number;
  criticalBatteryThreshold: number;
  enablePowerSaveMode: boolean;
  reducedEffectsConfig: {
    displacementScale: number;
    blurAmount: number;
    elasticity: number;
    saturation: number;
  };
}

class MobileOptimizer {
  private isInitialized: boolean = false;
  private batteryAPI: any = null;
  private networkInfo: any = null;
  private deviceMemory: number = 4; // Default 4GB
  private isLowPowerMode: boolean = false;
  private touchOptimization: TouchOptimizationConfig;
  private batteryOptimization: BatteryOptimizationConfig;

  constructor() {
    this.touchOptimization = {
      touchDelay: 0,
      tapThreshold: 10,
      swipeThreshold: 50,
      enableHapticFeedback: true,
    };

    this.batteryOptimization = {
      lowBatteryThreshold: 0.3, // 30%
      criticalBatteryThreshold: 0.15, // 15%
      enablePowerSaveMode: false,
      reducedEffectsConfig: {
        displacementScale: 0.3,
        blurAmount: 0.5,
        elasticity: 0.2,
        saturation: 0.8,
      },
    };

    this.initialize();
  }

  /**
   * Initialize mobile optimization features
   */
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Initialize battery API
      if ('getBattery' in navigator) {
        this.batteryAPI = await (navigator as any).getBattery();
        this.setupBatteryMonitoring();
      }

      // Initialize network information
      if ('connection' in navigator) {
        this.networkInfo = (navigator as any).connection;
        this.setupNetworkMonitoring();
      }

      // Get device memory
      if ('deviceMemory' in navigator) {
        this.deviceMemory = (navigator as any).deviceMemory;
      }

      // Check for low power mode
      this.detectLowPowerMode();

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize mobile optimization:', error);
    }
  }

  /**
   * Get mobile optimization configuration
   */
  getMobileOptimizationConfig(): MobileOptimizationConfig {
    const isMobile = this.isMobileDevice();
    const isLowMemory = this.deviceMemory < 4;
    const isSlowNetwork = this.isSlowNetwork();
    const isLowBattery = this.isLowBattery();

    return {
      enableTouchOptimization: isMobile,
      reduceAnimationComplexity: isMobile || isLowMemory || isSlowNetwork,
      enableBatteryOptimization: isLowBattery || this.isLowPowerMode,
      useReducedEffects: isLowMemory || isSlowNetwork || isLowBattery,
      enableVirtualization: isMobile && isLowMemory,
      maxConcurrentEffects: this.getMaxConcurrentEffects(),
    };
  }

  /**
   * Get touch optimization configuration
   */
  getTouchOptimizationConfig(): TouchOptimizationConfig {
    return {
      ...this.touchOptimization,
      touchDelay: this.isSlowDevice() ? 16 : 0, // Add delay for slow devices
      enableHapticFeedback: this.isMobileDevice() && 'vibrate' in navigator,
    };
  }

  /**
   * Get battery optimization configuration
   */
  getBatteryOptimizationConfig(): BatteryOptimizationConfig {
    return this.batteryOptimization;
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return isMobileUA || (isSmallScreen && hasTouchScreen);
  }

  /**
   * Check if device is slow (low performance)
   */
  isSlowDevice(): boolean {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = this.deviceMemory;
    
    return cores < 4 || memory < 4;
  }

  /**
   * Check if network is slow
   */
  isSlowNetwork(): boolean {
    if (!this.networkInfo) return false;

    const effectiveType = this.networkInfo.effectiveType;
    const downlink = this.networkInfo.downlink;

    return effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 1.5;
  }

  /**
   * Check if battery is low
   */
  isLowBattery(): boolean {
    if (!this.batteryAPI) return false;

    const level = this.batteryAPI.level;
    return level < this.batteryOptimization.lowBatteryThreshold;
  }

  /**
   * Check if battery is critically low
   */
  isCriticalBattery(): boolean {
    if (!this.batteryAPI) return false;

    const level = this.batteryAPI.level;
    return level < this.batteryOptimization.criticalBatteryThreshold;
  }

  /**
   * Get maximum concurrent effects based on device capabilities
   */
  getMaxConcurrentEffects(): number {
    if (this.isCriticalBattery()) return 1;
    if (this.isLowBattery() || this.isSlowDevice()) return 3;
    if (this.isMobileDevice()) return 5;
    return 10;
  }

  /**
   * Get optimized glass configuration for mobile
   */
  getOptimizedGlassConfig(baseConfig: any): any {
    const mobileConfig = this.getMobileOptimizationConfig();
    
    if (!mobileConfig.useReducedEffects) return baseConfig;

    const reductionFactor = this.getReductionFactor();

    return {
      ...baseConfig,
      displacementScale: baseConfig.displacementScale * reductionFactor,
      blurAmount: baseConfig.blurAmount * reductionFactor,
      elasticity: baseConfig.elasticity * reductionFactor,
      saturation: Math.max(1.0, baseConfig.saturation * reductionFactor),
      mode: mobileConfig.enableBatteryOptimization ? 'standard' : baseConfig.mode,
    };
  }

  /**
   * Get reduction factor based on device state
   */
  private getReductionFactor(): number {
    if (this.isCriticalBattery()) return 0.3;
    if (this.isLowBattery()) return 0.5;
    if (this.isSlowDevice() || this.isSlowNetwork()) return 0.7;
    if (this.isMobileDevice()) return 0.8;
    return 1.0;
  }

  /**
   * Detect low power mode
   */
  private detectLowPowerMode(): void {
    // Check for iOS low power mode indicators
    if (typeof window !== 'undefined') {
      // Reduced frame rate can indicate low power mode
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        let frameCount = 0;
        let startTime = performance.now();
        
        const checkFrameRate = () => {
          frameCount++;
          const elapsed = performance.now() - startTime;
          
          if (elapsed >= 1000) {
            const fps = frameCount;
            this.isLowPowerMode = fps < 30; // Assume low power mode if FPS is very low
            return;
          }
          
          if (frameCount < 60) {
            requestAnimationFrame(checkFrameRate);
          }
        };
        
        requestAnimationFrame(checkFrameRate);
      }
    }
  }

  /**
   * Setup battery monitoring
   */
  private setupBatteryMonitoring(): void {
    if (!this.batteryAPI) return;

    this.batteryAPI.addEventListener('levelchange', () => {
      const level = this.batteryAPI.level;
      this.batteryOptimization.enablePowerSaveMode = level < this.batteryOptimization.lowBatteryThreshold;
    });

    this.batteryAPI.addEventListener('chargingchange', () => {
      // Disable power save mode when charging
      if (this.batteryAPI.charging) {
        this.batteryOptimization.enablePowerSaveMode = false;
      }
    });
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (!this.networkInfo) return;

    this.networkInfo.addEventListener('change', () => {
      // Network conditions changed, might need to adjust optimization
    });
  }

  /**
   * Enable haptic feedback for touch interactions
   */
  enableHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.isMobileDevice() || !('vibrate' in navigator)) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };

    navigator.vibrate(patterns[type]);
  }

  /**
   * Optimize touch event handling
   */
  optimizeTouchEvent(event: TouchEvent): TouchEvent {
    // Add touch optimization logic here
    // For example, debouncing, gesture recognition, etc.
    return event;
  }

  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches || this.isLowPowerMode;
  }

  /**
   * Get current device state summary
   */
  getDeviceState(): {
    isMobile: boolean;
    isSlowDevice: boolean;
    isSlowNetwork: boolean;
    isLowBattery: boolean;
    isCriticalBattery: boolean;
    isLowPowerMode: boolean;
    deviceMemory: number;
    maxConcurrentEffects: number;
  } {
    return {
      isMobile: this.isMobileDevice(),
      isSlowDevice: this.isSlowDevice(),
      isSlowNetwork: this.isSlowNetwork(),
      isLowBattery: this.isLowBattery(),
      isCriticalBattery: this.isCriticalBattery(),
      isLowPowerMode: this.isLowPowerMode,
      deviceMemory: this.deviceMemory,
      maxConcurrentEffects: this.getMaxConcurrentEffects(),
    };
  }
}

// Export singleton instance
export const mobileOptimizer = new MobileOptimizer();

// Convenience functions
export function getMobileOptimizationConfig(): MobileOptimizationConfig {
  return mobileOptimizer.getMobileOptimizationConfig();
}

export function getTouchOptimizationConfig(): TouchOptimizationConfig {
  return mobileOptimizer.getTouchOptimizationConfig();
}

export function getBatteryOptimizationConfig(): BatteryOptimizationConfig {
  return mobileOptimizer.getBatteryOptimizationConfig();
}

export function getOptimizedGlassConfig(baseConfig: any): any {
  return mobileOptimizer.getOptimizedGlassConfig(baseConfig);
}

export function isMobileDevice(): boolean {
  return mobileOptimizer.isMobileDevice();
}

export function prefersReducedMotion(): boolean {
  return mobileOptimizer.prefersReducedMotion();
}

export function getDeviceState() {
  return mobileOptimizer.getDeviceState();
}