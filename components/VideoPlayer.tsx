import React, { useEffect, useRef, useState } from 'react';
import { ensureYouTubeApiIsReady } from '../services/youtubeService';

interface VideoPlayerProps {
  videoKey: string;
  isMuted: boolean;
  onEnd?: () => void;
  loop?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey, isMuted, onEnd, loop = false }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // This effect synchronizes the player's mute state with the component's state.
  useEffect(() => {
    if (isPlayerReady && playerInstance.current && typeof playerInstance.current.mute === 'function') {
      if (isMuted) {
        playerInstance.current.mute();
      } else {
        playerInstance.current.unMute();
      }
    }
  }, [isMuted, isPlayerReady]);

  // This effect creates and destroys the YouTube player instance.
  useEffect(() => {
    if (!videoKey || !playerRef.current) return;

    let isComponentMounted = true;
    setIsPlayerReady(false);

    const playerContainerNode = playerRef.current;
    
    const initializePlayer = () => {
      if (!isComponentMounted || !playerContainerNode) return;

      const onPlayerReady = (event: any) => {
        // Mute and play manually for robust autoplay across browsers.
        event.target.mute();
        event.target.playVideo();
        if (isComponentMounted) {
            setIsPlayerReady(true);
        }
      };

      const onPlayerStateChange = (event: any) => {
        // YT is defined on window by the YouTube IFrame API script
        if (event.data === (window as any).YT.PlayerState.ENDED && onEnd) {
          onEnd();
        }
      };

      const playerVars: any = {
        controls: 0,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
      };

      if (loop) {
        playerVars.loop = 1;
        playerVars.playlist = videoKey;
      }

      playerInstance.current = new (window as any).YT.Player(playerContainerNode, {
        videoId: videoKey,
        playerVars,
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
        }
      });
    };

    // Wait for the YouTube API to be ready, then initialize the player.
    ensureYouTubeApiIsReady().then(initializePlayer);

    return () => {
      isComponentMounted = false;
      if (playerInstance.current && typeof playerInstance.current.destroy === 'function') {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [videoKey, loop, onEnd]);
  
  return (
    <div className="w-full h-full">
      <div ref={playerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
    </div>
  );
};

export default VideoPlayer;