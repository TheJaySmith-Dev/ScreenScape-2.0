import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppleTheme } from './AppleThemeProvider';
import { MediaItem, TVShow } from '../types';
import {
    getUpcomingMovies,
    getPopularMovies,
    getPopularTVShows,
    getMovieImages,
    getTVShowImages,
    getMovieVideos,
    getTVShowVideos
} from '../services/tmdbService';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import MediaTitleLogo from './MediaTitleLogo';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

interface HeroCarouselProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

type HeroItem = MediaItem & { heroType: 'Trending Now' | 'New Release' };

const HeroCarousel: React.FC<HeroCarouselProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const [items, setItems] = useState<HeroItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [tmdbBackdrops, setTmdbBackdrops] = useState<Record<number, string | null>>({});
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
    const [shouldPlayVideo, setShouldPlayVideo] = useState<boolean>(false);
    const intervalRef = useRef<number | null>(null);
    const activeVideoUrlRef = useRef<string | null>(null);
    const { tokens } = useAppleTheme();

    // 1. Data Fetching
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const [upcomingResp, popularMoviesResp, popularTVResp] = await Promise.all([
                    getUpcomingMovies(apiKey),
                    getPopularMovies(apiKey),
                    getPopularTVShows(apiKey)
                ]);

                const recentThreshold = new Date();
                recentThreshold.setMonth(recentThreshold.getMonth() - 4);

                const newMovies = upcomingResp.results
                    .filter(it => it.backdrop_path)
                    .slice(0, 5)
                    .map(item => ({ ...item, heroType: 'New Release' as const }));

                const newShows = popularTVResp.results
                    .filter(tv => {
                        const d = (tv as TVShow).first_air_date;
                        if (!d) return false;
                        const dt = new Date(d);
                        return !isNaN(dt.getTime()) && dt >= recentThreshold;
                    })
                    .filter(it => it.backdrop_path)
                    .slice(0, Math.max(0, 5 - newMovies.length))
                    .map(item => ({ ...item, heroType: 'New Release' as const }));

                const popularMovies = popularMoviesResp.results
                    .filter(it => it.backdrop_path)
                    .slice(0, 5)
                    .map(item => ({ ...item, heroType: 'Trending Now' as const }));

                const popularShows = popularTVResp.results
                    .filter(it => it.backdrop_path)
                    .slice(0, Math.max(0, 5 - popularMovies.length))
                    .map(item => ({ ...item, heroType: 'Trending Now' as const }));

                const newSet = [...newMovies, ...newShows].slice(0, 5);
                const popularSet = [...popularMovies, ...popularShows].slice(0, 5);

                const combined: HeroItem[] = [];
                const maxLen = Math.max(newSet.length, popularSet.length);
                for (let i = 0; i < maxLen; i++) {
                    if (i < newSet.length) combined.push(newSet[i]);
                    if (i < popularSet.length) combined.push(popularSet[i]);
                }

                if (isMounted) {
                    setItems(combined.slice(0, 10));
                }
            } catch (err) {
                console.error("Hero fetch error", err);
                if (err instanceof Error && err.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [apiKey, onInvalidApiKey]);

    // 2. Resolve Backdrops (High Quality)
    useEffect(() => {
        if (items.length === 0) return;
        let cancelled = false;
        const resolveImages = async () => {
            const updates: Record<number, string | null> = {};
            for (const item of items) {
                try {
                    let url: string | null = null;
                    // Try to get better backdrops
                    if (item.media_type === 'movie') {
                        const imgs = await getMovieImages(apiKey, item.id);
                        const best = imgs.backdrops?.[0];
                        if (best?.file_path) url = `${IMAGE_BASE_URL}${best.file_path}`;
                    } else if (item.media_type === 'tv') {
                        const imgs = await getTVShowImages(apiKey, item.id);
                        const best = imgs.backdrops?.[0];
                        if (best?.file_path) url = `${IMAGE_BASE_URL}${best.file_path}`;
                    }
                    updates[item.id] = url;
                } catch {
                    updates[item.id] = null;
                }
            }
            if (!cancelled) setTmdbBackdrops(prev => ({ ...prev, ...updates }));
        };
        resolveImages();
        return () => { cancelled = true; };
    }, [items, apiKey]);

    // 3. Video Logic (Simplified for stability)
    useEffect(() => {
        activeVideoUrlRef.current = activeVideoUrl;
    }, [activeVideoUrl]);

    const activeItem = items[currentIndex];

    useEffect(() => {
        // Reset video state on slide change
        setActiveVideoUrl(null);
        setShouldPlayVideo(false);

        if (!activeItem) return;

        let cancelled = false;
        let videoTimer: number | null = null;

        const loadVideo = async () => {
            try {
                const res = activeItem.media_type === 'movie'
                    ? await getMovieVideos(apiKey, activeItem.id)
                    : await getTVShowVideos(apiKey, activeItem.id);

                const vids = res.results || [];
                // Priority: TV Spot > Official Trailer > Trailer
                const video = vids.find(v => v.site === 'YouTube' && (v.type === 'TV Spot' || /tv\s*spot/i.test(v.name || '')))
                    || vids.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
                    || vids.find(v => v.site === 'YouTube' && v.type === 'Trailer');

                if (video?.key && !cancelled) {
                    const url = `https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${video.key}`;
                    setActiveVideoUrl(url);

                    // Delay playing to allow backdrop to show first
                    videoTimer = window.setTimeout(() => {
                        if (!cancelled) setShouldPlayVideo(true);
                    }, 5000);
                }
            } catch (e) {
                console.error("Video fetch error", e);
            }
        };

        loadVideo();

        return () => {
            cancelled = true;
            if (videoTimer) clearTimeout(videoTimer);
        };
    }, [activeItem, apiKey]);

    // 4. Navigation Logic
    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % (items.length || 1));
    }, [items.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + (items.length || 1)) % (items.length || 1));
    }, [items.length]);

    // 5. Auto Rotation
    useEffect(() => {
        if (!isHovered && !shouldPlayVideo && items.length > 0) {
            intervalRef.current = window.setInterval(goToNext, 8000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [isHovered, shouldPlayVideo, items.length, goToNext]);

    if (items.length === 0) {
        return <div className="w-screen h-[70vh] bg-black/20 animate-pulse" />;
    }

    return (
        <div
            className="relative w-screen h-screen md:h-[95vh] overflow-hidden group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                marginLeft: 'calc(-50vw + 50%)',
                marginRight: 'calc(-50vw + 50%)',
                width: '100vw',
                background: '#000'
            }}
        >
            {/* Slides */}
            {items.map((item, index) => {
                const isActive = index === currentIndex;
                const backdrop = tmdbBackdrops[item.id]
                    || (item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : null);

                return (
                    <div
                        key={`${item.id}-${index}`}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {/* Image Layer */}
                        {backdrop && (
                            <img
                                src={backdrop}
                                alt={item.title || (item as TVShow).name}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Video Layer */}
                        {isActive && shouldPlayVideo && activeVideoUrl && (
                            <div className="absolute inset-0 overflow-hidden animate-fadeIn">
                                <iframe
                                    src={activeVideoUrl}
                                    className="absolute w-[170%] h-[170%] sm:w-[185%] sm:h-[185%] md:w-[200%] md:h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                    allow="autoplay; encrypted-media"
                                />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    </div>
                );
            })}

            {/* Content Layer (Z-20) */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center px-8 sm:px-16">
                {activeItem && (
                    <div className="max-w-2xl space-y-6 pointer-events-auto animate-slideUp">
                        {/* Badge */}
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                            {activeItem.heroType}
                        </div>

                        {/* Title / Logo */}
                        <div className="origin-left transform scale-100">
                            <MediaTitleLogo
                                media={activeItem}
                                apiKey={apiKey}
                                size="large"
                                fallbackToText={true}
                                style={{ maxWidth: '400px', maxHeight: '150px' }}
                            />
                        </div>

                        {/* Overview (Optional, short) */}
                        <p className="text-white/80 text-sm sm:text-base line-clamp-3 max-w-xl drop-shadow-md">
                            {activeItem.overview}
                        </p>

                        {/* Action Button */}
                        <button
                            onClick={() => onSelectItem(activeItem)}
                            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-xl"
                        >
                            <Info className="w-5 h-5" />
                            More Info
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Buttons (Z-50) - Always Visible & Clickable */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/30 text-white hover:bg-white hover:text-black transition-all backdrop-blur-sm border border-white/10 shadow-lg cursor-pointer"
                aria-label="Previous Slide"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/30 text-white hover:bg-white hover:text-black transition-all backdrop-blur-sm border border-white/10 shadow-lg cursor-pointer"
                aria-label="Next Slide"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            {/* Bottom Blend to Page */}
            <div
                aria-hidden
                className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none"
                style={{
                    height: '18vh',
                    background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${tokens?.colors?.background?.primary || '#000000'} 100%)`
                }}
            />

            {/* Indicators (Z-30) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {items.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
