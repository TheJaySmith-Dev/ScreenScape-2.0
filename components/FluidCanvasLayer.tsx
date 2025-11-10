import React, { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

type FluidCanvasLayerProps = {
  containerRef?: React.RefObject<HTMLElement>;
  strength?: number;
  resolutionScale?: number;
};

export default function FluidCanvasLayer({ containerRef, strength = 1, resolutionScale = 0.6 }: FluidCanvasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  const fitCanvas = () => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * resolutionScale));
    const h = Math.max(1, Math.floor(rect.height * resolutionScale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fitCanvas();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const takeSnapshot = async () => {
      try {
        const host = containerRef?.current as HTMLElement | undefined;
        const prevVis = host?.style.visibility;
        if (host) host.style.visibility = 'hidden';
        const snap = await html2canvas(document.body, {
          useCORS: true,
          backgroundColor: null,
          logging: false,
          scale: 1,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
        if (host) host.style.visibility = prevVis ?? '';
        snapshotCanvasRef.current = snap;
      } catch {
        snapshotCanvasRef.current = null;
      }
    };

    takeSnapshot();

    const onPointerMove = (ev: MouseEvent) => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / Math.max(1, rect.width);
      const y = (ev.clientY - rect.top) / Math.max(1, rect.height);
      pointerRef.current = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    const onResize = () => fitCanvas();
    window.addEventListener('resize', onResize);

    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      fitCanvas();
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const radius = 28 * resolutionScale;
      ctx.save();
      ctx.beginPath();
      const r = radius;
      ctx.moveTo(r, 0);
      ctx.arcTo(w, 0, w, h, r);
      ctx.arcTo(w, h, 0, h, r);
      ctx.arcTo(0, h, 0, 0, r);
      ctx.arcTo(0, 0, w, 0, r);
      ctx.closePath();
      ctx.clip();

      const stripes = Math.max(32, Math.floor(w / 6));
      const stripeW = w / stripes;
      const snap = snapshotCanvasRef.current;

      for (let i = 0; i < stripes; i++) {
        const x = i * stripeW;
        const nx = i / stripes;
        const wave = Math.sin(nx * 16 + t * 1.2) + Math.sin(nx * 9 - t * 0.9);
        const rippleCenterX = pointerRef.current.x;
        const d = Math.abs(nx - rippleCenterX) + 1e-4;
        const ripple = Math.sin(14 * d - t * 4) * Math.exp(-8 * d);
        const offsetY = (h * 0.02 * strength) * wave + (h * 0.03 * strength) * ripple;

        if (snap) {
          const sx = Math.floor((x / w) * snap.width);
          const sw = Math.floor((stripeW / w) * snap.width);
          const sy = Math.floor(((window.scrollY || 0) / Math.max(1, window.innerHeight)) * snap.height);
          const sh = Math.min(snap.height - sy, Math.floor((h / h) * snap.height));
          ctx.drawImage(snap, sx, sy, sw, sh, x, offsetY, stripeW, h);
        } else {
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, 'rgba(18,20,26,0.9)');
          g.addColorStop(1, 'rgba(26,28,34,0.9)');
          ctx.fillStyle = g;
          ctx.fillRect(x, offsetY, stripeW, h);
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      const glare = ctx.createRadialGradient(w * 0.2, h * 0.0, h * 0.2, w * 0.2, h * 0.0, h * 0.8);
      glare.addColorStop(0, 'rgba(255,255,255,0.08)');
      glare.addColorStop(1, 'rgba(255,255,255,0.00)');
      ctx.fillStyle = glare;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', onResize);
    };
  }, [containerRef, strength, resolutionScale]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 28,
        pointerEvents: 'none',
        mixBlendMode: 'soft-light',
        willChange: 'opacity, transform',
      }}
    />
  );
}

