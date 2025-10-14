import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchMulti, normalizeMovie, normalizeTVShow } from '../services/tmdbService';
import { MediaItem, Person, Movie, TVShow } from '../types';
import { SearchIcon } from './Icons';
import Loader from './Loader';

type SearchResult = Movie | TVShow | Person;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w92';

const ResultItem: React.FC<{ item: SearchResult, isActive: boolean, onSelect: () => void }> = ({ item, isActive, onSelect }) => {
    const getTitle = (item: SearchResult) => 'title' in item ? item.title : item.name;
    const getImagePath = (item: SearchResult) => 'profile_path' in item ? item.profile_path : item.poster_path;
    
    const getMeta = (item: SearchResult) => {
        if (item.media_type === 'movie' && 'release_date' in item) return `Movie · ${item.release_date?.substring(0, 4) || 'N/A'}`;
        if (item.media_type === 'tv' && 'first_air_date' in item) return `TV Show · ${item.first_air_date?.substring(0, 4) || 'N/A'}`;
        if (item.media_type === 'person' && 'known_for_department' in item) return `Person · ${item.known_for_department}`;
        return '';
    };

    return (
        <li
            className={`quick-jump-result-item ${isActive ? 'active' : ''}`}
            onClick={onSelect}
            role="option"
            aria-selected={isActive}
        >
            <img 
                src={getImagePath(item) ? `${IMAGE_BASE_URL}${getImagePath(item)}` : 'https://via.placeholder.com/64x96?text=N/A'}
                alt={getTitle(item)}
                loading="lazy"
            />
            <div className="quick-jump-result-item-info">
                <strong>{getTitle(item)}</strong>
                <small>{getMeta(item)}</small>
            </div>
        </li>
    );
};

const QuickJump: React.FC<{ apiKey: string }> = ({ apiKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounceTimeout = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
        setActiveIndex(-1);
    }, []);

    const handleSelect = useCallback((item: SearchResult) => {
        if (!item) return;
        if (item.media_type === 'movie' || item.media_type === 'tv') {
            const mediaItem = item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow);
            window.dispatchEvent(new CustomEvent('selectMediaItem', { detail: mediaItem }));
        } else if (item.media_type === 'person') {
            window.open(`https://www.themoviedb.org/person/${item.id}`, '_blank');
        }
        close();
    }, [close]);
    
    const handleSeeAllResults = () => {
        window.dispatchEvent(new CustomEvent('setSearchView', { detail: { query } }));
        close();
    };

    useEffect(() => {
        const handleOpenEvent = () => open();
        window.addEventListener('openQuickJump', handleOpenEvent);

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (!isOpen) return;

            if (e.key === 'Escape') close();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => Math.min(prev + 1, results.slice(0, 8).length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => Math.max(prev - 1, 0));
            }
            if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                handleSelect(results[activeIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('openQuickJump', handleOpenEvent);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, close, open, activeIndex, results, handleSelect]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        setActiveIndex(-1);

        if (query.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        debounceTimeout.current = window.setTimeout(async () => {
            try {
                const response = await searchMulti(apiKey, query);
                const filtered = response.results.filter(
                    (item): item is SearchResult =>
                        (item.media_type === 'movie' && !!(item as Movie).poster_path) ||
                        (item.media_type === 'tv' && !!(item as TVShow).poster_path) ||
                        (item.media_type === 'person' && !!(item as Person).profile_path)
                );
                setResults(filtered);
            } catch (error) {
                console.error('Quick Jump search failed:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        }
    }, [query, apiKey]);


    if (!isOpen) return null;

    return (
        <>
            <div className="quick-jump-backdrop" onClick={close}></div>
            <div className="quick-jump-overlay" role="dialog" aria-modal="true">
                <div className="quick-jump-container">
                    <div className="relative flex items-center">
                        <SearchIcon className="absolute left-6 w-6 h-6 text-slate-400 pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search movies, shows, people..."
                            className="quick-jump-input"
                            autoComplete="off"
                        />
                    </div>
                    {isLoading && <Loader />}
                    {!isLoading && results.length > 0 && (
                        <>
                            <ul className="quick-jump-results scrollbar-thin" role="listbox">
                                {results.slice(0, 8).map((item, index) => (
                                    <ResultItem
                                        key={`${item.id}-${item.media_type}`}
                                        item={item}
                                        isActive={index === activeIndex}
                                        onSelect={() => handleSelect(item)}
                                    />
                                ))}
                            </ul>
                            {results.length > 8 && (
                                <div className="quick-jump-footer">
                                    <button onClick={handleSeeAllResults} className="hover:text-white transition-colors">
                                        See all {results.length} results &rarr;
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                     {!isLoading && query.length > 1 && results.length === 0 && (
                        <div className="quick-jump-footer !text-base">
                            No results for "{query}"
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default QuickJump;
