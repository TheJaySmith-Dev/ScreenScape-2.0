import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MediaItem, TVShow } from '../types';
import { useAppleTheme } from '../hooks/useAppleTheme';
import { useAppleAnimationEffects } from '../hooks/useAppleAnimationEffects';
import { ChevronLeft, ChevronRight, Star, Play, Info } from 'lucide-react';
import BackdropOverlay from './BackdropOverlay';
import TrailerPlayer from './TrailerPlayer';
import { mediaHoverService } from '../services/mediaHoverService';
import RottenTomatoesRating from './RottenTomatoesRating';
import * as omdbService from '../services/omdbService';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface MediaRowProps {
    title: string;
    items: MediaItem[];
    onSelectItem: (item: MediaItem) => void;
    apiKey: string;
}

const MediaCard: React.FC<{ item: MediaItem; onSelectItem: (item: MediaItem) => void; apiKey: string; }> = ({ item, onSelectItem, apiKey }) => {
    const title = item.media_type === 'tv' ? (item as TVShow).name : item.title;
    const { tokens } = useAppleTheme();
    const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();
    
    // Hover state management
    const [isHovered, setIsHovered] = useState(false);
    const [showBackdrop, setShowBackdrop] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [backdropUrl, setBackdropUrl] = useState<string>('');
    const [trailerUrl, setTrailerUrl] = useState<string>('');
    const [omdbData, setOmdbData] = useState<omdbService.OMDbMovieDetails | null>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    
    const hoverTimeoutRef = useRef<NodeJS.Timeout>();
    const trailerTimeoutRef = useRef<NodeJS.Timeout>();
    
    // Check if device supports hover (desktop)
    useEffect(() => {
        const checkHoverSupport = () => {
            setIsDesktop(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
        };
        
        checkHoverSupport();
        window.addEventListener('resize', checkHoverSupport);
        
        return () => {
            window.removeEventListener('resize', checkHoverSupport);
        };
    }, []);
    
    // Handle mouse enter with delay
    const handleMouseEnter = useCallback(() => {
        if (!isDesktop) return;
        
        setIsHovered(true);
        
        // Clear any existing timeouts
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (trailerTimeoutRef.current) clearTimeout(trailerTimeoutRef.current);
        
        // Start loading media data after 300ms delay
        hoverTimeoutRef.current = setTimeout(async () => {
            try {
                const mediaData = await mediaHoverService.getHoverMedia(item, apiKey);
                
                if (mediaData.backdropUrl) {
                    setBackdropUrl(mediaData.backdropUrl);
                    setShowBackdrop(true);
                }
                
                if (mediaData.trailerUrl) {
                    setTrailerUrl(mediaData.trailerUrl);
                    
                    // Start trailer after additional 2s delay
                    trailerTimeoutRef.current = setTimeout(() => {
                        setShowTrailer(true);
                    }, 2000);
                }
                
                // Fetch OMDb data for Rotten Tomatoes rating (only for movies)
                if (item.media_type === 'movie') {
                    try {
                        const omdbDetails = await omdbService.getOMDbFromTMDBDetails(item);
                        setOmdbData(omdbDetails);
                    } catch (error) {
                        console.error('Error fetching OMDb data:', error);
                    }
                }
            } catch (error) {
                console.error('Error loading hover media:', error);
            }
        }, 300);
        
        applyHoverEffect();
    }, [isDesktop, item, apiKey, applyHoverEffect]);
    
    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
        if (!isDesktop) return;
        
        setIsHovered(false);
        setShowBackdrop(false);
        setShowTrailer(false);
        setBackdropUrl('');
        setTrailerUrl('');
        setOmdbData(null);
        
        // Clear timeouts
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (trailerTimeoutRef.current) clearTimeout(trailerTimeoutRef.current);
    }, [isDesktop]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (trailerTimeoutRef.current) clearTimeout(trailerTimeoutRef.current);
        };
    }, []);
    
    // Add null checks for tokens
    if (!tokens) {
        return (
            <div className="group/card flex-shrink-0 w-40 md:w-48 transition-all duration-300 group-hover/row:opacity-70 hover:!opacity-100">
                <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-gray-800">
                    <div className="w-full h-full flex items-center justify-center text-white">
                        Loading...
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div 
            className="group/card flex-shrink-0 w-40 md:w-48 transition-all duration-300 group-hover/row:opacity-70 hover:!opacity-100" 
            onClick={() => onSelectItem(item)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={applyPressEffect}
        >
            <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 ease-out group-hover/card:scale-105 shadow-lg group-hover/card:shadow-2xl">
                {/* Backdrop Overlay - Desktop Only */}
                {isDesktop && (
                    <BackdropOverlay
                        backdropUrl={backdropUrl}
                        isVisible={showBackdrop}
                        className="desktop-only-hover"
                    />
                )}
                
                {/* Trailer Player - Desktop Only */}
                {isDesktop && (
                    <TrailerPlayer
                        trailerUrl={trailerUrl}
                        isVisible={showTrailer}
                        autoplayDelay={0} // Already delayed in hover logic
                        className="desktop-only-hover"
                    />
                )}
                <img
                    src={item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                
                {/* Glass overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-500 backdrop-blur-sm" />
                
                {/* Border glow effect */}
                <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-100 transition-all duration-500"
                    style={{
                        border: `2px solid ${tokens?.colors?.accent?.primary || '#007AFF'}40`,
                        boxShadow: `0 0 20px ${tokens?.colors?.accent?.primary || '#007AFF'}20`
                    }}
                />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transform translate-y-6 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-500 ease-out">
                    <h3 
                        className="truncate mb-2"
                        style={{
                            fontFamily: tokens?.typography?.families?.text || 'system-ui',
                            fontSize: tokens?.typography?.sizes?.body || '16px',
                            fontWeight: tokens?.typography?.weights?.semibold || '600',
                            color: tokens?.colors?.text?.primary || '#ffffff'
                        }}
                    >
                        {title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Star 
                                    className="w-3 h-3 fill-yellow-400 text-yellow-400" 
                                />
                                <span 
                                    style={{
                                        fontFamily: tokens?.typography?.families?.text || 'system-ui',
                                        fontSize: tokens?.typography?.sizes?.caption || '12px',
                                        color: tokens?.colors?.text?.secondary || '#cccccc'
                                    }}
                                >
                                    {item.vote_average.toFixed(1)}
                                </span>
                            </div>
                            
                            {/* Rotten Tomatoes Rating */}
                            {omdbData && (() => {
                                const rtRating = omdbService.extractRottenTomatoesRating(omdbData);
                                return rtRating && (
                                    <RottenTomatoesRating 
                                        rating={rtRating} 
                                        size="sm" 
                                        showLabel={false}
                                    />
                                );
                            })()}
                        </div>
                        
                        <div 
                            className="flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-xl border border-white/20"
                            style={{
                                background: `linear-gradient(135deg, ${tokens?.colors?.accent?.primary || '#007AFF'}30, ${tokens?.colors?.accent?.primary || '#007AFF'}10)`
                            }}
                        >
                            <Info className="w-3 h-3" style={{ color: tokens?.colors?.text?.primary || '#ffffff' }} />
                            <span 
                                style={{
                                    fontFamily: tokens?.typography?.families?.text || 'system-ui',
                                    fontSize: tokens?.typography?.sizes?.caption || '12px',
                                    fontWeight: tokens?.typography?.weights?.medium || '500',
                                    color: tokens?.colors?.text?.primary || '#ffffff'
                                }}
                            >
                                Info
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MediaRow: React.FC<MediaRowProps> = ({ title, items, onSelectItem, apiKey }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { tokens } = useAppleTheme();
    const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();

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

    // Add null check for tokens
    if (!tokens) {
        return (
            <div className="relative transition-all duration-500 ease-out">
                <h2 className="mb-6 text-white text-2xl font-bold">
                    {title}
                </h2>
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="relative transition-all duration-500 ease-out">
            <h2 
                className="mb-6"
                style={{
                    fontFamily: tokens?.typography?.families?.text || 'system-ui',
                    fontSize: tokens?.typography?.sizes?.title2 || '24px',
                    fontWeight: tokens?.typography?.weights?.bold || '700',
                    color: tokens?.colors?.text?.primary || '#ffffff'
                }}
            >
                {title}
            </h2>
            
            <div className="group/row relative">
                <div
                    ref={scrollRef}
                    className="flex items-start gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-transparent group-hover/row:scrollbar-thumb-white/20 scrollbar-track-transparent"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'transparent transparent'
                    }}
                >
                    {items.map(item => (
                        <MediaCard key={`${item.id}-${item.media_type}`} item={item} onSelectItem={onSelectItem} apiKey={apiKey} />
                    ))}
                </div>
                
                {/* Left scroll button */}
                <button
                    onClick={() => scroll('left')}
                    onMouseEnter={applyHoverEffect}
                    onMouseDown={applyPressEffect}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-20 rounded-r-full opacity-0 group-hover/row:opacity-100 transition-all duration-300 backdrop-blur-xl border border-white/10"
                    style={{
                        background: `linear-gradient(135deg, ${tokens?.colors?.background?.secondary || '#1a1a1a'}E6, ${tokens?.colors?.background?.primary || '#000000'}E6)`,
                    }}
                >
                    <ChevronLeft 
                        className="w-6 h-6 mx-auto" 
                        style={{ color: tokens?.colors?.text?.primary || '#ffffff' }}
                    />
                </button>
                
                {/* Right scroll button */}
                <button
                    onClick={() => scroll('right')}
                    onMouseEnter={applyHoverEffect}
                    onMouseDown={applyPressEffect}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-20 rounded-l-full opacity-0 group-hover/row:opacity-100 transition-all duration-300 backdrop-blur-xl border border-white/10"
                    style={{
                        background: `linear-gradient(135deg, ${tokens?.colors?.background?.secondary || '#1a1a1a'}E6, ${tokens?.colors?.background?.primary || '#000000'}E6)`,
                    }}
                >
                    <ChevronRight 
                        className="w-6 h-6 mx-auto" 
                        style={{ color: tokens?.colors?.text?.primary || '#ffffff' }}
                    />
                </button>
            </div>
        </div>
    );
};

export default MediaRow;