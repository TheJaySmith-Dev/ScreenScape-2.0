
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Movie, AccountDetails } from '../types';
import { getPopularMovies, getSimilarMovies } from '../services/tmdbService';
import Loader from './Loader';
import { useTMDbAccount } from '../hooks/useTMDbAccount';
import { HeartIcon, XIcon } from './Icons';

interface TinderViewProps {
    apiKey: string;
    sessionId: string;
    account: AccountDetails;
}

const TinderCard: React.FC<{
    movie: Movie;
    onSwipe: (direction: 'left' | 'right') => void;
}> = ({ movie, onSwipe }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState({});
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);

    const handleMove = (x: number, y: number) => {
        if (!startPos) return;
        const dx = x - startPos.x;
        const dy = y - startPos.y;
        const rotate = dx * 0.1;
        setStyle({
            transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`,
            transition: 'none',
        });
    };

    const handleEnd = () => {
        if (!cardRef.current) return;
        const { x } = cardRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        if (x > screenWidth * 0.75) {
            onSwipe('right');
        } else if (x < -screenWidth * 0.1) {
            onSwipe('left');
        } else {
            setStyle({ transform: 'translate(0px, 0px) rotate(0deg)', transition: 'transform 0.3s ease' });
        }
        setStartPos(null);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => setStartPos({ x: e.clientX, y: e.clientY });
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => handleMove(e.clientX, e.clientY);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

    return (
        <div
            ref={cardRef}
            style={style}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
            className="absolute w-full h-full cursor-grab active:cursor-grabbing"
        >
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-glass-edge">
                <img src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`} alt={movie.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 p-6 text-white">
                    <h2 className="text-3xl font-bold">{movie.title}</h2>
                    <p className="mt-2 text-sm text-zinc-300 line-clamp-3">{movie.overview}</p>
                </div>
            </div>
        </div>
    );
};


const TinderView: React.FC<TinderViewProps> = ({ apiKey, sessionId, account }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { likedIds, likeMovie, dislikeMovie, hasRated, isLoading: isLoadingPreferences } = useTMDbAccount({apiKey, sessionId, account});
    const [page, setPage] = useState(1);

    const fetchAndSetMovies = useCallback(async () => {
        setIsLoading(true);
        try {
            let newMovies: Movie[] = [];
            if (likedIds.size > 0 && Math.random() > 0.3) {
                const lastLikedId = Array.from(likedIds).pop();
                if (lastLikedId) {
                    const res = await getSimilarMovies(apiKey, lastLikedId);
                    newMovies = res.results.filter(m => !hasRated(m.id) && m.backdrop_path);
                }
            }
            
            if (newMovies.length < 5) {
                const res = await getPopularMovies(apiKey, page);
                setPage(p => p + 1);
                newMovies.push(...res.results.filter(m => !hasRated(m.id) && m.backdrop_path));
            }

            setMovies(prev => [...prev, ...newMovies.filter(nm => !prev.find(pm => pm.id === nm.id))]);
        } catch (error) {
            console.error('Failed to fetch movies:', error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, likedIds, hasRated, page]);

    useEffect(() => {
        if (!isLoadingPreferences) {
            fetchAndSetMovies();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingPreferences]);

    const currentMovie = useMemo(() => movies[0], [movies]);

    const handleSwipe = useCallback((direction: 'left' | 'right') => {
        if (!currentMovie) return;
        if (direction === 'right') {
            likeMovie(currentMovie.id);
        } else {
            dislikeMovie(currentMovie.id);
        }
        // Animate out
        setTimeout(() => {
            setMovies(prev => prev.slice(1));
        }, 300);
    }, [currentMovie, likeMovie, dislikeMovie]);

    useEffect(() => {
        if (movies.length < 5 && !isLoading) {
            fetchAndSetMovies();
        }
    }, [movies.length, fetchAndSetMovies, isLoading]);

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] w-full">
            <div className="relative w-full max-w-sm h-full max-h-[600px] -mt-10">
                {(isLoading || isLoadingPreferences) && !currentMovie ? <Loader /> : null}
                {movies.map((movie, index) => {
                    if (index > 1) return null;
                    const isTop = index === 0;
                    return (
                        isTop ? <TinderCard key={movie.id} movie={movie} onSwipe={handleSwipe} /> :
                        <div key={movie.id} className="absolute w-full h-full rounded-3xl bg-zinc-800" style={{ transform: `scale(${1 - 0.05 * index}) translateY(${index * -10}px)`, zIndex: -index, filter: `blur(${index*2}px)` }}>
                             {movie.backdrop_path && <img src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`} alt={movie.title} className="w-full h-full object-cover rounded-3xl" />}
                        </div>
                    )
                })}
            </div>
            {currentMovie && (
                <div className="flex items-center space-x-8 mt-8">
                    <button onClick={() => handleSwipe('left')} className="p-5 rounded-full bg-white/10 backdrop-blur-xl border border-glass-edge hover:bg-red-500/30 transition-all duration-300">
                        <XIcon className="w-8 h-8 text-red-400" />
                    </button>
                    <button onClick={() => handleSwipe('right')} className="p-5 rounded-full bg-white/10 backdrop-blur-xl border border-glass-edge hover:bg-green-500/30 transition-all duration-300">
                        <HeartIcon className="w-8 h-8 text-green-400" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TinderView;
