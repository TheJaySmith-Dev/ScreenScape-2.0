import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, Collection, PersonMovieCredit, Movie } from '../types';
import { searchMulti, getCollectionDetails, getPersonMovieCredits, getMovieDetails } from '../services/tmdbService';
import { SearchIcon, XIcon, PlayIcon, StarIcon, ClockIcon } from './Icons';
import Loader from './Loader';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface WatchPathProps {
    apiKey: string;
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

const WatchPath: React.FC<WatchPathProps> = ({ apiKey, isOpen, onClose, initialQuery }) => {
    const [query, setQuery] = useState(initialQuery || '');
    const [path, setPath] = useState<Movie[]>([]);
    const [pathTitle, setPathTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    const autoScrollInterval = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const stopAutoScroll = () => {
        if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current);
            autoScrollInterval.current = null;
        }
    };

    const processAndSetPath = (title: string, movies: (Movie | PersonMovieCredit)[]) => {
        const sortedMovies = movies
            .filter(m => m.release_date && m.poster_path)
            .sort((a, b) => new Date(a.release_date!).getTime() - new Date(b.release_date!).getTime());
        setPath(sortedMovies as Movie[]);
        setPathTitle(title);
    };
    
    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setError(null);
        setPath([]);
        setPathTitle('');
        stopAutoScroll();

        try {
            const searchRes = await searchMulti(apiKey, searchQuery);
            const topResult = searchRes.results[0];

            if (!topResult) {
                setError(`No results found for "${searchQuery}".`);
                return;
            }

            if (topResult.media_type === 'movie') {
                const movieDetails = await getMovieDetails(apiKey, topResult.id, 'US'); // Assuming US region
                if (movieDetails.belongs_to_collection) {
                    const collection = await getCollectionDetails(apiKey, movieDetails.belongs_to_collection.id);
                    processAndSetPath(collection.name, collection.parts);
                } else {
                     setError(`"${movieDetails.title}" is not part of a known collection. Try a franchise name.`);
                }
            } else if (topResult.media_type === 'person') {
                const personCredits = await getPersonMovieCredits(apiKey, topResult.id);
                const department = topResult.known_for_department === 'Directing' ? 'crew' : 'cast';
                const movies = department === 'crew' 
                    ? personCredits.crew.filter(c => c.job === 'Director') 
                    : personCredits.cast;
                const pathName = `Films ${department === 'crew' ? 'Directed' : 'Starring'} ${topResult.name}`;
                processAndSetPath(pathName, movies);
            } else {
                setError(`Watch Paths can be created from movie franchises or people, not TV shows.`);
            }

        } catch (err) {
            console.error("Watch Path search failed:", err);
            setError("An error occurred while creating the path.");
        } finally {
            setIsLoading(false);
        }
    }, [apiKey]);
    
    useEffect(() => {
        if (initialQuery && isOpen) {
            handleSearch(initialQuery);
        }
    }, [initialQuery, isOpen, handleSearch]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 400); // Focus after animation
        } else {
            document.body.style.overflow = 'auto';
            stopAutoScroll();
        }
        return () => {
            document.body.style.overflow = 'auto';
            stopAutoScroll();
        };
    }, [isOpen]);

    const handlePlayPath = () => {
        if (!timelineRef.current || path.length === 0) return;
        if (autoScrollInterval.current) {
            stopAutoScroll();
            return;
        }

        const items = timelineRef.current.children;
        let currentIndex = 0;
        
        const scrollToNext = () => {
            if (currentIndex >= items.length) {
                currentIndex = 0; // Loop back
            }
            const item = items[currentIndex] as HTMLElement;
            item?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            currentIndex++;
        };

        scrollToNext(); // Scroll to first immediately
        autoScrollInterval.current = window.setInterval(scrollToNext, 3000);
    };

    const handleShareLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?watchpath=${encodeURIComponent(query)}`;
        navigator.clipboard.writeText(url).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    const handleSelectItem = (item: MediaItem) => {
        window.dispatchEvent(new CustomEvent('selectMediaItem', { detail: item }));
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={`watch-path-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} role="dialog" aria-modal="true">
            <div className={`watch-path-modal ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="watch-path-header">
                    <h2 className="text-2xl font-bold">Create Watch Path</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="p-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., 'Marvel Cinematic Universe'"
                            className="watch-path-input"
                        />
                    </form>
                </div>

                <div className="watch-path-content">
                    {isLoading && <Loader />}
                    {error && <p className="text-center text-red-400 p-4">{error}</p>}
                    
                    {!isLoading && path.length === 0 && !error && (
                        <div className="text-center text-slate-400 p-4">
                            <p className="text-lg">Your cinematic journey awaits.</p>
                            <p>Enter a franchise, director, or actor to begin.</p>
                        </div>
                    )}

                    {!isLoading && path.length > 0 && (
                        <div className="animate-fade-in-up h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4 px-4 flex-shrink-0">
                                <h3 className="text-lg font-bold truncate pr-2" title={pathTitle}>{pathTitle}</h3>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={handlePlayPath} className="watch-path-button text-xs">
                                        {autoScrollInterval.current ? 'Stop' : 'Play'}
                                    </button>
                                    <button onClick={handleShareLink} className="watch-path-button text-xs">
                                        {linkCopied ? 'Copied!' : 'Share'}
                                    </button>
                                </div>
                            </div>

                            <div className="watch-path-timeline-container">
                                <div className="watch-path-timeline-line" />
                                <div ref={timelineRef} className="watch-path-timeline">
                                    {path.map((movie) => (
                                        <div key={movie.id} className="watch-path-item group" onClick={() => handleSelectItem(movie)}>
                                            <div className="watch-path-poster-wrapper">
                                                <img
                                                    src={`${IMAGE_BASE_URL}w342${movie.poster_path}`}
                                                    alt={movie.title}
                                                    className="watch-path-poster"
                                                />
                                                <div className="watch-path-poster-overlay">
                                                    <h4 className="font-bold">{movie.title}</h4>
                                                    <p className="text-xs text-slate-300 line-clamp-3">{movie.overview}</p>
                                                    <div className="flex items-center justify-between text-xs mt-2">
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default WatchPath;