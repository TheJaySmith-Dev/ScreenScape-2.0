import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { liquidTokens } from '../utils/liquidDesignTokens';
import { getDominantColorFromImage } from '../utils/dominantColor';
import { getTrending, getFanArtLogoBackdrop, getFanArtLogo } from '../services/tmdbService';
import { useAppleTheme } from './AppleThemeProvider';
import { FANART_API_KEY } from '../utils/genscapeKeys';

interface GlassHeroProps {
  apiKey: string;
  onSelectItem?: (item: any) => void;
  onInvalidApiKey?: () => void;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w1280';

const GlassHero: React.FC<GlassHeroProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
  const [item, setItem] = useState<any | null>(null);
  const [trendingList, setTrendingList] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [tintColor, setTintColor] = useState<string | null>(null);
  const [blendOpacity, setBlendOpacity] = useState<number>(0);
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const [fanArtBackdrop, setFanArtBackdrop] = useState<string | null>(null);
  const [fanArtLogo, setFanArtLogo] = useState<string | null>(null);
  const { tokens } = useAppleTheme();
  const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const heroIndexRef = useRef<number>(0);
  
  // Image source state for fallback handling
  const tmdbBackdrop = item?.backdrop_path ? `${TMDB_IMG}${item.backdrop_path}` : undefined;
  const [currentBackdrop, setCurrentBackdrop] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCurrentBackdrop(fanArtBackdrop || tmdbBackdrop);
  }, [fanArtBackdrop, tmdbBackdrop]);

  useEffect(() => {
    setBlendOpacity(1);
    let cancelled = false;
    (async () => {
      try {
        const res = await getTrending(apiKey);
        const results = Array.isArray(res?.results) ? res.results : [];
        const picked = results.find((it: any) => it.backdrop_path) || results[0] || null;
        if (!cancelled) setTrendingList(results);
        if (!cancelled) setItem(picked);
        if (picked && !cancelled) {
          const idx = results.findIndex((x: any) => x?.id === picked.id);
          setHeroIndex(idx >= 0 ? idx : 0);
          heroIndexRef.current = idx >= 0 ? idx : 0;
        }
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

  useEffect(() => { heroIndexRef.current = heroIndex; }, [heroIndex]);

  // FanArt Integration
  useEffect(() => {
    let cancelled = false;
    const fetchFanArt = async () => {
        if (!item) {
            if (!cancelled) {
                setFanArtBackdrop(null);
                setFanArtLogo(null);
            }
            return;
        }
        
        try {
            const [url, logoUrl] = await Promise.all([
                getFanArtLogoBackdrop(apiKey, FANART_API_KEY, item),
                getFanArtLogo(apiKey, FANART_API_KEY, item)
            ]);

            if (!cancelled) {
                setFanArtBackdrop(url);
                setFanArtLogo(logoUrl);
                if (url) {
                    const color = await getDominantColorFromImage(url);
                    setTintColor(color);
                } else if (logoUrl && tmdbBackdrop) {
                    // If no FanArt backdrop, we use TMDb backdrop, check color from that
                    // (Already handled in main flow, but good to ensure consistency)
                }
            }
        } catch (e) {
            console.warn('GlassHero FanArt fetch error:', e);
        }
    };
    fetchFanArt();
    return () => { cancelled = true; };
  }, [item, apiKey]);

  const advanceHero = async (step: number = 1) => {
    try {
      if (!Array.isArray(trendingList) || trendingList.length === 0) return;
      const len = trendingList.length;
      let nextIdx = ((heroIndexRef.current + step) % len + len) % len;
      const nextItem = trendingList[nextIdx];
      if (!nextItem) return;
      setItem(nextItem);
      setHeroIndex(nextIdx);
      heroIndexRef.current = nextIdx;
      try {
        if (nextItem?.backdrop_path) {
          const imgUrl = `${TMDB_IMG}${nextItem.backdrop_path}`;
          const color = await getDominantColorFromImage(imgUrl);
          setTintColor(color);
        }
      } catch {}
    } catch {}
  };

  useEffect(() => {
    if (!Array.isArray(trendingList) || trendingList.length === 0) return;
    const timer = setInterval(() => {
        advanceHero(1);
    }, 10000);
    return () => clearInterval(timer);
  }, [trendingList, heroIndex]); // Re-run when list or index changes to ensure fresh state for advanceHero

  if (!item) return null;
  const title = item.title || item.name || 'Featured';
  
  const tintOverlay = tintColor ? `${tintColor}` : 'rgb(160,180,220)';

  return (
    <>
    <section
      ref={heroContainerRef}
      aria-label="Featured Hero"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 12px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
        filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55)) drop-shadow(0 12px 28px rgba(0,0,0,0.40))',
        marginTop: isMobile ? 40 : 32,
        zIndex: 0,
      }}
    >
      {/* Backdrop */}
      {currentBackdrop && (
        <img
          src={currentBackdrop}
          alt={title}
          decoding="async"
          loading="lazy"
          onError={(e) => {
             // If currently showing FanArt and it fails, try TMDb.
             // If already TMDb or no fallback, hide.
             if (currentBackdrop === fanArtBackdrop && tmdbBackdrop) {
                 setCurrentBackdrop(tmdbBackdrop);
             } else {
                 e.currentTarget.style.display = 'none'; 
             }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, rgba(0,0,0,${isMobile ? 0.35 : 0.25}), transparent 35%), linear-gradient(to top, rgba(0,0,0,${isMobile ? 0.35 : 0.25}), transparent 55%)`,
          opacity: blendOpacity,
          transition: 'opacity 1200ms ease'
        }}
      />

      {/* Tint + glass veil */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.35)), radial-gradient(900px 500px at 88% 82%, ${tintOverlay}33, transparent)`,
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Top veil for legibility */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,${isMobile ? 0.35 : 0.25}), transparent 30%)` }} />
      
      {/* Logo Overlay - Only if using fallback background (no text in image) */}
      {currentBackdrop === tmdbBackdrop && fanArtLogo && (
        <div 
          style={{ 
            position: 'absolute', 
            bottom: isMobile ? '30%' : '28%', // Positioned above the controls area
            left: isMobile ? '50%' : 24, 
            transform: isMobile ? 'translateX(-50%)' : 'none',
            width: '100%', 
            maxWidth: isMobile ? '240px' : '360px',
            zIndex: 2,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}
        >
          <img 
            src={fanArtLogo} 
            alt={title} 
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: isMobile ? '80px' : '120px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' 
            }} 
          />
        </div>
      )}

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
        <div className="hidden sm:block" style={{ position: 'absolute', left: 24, top: 'calc(50% + 84px)' }}>
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
            Info
          </motion.button>
        </div>
        
      </div>

      {/* Attribution */}
      {isMobile && (
        <div
          aria-hidden
          style={{ position: 'absolute', right: 16, bottom: 24, zIndex: 3 }}
        >
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
            alt="TMDb"
            loading="lazy"
            decoding="async"
            style={{ height: 32, width: 32, opacity: 0.9, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))' }}
          />
        </div>
      )}

    </section>
    {/* Mobile below-hero controls */}
    {item && (
      <div className="sm:hidden" style={{ marginTop: 24, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
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
          Info
        </motion.button>
      </div>
    )}
    </>
  );
};

export default GlassHero;
