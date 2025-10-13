import React from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import { UserIcon } from './Icons';

const SpotifyConnect: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useSpotify();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-glass p-1 pr-3 rounded-full">
          {user.images && user.images.length > 0 ? (
            <img src={user.images[0].url} alt={user.display_name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-zinc-400" />
            </div>
          )}
          <span className="text-sm font-semibold hidden sm:inline">{user.display_name}</span>
        </div>
        <button
          onClick={logout}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="bg-[#1DB954] text-white font-bold px-4 py-2 rounded-full text-sm hover:bg-[#1ED760] transition-colors flex items-center gap-2"
    >
      <svg role="img" height="20" width="20" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM11.65 12.35c-.2.2-.5.2-.7 0-1.7-1.1-3.8-1.3-6.2-.7-.3 0-.5-.2-.5-.5s.2-.5.5-.5c2.6-.6 4.9-.4 6.8.9.2.2.2.5 0 .7zm.9-2.2c-.3.2-.6.2-.8 0-1.9-1.2-4.9-1.6-7.3-.9-.3 0-.6-.2-.6-.6s.2-.6.6-.6c2.7-.8 6.1-.3 8.3 1.1.2.3.2.7 0 .9zm.1-2.3c-2.3-1.4-6.1-1.6-8.6-1-.4 0-.7-.3-.7-.7s.3-.7.7-.7c2.8-.6 7.1-.3 9.7 1.3.3.2.4.7.1 1s-.7.4-1 .1z"></path></svg>
      Connect with Spotify
    </button>
  );
};

export default SpotifyConnect;
