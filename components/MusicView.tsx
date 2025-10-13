import React, { useState, useCallback } from 'react';
import { useSpotify } from '../contexts/SpotifyContext';
import { searchAlbums, getAlbumDetails } from '../services/spotifyService';
import { SpotifyAlbum } from '../types';
import Loader from './Loader';
import { SearchIcon, PlayIcon, StarIcon } from './Icons';

const MusicView: React.FC = () => {
  const { accessToken, playAlbum } = useSpotify();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !query) return;

    setIsLoading(true);
    setSelectedAlbum(null);
    try {
      const response = await searchAlbums(accessToken, query);
      setResults(response.albums.items);
    } catch (error) {
      console.error("Spotify search failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, query]);
  
  const handleSelectAlbum = async (albumStub: SpotifyAlbum) => {
    if (!accessToken) return;
    try {
      const fullAlbum = await getAlbumDetails(accessToken, albumStub.id);
      setSelectedAlbum(fullAlbum);
    } catch(e) {
      console.error("could not load album details", e);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 animate-glow">Music Search</h1>
        <p className="text-center text-slate-300 mb-6">Find official soundtracks and albums for your favorite movies and shows.</p>
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a soundtrack..."
            className="w-full bg-glass border border-glass-edge rounded-full py-3 pl-12 pr-10 text-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none"
          />
        </form>
      </div>
      
      {isLoading && <Loader />}

      {selectedAlbum ? (
        <div className="max-w-4xl mx-auto bg-glass p-8 rounded-2xl animate-fade-in-up">
            <button onClick={() => setSelectedAlbum(null)} className="text-zinc-300 hover:text-white mb-4">&larr; Back to search results</button>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                    <img src={selectedAlbum.images[0].url} alt={selectedAlbum.name} className="w-64 h-64 rounded-lg shadow-2xl mx-auto" />
                    <button onClick={() => playAlbum(selectedAlbum)} className="w-full mt-4 bg-[#1DB954] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#1ED760] transition-colors">
                        <PlayIcon className="w-6 h-6"/> Play on Spotify
                    </button>
                </div>
                <div>
                    <h2 className="text-3xl font-bold">{selectedAlbum.name}</h2>
                    <p className="text-lg text-slate-300">{selectedAlbum.artists.map(a => a.name).join(', ')}</p>
                    <div className="mt-4 h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                        {selectedAlbum.tracks.items.map((track, index) => (
                             <div key={track.id} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400 w-6 text-right">{index + 1}</span>
                                    <div>
                                        <p className="font-semibold">{track.name}</p>
                                        <p className="text-sm text-slate-400">{track.artists.map(a => a.name).join(', ')}</p>
                                    </div>
                                </div>
                                <span className="text-sm text-slate-400">{Math.floor(track.duration_ms/60000)}:{((track.duration_ms%60000)/1000).toFixed(0).padStart(2,'0')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map(album => (
                <div key={album.id} onClick={() => handleSelectAlbum(album)} className="group cursor-pointer animate-fade-in">
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-glass shadow-lg transition-transform duration-300 group-hover:scale-105">
                        <img src={album.images[0].url} alt={album.name} className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <PlayIcon className="w-16 h-16 text-white/80" />
                        </div>
                    </div>
                    <h3 className="font-semibold text-white text-sm truncate mt-2">{album.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{album.artists.map(a => a.name).join(', ')}</p>
                </div>
            ))}
        </div>
      )}

    </div>
  );
};

export default MusicView;
