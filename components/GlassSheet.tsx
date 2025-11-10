import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { liquidTokens, glassSurfaceStyle } from '../utils/liquidDesignTokens';

interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children?: React.ReactNode;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const GlassSheet: React.FC<GlassSheetProps> = ({ isOpen, onClose, ariaLabel = 'Sheet dialog', children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = prefersReducedMotion();

  const side: 'bottom' | 'right' = useMemo(() => {
    if (typeof window === 'undefined') return 'bottom';
    return window.innerWidth >= 900 ? 'right' : 'bottom';
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previousActive = document.activeElement as HTMLElement | null;
    containerRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        // basic focus trap: keep focus inside container
        const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      previousActive?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const slideInitial = side === 'bottom' ? { y: 20, opacity: 0 } : { x: 20, opacity: 0 };
  const slideAnimate = side === 'bottom' ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex',
        alignItems: side === 'bottom' ? 'flex-end' : 'stretch',
        justifyContent: side === 'right' ? 'flex-end' : 'stretch',
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
      }}
    >
      <motion.div
        role="document"
        ref={containerRef}
        tabIndex={-1}
        initial={reduceMotion ? undefined : slideInitial}
        animate={reduceMotion ? undefined : slideAnimate}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
        style={{
          width: side === 'right' ? 'min(540px, 86vw)' : '100%',
          height: side === 'bottom' ? 'min(540px, 76vh)' : '100%',
          borderTopLeftRadius: side === 'bottom' ? liquidTokens.radii.large : 0,
          borderTopRightRadius: side === 'bottom' ? liquidTokens.radii.large : 0,
          borderLeft: side === 'right' ? `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}` : 'none',
          borderTop: side === 'bottom' ? `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}` : 'none',
          ...glassSurfaceStyle({ blur: liquidTokens.blur.large, tintAlpha: 0.16 }),
          boxShadow: liquidTokens.shadow.sheet,
          backdropFilter: `blur(${liquidTokens.blur.large}px) saturate(${liquidTokens.saturationBoost})`,
          WebkitBackdropFilter: `blur(${liquidTokens.blur.large}px) saturate(${liquidTokens.saturationBoost})`,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default GlassSheet;

