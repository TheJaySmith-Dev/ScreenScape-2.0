/**
 * Performance Monitoring Utilities for Liquid Glass Integration
 * Monitors rendering performance and provides adaptive quality settings
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  isLowPerformance: boolean;
}

export interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFPS: 30,
  maxFrameTime: 33, // ~30fps
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  maxRenderTime: 16 // 16ms for 60fps
};

/**
 * Performance monitor class for tracking rendering metrics
 */
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private frameTime = 0;
  private renderStartTime = 0;
  private isMonitoring = false;
  private animationFrameId: number | null = null;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor(private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {}

  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.measureFrame();
  }

  stop(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameTime = currentTime - this.lastTime;
    this.frameCount++;

    // Calculate FPS every second
    if (this.frameCount >= 60) {
      this.fps = Math.round(1000 / (this.frameTime / this.frameCount));
      this.frameCount = 0;
    }

    this.lastTime = currentTime;

    // Notify callbacks with current metrics
    const metrics = this.getMetrics();
    this.callbacks.forEach(callback => callback(metrics));

    this.animationFrameId = requestAnimationFrame(this.measureFrame);
  };

  startRenderMeasurement(): void {
    this.renderStartTime = performance.now();
  }

  endRenderMeasurement(): number {
    return performance.now() - this.renderStartTime;
  }

  getMetrics(): PerformanceMetrics {
    const memoryUsage = this.getMemoryUsage();
    const renderTime = this.frameTime;

    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage,
      renderTime,
      isLowPerformance: this.isLowPerformance()
    };
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private isLowPerformance(): boolean {
    return (
      this.fps < this.thresholds.minFPS ||
      this.frameTime > this.thresholds.maxFrameTime ||
      this.getMemoryUsage() > this.thresholds.maxMemoryUsage
    );
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }
}

// Global performance monitor instance
const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = (enabled = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16,
    memoryUsage: 0,
    renderTime: 0,
    isLowPerformance: false
  });

  useEffect(() => {
    if (!enabled) return;

    globalPerformanceMonitor.start();
    const unsubscribe = globalPerformanceMonitor.onMetricsUpdate(setMetrics);

    return () => {
      unsubscribe();
      globalPerformanceMonitor.stop();
    };
  }, [enabled]);

  return metrics;
};

/**
 * Hook for adaptive quality based on performance
 */
export const useAdaptiveQuality = (baseQuality: 'low' | 'medium' | 'high' = 'medium') => {
  const metrics = usePerformanceMonitor();
  const [quality, setQuality] = useState(baseQuality);

  // Hysteresis/cooldown to prevent rapid oscillation that can cause flicker
  const lastChangeRef = useRef<number>(performance.now());
  const stableCountersRef = useRef<{ good: number; bad: number }>({ good: 0, bad: 0 });

  useEffect(() => {
    const now = performance.now();
    const MIN_HOLD_MS = 1200; // minimum time between quality changes
    const MIN_STABLE_UPDATES = 8; // consecutive updates required before changing

    const isBad = metrics.isLowPerformance;
    // Slightly stricter "good" threshold to avoid bouncing at 60fps boundary
    const isGood = metrics.fps > 55 && metrics.frameTime < 18;
    const canChange = now - lastChangeRef.current >= MIN_HOLD_MS;

    if (isBad) {
      stableCountersRef.current.bad += 1;
      stableCountersRef.current.good = 0;

      if (canChange && stableCountersRef.current.bad >= MIN_STABLE_UPDATES) {
        if (quality === 'high') {
          setQuality('medium');
          lastChangeRef.current = now;
        } else if (quality === 'medium') {
          setQuality('low');
          lastChangeRef.current = now;
        }
        stableCountersRef.current.bad = 0;
      }
    } else if (isGood) {
      stableCountersRef.current.good += 1;
      stableCountersRef.current.bad = 0;

      if (canChange && stableCountersRef.current.good >= MIN_STABLE_UPDATES) {
        if (quality === 'low' && baseQuality !== 'low') {
          setQuality('medium');
          lastChangeRef.current = now;
        } else if (quality === 'medium' && baseQuality === 'high') {
          setQuality('high');
          lastChangeRef.current = now;
        }
        stableCountersRef.current.good = 0;
      }
    } else {
      // Reset counters when metrics are neutral
      stableCountersRef.current.good = 0;
      stableCountersRef.current.bad = 0;
    }
  }, [metrics, quality, baseQuality]);

  return quality;
};

/**
 * Intersection Observer hook for selective rendering
 */
export const useIntersectionObserver = (
  threshold = 0.1,
  rootMargin = '50px'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        setIsNearViewport(entry.intersectionRatio > 0 || entry.isIntersecting);
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return {
    elementRef,
    isVisible,
    isNearViewport
  };
};

/**
 * Debounced performance callback hook
 */
export const useDebouncedPerformanceCallback = (
  callback: (metrics: PerformanceMetrics) => void,
  delay = 1000
) => {
  const metrics = usePerformanceMonitor();
  // Use cross-platform timeout type and initialize ref with a value
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(metrics);
    }, delay);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [metrics, callback, delay]);
};

/**
 * Gets performance-optimized liquid glass configuration
 */
export const getPerformanceOptimizedConfig = (
  baseConfig: any,
  quality: 'low' | 'medium' | 'high'
): any => {
  if (!baseConfig) return baseConfig;

  const config = { ...baseConfig };

  switch (quality) {
    case 'low':
      config.elasticity = Math.min(config.elasticity || 0, 0.1);
      config.displacement = Math.min(config.displacement || 0, 20);
      config.blur = Math.min(config.blur || 0, 0.05);
      config.animationDuration = Math.min(config.animationDuration || 0, 150);
      config.enableComplexEffects = false;
      break;

    case 'medium':
      config.elasticity = Math.min(config.elasticity || 0, 0.2);
      config.displacement = Math.min(config.displacement || 0, 40);
      config.blur = Math.min(config.blur || 0, 0.1);
      config.animationDuration = Math.min(config.animationDuration || 0, 250);
      config.enableComplexEffects = false;
      break;

    case 'high':
      // Use full configuration for high quality
      config.enableComplexEffects = true;
      break;
  }

  return config;
};

/**
 * Performance logging utility
 */
export const logPerformanceMetrics = (metrics: PerformanceMetrics): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metrics:', {
      fps: Math.round(metrics.fps),
      frameTime: Math.round(metrics.frameTime * 100) / 100,
      memoryUsage: Math.round(metrics.memoryUsage / 1024 / 1024 * 100) / 100 + 'MB',
      renderTime: Math.round(metrics.renderTime * 100) / 100,
      isLowPerformance: metrics.isLowPerformance
    });
  }
};