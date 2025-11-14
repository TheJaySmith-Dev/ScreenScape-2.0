import React, { useEffect, useRef, useState } from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';
import ImaxView from '../components/ImaxView';
import { MediaItem } from '../types';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GlassPillButton } from '../components/GlassPillButton';

const getApiKey = (): string => {
  return localStorage.getItem('tmdb_api_key') || '09b97a49759876f2fde9eadb163edc44';
};

const ImaxPage: React.FC = () => {
  const apiKey = getApiKey();
  const navigate = useNavigate();
  const location = useLocation();
  // Show intro only for direct entry (home or URL), not when returning from a detail page
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      const st = (location?.state || {}) as any;
      const fromDetail = !!st?.fromDetail;
      return !fromDetail;
    } catch {
      return true;
    }
  });
  const ytPlayerRef = useRef<any>(null);
  const introContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize YouTube IFrame API and play intro video muted, autoplay, end at 48s
  useEffect(() => {
    if (!showIntro) return;

    const VIDEO_ID = 'n5HbQ7vCvDY'; // from https://youtu.be/n5HbQ7vCvDY
    let didCleanup = false;

    const createPlayer = () => {
      try {
        const YT = (window as any).YT;
        if (!YT || !YT.Player || ytPlayerRef.current) return;
        ytPlayerRef.current = new YT.Player('imaxIntroPlayer', {
          host: 'https://www.youtube-nocookie.com',
          videoId: VIDEO_ID,
          playerVars: {
            autoplay: 1,
            loop: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            playsinline: 1,
            origin: (typeof window !== 'undefined' ? window.location.origin : undefined)
          },
          events: {
            onReady: (event: any) => {
              try {
                // Ensure muted autoplay succeeds
                event?.target?.mute?.();
                // Load with explicit endSeconds to stop at 48s
                event?.target?.loadVideoById({ videoId: VIDEO_ID, startSeconds: 0, endSeconds: 48 });
                event?.target?.playVideo?.();
                // Force playback quality: prefer 4K (highres), else 1080p
                try {
                  const levels = event?.target?.getAvailableQualityLevels?.() || [];
                  const target = levels.includes('highres') ? 'highres' : (levels.includes('hd1080') ? 'hd1080' : null);
                  if (target && event?.target?.setPlaybackQuality) {
                    event.target.setPlaybackQuality(target);
                  }
                } catch {}
                // Force iframe to fill the screen in case default sizing is applied
                try {
                  const iframe = introContainerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
                  if (iframe) {
                    iframe.style.position = 'absolute';
                    iframe.style.inset = '0';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                  }
                } catch {}
              } catch {}
            },
            onPlaybackQualityChange: (event: any) => {
              // Re-pin quality if YouTube lowers it
              try {
                const levels = event?.target?.getAvailableQualityLevels?.() || [];
                const target = levels.includes('highres') ? 'highres' : (levels.includes('hd1080') ? 'hd1080' : null);
                if (target && event?.target?.setPlaybackQuality) {
                  event.target.setPlaybackQuality(target);
                }
              } catch {}
            },
            onStateChange: (event: any) => {
              try {
                const ENDED = (window as any).YT?.PlayerState?.ENDED ?? 0;
                if (event?.data === ENDED) {
                  // Explicitly stop and destroy to guarantee no restart
                  try { event?.target?.stopVideo?.(); } catch {}
                  try { event?.target?.destroy?.(); } catch {}
                  setShowIntro(false);
                }
              } catch {}
            }
          }
        });
      } catch {}
    };

    const ensureApiScript = () => {
      try {
        const win = window as any;
        if (win.YT && win.YT.Player) {
          createPlayer();
          return;
        }
        // Only inject once
        const existing = document.querySelector('script[src*="youtube.com/iframe_api"]') as HTMLScriptElement | null;
        if (!existing) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.async = true;
          document.body.appendChild(tag);
        }
        // Hook global ready
        const prev = (win as any).onYouTubeIframeAPIReady;
        (win as any).onYouTubeIframeAPIReady = () => {
          try { if (typeof prev === 'function') prev(); } catch {}
          createPlayer();
        };
      } catch {}
    };

    ensureApiScript();

    return () => {
      didCleanup = true;
      try {
        const p = ytPlayerRef.current;
        if (p && p.destroy) p.destroy();
      } catch {}
      ytPlayerRef.current = null;
    };
  }, [showIntro]);
  const handleSelectItem = (item: MediaItem) => {
    const prefix = '/IMAX';
    if (item.media_type === 'tv') {
      navigate(`${prefix}/t.${item.id}`);
    } else {
      // Simplify movie route: drop the m. prefix
      navigate(`${prefix}/${item.id}`);
    }
  };

  const handleInvalidApiKey = () => {
    // Soft-noop in this standalone route
    console.warn('Invalid TMDb API key');
  };

  const ImaxBlueWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tokens } = useAppleTheme();
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          // IMAX brand blue (#0072CE) gradient with subtle radial glow
          background:
            `radial-gradient(1000px 420px at 50% -200px, rgba(0, 114, 206, 0.22), transparent),` +
            `linear-gradient(180deg, #0072CE 0%, #003F7A 56%, #0A0A0A 100%)`,
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <AppleThemeProvider>
      {showIntro ? (
        // Fullscreen intro overlay with YouTube player, muted autoplay, no UI
        <div
          ref={introContainerRef}
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#000', zIndex: 9999 }}
        >
          <div id="imaxIntroPlayer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          {/* Occlude any residual YouTube title or info icon at the top */}
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64, background: '#000', pointerEvents: 'none' }} />
          {/* Occlude the bottom-right corner to hide YouTube logo/watermark */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 180,
              height: 72,
              background: '#000',
              pointerEvents: 'none'
            }}
          />
        </div>
      ) : (
        <ImaxBlueWrapper>
          <ImaxView apiKey={apiKey} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />
        </ImaxBlueWrapper>
      )}
    </AppleThemeProvider>
  );
};

export default ImaxPage;

const MarvelHub: React.FC = () => {
  const { tokens } = useAppleTheme();
  const navigate = useNavigate();
  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.micro[2],
    padding: tokens.spacing.standard[1],
    borderRadius: 16,
    border: `1px solid ${tokens.colors.separator.opaque}`,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)'
  };
  const titleStyle: React.CSSProperties = {
    fontFamily: tokens.typography.families.display,
    fontSize: tokens.typography.sizes.title2,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.label.primary,
    margin: 0
  };
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: `${tokens.spacing.standard[1]}px ${tokens.spacing.standard[0]}px` }}>
      <section style={sectionStyle}>
        <h2 style={titleStyle}>Marvel Studios</h2>
        <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
          <img
            src="https://static.wikia.nocookie.net/logopedia/images/f/f2/Marvel_Studios_Logo_%282016%2C_2021_Enhanced%29.jpg/revision/latest?cb=20220516180728"
            alt="Marvel Studios logo"
            style={{ width: '100%', height: 'auto', borderRadius: 12, background: '#000', cursor: 'pointer' }}
            loading="lazy"
          />
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: tokens.spacing.standard[1] }}>
          <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
            <img
              src="https://image.tmdb.org/t/p/original/tIvtw32cndE0h0aqLiyGleIFpXY.jpg"
              alt="Iron Man"
              style={{ width: '100%', height: 'auto', borderRadius: 12, cursor: 'pointer' }}
              loading="lazy"
            />
          </Link>
          <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
            <img
              src="https://image.tmdb.org/t/p/w1280/1fGblAmaE2wU6ts2A83eWBgkmHs.jpg"
              alt="Thor"
              style={{ width: '100%', height: 'auto', borderRadius: 12, cursor: 'pointer' }}
              loading="lazy"
            />
          </Link>
          <Link to="/IMAX/Marvel" style={{ display: 'block' }}>
            <img
              src="https://image.tmdb.org/t/p/original/qgru2heRmIunkW34roGkj9ADclc.jpg"
              alt="Captain America"
              style={{ width: '100%', height: 'auto', borderRadius: 12, cursor: 'pointer' }}
              loading="lazy"
            />
          </Link>
        </div>
        <div style={{ marginTop: tokens.spacing.standard[0], display: 'flex', justifyContent: 'flex-start' }}>
          <Link to="/IMAX/Marvel" style={{ textDecoration: 'none' }}>
            <GlassPillButton>
              View Marvel Studios Trailers
            </GlassPillButton>
          </Link>
        </div>
      </section>
    </div>
  );
};
