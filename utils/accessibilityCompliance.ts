/**
 * Accessibility Compliance Utility for Glass Effects
 * Ensures WCAG 2.1 AA compliance and accessibility best practices
 */

export interface AccessibilityConfig {
  respectReducedMotion: boolean;
  respectHighContrast: boolean;
  respectColorScheme: boolean;
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableFocusManagement: boolean;
  contrastRatio: number;
  animationDuration: number;
}

export interface AccessibilityState {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
  isKeyboardUser: boolean;
  isScreenReaderActive: boolean;
  hasReducedTransparency: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

export interface AccessibilityAdjustments {
  disableAnimations: boolean;
  increaseContrast: boolean;
  reduceTransparency: boolean;
  simplifyEffects: boolean;
  enhanceFocus: boolean;
  addTextAlternatives: boolean;
}

class AccessibilityManager {
  private state: AccessibilityState;
  private config: AccessibilityConfig;
  private mediaQueries: Map<string, MediaQueryList> = new Map();
  private keyboardDetected: boolean = false;
  private screenReaderDetected: boolean = false;

  constructor() {
    this.state = {
      prefersReducedMotion: false,
      prefersHighContrast: false,
      prefersColorScheme: 'no-preference',
      isKeyboardUser: false,
      isScreenReaderActive: false,
      hasReducedTransparency: false,
      fontSize: 'medium',
    };

    this.config = {
      respectReducedMotion: true,
      respectHighContrast: true,
      respectColorScheme: true,
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableFocusManagement: true,
      contrastRatio: 4.5, // WCAG AA standard
      animationDuration: 300,
    };

    this.initialize();
  }

  /**
   * Initialize accessibility monitoring
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    this.setupMediaQueries();
    this.detectKeyboardUsage();
    this.detectScreenReader();
    this.updateState();
  }

  /**
   * Setup media queries for accessibility preferences
   */
  private setupMediaQueries(): void {
    const queries = {
      reducedMotion: '(prefers-reduced-motion: reduce)',
      highContrast: '(prefers-contrast: high)',
      darkMode: '(prefers-color-scheme: dark)',
      lightMode: '(prefers-color-scheme: light)',
      reducedTransparency: '(prefers-reduced-transparency: reduce)',
    };

    Object.entries(queries).forEach(([key, query]) => {
      if (window.matchMedia) {
        const mq = window.matchMedia(query);
        this.mediaQueries.set(key, mq);
        
        // Listen for changes
        mq.addEventListener('change', () => this.updateState());
      }
    });
  }

  /**
   * Detect keyboard usage
   */
  private detectKeyboardUsage(): void {
    let keyboardUsed = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') {
        keyboardUsed = true;
        this.keyboardDetected = true;
        this.updateState();
      }
    };

    const handleMouseDown = () => {
      if (keyboardUsed) {
        keyboardUsed = false;
        this.keyboardDetected = false;
        this.updateState();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
  }

  /**
   * Detect screen reader usage
   */
  private detectScreenReader(): void {
    // Check for common screen reader indicators
    const indicators = [
      'JAWS',
      'NVDA',
      'DRAGON',
      'VoiceOver',
      'TalkBack',
      'Orca',
    ];

    const userAgent = navigator.userAgent;
    this.screenReaderDetected = indicators.some(indicator => 
      userAgent.includes(indicator)
    );

    // Check for screen reader specific APIs
    if ('speechSynthesis' in window) {
      // Additional screen reader detection logic
    }

    this.updateState();
  }

  /**
   * Update accessibility state
   */
  private updateState(): void {
    const reducedMotionMQ = this.mediaQueries.get('reducedMotion');
    const highContrastMQ = this.mediaQueries.get('highContrast');
    const darkModeMQ = this.mediaQueries.get('darkMode');
    const lightModeMQ = this.mediaQueries.get('lightMode');
    const reducedTransparencyMQ = this.mediaQueries.get('reducedTransparency');

    this.state = {
      prefersReducedMotion: reducedMotionMQ?.matches || false,
      prefersHighContrast: highContrastMQ?.matches || false,
      prefersColorScheme: darkModeMQ?.matches ? 'dark' : 
                         lightModeMQ?.matches ? 'light' : 'no-preference',
      isKeyboardUser: this.keyboardDetected,
      isScreenReaderActive: this.screenReaderDetected,
      hasReducedTransparency: reducedTransparencyMQ?.matches || false,
      fontSize: this.detectFontSize(),
    };
  }

  /**
   * Detect user's preferred font size
   */
  private detectFontSize(): 'small' | 'medium' | 'large' | 'extra-large' {
    if (typeof window === 'undefined') return 'medium';

    const testElement = document.createElement('div');
    testElement.style.fontSize = '1rem';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);

    const computedSize = window.getComputedStyle(testElement).fontSize;
    const size = parseFloat(computedSize);

    document.body.removeChild(testElement);

    if (size >= 20) return 'extra-large';
    if (size >= 18) return 'large';
    if (size >= 14) return 'medium';
    return 'small';
  }

  /**
   * Get current accessibility state
   */
  getAccessibilityState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * Get accessibility configuration
   */
  getAccessibilityConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Get accessibility adjustments for glass effects
   */
  getAccessibilityAdjustments(): AccessibilityAdjustments {
    return {
      disableAnimations: this.state.prefersReducedMotion,
      increaseContrast: this.state.prefersHighContrast,
      reduceTransparency: this.state.hasReducedTransparency || this.state.prefersHighContrast,
      simplifyEffects: this.state.prefersReducedMotion || this.state.isScreenReaderActive,
      enhanceFocus: this.state.isKeyboardUser,
      addTextAlternatives: this.state.isScreenReaderActive,
    };
  }

  /**
   * Apply accessibility adjustments to glass configuration
   */
  applyAccessibilityAdjustments(glassConfig: any): any {
    const adjustments = this.getAccessibilityAdjustments();
    const adjustedConfig = { ...glassConfig };

    if (adjustments.disableAnimations) {
      adjustedConfig.elasticity = 0;
      adjustedConfig.animationDuration = 0;
      adjustedConfig.transitionDuration = 0;
    }

    if (adjustments.increaseContrast) {
      adjustedConfig.saturation = Math.min(2.0, adjustedConfig.saturation * 1.5);
      adjustedConfig.brightness = Math.min(1.5, adjustedConfig.brightness * 1.2);
    }

    if (adjustments.reduceTransparency) {
      adjustedConfig.opacity = Math.min(1.0, adjustedConfig.opacity * 1.3);
      adjustedConfig.blurAmount = Math.max(0, adjustedConfig.blurAmount * 0.5);
    }

    if (adjustments.simplifyEffects) {
      adjustedConfig.displacementScale = Math.max(0, adjustedConfig.displacementScale * 0.3);
      adjustedConfig.mode = 'standard';
    }

    return adjustedConfig;
  }

  /**
   * Check if color contrast meets WCAG standards
   */
  checkColorContrast(foreground: string, background: string): {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  } {
    const getLuminance = (color: string): number => {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Calculate relative luminance
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7,
    };
  }

  /**
   * Generate accessible focus styles
   */
  getAccessibleFocusStyles(): {
    outline: string;
    outlineOffset: string;
    boxShadow: string;
  } {
    const adjustments = this.getAccessibilityAdjustments();
    
    return {
      outline: adjustments.enhanceFocus ? '3px solid #0066cc' : '2px solid #0066cc',
      outlineOffset: '2px',
      boxShadow: adjustments.enhanceFocus 
        ? '0 0 0 4px rgba(0, 102, 204, 0.3)' 
        : '0 0 0 2px rgba(0, 102, 204, 0.2)',
    };
  }

  /**
   * Generate ARIA attributes for glass components
   */
  getAriaAttributes(componentType: string, isInteractive: boolean = false): Record<string, string> {
    const attributes: Record<string, string> = {};

    if (this.state.isScreenReaderActive) {
      switch (componentType) {
        case 'button':
          attributes['aria-label'] = 'Glass effect button';
          if (isInteractive) {
            attributes['aria-pressed'] = 'false';
          }
          break;
        case 'card':
          attributes['aria-label'] = 'Glass effect card';
          attributes['role'] = 'region';
          break;
        case 'panel':
          attributes['aria-label'] = 'Glass effect panel';
          attributes['role'] = 'complementary';
          break;
        case 'navigation':
          attributes['aria-label'] = 'Glass effect navigation';
          attributes['role'] = 'navigation';
          break;
      }
    }

    return attributes;
  }

  /**
   * Validate accessibility compliance
   */
  validateAccessibility(element: HTMLElement): {
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for proper ARIA labels
    if (this.state.isScreenReaderActive && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      issues.push('Missing ARIA label for screen reader users');
      recommendations.push('Add aria-label or aria-labelledby attribute');
    }

    // Check for keyboard accessibility
    if (this.state.isKeyboardUser && element.tabIndex < 0 && element.tagName !== 'DIV') {
      issues.push('Element not keyboard accessible');
      recommendations.push('Ensure element is focusable with keyboard');
    }

    // Check for reduced motion compliance
    if (this.state.prefersReducedMotion) {
      const hasAnimations = element.style.animation || element.style.transition;
      if (hasAnimations) {
        issues.push('Animations present when reduced motion is preferred');
        recommendations.push('Disable or reduce animations for users who prefer reduced motion');
      }
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Get recommended animation duration based on accessibility preferences
   */
  getRecommendedAnimationDuration(baseDuration: number): number {
    if (this.state.prefersReducedMotion) return 0;
    
    // Adjust duration based on user preferences
    const multiplier = this.state.fontSize === 'extra-large' ? 1.5 : 1;
    return Math.min(baseDuration * multiplier, this.config.animationDuration);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Add accessibility event listeners to an element
   */
  addAccessibilityListeners(element: HTMLElement, callbacks: {
    onFocus?: () => void;
    onBlur?: () => void;
    onKeyDown?: (event: KeyboardEvent) => void;
  }): void {
    if (callbacks.onFocus) {
      element.addEventListener('focus', callbacks.onFocus);
    }

    if (callbacks.onBlur) {
      element.addEventListener('blur', callbacks.onBlur);
    }

    if (callbacks.onKeyDown) {
      element.addEventListener('keydown', callbacks.onKeyDown);
    }

    // Add keyboard navigation support
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        element.click();
      }
    });
  }
}

// Export singleton instance
export const accessibilityManager = new AccessibilityManager();

// Convenience functions
export function getAccessibilityState(): AccessibilityState {
  return accessibilityManager.getAccessibilityState();
}

export function getAccessibilityConfig(): AccessibilityConfig {
  return accessibilityManager.getAccessibilityConfig();
}

export function getAccessibilityAdjustments(): AccessibilityAdjustments {
  return accessibilityManager.getAccessibilityAdjustments();
}

export function applyAccessibilityAdjustments(glassConfig: any): any {
  return accessibilityManager.applyAccessibilityAdjustments(glassConfig);
}

export function checkColorContrast(foreground: string, background: string) {
  return accessibilityManager.checkColorContrast(foreground, background);
}

export function getAccessibleFocusStyles() {
  return accessibilityManager.getAccessibleFocusStyles();
}

export function getAriaAttributes(componentType: string, isInteractive: boolean = false) {
  return accessibilityManager.getAriaAttributes(componentType, isInteractive);
}

export function validateAccessibility(element: HTMLElement) {
  return accessibilityManager.validateAccessibility(element);
}

export function getRecommendedAnimationDuration(baseDuration: number): number {
  return accessibilityManager.getRecommendedAnimationDuration(baseDuration);
}