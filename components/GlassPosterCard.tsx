import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { liquidTokens, glassSurfaceStyle, supportsBackdropFilter } from '../utils/liquidDesignTokens';
import GlassLogoChip from './GlassLogoChip';
import GlassBadges from './GlassBadges';
import { getDominantColorFromImage } from '../utils/dominantColor';

interface MediaItem {
  id: string | number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
}

interface GlassPosterCardProps {
  item: MediaItem;
  tmdbImageBase?: string; // e.g. https://image.tmdb.org/t/p/w500
  onClick?: (item: MediaItem) => void;
}

const pickTitle = (item: MediaItem) => item.title || item.name || 'Untitled';

const GlassPosterCard: React.FC<GlassPosterCardProps> = ({ item, tmdbImageBase = 'https://image.tmdb.org/t/p/w500', onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [tintColor, setTintColor] = useState<string | null>(null);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const p = item.poster_path || item.backdrop_path;
    if (p) {
      const url = `${tmdbImageBase}${p}`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = async () => {
        setPosterUrl(url);
        setLoaded(true);
        try {
          const color = await getDominantColorFromImage(url);
          if (color) setTintColor(color);
        } catch {}
      };
      img.onerror = () => { setPosterUrl(null); setLoaded(true); };
    } else {
      setPosterUrl(null);
      setLoaded(true);
    }
  }, [item.poster_path, item.backdrop_path, tmdbImageBase]);

  const rating = useMemo(() => {
    if (typeof item.vote_average === 'number') {
      const pct = Math.round((item.vote_average / 10) * 100);
      return `${pct}%`; // TMDb style converted to 0–100
    }
    return null;
  }, [item.vote_average]);

  return (
    <motion.div
      role="button"
      aria-label={pickTitle(item)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, filter: 'brightness(1.05)', boxShadow: liquidTokens.shadow.cardHover }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick?.(item)}
      style={{
        width: 180,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: 270,
        borderRadius: liquidTokens.radii.large,
        overflow: 'hidden',
        ...glassSurfaceStyle({ blur: liquidTokens.blur.medium, tintAlpha: supportsBackdropFilter() ? 0.16 : 0.22 }),
        boxShadow: liquidTokens.shadow.card,
      }}>
        {/* Blurred echo behind poster */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            aria-hidden
            decoding="async"
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.06)',
              filter: 'blur(12px) saturate(1.2)',
              opacity: 0.7,
            }}
          />
        )}

        {/* Poster image */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={pickTitle(item)}
            decoding="async"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(1.2)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(60,60,70,0.6), rgba(30,30,40,0.6))'
          }} />
        )}

        {/* Dynamic tint overlay for material reading */}
        {tintColor && (
          <div aria-hidden style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(800px 400px at 10% 10%, ${tintColor}22, transparent)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Top overlay chips */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 8 }}>
          {rating && (
            <GlassBadges label={rating} variant="rating" />
          )}
        </div>

        {/* Play hover affordance */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: liquidTokens.radii.small,
            ...glassSurfaceStyle({ blur: liquidTokens.blur.small, tintAlpha: supportsBackdropFilter() ? 0.12 : 0.2 }),
          }}
        >
          <Play size={16} color="white" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Trailer</span>
        </motion.div>

        {/* Optional reflection sweep */}
        {!reduceMotion && (
          <motion.div
            aria-hidden
            initial={{ left: '-40%' }}
            whileHover={{ left: '140%' }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '35%',
              background: 'linear-gradient(60deg, rgba(255,255,255,0.0), rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.0))',
              filter: 'blur(2px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Edge vignette to read as slab */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(120px 120px at 10% 10%, rgba(0,0,0,0.0), rgba(0,0,0,0.12))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <GlassLogoChip text={pickTitle(item)} />
      </div>
    </motion.div>
  );
};

export default GlassPosterCard;
