import React, { createContext, useContext } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

const SpotifyContext = createContext<ReturnType<typeof useSpotifyAuth> & ReturnType<typeof useSpotifyPlayer> | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useSpotifyAuth();
  const player = useSpotifyPlayer(auth.accessToken);
  const value = { ...auth, ...player };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
