import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MediaItem, TVShow, WatchProviderCountry } from '../types';
import { getTrending, getMovieWatchProviders, getTVShowWatchProviders } from '../services/tmdbService';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useAppleTheme } from './AppleThemeProvider';
import { PlayIcon } from './Icons';
import { Info } from 'lucide-react';
import MediaTitleLogo from './MediaTitleLogo';
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
    const { tokens } = useAppleTheme();
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
                // Handle network errors silently to prevent console spam
                if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                    // Network error - silently set providers to null
                    if (isMounted) {
                        setAvailabilityMap(prev => ({ ...prev, [currentItem.id]: null }));
                    }
                } else {
                    // Log other types of errors for debugging
                    console.error("Failed to fetch providers:", error);
                    if (isMounted) {
                        setAvailabilityMap(prev => ({ ...prev, [currentItem.id]: null }));
                    }
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
            className="relative w-screen h-[70vh] overflow-hidden -mx-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                marginLeft: 'calc(-50vw + 50%)',
                marginRight: 'calc(-50vw + 50%)',
                width: '100vw',
            }}
        >
            {/* Edge gradient masks for seamless blending */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-black/20 to-transparent" />
                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-black/20 to-transparent" />
                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {items.map((item, index) => {
                const isActive = index === currentIndex;
                const availability = availabilityMap[item.id];
                const availabilityBuckets = getAvailabilityBuckets(availability, providerIds);
                const availabilityDescriptors = buildAvailabilityDescriptors(availabilityBuckets);
                const hasAnyAvailability = hasAvailability(availabilityBuckets);

                return (
                    <div
                        key={item.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                            isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
                                alt={item.media_type === 'movie' ? item.title : (item as TVShow).name}
                                className="w-full h-full object-cover"
                            />
                            {/* Subtle overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                        </div>
                    </div>
                );
            })}

            <div className="relative h-full flex flex-col justify-end z-20">
                {activeItem && (
                    <div className="mx-4 sm:mx-8 mb-8 sm:mb-12">
                        {/* Glass morphism content panel */}
                        <div 
                            className="p-6 sm:p-8 rounded-2xl max-w-4xl"
                            style={{
                                background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                                WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                                border: `1px solid ${tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)'}`,
                                boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div className="flex items-start gap-6 w-full">
                                {/* Logo Section - Left */}
                                <div className="flex-shrink-0 hidden sm:block">
                                    <MediaTitleLogo
                                        media={activeItem}
                                        apiKey={apiKey}
                                        size="large"
                                        fallbackToText={false}
                                        style={{
                                            maxWidth: '150px',
                                            maxHeight: '80px',
                                            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))'
                                        }}
                                    />
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 space-y-4">
                            {/* Mobile Logo - Show on small screens */}
                            <div className="block sm:hidden mb-4">
                                <MediaTitleLogo
                                    media={activeItem}
                                    apiKey={apiKey}
                                    size="medium"
                                    fallbackToText={false}
                                    style={{
                                        maxWidth: '120px',
                                        maxHeight: '60px',
                                        filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
                                    }}
                                />
                            </div>

                                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                                        {activeItem.media_type === 'movie' ? activeItem.title : (activeItem as TVShow).name}
                                    </h2>
                                    <p className="text-base sm:text-lg text-white/90 line-clamp-3 sm:line-clamp-2 leading-relaxed">
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
                                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-white/80">
                                            {availabilityDescriptors.slice(0, 2).map(descriptor => (
                                                <span
                                                    key={descriptor.type}
                                                    className="bg-white/10 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm"
                                                >
                                                    <span className="font-semibold text-white mr-1">{descriptor.type}:</span>
                                                    <span className="text-white/90">{descriptor.text}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                                        <button
                                            onClick={() => onSelectItem(activeItem)}
                                            className="flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200"
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.15)',
                                                backdropFilter: 'blur(20px)',
                                                WebkitBackdropFilter: 'blur(20px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            <Info className="w-5 h-5" />
                                            More Info
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Indicators - Horizontal Lines */}
            <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {items.map((_, index) => (
                    <button 
                        key={index} 
                        onClick={() => setCurrentIndex(index)} 
                        className="w-8 sm:w-12 h-1 bg-white/30 rounded-full overflow-hidden transition-all duration-300 hover:bg-white/50"
                        style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
                        }}
                    >
                        <div 
                            className={`h-full bg-white rounded-full transition-all duration-300 ${
                                index === currentIndex ? 'animate-progress' : ''
                            } ${
                                index > currentIndex ? 'w-0' : index < currentIndex ? 'w-full' : ''
                            }`}
                            style={{
                                boxShadow: index === currentIndex ? '0 0 8px rgba(255, 255, 255, 0.6)' : 'none'
                            }}
                        />
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
