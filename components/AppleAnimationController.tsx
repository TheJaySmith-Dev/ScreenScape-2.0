import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useAppleTheme } from './AppleThemeProvider';

// Apple Core Animation Timing Curves
export const AppleTimingCurves = {
  // Standard Apple timing curves
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  
  // Apple-specific curves
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  snappy: 'cubic-bezier(0.4, 0, 0.6, 1)',
  
  // iOS-specific curves
  iosSpring: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  iosEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // macOS-specific curves
  macosSpring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  macosEaseInOut: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

// Animation Durations (in seconds)
export const AppleAnimationDurations = {
  instant: 0,
  micro: 0.15,
  short: 0.25,
  medium: 0.35,
  long: 0.5,
  extraLong: 0.75,
  
  // Context-specific durations
  buttonPress: 0.1,
  buttonRelease: 0.15,
  hover: 0.2,
  focus: 0.15,
  modal: 0.35,
  sheet: 0.5,
  navigation: 0.35,
  
  // iOS-specific
  iosTransition: 0.35,
  iosSpring: 0.6,
  
  // macOS-specific
  macosTransition: 0.25,
  macosSpring: 0.5,
} as const;

// Animation Types
export type AnimationType = 
  | 'fadeIn'
  | 'fadeOut'
  | 'slideIn'
  | 'slideOut'
  | 'scaleIn'
  | 'scaleOut'
  | 'spring'
  | 'bounce'
  | 'ripple'
  | 'shimmer'
  | 'glow'
  | 'liquidMorph';

export interface AnimationConfig {
  type: AnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'center';
  intensity?: 'subtle' | 'normal' | 'strong';
  repeat?: boolean | number;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
  velocity?: number;
  precision?: number;
}

// Animation Controller Context
interface AppleAnimationContextType {
  animate: (element: HTMLElement, config: AnimationConfig) => Promise<void>;
  createSpringAnimation: (config: SpringConfig) => string;
  createRippleEffect: (x: number, y: number, element: HTMLElement) => void;
  createShimmerEffect: (element: HTMLElement) => void;
  createGlowEffect: (element: HTMLElement, intensity?: number) => void;
  createLiquidMorphEffect: (element: HTMLElement, targetShape: string) => void;
  stopAnimation: (element: HTMLElement) => void;
  pauseAllAnimations: () => void;
  resumeAllAnimations: () => void;
  setGlobalAnimationSpeed: (speed: number) => void;
}

const AppleAnimationContext = createContext<AppleAnimationContextType | undefined>(undefined);

export const useAppleAnimation = () => {
  const context = useContext(AppleAnimationContext);
  if (!context) {
    throw new Error('useAppleAnimation must be used within an AppleAnimationProvider');
  }
  return context;
};

// Animation Provider Component
interface AppleAnimationProviderProps {
  children: React.ReactNode;
}

export const AppleAnimationProvider: React.FC<AppleAnimationProviderProps> = ({ children }) => {
  const { reducedMotion } = useAppleTheme();
  const animationSpeedRef = useRef(1);
  const activeAnimationsRef = useRef<Set<Animation>>(new Set());

  // Core animation function
  const animate = useCallback(async (element: HTMLElement, config: AnimationConfig): Promise<void> => {
    if (reducedMotion && config.type !== 'fadeIn' && config.type !== 'fadeOut') {
      return Promise.resolve();
    }

    const {
      type,
      duration = AppleAnimationDurations.medium,
      delay = 0,
      easing = AppleTimingCurves.easeInOut,
      direction = 'center',
      intensity = 'normal',
      repeat = false,
      fillMode = 'both'
    } = config;

    const adjustedDuration = (duration * 1000) / animationSpeedRef.current;
    const adjustedDelay = (delay * 1000) / animationSpeedRef.current;

    let keyframes: Keyframe[] = [];
    
    switch (type) {
      case 'fadeIn':
        keyframes = [
          { opacity: 0, transform: 'translateZ(0)' },
          { opacity: 1, transform: 'translateZ(0)' }
        ];
        break;
        
      case 'fadeOut':
        keyframes = [
          { opacity: 1, transform: 'translateZ(0)' },
          { opacity: 0, transform: 'translateZ(0)' }
        ];
        break;
        
      case 'slideIn':
        const slideInTransform = getSlideTransform(direction, -100);
        keyframes = [
          { transform: slideInTransform, opacity: 0 },
          { transform: 'translateX(0) translateY(0) translateZ(0)', opacity: 1 }
        ];
        break;
        
      case 'slideOut':
        const slideOutTransform = getSlideTransform(direction, 100);
        keyframes = [
          { transform: 'translateX(0) translateY(0) translateZ(0)', opacity: 1 },
          { transform: slideOutTransform, opacity: 0 }
        ];
        break;
        
      case 'scaleIn':
        const scaleInValue = intensity === 'subtle' ? 0.95 : intensity === 'strong' ? 0.8 : 0.9;
        keyframes = [
          { transform: `scale(${scaleInValue}) translateZ(0)`, opacity: 0 },
          { transform: 'scale(1) translateZ(0)', opacity: 1 }
        ];
        break;
        
      case 'scaleOut':
        const scaleOutValue = intensity === 'subtle' ? 1.05 : intensity === 'strong' ? 1.2 : 1.1;
        keyframes = [
          { transform: 'scale(1) translateZ(0)', opacity: 1 },
          { transform: `scale(${scaleOutValue}) translateZ(0)`, opacity: 0 }
        ];
        break;
        
      case 'spring':
        keyframes = [
          { transform: 'scale(0.8) translateZ(0)' },
          { transform: 'scale(1.05) translateZ(0)', offset: 0.6 },
          { transform: 'scale(1) translateZ(0)' }
        ];
        break;
        
      case 'bounce':
        keyframes = [
          { transform: 'translateY(0) translateZ(0)' },
          { transform: 'translateY(-10px) translateZ(0)', offset: 0.25 },
          { transform: 'translateY(0) translateZ(0)', offset: 0.5 },
          { transform: 'translateY(-5px) translateZ(0)', offset: 0.75 },
          { transform: 'translateY(0) translateZ(0)' }
        ];
        break;
    }

    const animationOptions: KeyframeAnimationOptions = {
      duration: adjustedDuration,
      delay: adjustedDelay,
      easing,
      fill: fillMode,
      iterations: typeof repeat === 'number' ? repeat : repeat ? Infinity : 1,
    };

    const animation = element.animate(keyframes, animationOptions);
    activeAnimationsRef.current.add(animation);

    animation.addEventListener('finish', () => {
      activeAnimationsRef.current.delete(animation);
    });

    animation.addEventListener('cancel', () => {
      activeAnimationsRef.current.delete(animation);
    });

    return animation.finished;
  }, [reducedMotion]);

  // Helper function for slide transforms
  const getSlideTransform = (direction: string, distance: number): string => {
    switch (direction) {
      case 'up':
        return `translateY(${distance}px) translateZ(0)`;
      case 'down':
        return `translateY(${-distance}px) translateZ(0)`;
      case 'left':
        return `translateX(${distance}px) translateZ(0)`;
      case 'right':
        return `translateX(${-distance}px) translateZ(0)`;
      default:
        return `translateY(${distance}px) translateZ(0)`;
    }
  };

  // Create spring animation with physics
  const createSpringAnimation = useCallback((config: SpringConfig): string => {
    const {
      tension = 170,
      friction = 26,
      mass = 1,
      velocity = 0,
      precision = 0.01
    } = config;

    // Calculate spring parameters
    const w0 = Math.sqrt(tension / mass);
    const zeta = friction / (2 * Math.sqrt(tension * mass));
    
    if (zeta < 1) {
      // Underdamped
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      const A = 1;
      const B = (zeta * w0 + velocity) / wd;
      
      return `cubic-bezier(${0.25 + zeta * 0.3}, ${0.1 + B * 0.1}, ${0.25 - zeta * 0.1}, ${1 - A * 0.1})`;
    } else {
      // Critically damped or overdamped
      return AppleTimingCurves.easeOut;
    }
  }, []);

  // Create ripple effect
  const createRippleEffect = useCallback((x: number, y: number, element: HTMLElement): void => {
    if (reducedMotion) return;

    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const radius = size / 2;

    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0) translateZ(0);
      left: ${x - radius}px;
      top: ${y - radius}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      z-index: 1000;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    const animation = ripple.animate([
      { transform: 'scale(0) translateZ(0)', opacity: 1 },
      { transform: 'scale(1) translateZ(0)', opacity: 0 }
    ], {
      duration: 600,
      easing: AppleTimingCurves.easeOut,
      fill: 'forwards'
    });

    activeAnimationsRef.current.add(animation);

    animation.addEventListener('finish', () => {
      activeAnimationsRef.current.delete(animation);
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    });
  }, [reducedMotion]);

  // Create shimmer effect
  const createShimmerEffect = useCallback((element: HTMLElement): void => {
    if (reducedMotion) return;

    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      pointer-events: none;
      z-index: 1;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(shimmer);

    const animation = shimmer.animate([
      { transform: 'translateX(-100%) translateZ(0)' },
      { transform: 'translateX(200%) translateZ(0)' }
    ], {
      duration: 1500,
      easing: AppleTimingCurves.easeInOut,
      iterations: Infinity
    });

    activeAnimationsRef.current.add(animation);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      animation.cancel();
      if (shimmer.parentNode) {
        shimmer.parentNode.removeChild(shimmer);
      }
    }, 3000);
  }, [reducedMotion]);

  // Create glow effect
  const createGlowEffect = useCallback((element: HTMLElement, intensity: number = 1): void => {
    if (reducedMotion) return;

    const glowIntensity = Math.max(0.1, Math.min(1, intensity));
    const glowColor = getComputedStyle(element).color || '#007AFF';

    const animation = element.animate([
      { 
        boxShadow: `0 0 0 rgba(0, 122, 255, 0)`,
        filter: 'brightness(1) saturate(1)'
      },
      { 
        boxShadow: `0 0 ${20 * glowIntensity}px rgba(0, 122, 255, ${0.5 * glowIntensity})`,
        filter: `brightness(${1 + 0.2 * glowIntensity}) saturate(${1 + 0.3 * glowIntensity})`
      },
      { 
        boxShadow: `0 0 0 rgba(0, 122, 255, 0)`,
        filter: 'brightness(1) saturate(1)'
      }
    ], {
      duration: 2000,
      easing: AppleTimingCurves.easeInOut,
      iterations: Infinity
    });

    activeAnimationsRef.current.add(animation);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      animation.cancel();
    }, 5000);
  }, [reducedMotion]);

  // Create liquid morph effect
  const createLiquidMorphEffect = useCallback((element: HTMLElement, targetShape: string): void => {
    if (reducedMotion) return;

    const currentBorderRadius = getComputedStyle(element).borderRadius || '0px';
    
    const animation = element.animate([
      { 
        borderRadius: currentBorderRadius,
        transform: 'scale(1) translateZ(0)'
      },
      { 
        borderRadius: '50%',
        transform: 'scale(1.05) translateZ(0)',
        offset: 0.5
      },
      { 
        borderRadius: targetShape,
        transform: 'scale(1) translateZ(0)'
      }
    ], {
      duration: 800,
      easing: AppleTimingCurves.spring,
      fill: 'forwards'
    });

    activeAnimationsRef.current.add(animation);

    animation.addEventListener('finish', () => {
      activeAnimationsRef.current.delete(animation);
    });
  }, [reducedMotion]);

  // Stop specific animation
  const stopAnimation = useCallback((element: HTMLElement): void => {
    const animations = element.getAnimations();
    animations.forEach(animation => {
      animation.cancel();
      activeAnimationsRef.current.delete(animation as Animation);
    });
  }, []);

  // Pause all animations
  const pauseAllAnimations = useCallback((): void => {
    activeAnimationsRef.current.forEach(animation => {
      animation.pause();
    });
  }, []);

  // Resume all animations
  const resumeAllAnimations = useCallback((): void => {
    activeAnimationsRef.current.forEach(animation => {
      animation.play();
    });
  }, []);

  // Set global animation speed
  const setGlobalAnimationSpeed = useCallback((speed: number): void => {
    animationSpeedRef.current = Math.max(0.1, Math.min(10, speed));
    
    activeAnimationsRef.current.forEach(animation => {
      animation.playbackRate = animationSpeedRef.current;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeAnimationsRef.current.forEach(animation => {
        animation.cancel();
      });
      activeAnimationsRef.current.clear();
    };
  }, []);

  const contextValue: AppleAnimationContextType = {
    animate,
    createSpringAnimation,
    createRippleEffect,
    createShimmerEffect,
    createGlowEffect,
    createLiquidMorphEffect,
    stopAnimation,
    pauseAllAnimations,
    resumeAllAnimations,
    setGlobalAnimationSpeed,
  };

  return (
    <AppleAnimationContext.Provider value={contextValue}>
      {children}
    </AppleAnimationContext.Provider>
  );
};

// Animation Hook for Components
export const useAppleAnimationEffects = () => {
  const animation = useAppleAnimation();
  const { reducedMotion } = useAppleTheme();

  const animateOnMount = useCallback((ref: React.RefObject<HTMLElement>, config?: Partial<AnimationConfig>) => {
    useEffect(() => {
      if (ref.current && !reducedMotion) {
        animation.animate(ref.current, {
          type: 'fadeIn',
          duration: AppleAnimationDurations.medium,
          easing: AppleTimingCurves.easeOut,
          ...config
        });
      }
    }, []);
  }, [animation, reducedMotion]);

  const animateOnHover = useCallback((element: HTMLElement) => {
    if (!reducedMotion) {
      animation.animate(element, {
        type: 'scaleIn',
        duration: AppleAnimationDurations.hover,
        easing: AppleTimingCurves.easeOut,
        intensity: 'subtle'
      });
    }
  }, [animation, reducedMotion]);

  const animateOnPress = useCallback((element: HTMLElement) => {
    if (!reducedMotion) {
      animation.animate(element, {
        type: 'scaleOut',
        duration: AppleAnimationDurations.buttonPress,
        easing: AppleTimingCurves.easeIn,
        intensity: 'subtle'
      });
    }
  }, [animation, reducedMotion]);

  const animateOnFocus = useCallback((element: HTMLElement) => {
    if (!reducedMotion) {
      animation.createGlowEffect(element, 0.6);
    }
  }, [animation, reducedMotion]);

  return {
    animateOnMount,
    animateOnHover,
    animateOnPress,
    animateOnFocus,
    ...animation
  };
};

export default AppleAnimationProvider;