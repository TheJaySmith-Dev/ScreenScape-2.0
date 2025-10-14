import React, { useEffect, useRef, useState } from 'react';
import { ensureYouTubeApiIsReady } from '../services/youtubeService';

// Add TypeScript declarations for the YouTube IFrame Player API to resolve compilation errors.
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

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Effect to create and destroy the player ONCE.
    useEffect(() => {
        if (!playerContainerRef.current) return;

        const createPlayer = () => {
            if (!isMountedRef.current || !playerContainerRef.current) return;
            
            const playerVars: YT.PlayerOptions['playerVars'] = {
                autoplay: 1,
                controls: 0,
                showinfo: 0,
                rel: 0,
                modestbranding: 1,
                loop: loop ? 1 : 0,
                fs: 0,
                iv_load_policy: 3,
                mute: 1,
            };

            if (loop) {
                playerVars.playlist = videoKey;
            }

            playerRef.current = new window.YT.Player(playerContainerRef.current, {
                playerVars: playerVars,
                events: {
                    onReady: () => {
                        if (isMountedRef.current) {
                            setIsPlayerReady(true);
                        }
                    },
                    onStateChange: (event) => {
                        if (isMountedRef.current && event.data === window.YT.PlayerState.ENDED) {
                            onEnd();
                        }
                    },
                },
            });
        };

        ensureYouTubeApiIsReady().then(createPlayer);

        return () => {
            playerRef.current?.destroy();
        };
    }, [onEnd]);

    // Effect to load a new video when the key changes or player becomes ready.
    useEffect(() => {
        if (isPlayerReady && playerRef.current && videoKey) {
            playerRef.current.loadVideoById(videoKey);
        }
    }, [isPlayerReady, videoKey]);

    // Effect to handle mute/unmute toggles.
    useEffect(() => {
        if (isPlayerReady && playerRef.current && typeof playerRef.current.mute === 'function') {
            if (isMuted) {
                playerRef.current.mute();
            } else {
                playerRef.current.unMute();
            }
        }
    }, [isPlayerReady, isMuted]);


    return <div ref={playerContainerRef} className="w-full h-full" />;
};

export default VideoPlayer;