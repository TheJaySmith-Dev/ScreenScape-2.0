import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MediaItem, Movie, TVShow } from '../types';
import { ViewType } from '../App';
import { Game } from './GameView';
import HeroCarousel from './HeroCarousel';
import MediaRow from './MediaRow';
import {
    getTrending,
    normalizeMovie,
    normalizeTVShow,
    searchMulti,
    getMovieWatchProviders,
} from '../services/tmdbService';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useGeolocation } from '../hooks/useGeolocation';
import StreamingHubs from './StreamingHubs';
import Loader from './Loader';
import { StarIcon } from './Icons';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface ExploreViewProps {
    apiKey: string;
    searchQuery: string;
    onInvalidApiKey: () => void;
    view: ViewType;
    onSelectItem: (item: MediaItem) => void;
    onSelectGame: (game: Game) => void;
}

const SearchResultCard: React.FC<{ item: MediaItem; onClick: (item: MediaItem) => void }> = ({ item, onClick }) => {
    const title = 'title' in item ? item.title : item.name;
    const year = 'release_date' in item ? item.release_date?.substring(0, 4) : item.first_air_date?.substring(0, 4);

    return (
        <div onClick={() => onClick(item)} className="group cursor-pointer animate-fade-in">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-glass shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img
                    src={item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                    alt={title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 p-3">
                    <h3 className="font-bold text-white text-sm truncate">{title}</h3>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
                        <span>{year || 'N/A'}</span>
                        <div className="flex items-center gap-1">
                            <StarIcon className="h-3 w-3 text-yellow-400" isActive />
                            <span>{item.vote_average.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExploreView: React.FC<ExploreViewProps> = ({ apiKey, searchQuery, onSelectItem, onInvalidApiKey }) => {
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [popularShows, setPopularShows] = useState<TVShow[]>([]);
    const [forYou, setForYou] = useState<Movie[]>([]);
    const { providerIds } = useStreamingPreferences();
    const { country } = useGeolocation();
    const [activeProviderHub, setActiveProviderHub] = useState<number | null>(null);

    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimer = useRef<number | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchHomeData = async () => {
            try {
                // Use TMDb trending data since TheTVDB doesn't have popular endpoints
                const trending = await getTrending(apiKey, 'week');
                // Separate movies and shows from trending
                const movies = trending.results.filter(item => item.media_type === 'movie').slice(0, 10);
                const shows = trending.results.filter(item => item.media_type === 'tv').slice(0, 10);

                if (isMounted) {
                    setPopularMovies(movies);
                    setPopularShows(shows);
                }
            } catch (error) {
                console.error(error);
                if (error instanceof Error && error.message.includes('Invalid API Key')) {
                    onInvalidApiKey();
                }
            }
        };

        fetchHomeData();
        return () => {
            isMounted = false;
        };
    }, [apiKey, onInvalidApiKey]);

    useEffect(() => {
        let isMounted = true;
        const fetchForYou = async () => {
            const providersToFetch = activeProviderHub ? [activeProviderHub] : Array.from(providerIds);
            if (providersToFetch.length === 0) {
                if (isMounted) {
                    setForYou([]);
                }
                return;
            }

            try {
                // Use TMDb trending for "For You" recommendations since streaming availability is TMDb only
                const trendingRes = await getTrending(apiKey, 'week');
                const movies = trendingRes.results.filter(item => item.media_type === 'movie').slice(0, 10);
                if (isMounted) {
                    setForYou(movies);
                }
            } catch (error) {
                console.error("Failed to fetch 'For You' recommendations:", error);
                if (error instanceof Error && error.message.includes('Invalid API Key')) {
                    onInvalidApiKey();
                }
            }
        };

        fetchForYou();
        return () => {
            isMounted = false;
        };
    }, [apiKey, providerIds, activeProviderHub, country.code]);

    useEffect(() => {
        let isMounted = true;

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (searchQuery.trim() === '') {
            setSearchResults([]);
            setIsSearching(false);
            return () => {
                isMounted = false;
            };
        }

        setIsSearching(true);
        debounceTimer.current = window.setTimeout(async () => {
            try {
                const response = await searchMulti(apiKey, searchQuery);
                const validResults = response.results
                    .filter((item): item is Movie | TVShow =>
                        'media_type' in item &&
                        (item.media_type === 'movie' || item.media_type === 'tv') &&
                        item.poster_path != null,
                    )
                    .map(item => (item.media_type === 'movie' ? normalizeMovie(item) : normalizeTVShow(item)));

                if (isMounted) {
                    setSearchResults(validResults);
                }
            } catch (error) {
                console.error('Search failed:', error);
                if (error instanceof Error && error.message.includes('Invalid API Key')) {
                    onInvalidApiKey();
                }
            } finally {
                if (isMounted) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => {
            isMounted = false;
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchQuery, apiKey, onInvalidApiKey]);

    const rows = useMemo(
        () => [
            { title: 'Popular Movies', items: popularMovies },
            { title: 'Popular TV Shows', items: popularShows },
        ],
        [popularMovies, popularShows],
    );

    if (searchQuery.trim() !== '') {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold mb-6">Results for "{searchQuery}"</h2>
                {isSearching ? (
                    <Loader />
                ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {searchResults.map(item => (
                            <SearchResultCard key={`${item.id}-${item.media_type}`} item={item} onClick={onSelectItem} />
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">No results found.</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4 md:space-y-8">
            <HeroCarousel apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col space-y-8 -mt-24 md:-mt-32 relative z-10 pb-16">
                {providerIds.size > 0 && (
                    <div>
                        <StreamingHubs activeHub={activeProviderHub} setActiveHub={setActiveProviderHub} />
                        <MediaRow title="For You" items={forYou} onSelectItem={onSelectItem} />
                    </div>
                )}
                {rows.map((row, index) => (
                    <MediaRow key={`${row.title}-${index}`} title={row.title} items={row.items} onSelectItem={onSelectItem} />
                ))}
            </div>
        </div>
    );
};

export default ExploreView;
