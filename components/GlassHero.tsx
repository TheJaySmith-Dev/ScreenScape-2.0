import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { liquidTokens, glassSurfaceStyle, supportsBackdropFilter } from '../utils/liquidDesignTokens';
import GlassLogoChip from './GlassLogoChip';
import { getDominantColorFromImage } from '../utils/dominantColor';
import { getTrending } from '../services/tmdbService';

interface GlassHeroProps {
  apiKey: string;
  onSelectItem?: (item: any) => void;
  onInvalidApiKey?: () => void;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w1280';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const GlassHero: React.FC<GlassHeroProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
  const [item, setItem] = useState<any | null>(null);
  const [tintColor, setTintColor] = useState<string | null>(null);
  const scrollYRef = useRef(0);
  const reduceMotion = prefersReducedMotion();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTrending(apiKey);
        const picked = res?.results?.find((it: any) => it.backdrop_path) || res?.results?.[0] || null;
        if (!cancelled) setItem(picked);
        if (picked?.backdrop_path) {
          const url = `${TMDB_IMG}${picked.backdrop_path}`;
          const color = await getDominantColorFromImage(url);
          if (!cancelled) setTintColor(color);
        }
      } catch (e) {
        onInvalidApiKey?.();
      }
    })();
    return () => { cancelled = true; };
  }, [apiKey, onInvalidApiKey]);

  useEffect(() => {
    if (reduceMotion) return;
    const onScroll = () => {
      scrollYRef.current = window.scrollY || 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduceMotion]);

  const parallax = useMemo(() => {
    if (reduceMotion) return 0;
    const offset = Math.max(-6, Math.min(6, (scrollYRef.current - 0) * -0.04));
    return offset; // capped few pixels opposite scroll
  }, [reduceMotion, scrollYRef.current]);

  if (!item) return null;
  const title = item.title || item.name || 'Featured';
  const backdropUrl = item.backdrop_path ? `${TMDB_IMG}${item.backdrop_path}` : undefined;

  const tintOverlay = tintColor ? `${tintColor}` : 'rgb(160,180,220)';

  return (
    <section
      aria-label="Featured Hero"
      style={{
        position: 'relative',
        height: '56vh',
        minHeight: 380,
        overflow: 'hidden',
        borderRadius: liquidTokens.radii.large,
        boxShadow: liquidTokens.shadow.sheet,
      }}
    >
      {/* Backdrop */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={title}
          decoding="async"
          loading="lazy"
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            width: 'calc(100% + 40px)',
            height: 'calc(100% + 40px)',
            objectFit: 'cover',
            transform: `translateY(${parallax}px)`,
            filter: 'blur(8px) saturate(1.2)',
          }}
        />
      )}

      {/* Tint + glass veil */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.35)), radial-gradient(1200px 600px at 10% 10%, ${tintOverlay}33, transparent)`,
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Top/Bottom veils for legibility */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 30%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent 50%)' }} />

      {/* Foreground content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: '100%',
          padding: '20px 24px 28px',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <GlassLogoChip text={title} />
        </div>
        {item.overview && (
          <div
            style={{
              maxWidth: 820,
              fontSize: 16,
              color: 'rgba(255,255,255,0.92)',
              ...glassSurfaceStyle({ blur: liquidTokens.blur.small, tintAlpha: supportsBackdropFilter() ? 0.12 : 0.2 }),
              borderRadius: liquidTokens.radii.medium,
              border: `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}`,
              padding: '12px 14px',
              boxShadow: liquidTokens.shadow.card,
            }}
          >
            {item.overview}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <motion.button
            whileHover={{ y: -2, filter: 'brightness(1.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectItem?.(item)}
            style={{
              cursor: 'pointer',
              padding: '10px 16px',
              borderRadius: liquidTokens.radii.medium,
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              border: `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}`,
              boxShadow: liquidTokens.shadow.card,
            }}
          >
            Play
          </motion.button>
        </div>
      </div>

      {/* Attribution */}
      <div
        aria-hidden
        style={{ position: 'absolute', right: 12, bottom: 10, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}
      >
        Data: TMDb / OMDb
      </div>
    </section>
  );
};

export default GlassHero;

