import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoKey: string;
  isMuted: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey, isMuted }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);

  // This effect handles toggling mute state after the player is initialized.
  useEffect(() => {
    if (playerInstance.current && typeof playerInstance.current.mute === 'function') {
      if (isMuted) {
        playerInstance.current.mute();
      } else {
        playerInstance.current.unMute();
      }
    }
  }, [isMuted]);

  // Create/destroy player when videoKey changes
  useEffect(() => {
    if (!videoKey || !playerRef.current) return;

    const onPlayerReady = (event: any) => {
      event.target.playVideo();
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
        mute: 1, // Start muted, the effect above will unmute if needed
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