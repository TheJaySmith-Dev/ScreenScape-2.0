import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MediaItem } from '../types';
import HeroCarousel from './HeroCarousel';
import GlassHero from './GlassHero';
import MediaRow from './MediaRow';
import { getTrending, searchMulti, searchMovies, searchTVShows, searchKeywords, getMovieWatchProviders, getTVShowWatchProviders, normalizeMovie, normalizeTVShow, getPopularMovies, getPopularTVShows, getUpcomingMovies, getTopRatedMovies, getTopRatedTVShows } from "../services/tmdbService";
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useGeolocation } from '../hooks/useGeolocation';
import Loader from './Loader';
import { Star, Play, Plus, Info, Search } from 'lucide-react';
import { isMobileDevice } from '../utils/deviceDetection';
import GlassPosterCard from './GlassPosterCard';
import { useAppleTheme } from './AppleThemeProvider';
import { computeMatchScore } from '../utils/searchRanking';


interface ExploreViewProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
    onNavigateProvider: (providerId: number) => void;
    searchQuery: string;
}

interface SearchResultCardProps {
    item: MediaItem;
    onClick: (item: MediaItem) => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ item, onClick }) => {
    const { tokens } = useAppleTheme();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onClick={() => onClick(item)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="apple-glass-regular apple-depth-2"
            style={{
                cursor: 'pointer',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                transform: isHovered ? 'scale(1.02) translateY(-4px)' : 'scale(1) translateY(0)',
                willChange: 'transform',
                position: 'relative'
            }}
        >
            <div style={{ position: 'relative', aspectRatio: '2/3' }}>
                <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
                <div
                    className="apple-glass-thin"
                    style={{
                        position: 'absolute',
                        top: `${tokens.spacing.micro[1]}px`,
                        right: `${tokens.spacing.micro[1]}px`,
                        borderRadius: '8px',
                        padding: `${tokens.spacing.micro[0]}px ${tokens.spacing.micro[1]}px`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: `${tokens.spacing.micro[0]}px`
                    }}
                >
                    <Star size={12} fill={tokens.colors.system.yellow} color={tokens.colors.system.yellow} />
                    <span className="apple-caption-1" style={{ color: tokens.colors.label.primary }}>
                        {item.vote_average?.toFixed(1) || 'N/A'}
                    </span>
                </div>
            </div>
            <div style={{ padding: `${tokens.spacing.standard[0]}px` }}>
                <h3 className="apple-body" style={{
                    color: tokens.colors.label.primary,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {item.title}
                </h3>
                <p className="apple-caption-1" style={{
                    color: tokens.colors.label.secondary,
                    margin: `${tokens.spacing.micro[0]}px 0 0 0`
                }}>
                    {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                </p>
            </div>
        </div>
    );
};

// Apple-style Hero Section Component
const AppleHeroSection: React.FC<{ 
    featuredContent: MediaItem[], 
    onSelectItem: (item: MediaItem) => void 
}> = ({ featuredContent, onSelectItem }) => {
    const { tokens } = useAppleTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying || featuredContent.length === 0) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % featuredContent.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [featuredContent.length, isAutoPlaying]);

    if (featuredContent.length === 0) return null;

    const currentItem = featuredContent[currentIndex];

    return (
        <div 
            style={{
                position: 'relative',
                height: '70vh',
                minHeight: '500px',
                borderRadius: '24px',
                overflow: 'hidden',
                marginBottom: `${tokens.spacing.standard[2]}px`
            }}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            {/* Background Image */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(https://image.tmdb.org/t/p/original${currentItem.backdrop_path})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.7)'
                }}
            />
            
            {/* Glass Overlay */}
            <div 
                className="apple-glass-prominent"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)'
                }}
            />

            {/* Content */}
            <div style={{
                position: 'absolute',
                bottom: `${tokens.spacing.standard[2]}px`,
                left: `${tokens.spacing.standard[2]}px`,
                right: `${tokens.spacing.standard[2]}px`,
                zIndex: 2
            }}>
                <div className="apple-glass-regular" style={{
                    padding: `${tokens.spacing.standard[1]}px`,
                    borderRadius: '20px',
                    maxWidth: '600px'
                }}>
                    <h1 className="apple-large-title" style={{
                        color: tokens.colors.label.primary,
                        margin: `0 0 ${tokens.spacing.micro[1]}px 0`,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                        {currentItem.title}
                    </h1>
                    
                    <p className="apple-body" style={{
                        color: tokens.colors.label.secondary,
                        margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                        lineHeight: 1.5,
                        maxWidth: '500px'
                    }}>
                        {currentItem.overview?.substring(0, 200)}...
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: `${tokens.spacing.micro[1]}px`,
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => onSelectItem(currentItem)}
                            className="apple-glass-thick apple-depth-1"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: `${tokens.spacing.micro[1]}px`,
                                padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                backgroundColor: tokens.colors.system.blue,
                                color: 'white'
                            }}
                        >
                            <Play size={16} fill="white" />
                            <span className="apple-callout" style={{ fontWeight: tokens.typography.weights.semibold }}>
                                Watch Now
                            </span>
                        </button>

                        <button
                            className="apple-glass-regular apple-depth-1"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: `${tokens.spacing.micro[1]}px`,
                                padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                color: tokens.colors.label.primary
                            }}
                        >
                            <Info size={16} />
                            <span className="apple-callout">More Info</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pagination Dots */}
            <div style={{
                position: 'absolute',
                bottom: `${tokens.spacing.standard[0]}px`,
                right: `${tokens.spacing.standard[1]}px`,
                display: 'flex',
                gap: `${tokens.spacing.micro[0]}px`,
                zIndex: 3
            }}>
                {featuredContent.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: index === currentIndex 
                                ? tokens.colors.system.blue 
                                : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const providerGifMap: Record<string, string> = {
    'Disney+': 'https://media.giphy.com/media/LtAjCYgjUsUVeYNbQl/giphy.gif',
    'Netflix': 'https://media.giphy.com/media/c69RGBBRK8SKwMO78n/giphy.gif',
    'HBO Max': 'https://media.giphy.com/media/wzK2hDKussGKwa7CiB/giphy.gif',
    'Max': 'https://media.giphy.com/media/wzK2hDKussGKwa7CiB/giphy.gif',
    'Hulu': 'https://media.giphy.com/media/UIwMMKYYRRbUtfBFEf/giphy.gif',
    'Paramount+': 'https://media.giphy.com/media/alfSqlC9s7wdqDAOZY/giphy.gif',
    'Amazon Prime Video': 'https://media.giphy.com/media/gvfw1b9opaAFgOTBDI/giphy.gif',
    'Prime Video': 'https://media.giphy.com/media/gvfw1b9opaAFgOTBDI/giphy.gif',
};


const ExploreView: React.FC<ExploreViewProps> = ({ apiKey, searchQuery, onSelectItem, onInvalidApiKey, onNavigateProvider }) => {
    const { tokens } = useAppleTheme();
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
    const [popularTVShows, setPopularTVShows] = useState<MediaItem[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
    const [topRatedTVShows, setTopRatedTVShows] = useState<MediaItem[]>([]);
    const [upcomingMovies, setUpcomingMovies] = useState<MediaItem[]>([]);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const [activeHub, setActiveHub] = useState<number | null>(null);
    const [filterError, setFilterError] = useState<string | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [filtered, setFiltered] = useState({
        trending: [] as MediaItem[],
        popularMovies: [] as MediaItem[],
        popularTVShows: [] as MediaItem[],
        topRatedMovies: [] as MediaItem[],
        topRatedTVShows: [] as MediaItem[],
        upcomingMovies: [] as MediaItem[],
    });
    const { providerIds } = useStreamingPreferences();
    const { country } = useGeolocation();
    const isMobile = isMobileDevice();

    // Fetch all content types
    useEffect(() => {
        const fetchAllContent = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [
                    trendingData,
                    popularMoviesData,
                    popularTVData,
                    topRatedMoviesData,
                    topRatedTVData,
                    upcomingData
                ] = await Promise.all([
                    getTrending(apiKey, 'week'),
                    getPopularMovies(apiKey),
                    getPopularTVShows(apiKey),
                    getTopRatedMovies(apiKey),
                    getTopRatedTVShows(apiKey),
                    getUpcomingMovies(apiKey)
                ]);
                
                if (trendingData.results) {
                    const normalizedTrending = trendingData.results.map((item: any) => {
                        if (item.media_type === 'movie') {
                            return normalizeMovie(item);
                        } else {
                            return normalizeTVShow(item);
                        }
                    });
                    setTrending(normalizedTrending);
                }

                if (popularMoviesData.results) {
                    setPopularMovies(popularMoviesData.results.map(normalizeMovie));
                }

                if (popularTVData.results) {
                    setPopularTVShows(popularTVData.results.map(normalizeTVShow));
                }

                if (topRatedMoviesData.results) {
                    setTopRatedMovies(topRatedMoviesData.results.map(normalizeMovie));
                }

                if (topRatedTVData.results) {
                    setTopRatedTVShows(topRatedTVData.results.map(normalizeTVShow));
                }

                if (upcomingData.results) {
                    setUpcomingMovies(upcomingData.results.map(normalizeMovie));
                }
                
            } catch (err: any) {
                console.error('Error fetching content:', err);
                if (err.message?.includes('401') || err.message?.includes('Invalid API key')) {
                    onInvalidApiKey();
                } else {
                    setError('Failed to load content. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (apiKey) {
            fetchAllContent();
        }
    }, [apiKey, onInvalidApiKey]);

    // Enhanced search functionality
    useEffect(() => {
        const performSearch = async () => {
            const query = searchQuery || internalSearchQuery;
            if (!query.trim() || !apiKey) {
                setSearchResults([]);
                setSearchSuggestions([]);
                return;
            }

            try {
                setSearchLoading(true);
                const searchData = await searchMulti(apiKey, query);
                let combined: MediaItem[] = [];
                if (searchData.results) {
                    combined = searchData.results
                        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                        .map((item: any) => (item.media_type === 'movie' ? normalizeMovie(item) : normalizeTVShow(item)));
                }

                if (combined.length === 0) {
                    const [mr, tr] = await Promise.all([
                        searchMovies(apiKey, query),
                        searchTVShows(apiKey, query),
                    ]);
                    combined = ([...(mr.results || []), ...(tr.results || [])] as MediaItem[]);
                }

                const ranked = combined
                    .map((item) => ({ item, score: computeMatchScore((item as any).title || (item as any).name || '', query) }))
                    .sort((a, b) => b.score - a.score);
                const positive = ranked.filter(r => r.score > 0).map(r => r.item);
                const finalResults = (positive.length > 0 ? positive : combined);
                setSearchResults(finalResults);

                if (finalResults.length === 0) {
                    try {
                        const kw = await searchKeywords(apiKey, query);
                        const names = (kw.results || []).map((k: any) => k.name);
                        const curated = ['Iron Man (2008)', 'Iron Man 2', 'Iron Man 3', 'Tony Stark', 'Avengers'];
                        const sugg = Array.from(new Set([...(names || []).slice(0, 6), ...curated])).slice(0, 8);
                        setSearchSuggestions(sugg);
                    } catch {}
                } else {
                    setSearchSuggestions([]);
                }
            } catch (err: any) {
                console.error('Error searching:', err);
                if (err.message?.includes('401') || err.message?.includes('Invalid API key')) {
                    onInvalidApiKey();
                }
            } finally {
                setSearchLoading(false);
            }
        };

        const debounceTimer = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, internalSearchQuery, apiKey, onInvalidApiKey]);

    // Cache for per-item provider IDs to avoid repeated API calls
    const availabilityCache = useRef<Map<string, Set<number>>>(new Map());
    const getCacheKey = (item: MediaItem) => `${item.media_type}:${item.id}`;

    const getProviderIdsForItem = async (item: MediaItem): Promise<Set<number>> => {
        const key = getCacheKey(item);
        const cached = availabilityCache.current.get(key);
        if (cached) return cached;
        try {
            const data = item.media_type === 'movie'
                ? await getMovieWatchProviders(apiKey, item.id, country.code)
                : await getTVShowWatchProviders(apiKey, item.id, country.code);
            const regionData = data.results[country.code];
            const ids = new Set<number>();
            if (regionData?.flatrate) regionData.flatrate.forEach((p: any) => ids.add(p.provider_id));
            if (regionData?.rent) regionData.rent.forEach((p: any) => ids.add(p.provider_id));
            if (regionData?.buy) regionData.buy.forEach((p: any) => ids.add(p.provider_id));
            availabilityCache.current.set(key, ids);
            return ids;
        } catch (e) {
            // cache empty set on error to prevent hammering
            availabilityCache.current.set(key, new Set());
            throw e;
        }
    };

    const filterByProvider = async (items: MediaItem[], providerId: number): Promise<MediaItem[]> => {
        const result: MediaItem[] = [];
        for (const item of items) {
            try {
                const ids = await getProviderIdsForItem(item);
                if (ids.has(providerId)) result.push(item);
            } catch {
                // ignore per-item error
            }
        }
        return result;
    };

    // Compute filtered lists whenever active hub or lists change
    useEffect(() => {
        const applyFilter = async () => {
            if (!activeHub) {
                setFiltered({
                    trending,
                    popularMovies,
                    popularTVShows,
                    topRatedMovies,
                    topRatedTVShows,
                    upcomingMovies,
                });
                setFilterError(null);
                setIsFiltering(false);
                return;
            }
            setIsFiltering(true);
            setFilterError(null);
            try {
                const [ft, fpm, fptv, ftm, fttv, fu] = await Promise.all([
                    filterByProvider(trending, activeHub),
                    filterByProvider(popularMovies, activeHub),
                    filterByProvider(popularTVShows, activeHub),
                    filterByProvider(topRatedMovies, activeHub),
                    filterByProvider(topRatedTVShows, activeHub),
                    filterByProvider(upcomingMovies, activeHub),
                ]);
                setFiltered({
                    trending: ft,
                    popularMovies: fpm,
                    popularTVShows: fptv,
                    topRatedMovies: ftm,
                    topRatedTVShows: fttv,
                    upcomingMovies: fu,
                });
            } catch (err) {
                console.error('Filtering error', err);
                setFilterError('Service connectivity issue while filtering.');
            } finally {
                setIsFiltering(false);
            }
        };
        applyFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeHub, trending, popularMovies, popularTVShows, topRatedMovies, topRatedTVShows, upcomingMovies, apiKey, country.code]);

    const featuredContent = useMemo(() => {
        return trending.filter(item => item.backdrop_path && item.overview).slice(0, 5);
    }, [trending]);

    const handleInternalSearch = (query: string) => {
        setInternalSearchQuery(query);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="apple-glass-regular apple-depth-1" style={{
                padding: `${tokens.spacing.standard[1]}px`,
                borderRadius: '16px',
                textAlign: 'center',
                margin: `${tokens.spacing.standard[1]}px`
            }}>
                <h2 className="apple-title-2" style={{ color: tokens.colors.system.red, margin: `0 0 ${tokens.spacing.micro[1]}px 0` }}>
                    Error Loading Content
                </h2>
                <p className="apple-body" style={{ color: tokens.colors.label.secondary, margin: 0 }}>
                    {error}
                </p>
            </div>
        );
    }

    const currentSearchQuery = searchQuery || internalSearchQuery;

    return (
        <div style={{ 
            padding: `0 ${tokens.spacing.standard[0]}px`,
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            

            {/* Search Results */}
            {currentSearchQuery && (
                <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: `${tokens.spacing.micro[1]}px`,
                        marginBottom: `${tokens.spacing.standard[0]}px`
                    }}>
                        <Search size={20} color={tokens.colors.label.primary} />
                        <h2 className="apple-title-2" style={{ 
                            color: tokens.colors.label.primary,
                            margin: 0
                        }}>
                            Search Results for "{currentSearchQuery}"
                        </h2>
                    </div>
                    
                    {searchLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: `${tokens.spacing.standard[1]}px` }}>
                            <Loader />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile 
                                ? 'repeat(auto-fill, minmax(150px, 1fr))' 
                                : 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: `${tokens.spacing.standard[0]}px`,
                            marginBottom: `${tokens.spacing.standard[2]}px`
                        }}>
                            {searchResults.slice(0, 20).map((item) => (
                                <GlassPosterCard
                                    key={`${item.id}-${item.media_type}`}
                                    item={item as any}
                                    onClick={(it) => onSelectItem(it as any)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="apple-glass-thin" style={{
                            padding: `${tokens.spacing.standard[1]}px`,
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <p className="apple-body" style={{ color: tokens.colors.label.secondary, margin: 0 }}>
                                No results found for "{currentSearchQuery}"
                            </p>
                            {searchSuggestions.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.micro[1], justifyContent: 'center', marginTop: tokens.spacing.standard[0] }}>
                                    {searchSuggestions.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleInternalSearch(s)}
                                            className="apple-glass-regular"
                                            style={{
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                                                color: tokens.colors.label.primary,
                                                cursor: 'pointer',
                                                background: 'rgba(255,255,255,0.08)'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Hero Carousel - Only show when not searching */}
            {!currentSearchQuery && (
                <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
        <GlassHero
          apiKey={apiKey}
          onSelectItem={onSelectItem}
          onInvalidApiKey={onInvalidApiKey}
        />
                </div>
            )}

            {/* Content Rows - Only show when not searching */}
            {!currentSearchQuery && (
                <>
                    <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                        <h2 className="apple-title-2" style={{ 
                            color: '#FFFFFF',
                            margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            Recommendations
                        </h2>
                        <div style={{ display: 'flex', gap: tokens.spacing.standard[0], alignItems: 'center' }}>
                            <button
                                onClick={() => { try { window.dispatchEvent(new Event('openChoiceGPT')); } catch {} }}
                                className="apple-glass-regular"
                                style={{
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                                    color: tokens.colors.label.primary,
                                    cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.08)'
                                }}
                            >
                                Ask ChoiceGPT for picks
                            </button>
                            {filterError && (
                                <div style={{ color: '#ff6b6b' }}>
                                    {filterError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trending This Week */}
                    {(activeHub ? filtered.trending.length > 0 : trending.length > 0) && (
                        <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                            <h2 className="apple-title-2" style={{ 
                                color: '#FFFFFF',
                                margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Trending This Week
                            </h2>
                            <MediaRow
                                title="Trending This Week"
                                items={activeHub ? filtered.trending : trending}
                                onSelectItem={onSelectItem}
                                apiKey={apiKey}
                            />
                        </div>
                    )}

                    {/* Popular Movies */}
                    {(activeHub ? filtered.popularMovies.length > 0 : popularMovies.length > 0) && (
                        <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                            <h2 className="apple-title-2" style={{ 
                                color: '#FFFFFF',
                                margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Popular Movies
                            </h2>
                            <MediaRow
                                title="Popular Movies"
                                items={activeHub ? filtered.popularMovies : popularMovies}
                                onSelectItem={onSelectItem}
                                apiKey={apiKey}
                            />
                        </div>
                    )}

                    {/* Top TV Shows */}
                    {(activeHub ? filtered.popularTVShows.length > 0 : popularTVShows.length > 0) && (
                        <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                            <h2 className="apple-title-2" style={{ 
                                color: '#FFFFFF',
                                margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Popular TV Shows
                            </h2>
                            <MediaRow
                                title="Popular TV Shows"
                                items={activeHub ? filtered.popularTVShows : popularTVShows}
                                onSelectItem={onSelectItem}
                                apiKey={apiKey}
                            />
                        </div>
                    )}

                    {/* Top Rated Movies */}
                    {(activeHub ? filtered.topRatedMovies.length > 0 : topRatedMovies.length > 0) && (
                        <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                            <h2 className="apple-title-2" style={{ 
                                color: '#FFFFFF',
                                margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Top Rated Movies
                            </h2>
                            <MediaRow
                                title="Top Rated Movies"
                                items={activeHub ? filtered.topRatedMovies : topRatedMovies}
                                onSelectItem={onSelectItem}
                                apiKey={apiKey}
                            />
                        </div>
                    )}

                    {/* Top Rated TV Shows */}
                    {(activeHub ? filtered.topRatedTVShows.length > 0 : topRatedTVShows.length > 0) && (
                        <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                            <h2 className="apple-title-2" style={{ 
                                color: '#FFFFFF',
                                margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Top Rated TV Shows
                            </h2>
                            <MediaRow
                                title="Top Rated TV Shows"
                                items={activeHub ? filtered.topRatedTVShows : topRatedTVShows}
                                onSelectItem={onSelectItem}
                                apiKey={apiKey}
                            />
                        </div>
                    )}

                    {/* Recently Added */}
                    {(activeHub ? filtered.upcomingMovies.length > 0 : upcomingMovies.length > 0) && (
                        <div style={{ marginBottom: `${tokens.spacing.standard[2]}px` }}>
                            <h2 className="apple-title-2" style={{ 
                                color: '#FFFFFF',
                                margin: `0 0 ${tokens.spacing.standard[0]}px 0`,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Coming Soon
                            </h2>
                            <MediaRow
                                title="Coming Soon"
                                items={activeHub ? filtered.upcomingMovies : upcomingMovies}
                                onSelectItem={onSelectItem}
                                apiKey={apiKey}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ExploreView;
