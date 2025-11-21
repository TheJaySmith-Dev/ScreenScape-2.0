import React, { useState, useEffect, useRef } from 'react';
import { getTrending, getMovieExternalIds, getMovieImages, getTVShowImages } from '../services/tmdbService';
// FanArt removed: posters now resolved via TMDb images with OMDb fallback for movies
import { MediaItem, TVShow } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w300';

interface TrendingStripProps {
    apiKey: string;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

const TrendingStrip: React.FC<TrendingStripProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const [trendingItems, setTrendingItems] = useState<MediaItem[]>([]);
    const [posterMap, setPosterMap] = useState<Record<number, string | null>>({});
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const response = await getTrending(apiKey, 'week');
                const validItems = response.results.filter(item => 
                    (item.media_type === 'movie' || item.media_type === 'tv')
                ).slice(0, 15); // Get top 15
                setTrendingItems(validItems);
                setPosterMap({});
            } catch (error) {
                console.error("Failed to fetch trending items:", error);
                if (error instanceof Error && error.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            }
        };
        fetchTrending();
    }, [apiKey, onInvalidApiKey]);

    useEffect(() => {
        let cancelled = false;
        const resolvePosters = async () => {
            const updates: Record<number, string | null> = {};
            for (const it of trendingItems) {
                try {
                    let url: string | null = null;
                    if (it.media_type === 'movie') {
                        const images = await getMovieImages(apiKey, it.id);
                        if (images?.posters?.length) {
                            const poster = images.posters
                                .slice()
                                .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0))[0];
                            if (poster?.file_path) {
                                url = `${IMAGE_BASE_URL}${poster.file_path}`;
                            }
                        }
                        
                    } else if (it.media_type === 'tv') {
                        const images = await getTVShowImages(apiKey, it.id);
                        if (images?.posters?.length) {
                            const poster = images.posters
                                .slice()
                                .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0))[0];
                            if (poster?.file_path) {
                                url = `${IMAGE_BASE_URL}${poster.file_path}`;
                            }
                        }
                    }
                    updates[it.id] = url || null;
                } catch {
                    updates[it.id] = null;
                }
            }
            if (!cancelled) setPosterMap(prev => ({ ...prev, ...updates }));
        };
        if (trendingItems.length > 0) resolvePosters();
        return () => { cancelled = true; };
    }, [trendingItems, apiKey]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.7 : scrollLeft + clientWidth * 0.7;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };
    
    if (trendingItems.length === 0) return null;

    return (
        <div className="relative group/strip">
            <div
                ref={scrollRef}
                className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-transparent group-hover/strip:scrollbar-thumb-accent/50"
            >
                {trendingItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className="flex-shrink-0 w-28 h-44 rounded-xl overflow-hidden cursor-pointer trending-card bg-glass"
                        title={item.media_type === 'movie' ? item.title : (item as TVShow).name}
                    >
                        <img
                            src={(posterMap[item.id] || (item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : ''))}
                            alt="Trending Poster"
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover/strip:opacity-100 hover:bg-black/70 transition-all flex items-center justify-center"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover/strip:opacity-100 hover:bg-black/70 transition-all flex items-center justify-center"
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default TrendingStrip;
