import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { liquidTokens, glassSurfaceStyle, supportsBackdropFilter } from '../utils/liquidDesignTokens';
import MediaTitleLogo from './MediaTitleLogo';
import { getDominantColorFromImage } from '../utils/dominantColor';
import { getTrending, getMovieVideos, getTVShowVideos } from '../services/tmdbService';

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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [shouldPlay, setShouldPlay] = useState<boolean>(false);
  const [blendOpacity, setBlendOpacity] = useState<number>(0);

  useEffect(() => {
    setBlendOpacity(1);
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
    setVideoUrl(null);
    setShouldPlay(false);
    if (!item) return;
    let cancelled = false;
    let timerId: number | null = null;
    let cutoffTimerId: number | null = null;
    const run = async () => {
      try {
        const resp = item.media_type === 'movie'
          ? await getMovieVideos(apiKey, item.id)
          : await getTVShowVideos(apiKey, item.id);
        const vids = Array.isArray(resp?.results) ? resp.results : [];
        const pick =
          vids.find(v => v.site === 'YouTube' && /tv\s*spot/i.test((v.name || ''))) ||
          vids.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
          vids.find(v => v.site === 'YouTube' && v.type === 'Trailer');
        if (pick && (pick as any).key) {
          const url = `https://www.youtube.com/embed/${(pick as any).key}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1`;
          if (!cancelled) setVideoUrl(url);
        }
        timerId = window.setTimeout(() => {
          if (!cancelled) setShouldPlay(true);
        }, 5000);
        cutoffTimerId = window.setTimeout(() => {
          if (!cancelled) setShouldPlay(false);
        }, 90000);
      } catch {}
    };
    run();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      if (cutoffTimerId) clearTimeout(cutoffTimerId);
    };
  }, [item, apiKey]);

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
        height: '60vh',
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
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 35%), linear-gradient(to top, rgba(0,0,0,0.35), transparent 55%)',
          opacity: blendOpacity,
          transition: 'opacity 1200ms ease'
        }}
      />
      {shouldPlay && videoUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden'
          }}
        >
          <iframe
            src={videoUrl}
            title="Hero Trailer"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.2)',
              width: '100%',
              height: '100%'
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
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
        <div className="hidden sm:block" style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)' }}>
          <MediaTitleLogo
            media={item}
            apiKey={apiKey}
            size="large"
            fallbackToText={false}
            style={{ maxWidth: 200, maxHeight: 100, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          />
        </div>
        <div className="sm:hidden" style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)' }}>
          <MediaTitleLogo
            media={item}
            apiKey={apiKey}
            size="medium"
            fallbackToText={false}
            style={{ maxWidth: 160, maxHeight: 80, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
          />
        </div>

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
