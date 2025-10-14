import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ensureYouTubeApiIsReady } from '../services/youtubeService';

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

    useEffect(() => {
        if (!playerContainerRef.current) return;

        let isCancelled = false;

        const createPlayer = () => {
            if (!isMountedRef.current || !playerContainerRef.current || isCancelled) return;
            if (!window.YT || typeof window.YT.Player !== 'function') return;

            const playerVars: YT.PlayerOptions['playerVars'] = {
                autoplay: 1,
                controls: 0,
                showinfo: 0,
                rel: 0,
                modestbranding: 1,
                loop: loop ? 1 : 0,
                fs: 0,
                iv_load_policy: 3,
                mute: initialMuteRef.current ? 1 : 0,
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

                        applyMuteState(event.target, desiredMuteRef.current);
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

        const player = playerRef.current;
        applyMuteState(player, isMuted);
    }, [applyMuteState, isPlayerReady, isMuted]);


    return <div ref={playerContainerRef} className="w-full h-full" />;
};

export default VideoPlayer;