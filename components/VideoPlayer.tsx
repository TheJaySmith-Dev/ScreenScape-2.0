import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  videoKey: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);

  useEffect(() => {
    if (!videoKey || !playerRef.current) return;
    
    const onPlayerReady = (event: any) => {
        event.target.playVideo();
    };

    // FIX: Cast window to any to access YT property from YouTube Iframe API
    playerInstance.current = new (window as any).YT.Player(playerRef.current, {
      videoId: videoKey,
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
      },
      events: {
        'onReady': onPlayerReady,
      }
    });

    return () => {
      if (playerInstance.current && typeof playerInstance.current.destroy === 'function') {
        playerInstance.current.destroy();
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