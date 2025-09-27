import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoKey: string;
  isMuted?: boolean;
  isPlaying: boolean;
  onStateChange?: (state: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey, isMuted = false, isPlaying, onStateChange }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const createPlayer = () => {
      if (playerInstanceRef.current || !playerRef.current) return;

      playerInstanceRef.current = new (window as any).YT.Player(playerRef.current, {
        videoId: videoKey,
        playerVars: {
          autoplay: isMuted ? 1 : 0,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          mute: isMuted ? 1 : 0,
          playsinline: 1,
          loop: 1,
          playlist: videoKey,
        },
        events: {
          'onReady': (event: any) => {
            if (isPlaying && isMuted) {
              event.target.playVideo();
            }
          },
          'onStateChange': (event: any) => {
            if (onStateChange) {
              onStateChange(event.data);
            }
          },
        },
      });
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      const existingCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (existingCallback) {
          existingCallback();
        }
        createPlayer();
      };
    } else {
      createPlayer();
    }
  }, [videoKey, isMuted, onStateChange]);

  useEffect(() => {
    if (!playerInstanceRef.current || typeof playerInstanceRef.current.getPlayerState !== 'function') {
      return;
    }

    const player = playerInstanceRef.current;
    setTimeout(() => {
      if (!player.getPlayerState) return;
      const playerState = player.getPlayerState();
      if (isPlaying && playerState !== 1) {
        player.playVideo();
      } else if (!isPlaying && playerState === 1) {
        player.pauseVideo();
      }
    }, 150);

  }, [isPlaying]);

  const showThumbnail = !isPlaying && !isMuted;

  return (
    <div className="w-full h-full relative bg-black">
      <div ref={playerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
      {showThumbnail && (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <img
            src={`https://img.youtube.com/vi/${videoKey}/maxresdefault.jpg`}
            alt="Video thumbnail"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoKey}/hqdefault.jpg`; }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;