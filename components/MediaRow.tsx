import React, { useRef } from 'react';
import { MediaItem, TVShow } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon, PlayIcon } from './Icons';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface MediaRowProps {
    title: string;
    items: MediaItem[];
    onSelectItem: (item: MediaItem) => void;
}

const MediaCard: React.FC<{ item: MediaItem; onSelectItem: (item: MediaItem) => void; }> = ({ item, onSelectItem }) => {
    const title = item.media_type === 'tv' ? (item as TVShow).name : item.title;
    return (
        <div 
            className="group/card flex-shrink-0 w-40 md:w-48 perspective transition-opacity duration-300 group-hover/row:opacity-70 hover:!opacity-100" 
            onClick={() => onSelectItem(item)}
        >
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transform preserve-3d group-hover/card:scale-105 transition-transform duration-300 ease-in-out shadow-lg">
                <img
                    src={item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 border-2 border-transparent group-hover/card:border-white/50 rounded-xl transition-all duration-300" />
                <div className="absolute bottom-0 left-0 p-3 w-full opacity-0 transform translate-y-4 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300">
                    <h3 className="font-bold text-white text-sm truncate">{title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-300 mt-1">
                        <div className="flex items-center gap-1">
                            <StarIcon className="w-3 h-3 text-yellow-400" isActive />
                            <span>{item.vote_average.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                            <PlayIcon className="w-3 h-3" />
                            <span>Info</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MediaRow: React.FC<MediaRowProps> = ({ title, items, onSelectItem }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth * 0.8
                : scrollLeft + clientWidth * 0.8;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };
    
    if (!items || items.length === 0) return null;

    return (
        <div className="relative animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="group/row relative">
                 <div
                    ref={scrollRef}
                    className="flex items-start gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-transparent group-hover/row:scrollbar-thumb-accent/50 scrollbar-track-transparent"
                >
                    {items.map(item => (
                        <MediaCard key={`${item.id}-${item.media_type}`} item={item} onSelectItem={onSelectItem} />
                    ))}
                </div>
                
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-20 bg-black/40 backdrop-blur-sm rounded-r-full opacity-0 group-hover/row:opacity-100 hover:bg-black/70 transition-all"
                >
                    <ChevronLeftIcon className="w-6 h-6 mx-auto" />
                </button>
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-20 bg-black/40 backdrop-blur-sm rounded-l-full opacity-0 group-hover/row:opacity-100 hover:bg-black/70 transition-all"
                >
                    <ChevronRightIcon className="w-6 h-6 mx-auto" />
                </button>
            </div>
        </div>
    );
};

export default MediaRow;