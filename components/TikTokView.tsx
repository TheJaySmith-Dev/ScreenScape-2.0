

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Movie, Video } from '../types';
import { getPopularMovies, getSimilarMovies, getMovieVideos } from '../services/tmdbService';
import Loader from './Loader';
import { usePreferences } from '../hooks/usePreferences';
import { HeartIcon, XIcon, PlayIcon, MuteIcon, UnmuteIcon } from './Icons';

interface TikTokViewProps {
    apiKey: string;
}

const TikTokCard: React.FC<{
    movie: Movie;
    apiKey: string;
    onLike: (id: number) => void;
    onDislike: (id: number) => void;
    isActive: boolean;
}> = ({ movie, apiKey, onLike, onDislike, isActive }) => {
    const [video, setVideo] = useState<Video | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const playerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive) {
            getMovieVideos(apiKey, movie.id).then(setVideo);
        } else {
            setVideo(null);
            if(player) player.destroy();
            setPlayer(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, apiKey, movie.id]);

    const onPlayerReady = (event: any) => {
        event.target.playVideo();
        if(isMuted) event.target.mute();
    };
    
    useEffect(() => {
        if (isActive && video && playerRef.current && !player) {
            // FIX: Cast window to any to access YT property from YouTube Iframe API
            const newPlayer = new (window as any).YT.Player(playerRef.current.id, {
                videoId: video.key,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    showinfo: 0,
                    modestbranding: 1,
                    loop: 1,
                    playlist: video.key,
                    fs: 0,
                    cc_load_policy: 0,
                    iv_load_policy: 3,
                    autohide: 1,
                },
                events: {
                    'onReady': onPlayerReady,
                },
            });
            setPlayer(newPlayer);
        }

        return () => {
            if(player) {
                player.destroy();
                setPlayer(null);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, video]);

    const toggleMute = () => {
        if(!player) return;
        if(player.isMuted()) {
            player.unMute();
            setIsMuted(false);
        } else {
            player.mute();
            setIsMuted(true);
        }
    }

    return (
        <div className="w-full h-screen snap-start relative flex-shrink-0">
            <div className="absolute inset-0 z-0">
                {isActive && video ? (
                    <div id={`player-${movie.id}`} ref={playerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full object-cover"></div>
                ) : (
                    <img src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} alt={movie.title} className="w-full h-full object-cover" />
                )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

            <div className="absolute bottom-0 left-0 p-4 sm:p-6 text-white w-full flex justify-between items-end">
                <div className="w-4/5 pr-4">
                    <h2 className="text-2xl sm:text-3xl font-bold">{movie.title}</h2>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-300 line-clamp-2">{movie.overview}</p>
                </div>
                <div className="flex flex-col space-y-4 sm:space-y-6">
                    <button onClick={() => onLike(movie.id)} className="flex flex-col items-center space-y-1 text-center">
                        <div className="p-2 sm:p-3 bg-white/10 rounded-full backdrop-blur-lg"><HeartIcon className="w-6 h-6 sm:w-7 sm:h-7" /></div>
                    </button>
                     <button onClick={() => onDislike(movie.id)} className="flex flex-col items-center space-y-1 text-center">
                        <div className="p-2 sm:p-3 bg-white/10 rounded-full backdrop-blur-lg"><XIcon className="w-6 h-6 sm:w-7 sm:h-7" /></div>
                    </button>
                    <button onClick={toggleMute} className="flex flex-col items-center space-y-1 text-center">
                        <div className="p-2 sm:p-3 bg-white/10 rounded-full backdrop-blur-lg">
                            {isMuted ? <MuteIcon className="w-6 h-6 sm:w-7 sm:h-7" /> : <UnmuteIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const TikTokView: React.FC<TikTokViewProps> = ({ apiKey }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // FIX: Removed trailing underscore which was a syntax error.
    const { likedIds, dislikeMovie, likeMovie, hasRated } = usePreferences();
    const [page, setPage] = useState(1);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const fetchMovies = useCallback(async () => {
        setIsLoading(true);
        try {
            let newMovies: Movie[] = [];
            const lastLikedId = Array.from(likedIds).pop();
            if (lastLikedId && Math.random() > 0.3) {
                 const res = await getSimilarMovies(apiKey, lastLikedId);
                 newMovies = res.results.filter(m => !hasRated(m.id));
            }

            if (newMovies.length < 5) {
                const res = await getPopularMovies(apiKey, page);
                setPage(p => p+1);
                newMovies.push(...res.results.filter(m => !hasRated(m.id)));
            }
            
            setMovies(prev => [...prev, ...newMovies.filter(nm => !prev.find(pm => pm.id === nm.id))]);

        } catch (error) {
            console.error('Failed to fetch movies', error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, page, likedIds, hasRated]);

    useEffect(() => {
        fetchMovies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, clientHeight } = containerRef.current;
            const newIndex = Math.round(scrollTop / clientHeight);
            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
            }

            if (scrollTop + clientHeight >= containerRef.current.scrollHeight - clientHeight) {
                if (!isLoading) fetchMovies();
            }
        }
    };

    const handleLike = (id: number) => {
        likeMovie(id);
        setMovies(movies => movies.filter(m => m.id !== id));
    };

    const handleDislike = (id: number) => {
        dislikeMovie(id);
        setMovies(movies => movies.filter(m => m.id !== id));
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-screen h-screen overflow-y-scroll snap-y snap-mandatory fixed top-0 left-0"
        >
            {movies.map((movie, index) => (
                <TikTokCard
                    key={movie.id}
                    movie={movie}
                    apiKey={apiKey}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    isActive={index === activeIndex}
                />
            ))}
            {isLoading && <div className="w-full h-screen snap-start flex items-center justify-center"><Loader /></div>}
        </div>
    );
};

export default TikTokView;
