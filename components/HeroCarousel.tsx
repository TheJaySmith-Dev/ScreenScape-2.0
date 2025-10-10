import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, Video, TVShow } from '../types';
import { getTrending, getMovieDetails, getTVShowDetails } from '../services/tmdbService';
import VideoPlayer from './VideoPlayer';
import { PlayIcon, VolumeOffIcon, VolumeUpIcon } from './Icons';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

interface HeroCarouselProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [trailers, setTrailers] = useState<Record<string, string | null>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const trending = await getTrending(apiKey, 'week');
                const filteredItems = trending.results
                    .filter(item => item.backdrop_path && (item.media_type === 'movie' || item.media_type === 'tv'))
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 7);
                setItems(filteredItems);
            } catch (error) {
                console.error(error);
                onInvalidApiKey();
            }
        };
        fetchTrending();
    }, [apiKey, onInvalidApiKey]);

    useEffect(() => {
        if (items.length > 0) {
            const currentItem = items[currentIndex];
            if (!trailers[currentItem.id]) {
                const fetchTrailer = async () => {
                    try {
                        const details = currentItem.media_type === 'movie'
                            ? await getMovieDetails(apiKey, currentItem.id)
                            : await getTVShowDetails(apiKey, currentItem.id);
                        
                        const officialTrailer = details.videos?.results.find((v: Video) => v.type === 'Trailer' && v.official && v.site === 'YouTube');
                        const anyTrailer = details.videos?.results.find((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');
                        const trailerKey = officialTrailer?.key || anyTrailer?.key || null;

                        setTrailers(prev => ({ ...prev, [currentItem.id]: trailerKey }));
                    } catch (error) {
                        console.error("Failed to fetch trailer:", error);
                        setTrailers(prev => ({ ...prev, [currentItem.id]: null })); // Mark as failed
                    }
                };
                fetchTrailer();
            }
        }
    }, [currentIndex, items, apiKey, trailers]);

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
    const activeTrailerKey = activeItem ? trailers[activeItem.id] : null;

    return (
        <div 
            className="relative h-[80vh] w-full text-white overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                    {activeTrailerKey && index === currentIndex ? (
                         <div className="absolute inset-0 scale-125">
                            <VideoPlayer videoKey={activeTrailerKey} isMuted={isMuted} onEnd={goToNext} />
                        </div>
                    ) : (
                        <img
                            src={`${IMAGE_BASE_URL}${item.backdrop_path}`}
                            alt={item.media_type === 'movie' ? item.title : (item as TVShow).name}
                            className="w-full h-full object-cover scale-110"
                        />
                    )}
                </div>
            ))}
            
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative h-full flex flex-col justify-end container mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-40 z-10">
                {activeItem && (
                    <div className="w-full md:w-1/2 lg:w-2/5 animate-fade-in-up">
                        <h2 className="text-4xl md:text-6xl font-bold drop-shadow-lg">{activeItem.media_type === 'movie' ? activeItem.title : (activeItem as TVShow).name}</h2>
                        <p className="mt-4 text-lg text-slate-200 line-clamp-3 drop-shadow-md">{activeItem.overview}</p>
                        <div className="mt-6 flex items-center gap-4">
                            <button
                                onClick={() => onSelectItem(activeItem)}
                                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <PlayIcon className="w-6 h-6" />
                                More Info
                            </button>
                            <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className="glass-button rounded-full w-12 h-12 flex items-center justify-center"
                            >
                                {isMuted ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {items.map((_, index) => (
                    <button key={index} onClick={() => setCurrentIndex(index)} className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full bg-white ${index === currentIndex ? 'animate-progress' : ''} ${index > currentIndex ? 'w-0' : 'w-full'}`}
                            style={{ animation: index === currentIndex ? 'progress 7s linear forwards' : 'none' }}
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