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
import GlassPanel from './GlassPanel';

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
    const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    const containerRef = useRef<HTMLDivElement>(null);
    const [heroHeight, setHeroHeight] = useState<number | null>(null);

    useEffect(() => {
        const updateHeight = () => {
            try {
                const el = containerRef.current;
                if (!el) return;
                const w = el.offsetWidth || 0;
                const maxH = (typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800);
                const h = Math.min(w * (9 / 16), maxH);
                setHeroHeight(h);
            } catch {}
        };
        updateHeight();
        window.addEventListener('resize', updateHeight, { passive: true });
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

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
                // Priority: Official Trailer > Trailer > TV Spot
                const video = vids.find(v => v.site === 'YouTube' && v.type === 'Trailer' && (v as any).official)
                    || vids.find(v => v.site === 'YouTube' && v.type === 'Trailer')
                    || vids.find(v => v.site === 'YouTube' && (((v.type as string) === 'TV Spot') || /tv\s*spot/i.test(v.name || '')));

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
        <>
        <div
            ref={containerRef}
            className="relative w-full mx-auto max-w-6xl overflow-hidden group rounded-3xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: '#000',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 12px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
                filter: 'drop-shadow(0 28px 48px rgba(0,0,0,0.55)) drop-shadow(0 10px 24px rgba(0,0,0,0.40))',
                marginTop: isMobile ? '40px' : '32px',
                aspectRatio: '16 / 9',
                maxHeight: '80vh',
                height: heroHeight ?? undefined
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

                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                    </div>
                );
            })}

            {activeItem && (
                <>
                    <div className="hidden sm:block" style={{ position: 'absolute', left: 24, top: 'calc(50% + 24px)', transform: 'translateY(-50%)', zIndex: 30 }}>
                        <MediaTitleLogo
                            media={activeItem}
                            apiKey={apiKey}
                            size="large"
                            fallbackToText={true}
                            style={{ maxWidth: 240, maxHeight: 100, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
                        />
                    </div>
                    <div className="hidden sm:block" style={{ position: 'absolute', left: 24, top: 'calc(50% + 84px)', zIndex: 30 }}>
                        <button
                            onClick={() => onSelectItem(activeItem)}
                            style={{
                                cursor: 'pointer',
                                padding: '10px 16px',
                                borderRadius: 16,
                                background: 'rgba(255,255,255,0.12)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.22)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                            }}
                        >
                            Info
                        </button>
                    </div>
                </>
            )}

            {/* Content Layer (Z-20) */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center px-8 sm:px-16">
                {activeItem && (
                    <div className="max-w-2xl pointer-events-auto animate-slideUp">
                        <GlassPanel
                            variant="primary"
                            material="regular"
                            padding="large"
                            borderRadius="large"
                            className="space-y-6 backdrop-blur-3xl"
                        >
                            {/* Badge */}
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                                {activeItem.heroType}
                            </div>

                            

                            {/* Overview (Optional, short) */}
                            <p className="text-white/90 text-sm sm:text-base line-clamp-3 max-w-xl drop-shadow-md font-medium">
                                {activeItem.overview}
                            </p>

                            
                        </GlassPanel>
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
        {activeItem && (
            <div className="sm:hidden" style={{ marginTop: 24, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <MediaTitleLogo
                    media={activeItem}
                    apiKey={apiKey}
                    size="medium"
                    fallbackToText={true}
                    style={{ maxWidth: 180, maxHeight: 80, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
                />
                <button
                    onClick={() => onSelectItem(activeItem)}
                    style={{
                        cursor: 'pointer',
                        padding: '10px 16px',
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.12)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.22)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                    }}
                >
                    Info
                </button>
            </div>
        )}
        </>
    );
};

export default HeroCarousel;
