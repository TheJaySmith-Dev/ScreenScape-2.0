import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MediaItem, TVShow, WatchProviderCountry } from '../types';
import { getTrending, getMovieWatchProviders, getTVShowWatchProviders } from '../services/tmdbService';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { PlayIcon } from './Icons';
import {
    getAvailabilityBuckets,
    buildAvailabilityDescriptors,
    hasAvailability,
} from '../utils/streamingAvailability';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

interface HeroCarouselProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [availabilityMap, setAvailabilityMap] = useState<Record<number, WatchProviderCountry | null>>({});
    const intervalRef = useRef<number | null>(null);
    const { country } = useGeolocation();
    const { providerIds } = useStreamingPreferences();

    useEffect(() => {
        let isMounted = true;
        const fetchTrending = async () => {
            try {
                const trending = await getTrending(apiKey, 'week');
                const filteredItems = trending.results
                    .filter(item => item.backdrop_path && (item.media_type === 'movie' || item.media_type === 'tv'))
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 7);
                if (isMounted) {
                    setItems(filteredItems);
                    setAvailabilityMap({});
                }
            } catch (error) {
                console.error(error);
                if (error instanceof Error && error.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            }
        };
        fetchTrending();
        return () => { isMounted = false; };
    }, [apiKey, onInvalidApiKey]);

    useEffect(() => {
        if (items.length === 0) return;

        let isMounted = true;
        const currentItem = items[currentIndex];

        // Only fetch watch providers since we don't need trailers anymore
        const fetchProviders = async () => {
            try {
                const providersResponse = currentItem.media_type === 'movie'
                    ? await getMovieWatchProviders(apiKey, currentItem.id, country.code)
                    : await getTVShowWatchProviders(apiKey, currentItem.id, country.code);

                if (isMounted) {
                    const providers = providersResponse.results?.[country.code] ?? null;
                    setAvailabilityMap(prev => ({ ...prev, [currentItem.id]: providers }));
                }
            } catch (error) {
                console.error("Failed to fetch providers:", error);
                if (isMounted) {
                    setAvailabilityMap(prev => ({ ...prev, [currentItem.id]: null }));
                }
            }
        };
        fetchProviders();

        return () => { isMounted = false; };
    }, [currentIndex, items, apiKey, country.code]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % (items.length || 1));
    }, [items.length]);

    useEffect(() => {
        if (!isHovered && items.length > 0) {
            intervalRef.current = window.setInterval(goToNext, 7000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHovered, items.length, goToNext]);

    const activeItem = items[currentIndex];
    const activeAvailability = activeItem ? availabilityMap[activeItem.id] ?? undefined : undefined;
    // Always show static backdrop images instead of trying to autoplay trailers
    const showVideo = false;

    const activeBuckets = useMemo(
        () => getAvailabilityBuckets(activeAvailability, providerIds),
        [activeAvailability, providerIds]
    );

    const availabilityDescriptors = useMemo(
        () => buildAvailabilityDescriptors(activeBuckets, 3),
        [activeBuckets]
    );

    const showAvailability = useMemo(() => hasAvailability(activeBuckets), [activeBuckets]);

    return (
        <div
            className="relative min-h-[520px] sm:h-[80vh] w-full text-white overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                    {item.backdrop_path && (
                        <img
                            src={`${IMAGE_BASE_URL}${item.backdrop_path}`}
                            alt={item.media_type === 'movie' ? item.title : (item as TVShow).name}
                            className="w-full h-full object-cover scale-110"
                        />
                    )}
                </div>
            ))}
            
            <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <div
                className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent"
                style={{ backdropFilter: 'blur(2px)' }}
            />

            <div className="relative h-full flex flex-col justify-end container mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-28 md:pb-40 z-10">
                {activeItem && (
                    <div className="w-full md:w-1/2 lg:w-2/5 max-w-2xl animate-fade-in-up space-y-4">
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold drop-shadow-lg leading-tight">
                            {activeItem.media_type === 'movie' ? activeItem.title : (activeItem as TVShow).name}
                        </h2>
                        <p className="text-base sm:text-lg text-slate-200 line-clamp-4 sm:line-clamp-3 drop-shadow-md">
                            {activeItem.overview}
                        </p>
                        {showAvailability && activeAvailability && (
                            <div className="flex flex-wrap gap-2 items-center">
                                {/* Show actual provider logos */}
                                {activeAvailability.flatrate?.slice(0, 5).map(provider => (
                                    <div
                                        key={`flatrate-${provider.provider_id}`}
                                        className="relative group"
                                        title={`Stream on ${provider.provider_name}`}
                                    >
                                        <img
                                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ))}
                                {activeAvailability.rent?.slice(0, 3).map(provider => (
                                    <div
                                        key={`rent-${provider.provider_id}`}
                                        className="relative group"
                                        title={`Rent on ${provider.provider_name}`}
                                    >
                                        <img
                                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 opacity-75"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ))}
                                {/* Fallback text if no logos */}
                                {(!activeAvailability.flatrate || activeAvailability.flatrate.length === 0) && availabilityDescriptors.length > 0 && (
                                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-200">
                                        {availabilityDescriptors.slice(0, 2).map(descriptor => (
                                            <span
                                                key={descriptor.type}
                                                className="bg-black/40 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm"
                                            >
                                                <span className="font-semibold text-white mr-1">{descriptor.type}:</span>
                                                {descriptor.text}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                            <button
                                onClick={() => onSelectItem(activeItem)}
                                className="flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-slate-200 transition-colors shadow-lg sm:shadow-none"
                            >
                                <PlayIcon className="w-6 h-6" />
                                More Info
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Indicators */}
            <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {items.map((_, index) => (
                    <button key={index} onClick={() => setCurrentIndex(index)} className="w-8 sm:w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full bg-white ${index === currentIndex ? 'animate-progress' : ''} ${index > currentIndex ? 'w-0' : 'w-full'}`} />
                    </button>
                ))}
            </div>
             <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-progress {
                    animation: progress 7s linear forwards;
                }
            `}</style>
        </div>
    );
};

export default HeroCarousel;
