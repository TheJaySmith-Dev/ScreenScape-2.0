import React, { useEffect, useState, useCallback } from 'react';
import { MediaItem, Movie, TVShow } from '../types';
import MediaRow from './MediaRow';
import { useAppleTheme } from './AppleThemeProvider';
import { getMovieVideosImaxOnly, getTVShowVideosImaxOnly, searchMovies } from '../services/tmdbService';
import { resolveCuratedMediaItems, getCuratedTrailerKeyForItem } from '../services/imaxCuratedService';
import VideoPlayer from './VideoPlayer';
import BackdropOverlay from './BackdropOverlay';
import { X } from 'lucide-react';
import MediaTitleLogo from './MediaTitleLogo';

interface ImaxViewProps {
  apiKey: string;
  onSelectItem: (item: MediaItem) => void;
  onInvalidApiKey: () => void;
}

const IMAX_LOGO_URL = 'https://i.ibb.co/G47CHyhg/toppng-com-imax-michael-jackson-thriller-imax-445x87.png';

const ImaxView: React.FC<ImaxViewProps> = ({ apiKey, onSelectItem }) => {
  const { tokens } = useAppleTheme();
  const [imaxCuratedItems, setImaxCuratedItems] = useState<MediaItem[]>([]);
  const [marvelItems, setMarvelItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVideoKey, setExpandedVideoKey] = useState<string | null>(null);
  const [expandedCandidateKeys, setExpandedCandidateKeys] = useState<string[] | null>(null);
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);
  const [expandedBackdropUrl, setExpandedBackdropUrl] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState<boolean>(false);
  const [trailerError, setTrailerError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [imaxAudioActivated, setImaxAudioActivated] = useState<boolean>(false);
  const audioCtxRef = React.useRef<any>(null);
  const activateImaxAudio = React.useCallback(() => {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC({ latencyHint: 'playback' } as any);
      audioCtxRef.current = ctx;
      // Short bass thump to emulate cinema woofer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 40;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      setTimeout(() => { try { ctx.close(); } catch {} }, 1000);
      setImaxAudioActivated(true);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadImaxContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const curatedItems = await resolveCuratedMediaItems(apiKey);
        if (!cancelled) {
          setImaxCuratedItems(curatedItems);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load IMAX content');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadImaxContent();
    return () => { cancelled = true; };
  }, [apiKey]);

  // Marvel and Spider-Man MCU trailers list to resolve into TMDb items
  const MARVEL_TRAILERS: Array<{ title: string; releaseDate: string }> = [
    { title: 'Spider-Man: Homecoming | IMAX Trailer', releaseDate: '2017-07-07' },
    { title: 'Avengers: Infinity War | IMAX Trailer', releaseDate: '2018-04-27' },
    { title: 'Captain Marvel | IMAX Trailer', releaseDate: '2019-03-08' },
    { title: 'Avengers: Endgame | IMAX Trailer', releaseDate: '2019-04-26' },
    { title: 'Spider-Man: Far From Home | IMAX Trailer', releaseDate: '2019-07-02' },
    { title: 'Black Widow | IMAX Trailer', releaseDate: '2021-07-09' },
    { title: 'Eternals | IMAX Trailer', releaseDate: '2021-11-05' },
    { title: 'Spider-Man: No Way Home | IMAX Trailer', releaseDate: '2021-12-17' },
    { title: 'Doctor Strange in the Multiverse of Madness | IMAX Trailer', releaseDate: '2022-05-06' },
    { title: 'Thor: Love and Thunder | IMAX Trailer', releaseDate: '2022-07-08' },
    { title: 'Black Panther: Wakanda Forever | IMAX Trailer', releaseDate: '2022-11-11' },
    { title: 'Ant-Man and the Wasp: Quantumania | IMAX Trailer', releaseDate: '2023-02-17' },
    { title: 'Guardians of the Galaxy Vol. 3 | IMAX Trailer', releaseDate: '2023-05-05' },
    { title: 'Thunderbolts* | IMAX Teaser', releaseDate: '2025-05-02' },
    { title: 'The Fantastic Four: First Steps', releaseDate: '2025-07-25' },
  ];

  // Specific TMDb ID overrides where title-to-search may be ambiguous
  const OVERRIDES: Record<string, { id: number; title?: string }> = {
    'The Fantastic Four: First Steps': { id: 617126, title: 'The Fantastic Four: First Steps' },
  };

  useEffect(() => {
    let cancelled = false;
    const baseTitle = (t: { title: string }) => t.title.split(' | ')[0].trim();
    const sorted = [...MARVEL_TRAILERS].sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    const loadMarvel = async () => {
      try {
        const found = await Promise.all(sorted.map(async (t) => {
          try {
            const override = OVERRIDES[t.title];
            if (override) {
              return {
                id: override.id,
                title: override.title || t.title,
                poster_path: null,
                backdrop_path: null,
                release_date: t.releaseDate,
                media_type: 'movie',
                genre_ids: [],
                popularity: 0,
                vote_average: 0,
              } as MediaItem;
            }
            const res = await searchMovies(apiKey, baseTitle(t), 1);
            const first = (res.results || [])[0];
            if (first && first.id) {
              const item: MediaItem = {
                id: first.id,
                title: (first as any).title || t.title,
                poster_path: (first as any).poster_path || null,
                backdrop_path: (first as any).backdrop_path || null,
                release_date: (first as any).release_date || t.releaseDate,
                media_type: 'movie',
                genre_ids: (first as any).genre_ids || [],
                popularity: (first as any).popularity || 0,
                vote_average: (first as any).vote_average || 0
              };
              return item;
            }
          } catch { /* ignore */ }
          return null;
        }));
        if (!cancelled) {
          const deduped: Record<number, MediaItem> = {};
          for (const it of found) {
            if (it && !deduped[it.id]) deduped[it.id] = it;
          }
          setMarvelItems(Object.values(deduped));
        }
      } catch { /* ignore */ }
    };
    loadMarvel();
    return () => { cancelled = true; };
  }, [apiKey]);

  const handlePosterSelect = useCallback(async (item: MediaItem) => {
    setTrailerLoading(true);
    setTrailerError(null);
    try {
      // Prefer curated trailer key if available
      const curatedKey = getCuratedTrailerKeyForItem(item);
      if (curatedKey) {
        setExpandedVideoKey(curatedKey);
        setExpandedCandidateKeys([curatedKey]);
        setExpandedTitle((item as any).title || (item as any).name || null);
        // Build backdrop URL for 16:9 expansion using TMDb path if present
        const path = (item as any).backdrop_path as string | null;
        let url: string | null = null;
        if (path) {
          url = path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w1280${path}`;
        }
        setExpandedBackdropUrl(url);
        setSelectedItem(item);
        setImaxAudioActivated(false);
      } else {
        // Fallback to IMAX-only TMDb videos if curated key not present
        let resp: { results: Array<{ key: string }> } | null = null;
        if (item.media_type === 'movie') {
          resp = await getMovieVideosImaxOnly(apiKey, item.id);
        } else if (item.media_type === 'tv') {
          resp = await getTVShowVideosImaxOnly(apiKey, item.id);
        }

        const first = resp && resp.results && resp.results.length > 0 ? resp.results[0] : null;
        if (first && first.key) {
          setExpandedVideoKey(first.key);
          try {
            const keys = (resp?.results || []).map(r => r.key).filter(k => typeof k === 'string');
            setExpandedCandidateKeys(keys.length ? keys : [first.key]);
          } catch { setExpandedCandidateKeys([first.key]); }
          setExpandedTitle((item as any).title || (item as any).name || null);
          const path = (item as any).backdrop_path as string | null;
          let url: string | null = null;
          if (path) {
            url = path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w1280${path}`;
          }
          setExpandedBackdropUrl(url);
          setSelectedItem(item);
          setImaxAudioActivated(false);
        } else {
          setTrailerError('IMAX trailer not available for this title.');
          setExpandedVideoKey(null);
          setExpandedTitle(null);
          setExpandedBackdropUrl(null);
          setSelectedItem(null);
        }
      }
    } catch (e: any) {
      setTrailerError(e?.message || 'Failed to load IMAX trailer.');
      setExpandedVideoKey(null);
      setExpandedTitle(null);
      setExpandedBackdropUrl(null);
      setSelectedItem(null);
      setImaxAudioActivated(false);
    } finally {
      setTrailerLoading(false);
    }
  }, [apiKey]);

  return (
    <div className="ImaxView" style={{ width: '100%' }}>
      {/* Cinematic header: Movie Logo | IMAX */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingTop: `calc(${tokens.spacing.standard[2]}px + env(safe-area-inset-top))`,
          paddingBottom: `${tokens.spacing.standard[1]}px`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: (() => { const t = (selectedItem as any)?.title || (selectedItem as any)?.name || ''; const lower = (t || '').toLowerCase(); return (lower === 'michael' || lower === 'micheal') ? 6 : tokens.spacing.standard[1]; })() }}>
          {/* Movie title logo left, only when a selection exists */}
          {selectedItem && (
            <MediaTitleLogo
              media={selectedItem}
              apiKey={apiKey}
              size="small"
              style={{
                textShadow: '0 2px 6px rgba(0,0,0,0.9)'
              }}
              fallbackToText={true}
              maxHeightPx={(() => { const t = (selectedItem as any)?.title || (selectedItem as any)?.name || ''; const lower = (t || '').toLowerCase(); return (lower === 'michael' || lower === 'micheal') ? 36 : undefined; })()}
              overrideUrl={(() => {
                const title = (selectedItem as any)?.title || (selectedItem as any)?.name || '';
                const lower = (title || '').toLowerCase();
                return (lower === 'michael' || lower === 'micheal')
                  ? 'https://image.tmdb.org/t/p/original/xGXVipsn5kx6Q7XL7zPQOQnbYvz.png'
                  : undefined;
              })()}
            />
          )}

          {/* Separator line between movie logo and IMAX */}
          {selectedItem && (
            <div
              aria-hidden="true"
              style={{
                width: '1px',
                height: '32px',
                background: tokens.colors.separator.nonOpaque,
                opacity: 0.8
              }}
            />
          )}

          {/* IMAX logo right */}
          <img
            src={IMAX_LOGO_URL}
            alt="IMAX"
            style={{ height: '32px', width: 'auto' }}
            loading="lazy"
          />
        </div>
      </div>

      {/* Expanded IMAX Trailer Player (16:9) */}
      {(expandedVideoKey || trailerLoading || trailerError) && (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#0072CE',
          marginBottom: tokens.spacing.standard[1],
          boxShadow: tokens.shadows.medium,
          borderRadius: tokens.borderRadius.large || 12,
          overflow: 'hidden'
        }}>
          {/* Backdrop behind the player to visually anchor 16:9 expansion */}
          {expandedBackdropUrl && (
            <BackdropOverlay
              backdropUrl={expandedBackdropUrl}
              isVisible={true}
            />
          )}
          {expandedVideoKey && (
            <>
              {!imaxAudioActivated && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 10 }}>
                  <button
                    type="button"
                    onClick={activateImaxAudio}
                    style={{
                      padding: '14px 24px', borderRadius: 9999,
                      border: '1px solid #FFFFFF', color: '#FFFFFF',
                      background: 'rgba(0,114,206,0.15)', cursor: 'pointer',
                      fontFamily: 'Nexa, -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: 14,
                      boxShadow: '0 0 24px rgba(0,114,206,0.35)'
                    }}
                  >
                    Activate IMAX Audio
                  </button>
                </div>
              )}
              <VideoPlayer
                videoKey={expandedVideoKey}
                isMuted={true}
                onEnd={() => {}}
                loop={false}
                boostAudio={true}
                fallbackKeys={expandedCandidateKeys || undefined}
                onAlternateSelected={(k) => { try { setExpandedVideoKey(k); } catch {} }}
              />
            </>
          )}

          {trailerLoading && (
            <div className="flex items-center justify-center w-full h-full" style={{ color: tokens.colors.label.secondary }}>
              Loading IMAX trailer...
            </div>
          )}

          {trailerError && !expandedVideoKey && (
            <div className="flex items-center justify-center w-full h-full" style={{ color: tokens.colors.label.primary }}>
              {trailerError}
            </div>
          )}

          {/* Close button */}
          {(expandedVideoKey || trailerError) && (
            <button
              type="button"
              onClick={() => { setExpandedVideoKey(null); setTrailerError(null); setExpandedTitle(null); setExpandedBackdropUrl(null); }}
              aria-label="Close trailer"
              className="absolute right-3 top-3"
              style={{
                background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.15)',
                backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(12px)',
                WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(12px)',
                borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                boxShadow: tokens?.shadows?.medium || '0 4px 16px rgba(0, 0, 0, 0.2)',
                color: tokens?.colors?.text?.primary || '#fff',
                borderWidth: 1,
                borderStyle: 'solid',
                borderRadius: tokens?.borderRadius?.pill || 9999,
                padding: `${tokens?.spacing?.xsmall || 6}px ${tokens?.spacing?.small || 10}px`,
                cursor: 'pointer'
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}

          {/* Title badge */}
          {expandedTitle && expandedVideoKey && (
            <div className="absolute left-3 top-3" style={{
              background: tokens?.materials?.pill?.secondary?.background || 'rgba(255, 255, 255, 0.10)',
              backdropFilter: tokens?.materials?.pill?.secondary?.backdropFilter || 'blur(12px)',
              WebkitBackdropFilter: tokens?.materials?.pill?.secondary?.backdropFilter || 'blur(12px)',
              borderColor: tokens?.materials?.pill?.secondary?.border || 'rgba(255, 255, 255, 0.2)',
              color: tokens?.colors?.text?.primary || '#fff',
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: tokens?.borderRadius?.pill || 9999,
              padding: `${tokens?.spacing?.xsmall || 6}px ${tokens?.spacing?.small || 10}px`,
              fontFamily: tokens?.typography?.families?.text,
              fontWeight: tokens?.typography?.weights?.medium
            }}>
              {expandedTitle}
            </div>
          )}
        </div>
      )}

      {/* Hubs removed per requirement; IMAX content rows only */}

      {/* Content rows */}
      {error && (
        <div className="apple-callout" style={{ color: tokens.colors.label.primary, textAlign: 'center', marginBottom: tokens.spacing.standard[1] }}>
          {error}
        </div>
      )}

      <div style={{ opacity: loading ? 0.6 : 1 }}>
        {imaxCuratedItems.length > 0 && (
          <MediaRow
            title="IMAX Curated"
            items={imaxCuratedItems}
            onSelectItem={onSelectItem}
            apiKey={apiKey}
            imaxOnlyTrailers={true}
            titleColor="#ffffff"
            titleStyle={{
              fontFamily: 'Nexa, -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontWeight: 800,
              textShadow: 'none'
            }}
          />
        )}
        {marvelItems.length > 0 && (
          <MediaRow
            title="Marvel Studios"
            items={marvelItems}
            onSelectItem={onSelectItem}
            apiKey={apiKey}
            imaxOnlyTrailers={true}
            titleColor="#ffffff"
            titleStyle={{
              fontFamily: 'Nexa, -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontWeight: 800,
              textShadow: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ImaxView;
