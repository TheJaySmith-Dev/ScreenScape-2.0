import React, { useEffect, useRef, useState } from 'react';

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
  // It runs whenever the mute state changes OR when the player becomes ready.
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
  // It runs whenever the videoKey changes.
  useEffect(() => {
    if (!videoKey || !playerRef.current) return;

    // Reset player ready state for the new video
    setIsPlayerReady(false);

    const onPlayerReady = (event: any) => {
      // For reliable autoplay, we must mute the player first, then play.
      event.target.mute();
      event.target.playVideo();
      setIsPlayerReady(true);
    };

    const onPlayerStateChange = (event: any) => {
      // YT is defined on window by the YouTube IFrame API script
      if (event.data === (window as any).YT.PlayerState.ENDED && onEnd) {
        onEnd();
      }
    };

    const playerContainerNode = playerRef.current;
    
    // We control autoplay and mute manually in onPlayerReady for better browser compatibility.
    const playerVars: any = {
      controls: 0,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
    };

    if (loop) {
      playerVars.loop = 1;
      playerVars.playlist = videoKey; // Required for loop to work
    }

    playerInstance.current = new (window as any).YT.Player(playerContainerNode, {
      videoId: videoKey,
      playerVars,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange,
      }
    });

    return () => {
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