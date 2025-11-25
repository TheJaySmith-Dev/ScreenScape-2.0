import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { liquidTokens, glassSurfaceStyle, supportsBackdropFilter } from '../utils/liquidDesignTokens';
import MediaTitleLogo from './MediaTitleLogo';
import { getDominantColorFromImage } from '../utils/dominantColor';
import { getTrending, getMovieVideos, getTVShowVideos } from '../services/tmdbService';
import { ensureYouTubeApiIsReady } from '../services/youtubeService';
import { useAppleTheme } from './AppleThemeProvider';

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
  const [trendingList, setTrendingList] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [tintColor, setTintColor] = useState<string | null>(null);
  const scrollYRef = useRef(0);
  const reduceMotion = prefersReducedMotion();
  const [videoId, setVideoId] = useState<string | null>(null);
  const [shouldPlay, setShouldPlay] = useState<boolean>(false);
  const [blendOpacity, setBlendOpacity] = useState<number>(0);
  const heroPlayerRef = useRef<any>(null);
  const heroPlayerContainerRef = useRef<HTMLDivElement>(null);
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const { tokens } = useAppleTheme();
  const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const heroIndexRef = useRef<number>(0);

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

  useEffect(() => {
    const updateHeight = () => {
      try {
        const el = heroContainerRef.current;
        if (!el) return;
        const w = el.offsetWidth || 0;
        const maxH = (typeof window !== 'undefined' ? window.innerHeight * 0.72 : 720);
        const h = Math.min(w * (9 / 16), maxH);
        setHeroHeight(h);
      } catch {}
    };
    updateHeight();
    window.addEventListener('resize', updateHeight, { passive: true });
    return () => window.removeEventListener('resize', updateHeight);
  }, [isMobile]);

  useEffect(() => { heroIndexRef.current = heroIndex; }, [heroIndex]);

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
      setShouldPlay(false);
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
    setVideoId(null);
    setShouldPlay(false);
    if (!item) return;
    let cancelled = false;
    let timerId: number | null = null;
    const run = async () => {
      try {
        const resp = item.media_type === 'movie'
          ? await getMovieVideos(apiKey, item.id)
          : await getTVShowVideos(apiKey, item.id);
        const vids = Array.isArray(resp?.results) ? resp.results : [];
        const isRedBand = (v: any) => /red\s*band/i.test(String(v?.name || ''));
        const yt = vids.filter(v => v.site === 'YouTube');
        const rank = (arr: any[]) => arr.filter(v => !isRedBand(v));
        const pick = rank(yt.filter(v => v.type === 'Trailer' && (v as any).official))[0]
          || rank(yt.filter(v => v.type === 'Trailer'))[0]
          || rank(yt.filter(v => v.type === 'Teaser'))[0]
          || rank(yt.filter(v => /tv\s*spot/i.test(String(v?.name || ''))))[0]
          || rank(yt)[0];
        if (pick && (pick as any).key) {
          if (!cancelled) setVideoId((pick as any).key);
        } else {
          for (let i = 0; i < Math.min(8, trendingList.length); i++) {
            const candidate = trendingList[i];
            if (!candidate || candidate.id === item.id) continue;
            const r2 = candidate.media_type === 'movie'
              ? await getMovieVideos(apiKey, candidate.id)
              : await getTVShowVideos(apiKey, candidate.id);
            const vids2 = Array.isArray(r2?.results) ? r2.results : [];
            const yt2 = vids2.filter(v => v.site === 'YouTube');
            const alt = rank(yt2.filter(v => v.type === 'Trailer' && (v as any).official))[0]
              || rank(yt2.filter(v => v.type === 'Trailer'))[0]
              || rank(yt2.filter(v => v.type === 'Teaser'))[0]
              || rank(yt2.filter(v => /tv\s*spot/i.test(String(v?.name || ''))))[0]
              || rank(yt2)[0];
            if (alt && (alt as any).key) {
              if (!cancelled) {
                setItem(candidate);
                const idx2 = trendingList.findIndex((x: any) => x?.id === candidate.id);
                setHeroIndex(idx2 >= 0 ? idx2 : heroIndexRef.current);
                heroIndexRef.current = idx2 >= 0 ? idx2 : heroIndexRef.current;
                setVideoId((alt as any).key);
                if (candidate?.backdrop_path) {
                  try {
                    const imgUrl = `${TMDB_IMG}${candidate.backdrop_path}`;
                    const color = await getDominantColorFromImage(imgUrl);
                    setTintColor(color);
                  } catch {}
                }
              }
              break;
            }
          }
        }
        timerId = window.setTimeout(() => {
          if (!cancelled) setShouldPlay(true);
        }, 5000);
      } catch {}
    };
    run();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [item, apiKey, trendingList]);

  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      if (!shouldPlay || !videoId) return;
      if (!heroPlayerContainerRef.current) return;
      await ensureYouTubeApiIsReady();
      if (cancelled) return;
      try {
        if (heroPlayerRef.current) {
          try { heroPlayerRef.current.destroy(); } catch {}
          heroPlayerRef.current = null;
        }
        const YTObj = (window as any).YT;
        if (!YTObj || !YTObj.Player) return;
        heroPlayerRef.current = new YTObj.Player(heroPlayerContainerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3
          },
          events: {
            onStateChange: (event: any) => {
              try {
                const ENDED = (window as any).YT?.PlayerState?.ENDED ?? 0;
                if (event?.data === ENDED) {
                  setShouldPlay(false);
                  try { heroPlayerRef.current?.destroy?.(); } catch {}
                  heroPlayerRef.current = null;
                  advanceHero(1);
                }
              } catch {}
            }
          }
        });
      } catch {}
    };
    setup();
    return () => {
      cancelled = true;
      try { heroPlayerRef.current?.destroy?.(); } catch {}
      heroPlayerRef.current = null;
    };
  }, [shouldPlay, videoId]);

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
        minHeight: isMobile ? 0 : 360,
        height: heroHeight ?? (isMobile ? 'calc(100vw * 9 / 16)' : undefined),
        maxHeight: isMobile ? undefined : '72vh',
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
          background: `linear-gradient(to bottom, rgba(0,0,0,${isMobile ? 0.35 : 0.25}), transparent 35%), linear-gradient(to top, rgba(0,0,0,${isMobile ? 0.35 : 0.25}), transparent 55%)`,
          opacity: blendOpacity,
          transition: 'opacity 1200ms ease'
        }}
      />
      {shouldPlay && videoId && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden'
          }}
        >
          <div ref={heroPlayerContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }} />
        </div>
      )}

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
        <div className="hidden sm:block" style={{ position: 'absolute', left: 24, top: 'calc(50% + 24px)', transform: 'translateY(-50%)' }}>
          <MediaTitleLogo
            media={item}
            apiKey={apiKey}
            size="large"
            fallbackToText={false}
            style={{ maxWidth: 200, maxHeight: 100, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          />
        </div>
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
        <MediaTitleLogo
          media={item}
          apiKey={apiKey}
          size="medium"
          fallbackToText={false}
          style={{ maxWidth: 160, maxHeight: 80, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
        />
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
