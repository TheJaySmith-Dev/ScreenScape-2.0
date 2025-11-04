# Responsive Design Specification
## ScreenScape Liquid Glass Responsive System

### Executive Summary
This document defines the responsive design system for ScreenScape's liquid glass interface, ensuring optimal user experience across all device types while maintaining the authentic optical properties of the glass effects.

---

## 1. Breakpoint System

### 1.1 Device Categories and Breakpoints

```typescript
export const breakpoints = {
  mobile: {
    small: 320,    // iPhone SE, small Android phones
    medium: 375,   // iPhone 12/13/14, standard mobile
    large: 414,    // iPhone 12/13/14 Plus, large mobile
  },
  tablet: {
    small: 768,    // iPad Mini, small tablets
    medium: 834,   // iPad Air, standard tablets
    large: 1024,   // iPad Pro 11", large tablets
  },
  desktop: {
    small: 1280,   // Small laptops, compact desktops
    medium: 1440,  // Standard laptops, medium desktops
    large: 1920,   // Large desktops, external monitors
    xlarge: 2560,  // 4K displays, ultra-wide monitors
  },
};

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.tablet.small - 1}px)`,
  tablet: `(min-width: ${breakpoints.tablet.small}px) and (max-width: ${breakpoints.desktop.small - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop.small}px)`,
  
  // Specific breakpoints
  mobileSmall: `(max-width: ${breakpoints.mobile.medium - 1}px)`,
  mobileMedium: `(min-width: ${breakpoints.mobile.medium}px) and (max-width: ${breakpoints.mobile.large - 1}px)`,
  mobileLarge: `(min-width: ${breakpoints.mobile.large}px) and (max-width: ${breakpoints.tablet.small - 1}px)`,
  
  tabletSmall: `(min-width: ${breakpoints.tablet.small}px) and (max-width: ${breakpoints.tablet.medium - 1}px)`,
  tabletMedium: `(min-width: ${breakpoints.tablet.medium}px) and (max-width: ${breakpoints.tablet.large - 1}px)`,
  tabletLarge: `(min-width: ${breakpoints.tablet.large}px) and (max-width: ${breakpoints.desktop.small - 1}px)`,
  
  desktopSmall: `(min-width: ${breakpoints.desktop.small}px) and (max-width: ${breakpoints.desktop.medium - 1}px)`,
  desktopMedium: `(min-width: ${breakpoints.desktop.medium}px) and (max-width: ${breakpoints.desktop.large - 1}px)`,
  desktopLarge: `(min-width: ${breakpoints.desktop.large}px) and (max-width: ${breakpoints.desktop.xlarge - 1}px)`,
  desktopXLarge: `(min-width: ${breakpoints.desktop.xlarge}px)`,
  
  // Orientation
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
  
  // High DPI
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // Touch devices
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
};
```

### 1.2 Container System

```typescript
export const containers = {
  mobile: {
    padding: 16,
    maxWidth: '100%',
    margin: '0 auto',
  },
  tablet: {
    padding: 24,
    maxWidth: 768,
    margin: '0 auto',
  },
  desktop: {
    padding: 32,
    maxWidth: 1200,
    margin: '0 auto',
  },
  wide: {
    padding: 40,
    maxWidth: 1400,
    margin: '0 auto',
  },
  full: {
    padding: 0,
    maxWidth: '100%',
    margin: 0,
  },
};
```

---

## 2. Glass Effect Adaptations

### 2.1 Performance-Based Glass Scaling

```typescript
export const glassAdaptations = {
  mobile: {
    // Reduced glass effects for performance
    blur: {
      ultraThin: 8,   // Reduced from 15px
      thin: 12,       // Reduced from 20px
      regular: 16,    // Reduced from 25px
      thick: 20,      // Reduced from 30px
      prominent: 24,  // Reduced from 35px
    },
    opacity: {
      ultraThin: 0.03,  // Slightly increased for visibility
      thin: 0.05,
      regular: 0.08,
      thick: 0.12,
      prominent: 0.15,
    },
    chromatic: {
      enabled: false,   // Disabled for performance
    },
    prismatic: {
      enabled: false,   // Disabled for performance
    },
    animations: {
      reduced: true,    // Simplified animations
      duration: 200,    // Faster transitions
    },
  },
  
  tablet: {
    // Moderate glass effects
    blur: {
      ultraThin: 12,
      thin: 16,
      regular: 20,
      thick: 25,
      prominent: 30,
    },
    opacity: {
      ultraThin: 0.025,
      thin: 0.045,
      regular: 0.075,
      thick: 0.11,
      prominent: 0.14,
    },
    chromatic: {
      enabled: true,
      intensity: 0.2,   // Reduced intensity
    },
    prismatic: {
      enabled: false,   // Still disabled for performance
    },
    animations: {
      reduced: false,
      duration: 250,
    },
  },
  
  desktop: {
    // Full glass effects
    blur: {
      ultraThin: 15,
      thin: 20,
      regular: 25,
      thick: 30,
      prominent: 35,
    },
    opacity: {
      ultraThin: 0.021,
      thin: 0.042,
      regular: 0.081,
      thick: 0.118,
      prominent: 0.189,
    },
    chromatic: {
      enabled: true,
      intensity: 0.4,
    },
    prismatic: {
      enabled: true,
      intensity: 0.4,
    },
    animations: {
      reduced: false,
      duration: 300,
    },
  },
};
```

### 2.2 Adaptive Glass Hook

```typescript
export const useAdaptiveGlass = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [glassConfig, setGlassConfig] = useState(glassAdaptations.desktop);
  
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.tablet.small) {
        setDeviceType('mobile');
        setGlassConfig(glassAdaptations.mobile);
      } else if (width < breakpoints.desktop.small) {
        setDeviceType('tablet');
        setGlassConfig(glassAdaptations.tablet);
      } else {
        setDeviceType('desktop');
        setGlassConfig(glassAdaptations.desktop);
      }
    };
    
    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);
  
  const getAdaptiveGlassStyle = useCallback((
    variant: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'prominent' = 'regular'
  ) => {
    const config = glassConfig;
    
    return {
      background: `rgba(255, 255, 255, ${config.opacity[variant]})`,
      backdropFilter: `blur(${config.blur[variant]}px) brightness(1.15) saturate(1.3)`,
      border: '1px solid rgba(255, 255, 255, 0.12)',
      transition: `all ${config.animations.duration}ms ease-out`,
    };
  }, [glassConfig]);
  
  return {
    deviceType,
    glassConfig,
    getAdaptiveGlassStyle,
  };
};
```

---

## 3. Layout Adaptations

### 3.1 Navigation Adaptations

#### Mobile Navigation
```typescript
export const mobileNavigation = {
  type: 'bottom-tab',
  height: 80,
  items: 5, // Maximum recommended
  layout: 'horizontal',
  glass: {
    variant: 'thin',
    blur: 12,
    opacity: 0.05,
  },
  spacing: {
    padding: 12,
    iconSize: 24,
    labelSize: 11,
  },
  behavior: {
    hideOnScroll: true,
    safeArea: true,
  },
};
```

#### Tablet Navigation
```typescript
export const tabletNavigation = {
  type: 'sidebar',
  width: 280,
  collapsible: true,
  layout: 'vertical',
  glass: {
    variant: 'regular',
    blur: 20,
    opacity: 0.08,
  },
  spacing: {
    padding: 16,
    iconSize: 28,
    labelSize: 14,
  },
  behavior: {
    overlay: true,
    persistent: false,
  },
};
```

#### Desktop Navigation
```typescript
export const desktopNavigation = {
  type: 'header',
  height: 72,
  sticky: true,
  layout: 'horizontal',
  glass: {
    variant: 'prominent',
    blur: 35,
    opacity: 0.15,
    chromatic: true,
  },
  spacing: {
    padding: 20,
    iconSize: 32,
    labelSize: 16,
  },
  behavior: {
    transparent: true,
    backdrop: true,
  },
};
```

### 3.2 Grid System Adaptations

```typescript
export const gridSystem = {
  mobile: {
    columns: 1,
    gap: 12,
    padding: 16,
    cardAspectRatio: '16:9',
    itemsPerRow: {
      portrait: 1,
      landscape: 2,
    },
  },
  
  tablet: {
    columns: 2,
    gap: 16,
    padding: 24,
    cardAspectRatio: '3:4',
    itemsPerRow: {
      portrait: 2,
      landscape: 3,
    },
  },
  
  desktop: {
    columns: 4,
    gap: 20,
    padding: 32,
    cardAspectRatio: '2:3',
    itemsPerRow: {
      small: 3,
      medium: 4,
      large: 5,
      xlarge: 6,
    },
  },
};
```

### 3.3 Typography Scaling

```typescript
export const typographyScaling = {
  mobile: {
    largeTitle: 24,    // Reduced from 34
    title1: 20,        // Reduced from 28
    title2: 18,        // Reduced from 22
    title3: 16,        // Reduced from 20
    headline: 15,      // Reduced from 17
    body: 14,          // Reduced from 17
    callout: 13,       // Reduced from 16
    subheadline: 12,   // Reduced from 15
    footnote: 11,      // Reduced from 13
    caption1: 10,      // Reduced from 12
    caption2: 9,       // Reduced from 11
  },
  
  tablet: {
    largeTitle: 28,
    title1: 24,
    title2: 20,
    title3: 18,
    headline: 16,
    body: 15,
    callout: 14,
    subheadline: 13,
    footnote: 12,
    caption1: 11,
    caption2: 10,
  },
  
  desktop: {
    largeTitle: 34,
    title1: 28,
    title2: 22,
    title3: 20,
    headline: 17,
    body: 17,
    callout: 16,
    subheadline: 15,
    footnote: 13,
    caption1: 12,
    caption2: 11,
  },
};
```

---

## 4. Touch and Interaction Adaptations

### 4.1 Touch Target Sizing

```typescript
export const touchTargets = {
  mobile: {
    minimum: 44,      // iOS HIG minimum
    recommended: 48,  // Material Design recommendation
    comfortable: 56,  // Comfortable touch target
    spacing: 8,       // Minimum spacing between targets
  },
  
  tablet: {
    minimum: 40,
    recommended: 44,
    comfortable: 48,
    spacing: 12,
  },
  
  desktop: {
    minimum: 32,      // Mouse precision allows smaller targets
    recommended: 36,
    comfortable: 40,
    spacing: 4,
  },
};
```

### 4.2 Gesture Support

```typescript
export const gestureSupport = {
  mobile: {
    swipe: {
      enabled: true,
      threshold: 50,    // pixels
      velocity: 0.3,    // pixels/ms
    },
    pinch: {
      enabled: true,
      minScale: 0.5,
      maxScale: 3.0,
    },
    longPress: {
      enabled: true,
      duration: 500,    // ms
    },
    doubleTap: {
      enabled: true,
      delay: 300,       // ms between taps
    },
  },
  
  tablet: {
    swipe: {
      enabled: true,
      threshold: 60,
      velocity: 0.4,
    },
    pinch: {
      enabled: true,
      minScale: 0.5,
      maxScale: 2.5,
    },
    longPress: {
      enabled: true,
      duration: 400,
    },
    doubleTap: {
      enabled: true,
      delay: 250,
    },
  },
  
  desktop: {
    hover: {
      enabled: true,
      delay: 100,       // ms before hover state
    },
    scroll: {
      enabled: true,
      smooth: true,
    },
    keyboard: {
      enabled: true,
      shortcuts: true,
    },
  },
};
```

---

## 5. Performance Optimizations

### 5.1 Rendering Optimizations

```typescript
export const performanceConfig = {
  mobile: {
    // Aggressive optimizations for mobile
    willChange: 'transform',
    transform3d: true,
    backfaceVisibility: 'hidden',
    perspective: 1000,
    
    // Reduced animations
    reducedMotion: true,
    animationDuration: 200,
    
    // Simplified effects
    boxShadow: 'simple',
    borderRadius: 8,      // Reduced from 12
    
    // Image optimizations
    imageQuality: 'medium',
    lazyLoading: true,
    placeholder: 'blur',
  },
  
  tablet: {
    willChange: 'transform',
    transform3d: true,
    backfaceVisibility: 'hidden',
    perspective: 1000,
    
    reducedMotion: false,
    animationDuration: 250,
    
    boxShadow: 'enhanced',
    borderRadius: 10,
    
    imageQuality: 'high',
    lazyLoading: true,
    placeholder: 'blur',
  },
  
  desktop: {
    willChange: 'auto',
    transform3d: true,
    backfaceVisibility: 'hidden',
    perspective: 1000,
    
    reducedMotion: false,
    animationDuration: 300,
    
    boxShadow: 'full',
    borderRadius: 12,
    
    imageQuality: 'high',
    lazyLoading: false,
    placeholder: 'none',
  },
};
```

### 5.2 Memory Management

```typescript
export const memoryManagement = {
  mobile: {
    // Aggressive cleanup for mobile
    componentCleanup: true,
    eventListenerCleanup: true,
    imageCache: 'limited',
    maxCacheSize: 50, // MB
    
    // Virtualization for large lists
    virtualScrolling: true,
    itemBuffer: 5,
    
    // Reduced concurrent animations
    maxConcurrentAnimations: 3,
  },
  
  tablet: {
    componentCleanup: true,
    eventListenerCleanup: true,
    imageCache: 'moderate',
    maxCacheSize: 100, // MB
    
    virtualScrolling: true,
    itemBuffer: 10,
    
    maxConcurrentAnimations: 5,
  },
  
  desktop: {
    componentCleanup: true,
    eventListenerCleanup: true,
    imageCache: 'extensive',
    maxCacheSize: 200, // MB
    
    virtualScrolling: false,
    itemBuffer: 20,
    
    maxConcurrentAnimations: 10,
  },
};
```

---

## 6. Accessibility Adaptations

### 6.1 