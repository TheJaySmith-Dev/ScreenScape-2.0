import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { MediaItem, Movie, TVShow, PersonMovieCredit, Person } from '../types';
import { searchMulti } from '../services/tmdbService';
import { normalizeMovie, normalizeTVShow, getCollectionDetails, getPersonMovieCredits, getMovieDetailsForCollections } from '../services/tmdbService';
import { findFranchise } from '../services/franchiseService';
import { SearchIcon, StarIcon, XIcon } from './Icons';
import Loader from './Loader';
import TrendingStrip from './TrendingStrip';
import HeroCarousel from './HeroCarousel';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

const WatchPathTimeline: React.FC<{
    path: Movie[];
    pathTitle: string;
    onSelectItem: (item: MediaItem) => void;
    query: string;
}> = ({ path, pathTitle, onSelectItem, query }) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const stopAutoScroll = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            if (!timelineRef.current || path.length === 0) {
                setIsPlaying(false);
                return;
            }
            const items = timelineRef.current.children;
            let currentIndex = 0;
            
            const scrollToNext = () => {
                if (currentIndex >= items.length) currentIndex = 0;
                const item = items[currentIndex] as HTMLElement;
                item?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                currentIndex++;
            };
            scrollToNext();
            intervalRef.current = window.setInterval(scrollToNext, 3000);
        } else {
             if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
             if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, path]);

    const handlePlayPath = () => setIsPlaying(p => !p);

    const handleShareLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?watchpath=${encodeURIComponent(query)}`;
        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };
    
    return (
        <div className="animate-fade-in-up h-full flex flex-col mt-12 w-full">
            <div className="flex justify-between items-center mb-4 px-4 flex-shrink-0">
                <h3 className="text-xl font-bold truncate pr-2" title={pathTitle}>{pathTitle}</h3>
                <div className="flex gap-2 flex-shrink-0">
                    <button onClick={handlePlayPath} className="glass-button text-xs px-3 py-1 rounded-full">
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                    <button onClick={handleShareLink} className="glass-button text-xs px-3 py-1 rounded-full">
                        {linkCopied ? 'Copied!' : 'Share'}
                    </button>
                </div>
            </div>
            <div className="watch-path-timeline-container">
                <div className="watch-path-timeline-line" />
                <div ref={timelineRef} className="watch-path-timeline" onWheel={stopAutoScroll} onTouchStart={stopAutoScroll}>
                    {path.map((movie) => (
                        <div key={movie.id} className="watch-path-item group" onClick={() => onSelectItem(movie)}>
                            <div className="watch-path-poster-wrapper">
                                <img src={`${IMAGE_BASE_URL}w342${movie.poster_path}`} alt={movie.title} className="watch-path-poster"/>
                                <div className="watch-path-poster-overlay">
                                    <h4 className="font-bold">{movie.title}</h4>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span>{movie.release_date.substring(0,4)}</span>
                                        <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-yellow-400" isActive/>{movie.vote_average.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="watch-path-dot" />
                            <div className="watch-path-year">{movie.release_date.substring(0, 4)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const shimmer = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.1); }
    50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.3); }
`;

const ripple = keyframes`
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.2); opacity: 0; }
`;

const Card = styled(motion.div)<{ active: boolean }>`
    position: relative;
    aspect-ratio: 2/3;
    width: 100%;
    overflow: hidden;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
        transform: scale(1.05);
        animation: ${shimmer} 1.5s ease-in-out infinite;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(16px);
    }

    &:active::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        transform: translate(-50%, -50%);
        animation: ${ripple} 0.6s ease-out;
    }
`;

const SearchResultCard: React.FC<{ item: MediaItem, onClick: (item: MediaItem) => void }> = ({ item, onClick }) => {
    const title = 'title' in item ? item.title : item.name;
    const year = 'release_date' in item && item.release_date ? item.release_date.substring(0, 4) : ('first_air_date' in item && item.first_air_date ? item.first_air_date.substring(0, 4) : '');

    return (
        <Card onClick={() => onClick(item)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <img
                src={item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                alt={title}
                className="h-full w-full object-cover"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/30 backdrop-blur-sm border-t border-white/10">
                <h3 className="font-bold text-white text-sm mb-1 font-family: 'Inter', sans-serif; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">{title}</h3>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200">{year || 'N/A'}</span>
                    <div className="flex items-center gap-1 text-yellow-400">
                        <StarIcon className="h-3 w-3" isActive />
                        <span className="text-slate-200">{item.vote_average.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-3">
                    {item.overview || 'No overview available.'}
                </p>
                <div className="text-center bg-white/20 py-1.5 rounded-md text-sm font-semibold text-white">
                    View Details
                </div>
            </div>
        </Card>
    );
};

interface ScreenSearchProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

const ScreenSearch: React.FC<ScreenSearchProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const [query, setQuery] = useState('');
    const [searchMode, setSearchMode] = useState<'media' | 'path'>('media');
    const [mediaResults, setMediaResults] = useState<MediaItem[]>([]);
    const [pathResults, setPathResults] = useState<Movie[]>([]);
    const [pathTitle, setPathTitle] = useState('');
    const [pathError, setPathError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const debounceTimer = useRef<number | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const watchPathQueryParam = params.get('watchpath');
        if (watchPathQueryParam) {
            setSearchMode('path');
            setQuery(watchPathQueryParam);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const processAndSetPath = (title: string, movies: (Movie | PersonMovieCredit)[]) => {
        const sortedMovies = movies
            .filter(m => m.release_date && m.poster_path)
            .sort((a, b) => new Date(a.release_date!).getTime() - new Date(b.release_date!).getTime());
        setPathResults(sortedMovies as Movie[]);
        setPathTitle(title);
    };

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (query.trim() === '') {
            setMediaResults([]);
            setPathResults([]);
            setPathTitle('');
            setPathError(null);
            setIsLoading(false);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        debounceTimer.current = window.setTimeout(async () => {
            try {
                if (searchMode === 'media') {
                    const response = await searchMulti(apiKey, query);
                    const validResults = response.results
                        .filter((item): item is Movie | TVShow => 
                            'media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path != null
                        )
                        .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
                    setMediaResults(validResults);
                } else { // searchMode === 'path'
                    setPathError(null);
                    setPathResults([]);
                    setPathTitle('');
                    
                    const franchise = findFranchise(query);
                    if (franchise) {
                        if (franchise.type === 'collection' && franchise.id) {
                            const collection = await getCollectionDetails(apiKey, franchise.id);
                            processAndSetPath(franchise.name, collection.parts);
                        } else if (franchise.type === 'curated_list' && franchise.ids) {
                            const moviePromises = franchise.ids.map(id => getMovieDetailsForCollections(apiKey, id)); // Region is required
                            const movies = await Promise.all(moviePromises);
                            processAndSetPath(franchise.name, movies);
                        }
                    } else {
                        const searchRes = await searchMulti(apiKey, query);
                        const topResult = searchRes.results[0] as Movie | TVShow | Person;

                        if (!topResult) {
                            setPathError(`No results found for "${query}".`);
                            return;
                        }

                        if (topResult.media_type === 'movie') {
                            const movieDetails = await getMovieDetailsForCollections(apiKey, topResult.id);
                            if (movieDetails.belongs_to_collection) {
                                const collection = await getCollectionDetails(apiKey, movieDetails.belongs_to_collection.id);
                                processAndSetPath(collection.name, collection.parts);
                            } else {
                                setPathError(`"${movieDetails.title}" is not part of a known collection. Try a franchise name.`);
                            }
                        } else if (topResult.media_type === 'person') {
                            const personCredits = await getPersonMovieCredits(apiKey, topResult.id);
                            const department = topResult.known_for_department === 'Directing' ? 'crew' : 'cast';
                            const movies = department === 'crew' ? personCredits.crew.filter(c => c.job === 'Director') : personCredits.cast;
                            const pathName = `Films ${department === 'crew' ? 'Directed by' : 'Starring'} ${topResult.name}`;
                            processAndSetPath(pathName, movies);
                        } else {
                            setPathError(`Watch Paths can be created from movie franchises or people, not TV shows.`);
                        }
                    }
                }
            } catch (error) {
                console.error("Search failed:", error);
                if (searchMode === 'path') {
                    setPathError("An error occurred while creating the path.");
                }
                if (error instanceof Error && error.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [query, apiKey, onInvalidApiKey, searchMode]);

    const renderContent = () => {
        if (isLoading) return <Loader />;

        if (searchMode === 'path') {
            if (pathError) return <p className="text-center text-red-400 mt-8">{pathError}</p>;
            if (pathResults.length > 0) return <WatchPathTimeline path={pathResults} pathTitle={pathTitle} onSelectItem={onSelectItem} query={query} />;
            if (hasSearched) return null; // No results, no error = still loading or empty query
             return (
                <div className="text-center text-slate-400 p-4 mt-8 animate-fade-in">
                    <p className="text-lg">Your cinematic journey awaits.</p>
                    <p>Enter a franchise (e.g., Harry Potter), director (e.g., Wes Anderson), or actor (e.g., Tom Hanks) to begin.</p>
                </div>
            );
        }

        // searchMode === 'media'
        if (hasSearched && mediaResults.length > 0) {
            return (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {mediaResults.map(item => (
                        <SearchResultCard key={`${item.id}-${item.media_type}`} item={item} onClick={onSelectItem} />
                    ))}
                </div>
            );
        }
        
        if (hasSearched && mediaResults.length === 0) {
            return <p className="text-center text-slate-400 mt-8">No results found for "{query}".</p>;
        }

        return (
            <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4">Trending This Week</h2>
                <TrendingStrip apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
            </div>
        );
    };

    const SearchOverlay = styled.div<{ hasSearched: boolean }>`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(12px);
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: ${props => props.hasSearched ? 1 : 0};
        pointer-events: ${props => props.hasSearched ? 'auto' : 'none'};
        transition: opacity 0.3s ease;
    `;

    const SearchContent = styled.div`
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2rem;
        max-width: 600px;
        width: 90%;
        text-align: center;
    `;

    return (
        <>
            {!hasSearched && (
                <>
                    <HeroCarousel apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
                    <div className="relative -mt-20 z-10">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <SearchContent className="mx-auto mb-12">
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-glow" style={{ fontFamily: 'Inter, sans-serif', color: 'white' }}>ScreenScape</h1>
                                <p className="text-slate-300 mb-6">Discover movies, TV shows, and cinematic journeys.</p>

                                <div className="flex justify-center gap-2 mb-4">
                                    <button onClick={() => setSearchMode('media')} className={`px-4 py-2 rounded-full font-semibold transition-colors ${searchMode === 'media' ? 'bg-accent-500 text-primary' : 'bg-glass hover:bg-white/10'}`}>
                                        Search Media
                                    </button>
                                    <button onClick={() => setSearchMode('path')} className={`px-4 py-2 rounded-full font-semibold transition-colors ${searchMode === 'path' ? 'bg-accent-500 text-primary' : 'bg-glass hover:bg-white/10'}`}>
                                        Create Watch Path
                                    </button>
                                </div>

                                <div className="relative">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={searchMode === 'media' ? 'Search for a movie, TV show...' : "e.g., 'Marvel Cinematic Universe'"}
                                        className="w-full bg-glass border border-glass-edge rounded-full py-3 pl-12 pr-10 text-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none transition-shadow"
                                        onFocus={() => setHasSearched(true)}
                                    />
                                    {query && (
                                        <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                            <XIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                            </SearchContent>
                        </div>

                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {renderContent()}
                        </div>
                    </div>
                </>
            )}

            <SearchOverlay hasSearched={hasSearched}>
                <SearchContent>
                    <div className="flex justify-center gap-2 mb-6">
                        <button onClick={() => { setSearchMode('media'); setHasSearched(false); }} className={`px-4 py-2 rounded-full font-semibold transition-colors ${searchMode === 'media' ? 'bg-accent-500 text-primary' : 'bg-glass hover:bg-white/10'}`}>
                            Search Media
                        </button>
                        <button onClick={() => { setSearchMode('path'); setHasSearched(false); }} className={`px-4 py-2 rounded-full font-semibold transition-colors ${searchMode === 'path' ? 'bg-accent-500 text-primary' : 'bg-glass hover:bg-white/10'}`}>
                            Create Watch Path
                        </button>
                        <button onClick={() => { setQuery(''); setHasSearched(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            ✕
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchMode === 'media' ? 'Search for a movie, TV show...' : "e.g., 'Marvel Cinematic Universe'"}
                            className="w-full bg-glass border border-glass-edge rounded-full py-3 pl-12 pr-10 text-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none transition-shadow"
                            autoFocus
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {renderContent()}
                    </div>
                </SearchContent>
            </SearchOverlay>
        </>
    );
};

export default ScreenSearch;
