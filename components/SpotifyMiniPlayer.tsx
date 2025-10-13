import React from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import { PlayIcon } from './Icons';

const SpotifyMiniPlayer: React.FC = () => {
  const { playerState, togglePlay } = useSpotify();
  const { track, album, isPlaying } = playerState;

  if (!track || !album) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-50 animate-fade-in-up">
      <div className="glass-panel p-2 rounded-xl flex items-center gap-3 shadow-2xl spotify-glow-pulse">
        <img
          src={album.images[album.images.length - 1]?.url}
          alt={album.name}
          className="w-14 h-14 rounded-md"
        />
        <div className="w-40">
          <p className="font-semibold text-sm truncate">{track.name}</p>
          <p className="text-xs text-slate-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
        </div>
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          {isPlaying ? (
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path></svg>
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SpotifyMiniPlayer;
