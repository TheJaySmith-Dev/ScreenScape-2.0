import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  videoKey: string;
  isMuted: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey, isMuted }) => {
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
      event.target.playVideo();
      setIsPlayerReady(true); // Signal that the player is ready to be controlled
    };

    const playerContainerNode = playerRef.current;
    
    playerInstance.current = new (window as any).YT.Player(playerContainerNode, {
      videoId: videoKey,
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        mute: 1, // Always start muted, the effect will handle the state
        loop: 1,
        playlist: videoKey, // Required for loop to work
      },
      events: {
        'onReady': onPlayerReady,
      }
    });

    return () => {
      if (playerInstance.current && typeof playerInstance.current.destroy === 'function') {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [videoKey]);
  
  return (
    <div className="w-full h-full">
      <div ref={playerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
    </div>
  );
};

export default VideoPlayer;