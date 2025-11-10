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
  }
}


interface VideoPlayerProps {
    videoKey: string;
    isMuted: boolean;
    onEnd: () => void;
    loop?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey, isMuted, onEnd, loop = false }) => {
    const playerRef = useRef<YT.Player | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const isMountedRef = useRef(false);
    const initialMuteRef = useRef(isMuted);
    const desiredMuteRef = useRef(isMuted);
    const lastVideoKeyRef = useRef<string | null>(null);
    const onEndRef = useRef(onEnd);
    const { tokens } = useAppleTheme();

    // Local, user-controlled mute state with persistence
    const [muted, setMuted] = useState<boolean>(true);
    const [policyMuted, setPolicyMuted] = useState<boolean>(false);

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
                        lastVideoKeyRef.current = null;
                        setIsPlayerReady(true);
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
        } catch (error) {
            console.error('Failed to load YouTube video', error);
        }
    }, [isPlayerReady, videoKey]);

    useEffect(() => {
        if (!isPlayerReady || !playerRef.current) return;

        // Always start muted for autoplay; honor local user toggle thereafter
        const player = playerRef.current;
        const shouldMute = muted;
        applyMuteState(player, shouldMute);
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
