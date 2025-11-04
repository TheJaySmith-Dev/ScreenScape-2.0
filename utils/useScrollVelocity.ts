/**
 * useScrollVelocity
 * Computes scroll velocity and direction in a performant, RAF-driven loop.
 * Returns velocity in px/s and a normalized direction vector.
 */
import { useEffect, useRef, useState } from 'react';

export interface ScrollVelocity {
  velocityY: number; // px/s
  velocityX: number; // px/s (for horizontal scroll containers)
  directionY: number; // -1 up, +1 down, 0 still
  directionX: number; // -1 left, +1 right, 0 still
}

export function useScrollVelocity(target: Window | HTMLElement = window): ScrollVelocity {
  const [vel, setVel] = useState<ScrollVelocity>({ velocityY: 0, velocityX: 0, directionY: 0, directionX: 0 });
  const lastPosYRef = useRef<number>(0);
  const lastPosXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);
  const lastEmitRef = useRef<ScrollVelocity>({ velocityY: 0, velocityX: 0, directionY: 0, directionX: 0 });

  useEffect(() => {
    let mounted = true;
    const isWindow = target === window;

    const getScrollY = () => (isWindow ? window.scrollY : (target as HTMLElement).scrollTop);
    const getScrollX = () => (isWindow ? window.scrollX : (target as HTMLElement).scrollLeft);

    // Initialize
    lastPosYRef.current = getScrollY();
    lastPosXRef.current = getScrollX();
    lastTimeRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current); // ms
      const y = getScrollY();
      const x = getScrollX();
      const dy = y - lastPosYRef.current;
      const dx = x - lastPosXRef.current;

      // Velocity in px/s
      const vy = (dy / dt) * 1000;
      const vx = (dx / dt) * 1000;

      // Direction
      const dirY = Math.abs(vy) < 0.5 ? 0 : vy > 0 ? 1 : -1;
      const dirX = Math.abs(vx) < 0.5 ? 0 : vx > 0 ? 1 : -1;

      // Only emit when velocity or direction meaningfully changes to avoid re-render loops
      const prev = lastEmitRef.current;
      const epsilon = 0.5; // px/s threshold
      const changed =
        Math.abs(vy - prev.velocityY) > epsilon ||
        Math.abs(vx - prev.velocityX) > epsilon ||
        dirY !== prev.directionY ||
        dirX !== prev.directionX;

      if (mounted && changed) {
        const next = { velocityY: vy, velocityX: vx, directionY: dirY, directionX: dirX };
        lastEmitRef.current = next;
        setVel(next);
      }

      lastPosYRef.current = y;
      lastPosXRef.current = x;
      lastTimeRef.current = now;
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [target]);

  return vel;
}