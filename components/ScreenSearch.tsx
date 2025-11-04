import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItem, Movie, TVShow, PersonMovieCredit, Person } from '../types';
import { searchMulti } from '../services/tmdbService';
import { normalizeMovie, normalizeTVShow, getCollectionDetails, getPersonMovieCredits, getMovieDetailsForCollections } from '../services/tmdbService';
import { findFranchise } from '../services/franchiseService';
import { SearchIcon, StarIcon, XIcon } from './Icons';
import { useAppleTheme } from './AppleThemeProvider';
import Loader from './Loader';
import TrendingStrip from './TrendingStrip';
import HeroCarousel from './HeroCarousel';
import { Search, Star, X, Play, Share, Copy } from 'lucide-react';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

const WatchPathTimeline: React.FC<{
    path: Movie[];
    pathTitle: string;
    onSelectItem: (item: MediaItem) => void;
    query: string;
}> = ({ path, pathTitle, onSelectItem, query }) => {
    const { tokens } = useAppleTheme();
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="h-full flex flex-col w-full"
            style={{ marginTop: `${tokens.spacing.macro[0]}px` }}
        >
            <div 
                className="flex justify-between items-center mb-4 px-4 flex-shrink-0"
                style={{ marginBottom: `${tokens.spacing.standard[1]}px` }}
            >
                <h3 
                    className="truncate pr-2" 
                    title={pathTitle}
                    style={{
                        fontSize: `${tokens.typography.sizes.title2}px`,
                        fontWeight: tokens.typography.weights.bold,
                        fontFamily: tokens.typography.families.text,
                        color: tokens.colors.label.primary
                    }}
                >
                    {pathTitle}
                </h3>
                <div className="flex flex-shrink-0" style={{ gap: `${tokens.spacing.micro[2]}px` }}>
                    <button 
                        onClick={handlePlayPath} 
                        className="rounded-full backdrop-blur-xl border transition-all duration-300"
                        style={{
                            padding: `${tokens.spacing.micro[0]}px ${tokens.spacing.standard[1]}px`,
                            background: `linear-gradient(135deg, ${tokens.colors.background.secondary}E6, ${tokens.colors.background.primary}E6)`,
                            borderColor: tokens.colors.separator.opaque,
                            color: tokens.colors.label.primary,
                            fontSize: `${tokens.typography.sizes.caption1}px`,
                            fontFamily: tokens.typography.families.text,
                            fontWeight: tokens.typography.weights.medium
                        }}
                    >
                        <Play className="w-4 h-4 mr-1 inline" />
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                    <button 
                        onClick={handleShareLink} 
                        className="rounded-full backdrop-blur-xl border transition-all duration-300"
                        style={{
                            padding: `${tokens.spacing.micro[0]}px ${tokens.spacing.standard[1]}px`,
                            background: linkCopied 
                                ? `linear-gradient(135deg, ${tokens.colors.system.green}, ${tokens.colors.system.green})`
                                : `linear-gradient(135deg, ${tokens.colors.background.secondary}E6, ${tokens.colors.background.primary}E6)`,
                            borderColor: linkCopied ? tokens.colors.system.green : tokens.colors.separator.opaque,
                            color: linkCopied ? tokens.colors.background.primary : tokens.colors.label.primary,
                            fontSize: `${tokens.typography.sizes.caption1}px`,
                            fontFamily: tokens.typography.families.text,
                            fontWeight: tokens.typography.weights.medium
                        }}
                    >
                        {linkCopied ? <Copy className="w-4 h-4 mr-1 inline" /> : <Share className="w-4 h-4 mr-1 inline" />}
                        {linkCopied ? 'Copied!' : 'Share'}
                    </button>
                </div>
            </div>
            
            <div className="relative">
                <div 
                    className="absolute left-1/2 transform -translate-x-1/2 w-1 rounded-full"
                    style={{
                        background: `linear-gradient(180deg, ${tokens.colors.system.blue}, ${tokens.colors.system.purple})`,
                        height: '100%',
                        top: 0,
                        zIndex: 1
                    }}
                />
                <div 
                    ref={timelineRef} 
                    className="flex overflow-x-auto pb-4 space-x-6"
                    onWheel={stopAutoScroll} 
                    onTouchStart={stopAutoScroll}
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        paddingLeft: `${tokens.spacing.standard[1]}px`,
                        paddingRight: `${tokens.spacing.standard[1]}px`
                    }}
                >
                    {path.map((movie, index) => (
                        <motion.div 
                            key={movie.id} 
                            className="flex-shrink-0 relative group cursor-pointer"
                            onClick={() => onSelectItem(movie)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ width: '200px' }}
                        >
                            <div className="relative">
                                <img 
                                    src={`${IMAGE_BASE_URL}w342${movie.poster_path}`} 
                                    alt={movie.title} 
                                    className="w-full aspect-[2/3] object-cover rounded-xl backdrop-blur-xl border transition-all duration-300"
                                    style={{
                                        borderColor: tokens.colors.separator.opaque,
                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <div 
                                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end"
                                    style={{
                                        background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
                                        padding: `${tokens.spacing.standard[1]}px`
                                    }}
                                >
                                    <h4 
                                        className="font-bold mb-1"
                                        style={{
                                            color: tokens.colors.background.primary,
                                            fontSize: `${tokens.typography.sizes.body}px`,
                                            fontFamily: tokens.typography.families.text
                                        }}
                                    >
                                        {movie.title}
                                    </h4>
                                    <div 
                                        className="flex items-center justify-between"
                                        style={{
                                            fontSize: `${tokens.typography.sizes.caption1}px`,
                                            color: tokens.colors.label.secondary
                                        }}
                                    >
                                        <span>{movie.release_date.substring(0,4)}</span>
                                        <div className="flex items-center" style={{ gap: tokens.spacing.smallall }}>
                                            <Star className="w-3 h-3" style={{ color: tokens.colors.accent.yellow }} fill="currentColor" />
                                            <span>{movie.vote_average.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div 
                                className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2"
                                style={{
                                    background: tokens.colors.accent.blue,
                                    borderColor: tokens.colors.background.primary,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 2
                                }}
                            />
                            
                            <div 
                                className="text-center mt-2"
                                style={{
                                    fontSize: tokens.typography.sizes.caption,
                                    color: tokens.colors.text.tertiary,
                                    fontFamily: tokens.typography.families.text
                                }}
                            >
                                {movie.release_date.substring(0, 4)}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const SearchResultCard: React.FC<{ item: MediaItem, onClick: (item: MediaItem) => void }> = ({ item, onClick }) => {
    const { tokens } = useAppleTheme();
    const title = 'title' in item ? item.title : item.name;
    const year = 'release_date' in item && item.release_date ? item.release_date.substring(0, 4) : ('first_air_date' in item && item.first_air_date ? item.first_air_date.substring(0, 4) : '');

    return (
        <motion.div 
            onClick={() => onClick(item)} 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative aspect-[2/3] w-full overflow-hidden rounded-xl backdrop-blur-xl border cursor-pointer transition-all duration-300"
            style={{
                background: `linear-gradient(135deg, ${tokens.colors.background.secondary}40, ${tokens.colors.background.primary}40)`,
                borderColor: tokens.colors.separator.opaque,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
        >
            <img
                src={item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                alt={title}
                className="h-full w-full object-cover"
                loading="lazy"
            />
            
            <div 
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 70%, rgba(0, 0, 0, 0.8) 100%)'
                }}
            />

            {/* Info overlay */}
            <div 
                className="absolute bottom-0 left-0 right-0 backdrop-blur-sm border-t"
                style={{
                    padding: `${tokens.spacing.micro[2]}px`,
                    background: `${tokens.colors.background.secondary}80`,
                    borderColor: `${tokens.colors.separator.opaque}40`
                }}
            >
                <h3 
                    className="font-bold mb-1 line-clamp-2"
                    style={{
                        color: tokens.colors.text.primary,
                        fontSize: tokens.typography.sizes.caption,
                        fontFamily: tokens.typography.families.system,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {title}
                </h3>
                <div 
                    className="flex items-center justify-between"
                    style={{
                        fontSize: tokens.typography.sizes.caption2,
                        fontFamily: tokens.typography.families.text
                    }}
                >
                    <span style={{ color: tokens.colors.text.secondary }}>{year || 'N/A'}</span>
                    <div className="flex items-center" style={{ gap: tokens.spacing.smallall }}>
                        <Star className="h-3 w-3" style={{ color: tokens.colors.accent.yellow }} fill="currentColor" />
                        <span style={{ color: tokens.colors.text.secondary }}>{item.vote_average.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* Hover overlay */}
            <div 
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end pointer-events-none"
                style={{
                    background: `${tokens.colors.background.overlay}CC`,
                    backdropFilter: 'blur(8px)',
                    padding: tokens.spacing.small
                }}
            >
                <p 
                    className="line-clamp-3 leading-relaxed mb-3"
                    style={{
                        fontSize: tokens.typography.sizes.caption,
                        color: tokens.colors.text.secondary,
                        fontFamily: tokens.typography.families.text
                    }}
                >
                    {item.overview || 'No overview available.'}
                </p>
                <div 
                    className="text-center rounded-lg"
                    style={{
                        background: `${tokens.colors.background.secondary}80`,
                        padding: `${tokens.spacing.smallall} 0`,
                        fontSize: tokens.typography.sizes.caption,
                        fontWeight: tokens.typography.weights.semibold,
                        color: tokens.colors.text.primary,
                        fontFamily: tokens.typography.families.text
                    }}
                >
                    View Details
                </div>
            </div>
        </motion.div>
    );
};

interface ScreenSearchProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

const ScreenSearch: React.FC<ScreenSearchProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const { tokens } = useAppleTheme();
    
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
                            const moviePromises = franchise.ids.map(id => getMovieDetailsForCollections(apiKey, id));
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
            if (pathError) {
                return (
                    <p 
                        className="text-center mt-8"
                        style={{
                            color: tokens.colors.system.red,
                            fontFamily: tokens.typography.families.text,
                            fontSize: tokens.typography.sizes.body
                        }}
                    >
                        {pathError}
                    </p>
                );
            }
            if (pathResults.length > 0) return <WatchPathTimeline path={pathResults} pathTitle={pathTitle} onSelectItem={onSelectItem} query={query} />;
            if (hasSearched) return null;
            return (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-4 mt-8"
                    style={{
                        color: tokens.colors.text.tertiary,
                        fontFamily: tokens.typography.families.text
                    }}
                >
                    <p style={{ fontSize: tokens.typography.sizes.title3, marginBottom: tokens.spacing.small }}>
                        Your cinematic journey awaits.
                    </p>
                    <p style={{ fontSize: tokens.typography.sizes.body }}>
                        Enter a franchise (e.g., Harry Potter), director (e.g., Wes Anderson), or actor (e.g., Tom Hanks) to begin.
                    </p>
                </motion.div>
            );
        }

        // searchMode === 'media'
        if (hasSearched && mediaResults.length > 0) {
            return (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                    style={{ gap: tokens.spacing.medium }}
                >
                    {mediaResults.map(item => (
                        <SearchResultCard key={`${item.id}-${item.media_type}`} item={item} onClick={onSelectItem} />
                    ))}
                </motion.div>
            );
        }
        
        if (hasSearched && mediaResults.length === 0) {
            return (
                <p 
                    className="text-center mt-8"
                    style={{
                        color: tokens.colors.text.tertiary,
                        fontFamily: tokens.typography.families.text,
                        fontSize: tokens.typography.sizes.body
                    }}
                >
                    No results found for "{query}".
                </p>
            );
        }

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2 
                    className="mb-4"
                    style={{
                        fontSize: tokens.typography.sizes.title1,
                        fontWeight: tokens.typography.weights.bold,
                        color: tokens.colors.text.primary,
                        fontFamily: tokens.typography.families.text
                    }}
                >
                    Trending This Week
                </h2>
                <TrendingStrip apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
            </motion.div>
        );
    };

    const SearchContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
        <div 
            className={`rounded-3xl backdrop-blur-xl border ${className}`}
            style={{
                background: `linear-gradient(135deg, ${tokens.colors.background.secondary}40, ${tokens.colors.background.primary}40)`,
                borderColor: tokens.colors.border.primary,
                padding: tokens.spacing.xlarge,
                maxWidth: '600px',
                width: '90%',
                textAlign: 'center',
                boxShadow: tokens.shadows.large
            }}
        >
            {children}
        </div>
    );

    const SearchOverlay: React.FC<{ hasSearched: boolean; children: React.ReactNode }> = ({ hasSearched, children }) => (
        <div 
            className="fixed inset-0 z-10 flex items-center justify-center transition-opacity duration-300"
            style={{
                background: `${tokens.colors.background.overlay}80`,
                backdropFilter: 'blur(12px)',
                opacity: hasSearched ? 1 : 0,
                pointerEvents: hasSearched ? 'auto' : 'none'
            }}
        >
            {children}
        </div>
    );

    return (
        <>
            {!hasSearched && (
                <>
                    <HeroCarousel apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
                    <div className="relative -mt-20 z-10">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <SearchContent className="mx-auto mb-12">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-2"
                                    style={{
                                        fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                                        fontFamily: tokens.typography.families.text,
                                        fontWeight: tokens.typography.weights.bold,
                                        color: tokens.colors.text.primary,
                                        background: `linear-gradient(135deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.purple})`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    ChoiceForReels
                                </motion.h1>
                                <p 
                                    className="mb-4"
                                    style={{
                                        color: tokens.colors.text.tertiary,
                                        fontSize: tokens.typography.sizes.caption,
                                        fontFamily: tokens.typography.families.text
                                    }}
                                >
                                    By @jasonforreels
                                </p>
                                <p 
                                    className="mb-6"
                                    style={{
                                        color: tokens.colors.text.secondary,
                                        fontSize: tokens.typography.sizes.body,
                                        fontFamily: tokens.typography.families.text
                                    }}
                                >
                                    Discover movies, TV shows, and cinematic journeys.
                                </p>

                                <div className="flex justify-center mb-4" style={{ gap: tokens.spacing.small }}>
                                    <button 
                                        onClick={() => setSearchMode('media')} 
                                        onMouseEnter={applyHoverEffect}
                                        onMouseDown={applyPressEffect}
                                        className="rounded-full font-semibold transition-all duration-300"
                                        style={{
                                            padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                                            background: searchMode === 'media' 
                                                ? `linear-gradient(135deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.purple})`
                                                : `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                            color: searchMode === 'media' ? tokens.colors.text.primary : tokens.colors.text.primary,
                                            border: `1px solid ${tokens.colors.border.primary}`,
                                            fontSize: tokens.typography.sizes.body,
                                            fontFamily: tokens.typography.families.text
                                        }}
                                    >
                                        Search Media
                                    </button>
                                    <button 
                                        onClick={() => setSearchMode('path')} 
                                        onMouseEnter={applyHoverEffect}
                                        onMouseDown={applyPressEffect}
                                        className="rounded-full font-semibold transition-all duration-300"
                                        style={{
                                            padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                                            background: searchMode === 'path' 
                                                ? `linear-gradient(135deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.purple})`
                                                : `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                            color: searchMode === 'path' ? tokens.colors.text.primary : tokens.colors.text.primary,
                                            border: `1px solid ${tokens.colors.border.primary}`,
                                            fontSize: tokens.typography.sizes.body,
                                            fontFamily: tokens.typography.families.text
                                        }}
                                    >
                                        Create Watch Path
                                    </button>
                                </div>

                                <div className="relative">
                                    <Search 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                                        style={{ color: tokens.colors.text.tertiary }}
                                    />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={searchMode === 'media' ? 'Search for a movie, TV show...' : "e.g., 'Marvel Cinematic Universe'"}
                                        className="w-full rounded-full border backdrop-blur-xl transition-all duration-300 focus:outline-none"
                                        style={{
                                            background: `linear-gradient(135deg, ${tokens.colors.fill.quaternary}60, ${tokens.colors.fill.tertiary}60)`,
                                            borderColor: tokens.colors.separator.opaque,
                                            padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.micro[2]}px ${tokens.spacing.micro[2]}px 3rem`,
                                            fontSize: `${tokens.typography.sizes.title3}px`,
                                            color: tokens.colors.label.primary,
                                            fontFamily: tokens.typography.families.text,
                                            boxShadow: `0 0 0 2px transparent`,
                                            transition: 'box-shadow 0.3s ease'
                                        }}
                                        onFocus={(e) => {
                                            setHasSearched(true);
                                            e.target.style.boxShadow = `0 0 0 2px ${tokens.colors.accent.blue}`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.boxShadow = '0 0 0 2px transparent';
                                        }}
                                    />
                                    {query && (
                                        <button 
                                            onClick={() => setQuery('')} 
                                            onMouseEnter={applyHoverEffect}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                                            style={{ color: tokens.colors.text.tertiary }}
                                        >
                                            <X className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                            </SearchContent>
                        </div>

                        <div 
                            className="container mx-auto px-4 sm:px-6 lg:px-8"
                            style={{ paddingTop: tokens.spacing.xlarge, paddingBottom: tokens.spacing.xlarge }}
                        >
                            {renderContent()}
                        </div>
                    </div>
                </>
            )}

            <SearchOverlay hasSearched={hasSearched}>
                <SearchContent>
                    <div className="flex justify-center mb-6" style={{ gap: tokens.spacing.small }}>
                        <button 
                            onClick={() => { setSearchMode('media'); setHasSearched(false); }} 
                            onMouseEnter={applyHoverEffect}
                            onMouseDown={applyPressEffect}
                            className="rounded-full font-semibold transition-all duration-300"
                            style={{
                                padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                                background: searchMode === 'media' 
                                    ? `linear-gradient(135deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.purple})`
                                    : `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                color: searchMode === 'media' ? tokens.colors.text.primary : tokens.colors.text.primary,
                                border: `1px solid ${tokens.colors.border.primary}`,
                                fontSize: tokens.typography.sizes.body,
                                fontFamily: tokens.typography.families.text
                            }}
                        >
                            Search Media
                        </button>
                        <button 
                            onClick={() => { setSearchMode('path'); setHasSearched(false); }} 
                            onMouseEnter={applyHoverEffect}
                            onMouseDown={applyPressEffect}
                            className="rounded-full font-semibold transition-all duration-300"
                            style={{
                                padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                                background: searchMode === 'path' 
                                    ? `linear-gradient(135deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.purple})`
                                    : `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                color: searchMode === 'path' ? tokens.colors.text.primary : tokens.colors.text.primary,
                                border: `1px solid ${tokens.colors.border.primary}`,
                                fontSize: tokens.typography.sizes.body,
                                fontFamily: tokens.typography.families.text
                            }}
                        >
                            Create Watch Path
                        </button>
                        <button 
                            onClick={() => { setQuery(''); setHasSearched(false); }} 
                            onMouseEnter={applyHoverEffect}
                            className="absolute top-4 right-4 transition-colors duration-300"
                            style={{ color: tokens.colors.text.tertiary }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <Search 
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                            style={{ color: tokens.colors.text.tertiary }}
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchMode === 'media' ? 'Search for a movie, TV show...' : "e.g., 'Marvel Cinematic Universe'"}
                            className="w-full rounded-full border backdrop-blur-xl transition-all duration-300 focus:outline-none"
                            autoFocus
                            style={{
                                background: `linear-gradient(135deg, ${tokens.colors.background.secondary}60, ${tokens.colors.background.primary}60)`,
                                borderColor: tokens.colors.border.primary,
                                padding: `${tokens.spacing.small} ${tokens.spacing.small} ${tokens.spacing.small} 3rem`,
                                fontSize: tokens.typography.sizes.title3,
                                color: tokens.colors.text.primary,
                                fontFamily: tokens.typography.families.text
                            }}
                        />
                        {query && (
                            <button 
                                onClick={() => setQuery('')} 
                                onMouseEnter={applyHoverEffect}
                                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                                style={{ color: tokens.colors.text.tertiary }}
                            >
                                <X className="w-5 h-5"/>
                            </button>
                        )}
                    </div>

                    <div 
                        className="max-h-96 overflow-y-auto"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: `${tokens.colors.border.primary} transparent`
                        }}
                    >
                        {renderContent()}
                    </div>
                </SearchContent>
            </SearchOverlay>
        </>
    );
};

export default ScreenSearch;
