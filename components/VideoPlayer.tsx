import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ensureYouTubeApiIsReady } from '../services/youtubeService';
import { isMobileDevice } from '../utils/deviceDetection';
import { useAppleTheme } from './AppleThemeProvider';
import { Volume2, VolumeX } from 'lucide-react';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerOptions {
    videoId?: string;
    playerVars?: {
      autoplay?: 0 | 1;
      controls?: 0 | 1 | 2;
      showinfo?: 0 | 1;
      rel?: 0 | 1;
      modestbranding?: 1;
      loop?: 0 | 1;
      playlist?: string;
      fs?: 0 | 1;
      iv_load_policy?: 3;
      mute?: 0 | 1;
    };
    events?: {
      onReady?: (event: { target: Player }) => void;
      onStateChange?: (event: { data: PlayerState; target: Player }) => void;
      onPlaybackQualityChange?: (event: { data: string; target: Player }) => void;
      onError?: (event: { data: number; target: Player }) => void;
    };
  }

  class Player {
    constructor(element: string | HTMLDivElement, options: PlayerOptions);
    destroy(): void;
    mute(): void;
    unMute(): void;
    playVideo(): void;
    isMuted(): boolean;
    loadVideoById(videoId: string): void;
    setPlaybackQuality(suggestedQuality: string): void;
    getAvailableQualityLevels(): string[];
    setVolume(volume: number): void;
  }
}


interface VideoPlayerProps {
    videoKey: string;
    isMuted: boolean;
    onEnd: () => void;
    loop?: boolean;
    boostAudio?: boolean;
    onTimeUpdate?: (timeSec: number) => void;
    onReady?: (player: any) => void;
    fallbackKeys?: string[];
    onError?: (code: number) => void;
    onAlternateSelected?: (key: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey, isMuted, onEnd, loop = false, boostAudio = false, onTimeUpdate, onReady, fallbackKeys, onError, onAlternateSelected }) => {
    const playerRef = useRef<YT.Player | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const isMountedRef = useRef(false);
    const initialMuteRef = useRef(isMuted);
    const desiredMuteRef = useRef(isMuted);
    const lastVideoKeyRef = useRef<string | null>(null);
    const onEndRef = useRef(onEnd);
    const { tokens } = useAppleTheme();
    const timePollRef = useRef<number | null>(null);

    // Local, user-controlled mute state with persistence
  const [muted, setMuted] = useState<boolean>(true);
  const [policyMuted, setPolicyMuted] = useState<boolean>(false);
  const [playerErrorCode, setPlayerErrorCode] = useState<number | null>(null);
  const fallbackIndexRef = useRef<number>(0);

    const applyMuteState = useCallback((player: YT.Player | null, shouldMute: boolean) => {
        if (!player) return;

        try {
            if (shouldMute) {
                if (typeof player.mute === 'function') {
                    player.mute();
                }
                return;
            }

            if (typeof player.unMute === 'function') {
                player.unMute();
            }

            if (typeof player.playVideo === 'function') {
                player.playVideo();
            }

            // Boost audio volume for IMAX trailers when unmuted
            try {
                if (boostAudio && typeof player.setVolume === 'function') {
                    player.setVolume(100);
                }
            } catch {}
        } catch (error) {
            console.error('Failed to sync YouTube player audio state', error);
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        initialMuteRef.current = isMuted;
        desiredMuteRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        onEndRef.current = onEnd;
    }, [onEnd]);

    // Initialize local mute state from localStorage or props
    useEffect(() => {
        try {
            const stored = localStorage.getItem('trailerAudioMuted');
            if (stored !== null) {
                const prefMuted = stored === 'true';
                setMuted(prefMuted);
                desiredMuteRef.current = prefMuted;
                initialMuteRef.current = prefMuted;
            } else {
                // Default to muted to ensure autoplay across browsers
                const defaultMuted = true;
                setMuted(defaultMuted);
                desiredMuteRef.current = defaultMuted;
                initialMuteRef.current = defaultMuted;
            }
        } catch {
            // Fallback if localStorage not available
            const defaultMuted = true;
            setMuted(defaultMuted);
            desiredMuteRef.current = defaultMuted;
            initialMuteRef.current = defaultMuted;
        }
    }, []);

    useEffect(() => {
        if (!playerContainerRef.current) return;

        let isCancelled = false;

        const createPlayer = () => {
            if (!isMountedRef.current || !playerContainerRef.current || isCancelled) return;
            if (!window.YT || typeof window.YT.Player !== 'function') return;

            // Always start muted to comply with autoplay policies across browsers
            const muteValue = 1;

      const playerVars: YT.PlayerOptions['playerVars'] = {
        autoplay: 1,
        controls: 0,
        showinfo: 0,
        rel: 0,
        modestbranding: 1,
        loop: loop ? 1 : 0,
        fs: 0,
        iv_load_policy: 3,
        mute: muteValue,
      };

            if (loop) {
                playerVars.playlist = videoKey;
            }

            playerRef.current = new window.YT.Player(playerContainerRef.current, {
                playerVars: playerVars,
                events: {
                onReady: (event) => {
                        if (!isMountedRef.current || isCancelled) {
                            return;
                        }

                        // Attempt to honor user preference on ready;
                        // browsers may keep audio muted until user gesture
                        applyMuteState(event.target, desiredMuteRef.current);
                        try {
                            const actuallyMuted = event.target.isMuted();
                            setPolicyMuted(actuallyMuted);
                            setMuted(actuallyMuted);
                        } catch {}

                        // Force playback quality to 4K if available, else 1080p
                        try {
                            const levels = (event.target as any)?.getAvailableQualityLevels?.() || [];
                            const target = levels.includes('highres') ? 'highres' : (levels.includes('hd1080') ? 'hd1080' : null);
                            if (target && (event.target as any)?.setPlaybackQuality) {
                                (event.target as any).setPlaybackQuality(target);
                            }
                        } catch {}
                        lastVideoKeyRef.current = null;
                        setIsPlayerReady(true);
                        if (typeof onReady === 'function') {
                            try { onReady(event.target as any); } catch {}
                        }
                        if (typeof onTimeUpdate === 'function') {
                            const poll = () => {
                                try {
                                    const t = (event.target as any)?.getCurrentTime?.() ?? 0;
                                    onTimeUpdate(t || 0);
                                } catch {}
                                timePollRef.current = window.requestAnimationFrame(poll);
                            };
                            timePollRef.current = window.requestAnimationFrame(poll);
                        }
                    },
                    onStateChange: (event) => {
                        if (!isMountedRef.current || isCancelled) {
                            return;
                        }

                        try {
                            if (window.YT && event.data === window.YT.PlayerState.ENDED) {
                                onEndRef.current();
                            }
                        } catch (error) {
                            console.error('YouTube player state change handler failed', error);
                        }
                    },
                    onPlaybackQualityChange: (event) => {
                        // Re-pin quality if YouTube lowers it
                        try {
                            const player = event.target as any;
                            const levels = player?.getAvailableQualityLevels?.() || [];
                            const target = levels.includes('highres') ? 'highres' : (levels.includes('hd1080') ? 'hd1080' : null);
                            if (target && player?.setPlaybackQuality) {
                                player.setPlaybackQuality(target);
                            }
                        } catch {}
                    },
                    onError: (event) => {
                      try {
                        const code = (event as any)?.data;
                        const numCode = typeof code === 'number' ? code : -1;
                        onError?.(numCode);
                        const keys = Array.isArray(fallbackKeys) ? fallbackKeys.filter(k => typeof k === 'string' && k.length > 0) : [];
                        if (keys.length > 0) {
                          const current = lastVideoKeyRef.current || videoKey;
                          let idx = keys.indexOf(current);
                          if (idx < 0) idx = fallbackIndexRef.current || 0;
                          let nextIdx = idx + 1;
                          if (nextIdx < keys.length) {
                            try {
                              const nextKey = keys[nextIdx];
                              fallbackIndexRef.current = nextIdx;
                              lastVideoKeyRef.current = nextKey;
                              setPlayerErrorCode(null);
                              (event.target as any)?.loadVideoById?.(nextKey);
                              onAlternateSelected?.(nextKey);
                              return;
                            } catch {}
                          }
                        }
                        setPlayerErrorCode(numCode);
                      } catch {
                        setPlayerErrorCode(-1);
                      }
                    },
                },
            });
        };

        ensureYouTubeApiIsReady().then(createPlayer);

        return () => {
            isCancelled = true;
            playerRef.current?.destroy();
            playerRef.current = null;
            if (isMountedRef.current) {
                setIsPlayerReady(false);
            }
            lastVideoKeyRef.current = null;
            if (timePollRef.current) {
                window.cancelAnimationFrame(timePollRef.current);
                timePollRef.current = null;
            }
        };
    }, [applyMuteState, loop, videoKey]);

    useEffect(() => {
        if (!isPlayerReady || !playerRef.current || !videoKey) {
            return;
        }

        if (lastVideoKeyRef.current === videoKey) {
            return;
        }

        try {
            playerRef.current.loadVideoById(videoKey);
            lastVideoKeyRef.current = videoKey;
            fallbackIndexRef.current = Math.max(0, (Array.isArray(fallbackKeys) ? fallbackKeys.indexOf(videoKey) : 0));
        } catch (error) {
            console.error('Failed to load YouTube video', error);
        }
    }, [isPlayerReady, videoKey, fallbackKeys]);

    useEffect(() => {
        if (!isPlayerReady || !playerRef.current) return;

        // Always start muted for autoplay; honor local user toggle thereafter
        const player = playerRef.current;
        const shouldMute = muted;
        applyMuteState(player, shouldMute);

        // Reassert quality after load
        try {
            const levels = (player as any)?.getAvailableQualityLevels?.() || [];
            const target = levels.includes('highres') ? 'highres' : (levels.includes('hd1080') ? 'hd1080' : null);
            if (target && (player as any)?.setPlaybackQuality) {
                (player as any).setPlaybackQuality(target);
            }
        } catch {}
    }, [applyMuteState, isPlayerReady, muted]);

    const handleToggleMute = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;

        const nextMuted = !muted;
        setMuted(nextMuted);
        try {
            localStorage.setItem('trailerAudioMuted', String(nextMuted));
        } catch {}
        applyMuteState(player, nextMuted);

        // Dispatch event to keep external listeners in sync
        try {
            const action = nextMuted ? 'mute' : 'unmute';
            window.dispatchEvent(new CustomEvent('controlTrailerAudio', { detail: { action } }));
        } catch {}
    }, [muted, applyMuteState]);

    return (
      <div className="relative w-full h-full">
        <div ref={playerContainerRef} className="w-full h-full" />
        {playerErrorCode !== null && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.5)'
            }}
          >
            <div
              className="flex flex-col items-center gap-3"
              style={{
                background: tokens?.materials?.pill?.primary?.background || 'rgba(255,255,255,0.15)',
                backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(12px)',
                WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(12px)',
                borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255,255,255,0.2)',
                boxShadow: tokens?.shadows?.medium || '0 4px 16px rgba(0,0,0,0.2)',
                color: tokens?.colors?.text?.primary || '#fff',
                borderWidth: 1,
                borderStyle: 'solid',
                borderRadius: tokens?.borderRadius?.pill || 16,
                padding: `${tokens?.spacing?.small || 10}px ${tokens?.spacing?.medium || 14}px`
              }}
            >
              <span style={{ fontFamily: tokens?.typography?.families?.text, fontWeight: tokens?.typography?.weights?.medium }}>Playback restricted</span>
              <button
                type="button"
                onClick={() => {
                  try {
                    const url = `https://www.youtube.com/watch?v=${videoKey}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  } catch {}
                }}
                className="flex items-center gap-2"
                style={{
                  background: tokens?.colors?.accent?.blue || '#1f6feb',
                  color: '#fff',
                  borderRadius: tokens?.borderRadius?.pill || 9999,
                  padding: `${tokens?.spacing?.xsmall || 6}px ${tokens?.spacing?.small || 10}px`,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: tokens?.typography?.families?.text,
                  fontWeight: tokens?.typography?.weights?.medium
                }}
                aria-label="Watch on YouTube"
              >
                Watch on YouTube
              </button>
            </div>
          </div>
        )}
        {/* Accessible Unmute/Mute Control Overlay */}
        <button
          type="button"
          onClick={handleToggleMute}
          aria-pressed={!muted}
                aria-label={muted ? 'Unmute trailer audio' : 'Mute trailer audio'}
                className="absolute left-3 bottom-3 flex items-center gap-2"
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
                    fontFamily: tokens?.typography?.families?.text,
                    fontWeight: tokens?.typography?.weights?.medium,
                    transition: tokens?.interactions?.transitions?.fast || 'all 0.2s ease-in-out',
                    cursor: 'pointer'
                }}
            >
                {muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                <span>{muted ? (policyMuted ? 'Muted. Tap to unmute' : 'Muted') : 'Sound on'}</span>
            </button>
        </div>
    );
};

export default VideoPlayer;
