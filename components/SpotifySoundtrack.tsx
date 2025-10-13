import React, { useState, useEffect } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import { SpotifyAlbum } from '../types';
import { searchAlbums, getAlbumDetails } from '../services/spotifyService';
import { PlayIcon } from './Icons';

interface SpotifySoundtrackProps {
  mediaTitle: string;
}

const SpotifySoundtrack: React.FC<SpotifySoundtrackProps> = ({ mediaTitle }) => {
  const { accessToken, playAlbum, isSdkReady } = useSpotify();
  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const findSoundtrack = async () => {
      if (!accessToken || !mediaTitle) return;
      setIsLoading(true);
      try {
        const searchResult = await searchAlbums(accessToken, mediaTitle);
        const foundAlbum = searchResult.albums.items[0];
        if (foundAlbum) {
          // Fetch full album details to get tracklist
          const fullAlbum = await getAlbumDetails(accessToken, foundAlbum.id);
          setAlbum(fullAlbum);
        } else {
            setAlbum(null);
        }
      } catch (error) {
        console.error("Failed to find soundtrack:", error);
        setAlbum(null);
      } finally {
        setIsLoading(false);
      }
    };

    findSoundtrack();
  }, [accessToken, mediaTitle]);

  if (isLoading || !isSdkReady) {
    return (
        <div>
            <h3 className="text-xl font-bold mb-3">Soundtrack</h3>
            <div className="bg-glass p-4 rounded-lg text-sm text-slate-400">Searching for soundtrack on Spotify...</div>
        </div>
    );
  }
  
  if (!album) {
    return (
        <div>
            <h3 className="text-xl font-bold mb-3">Soundtrack</h3>
            <div className="bg-glass p-4 rounded-lg text-sm text-slate-400">No official soundtrack found on Spotify.</div>
        </div>
    );
  }

  return (
    <div>
        <h3 className="text-xl font-bold mb-3">Soundtrack</h3>
        <div className="bg-glass p-4 rounded-lg flex items-center gap-4">
            <img src={album.images[1]?.url || album.images[0]?.url} alt={album.name} className="w-24 h-24 rounded-md flex-shrink-0" />
            <div className="flex-grow">
                <p className="font-bold text-lg leading-tight">{album.name}</p>
                <p className="text-sm text-slate-300">{album.artists.map(a => a.name).join(', ')}</p>
                <p className="text-xs text-slate-400">{album.tracks.total} tracks</p>
            </div>
            <button onClick={() => playAlbum(album)} className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#1ED760] transition-transform hover:scale-110">
                <PlayIcon className="w-7 h-7 text-white" />
            </button>
        </div>
    </div>
  );
};

export default SpotifySoundtrack;
