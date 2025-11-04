import { useCallback } from 'react';

/**
 * Apple Animation Effects Hook
 * Provides standardized animation effects for Apple Liquid Glass design system
 */
export const useAppleAnimationEffects = () => {
  // Hover effect with subtle scale and opacity changes
  const applyHoverEffect = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    if (!event) return; // Skip if no event provided
    const element = event.currentTarget;
    element.style.transform = 'scale(1.02)';
    element.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }, []);

  // Press effect with scale down
  const applyPressEffect = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.style.transform = 'scale(0.98)';
    element.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }, []);

  // Reset effect to return to normal state
  const resetEffect = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.style.transform = 'scale(1)';
    element.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }, []);

  // Focus effect for accessibility
  const applyFocusEffect = useCallback((event: React.FocusEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.style.outline = '2px solid rgba(0, 122, 255, 0.6)';
    element.style.outlineOffset = '2px';
  }, []);

  // Remove focus effect
  const removeFocusEffect = useCallback((event: React.FocusEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.style.outline = 'none';
  }, []);

  // Pulse animation for notifications
  const applyPulseEffect = useCallback((element: HTMLElement) => {
    element.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
  }, []);

  // Fade in animation
  const applyFadeInEffect = useCallback((element: HTMLElement) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(10px)';
    element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    
    // Trigger animation
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }, []);

  // Slide in from right animation
  const applySlideInEffect = useCallback((element: HTMLElement) => {
    element.style.transform = 'translateX(100%)';
    element.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
    });
  }, []);

  return {
    applyHoverEffect,
    applyPressEffect,
    resetEffect,
    applyFocusEffect,
    removeFocusEffect,
    applyPulseEffect,
    applyFadeInEffect,
    applySlideInEffect,
  };
};

export default useAppleAnimationEffects;