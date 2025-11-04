import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchMulti, normalizeMovie, normalizeTVShow } from '../services/tmdbService';
import { MediaItem, Person, Movie, TVShow } from '../types';
import { SearchIcon } from './Icons';
import { useAppleTheme } from './AppleThemeProvider';
import Loader from './Loader';

type SearchResult = Movie | TVShow | Person;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w92';

const ResultItem: React.FC<{ item: SearchResult, isActive: boolean, onSelect: () => void }> = ({ item, isActive, onSelect }) => {
    const { tokens } = useAppleTheme();
    const getTitle = (item: SearchResult) => 'title' in item ? item.title : item.name;
    const getImagePath = (item: SearchResult) => 'profile_path' in item ? item.profile_path : item.poster_path;
    
    const getMeta = (item: SearchResult) => {
        if (item.media_type === 'movie' && 'release_date' in item) return `Movie · ${item.release_date?.substring(0, 4) || 'N/A'}`;
        if (item.media_type === 'tv' && 'first_air_date' in item) return `TV Show · ${item.first_air_date?.substring(0, 4) || 'N/A'}`;
        if (item.media_type === 'person' && 'known_for_department' in item) return `Person · ${item.known_for_department}`;
        return '';
    };

    return (
        <motion.li
            onClick={onSelect}
            role="option"
            aria-selected={isActive}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: `${tokens.spacing.micro[2]}px`,
                padding: `${tokens.spacing.micro[2]}px`,
                borderRadius: '12px',
                cursor: 'pointer',
                background: isActive ? tokens.colors.fill.secondary : 'transparent',
                transition: 'background-color 0.2s ease'
            }}
            whileHover={{ 
                backgroundColor: tokens.colors.fill.secondary,
                scale: 1.01
            }}
            whileTap={{ scale: 0.99 }}
        >
            <img 
                src={getImagePath(item) ? `${IMAGE_BASE_URL}${getImagePath(item)}` : 'https://via.placeholder.com/64x96?text=N/A'}
                alt={getTitle(item)}
                loading="lazy"
                style={{
                    width: '48px',
                    height: '72px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0
                }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div 
                    className="apple-callout"
                    style={{ 
                        color: tokens.colors.label.primary,
                        fontWeight: tokens.typography.weights.medium,
                        marginBottom: `${tokens.spacing.micro[0]}px`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {getTitle(item)}
                </div>
                <div 
                    className="apple-caption1"
                    style={{ 
                        color: tokens.colors.label.secondary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {getMeta(item)}
                </div>
            </div>
        </motion.li>
    );
};

const QuickJump: React.FC<{ apiKey: string }> = ({ apiKey }) => {
    const { tokens } = useAppleTheme();
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


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={close}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 9999
                        }}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        role="dialog" 
                        aria-modal="true"
                        style={{
                            position: 'fixed',
                            top: '20vh',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '90%',
                            maxWidth: '600px',
                            zIndex: 10000
                        }}
                    >
                        <div 
                            className="apple-glass-regular apple-depth-3"
                            style={{
                                borderRadius: '20px',
                                overflow: 'hidden',
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${tokens.colors.separator.nonOpaque}`
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.standard[1]}px`
                            }}>
                                <SearchIcon style={{ 
                                    position: 'absolute',
                                    left: `${tokens.spacing.standard[1]}px`,
                                    width: '20px',
                                    height: '20px',
                                    color: tokens.colors.label.tertiary,
                                    pointerEvents: 'none'
                                }} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search movies, shows, people..."
                                    autoComplete="off"
                                    style={{
                                        width: '100%',
                                        padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.micro[2]}px ${tokens.spacing.micro[2]}px ${tokens.spacing.standard[2]}px`,
                                        border: 'none',
                                        background: 'transparent',
                                        outline: 'none',
                                        fontSize: `${tokens.typography.sizes.body}px`,
                                        fontFamily: tokens.typography.families.text,
                                        color: tokens.colors.label.primary
                                    }}
                                />
                            </div>
                            
                            {isLoading && (
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    padding: `${tokens.spacing.standard[1]}px` 
                                }}>
                                    <Loader />
                                </div>
                            )}
                            
                            {!isLoading && results.length > 0 && (
                                <>
                                    <div style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        padding: `0 ${tokens.spacing.micro[2]}px`
                                    }}>
                                        <ul role="listbox" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {results.slice(0, 8).map((item, index) => (
                                                <ResultItem
                                                    key={`${item.id}-${item.media_type}`}
                                                    item={item}
                                                    isActive={index === activeIndex}
                                                    onSelect={() => handleSelect(item)}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                    {results.length > 8 && (
                                        <div style={{
                                            padding: `${tokens.spacing.micro[2]}px`,
                                            borderTop: `1px solid ${tokens.colors.separator.nonOpaque}`,
                                            textAlign: 'center'
                                        }}>
                                            <button 
                                                onClick={handleSeeAllResults}
                                                className="apple-callout"
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: tokens.colors.system.blue,
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s ease'
                                                }}
                                            >
                                                See all {results.length} results →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {!isLoading && query.length > 1 && results.length === 0 && (
                                <div style={{
                                    padding: `${tokens.spacing.standard[1]}px`,
                                    textAlign: 'center'
                                }}>
                                    <p 
                                        className="apple-body"
                                        style={{ 
                                            color: tokens.colors.label.secondary,
                                            margin: 0
                                        }}
                                    >
                                        No results for "{query}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuickJump;
