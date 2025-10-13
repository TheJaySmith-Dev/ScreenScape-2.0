import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, Movie, TVShow } from '../types';
import { searchMulti, normalizeMovie, normalizeTVShow } from '../services/tmdbService';
import { SearchIcon, StarIcon, XIcon } from './Icons';
import Loader from './Loader';
import TrendingStrip from './TrendingStrip';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface ScreenSearchProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

const SearchResultCard: React.FC<{ item: MediaItem, onClick: (item: MediaItem) => void }> = ({ item, onClick }) => {
    const title = 'title' in item ? item.title : item.name;
    const year = 'release_date' in item && item.release_date ? item.release_date.substring(0, 4) : ('first_air_date' in item && item.first_air_date ? item.first_air_date.substring(0, 4) : '');

    return (
        <div onClick={() => onClick(item)} className="group cursor-pointer animate-fade-in relative">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-glass shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img
                    src={item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                    alt={title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
                <div className="absolute bottom-0 left-0 p-2 w-full bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-center justify-between text-xs text-slate-200">
                        <span>{year || 'N/A'}</span>
                        <div className="flex items-center gap-1">
                            <StarIcon className="h-3 w-3 text-yellow-400" isActive />
                            <span>{item.vote_average.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Preview panel on hover */}
            <div className="absolute inset-0 z-10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 backdrop-blur-sm flex flex-col justify-end pointer-events-none">
                <h3 className="font-bold text-white text-base mb-1">{title}</h3>
                <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed mb-2">
                    {item.overview || 'No overview available.'}
                </p>
                <div className="text-center w-full text-sm font-semibold bg-white/20 py-1.5 rounded-md">
                    View Details
                </div>
            </div>
        </div>
    );
};

const ScreenSearch: React.FC<ScreenSearchProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const debounceTimer = useRef<number | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (query.trim() === '') {
            setResults([]);
            setIsLoading(false);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        debounceTimer.current = window.setTimeout(async () => {
            try {
                const response = await searchMulti(apiKey, query);
                const validResults = response.results
                    .filter((item): item is Movie | TVShow => 
                        'media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path != null
                    )
                    .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
                
                if (isMounted) {
                    setResults(validResults);
                }
            } catch (error) {
                console.error("Search failed:", error);
                if (error instanceof Error && error.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }, 300);

        return () => {
            isMounted = false;
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [query, apiKey, onInvalidApiKey]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 animate-glow">Screen Search</h1>
                <p className="text-center text-slate-300 mb-6">Discover movies and TV shows. Your next favorite is just a search away.</p>
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a movie, TV show..."
                        className="w-full bg-glass border border-glass-edge rounded-full py-3 pl-12 pr-10 text-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none transition-shadow"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <Loader />}
            
            {!isLoading && hasSearched && results.length > 0 && (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {results.map(item => (
                        <SearchResultCard key={`${item.id}-${item.media_type}`} item={item} onClick={onSelectItem} />
                    ))}
                </div>
            )}
            
            {!isLoading && hasSearched && results.length === 0 && (
                <p className="text-center text-slate-400">No results found for "{query}".</p>
            )}

            {!hasSearched && !isLoading && (
                <div className="animate-fade-in-up">
                    <h2 className="text-2xl font-bold mb-4">Trending This Week</h2>
                    <TrendingStrip apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
                </div>
            )}
        </div>
    );
};

export default ScreenSearch;