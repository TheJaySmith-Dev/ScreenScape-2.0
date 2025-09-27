import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Import AccountDetails type
import { Movie, Video, AccountDetails } from '../types';
import { getPopularMovies, getMovieVideos } from '../services/tmdbService';
import Loader from './Loader';
import { useTMDbAccount } from '../hooks/useTMDbAccount';
import { HeartIcon, XIcon } from './Icons';
import VideoPlayer from './VideoPlayer';

interface TikTokViewProps {
  apiKey: string;
  sessionId: string;
  // FIX: Use the full AccountDetails type for the account prop.
  account: AccountDetails;
}

interface MovieWithVideo extends Movie {
    video?: Video | null;
}

const TikTokView: React.FC<TikTokViewProps> = ({ apiKey, sessionId, account }) => {
    const [movies, setMovies] = useState<MovieWithVideo[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const { likeMovie, dislikeMovie, hasRated } = useTMDbAccount({ apiKey, sessionId, account });

    const observer = useRef<IntersectionObserver | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentItem, setCurrentItem] = useState(0);

    const fetchMoviesAndVideos = useCallback(async (pageNum: number) => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const data = await getPopularMovies(apiKey, pageNum);
            if (data.results.length === 0) {
                setHasMore(false);
                setIsLoading(false);
                return;
            }
            
            const moviesWithVideos = await Promise.all(
                data.results.filter(m => !hasRated(m.id)).map(async (movie) => {
                    const video = await getMovieVideos(apiKey, movie.id);
                    return { ...movie, video };
                })
            );

            const validMovies = moviesWithVideos.filter(m => m.video);
            setMovies(prev => [...prev, ...validMovies]);
            setHasMore(data.page < data.total_pages);
        } catch (error) {
            console.error("Failed to fetch movies for feed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, isLoading, hasMore, hasRated]);

    useEffect(() => {
        fetchMoviesAndVideos(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const handleScroll = () => {
        const container = containerRef.current;
        if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop <= clientHeight + 500 && !isLoading) { 
                setPage(p => p + 1);
            }
        }
    };
    
    useEffect(() => {
        if (page > 1) {
            fetchMoviesAndVideos(page);
        }
    }, [page, fetchMoviesAndVideos]);

    const FeedItem: React.FC<{ movie: MovieWithVideo, isVisible: boolean }> = ({ movie, isVisible }) => {
        if (!movie.video) return null;
        return (
            <div className="h-full w-full snap-start relative flex-shrink-0 bg-black">
                { isVisible ? (
                    <VideoPlayer videoKey={movie.video.key} />
                ) : (
                    <img src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} className="w-full h-full object-cover" alt={movie.title}/>
                )}
                <div className="absolute bottom-0 left-0 p-4 text-white bg-gradient-to-t from-black to-transparent w-full">
                    <h3 className="font-bold text-xl">{movie.title}</h3>
                    <p className="text-sm line-clamp-2 mt-1">{movie.overview}</p>
                </div>
                <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
                    <button onClick={() => likeMovie(movie.id)} className="flex flex-col items-center text-white bg-black bg-opacity-30 p-2 rounded-full">
                        <HeartIcon className="h-8 w-8" />
                    </button>
                    <button onClick={() => dislikeMovie(movie.id)} className="flex flex-col items-center text-white bg-black bg-opacity-30 p-2 rounded-full">
                        <XIcon className="h-8 w-8" />
                    </button>
                </div>
            </div>
        )
    };
    
    useEffect(() => {
        const options = {
            root: containerRef.current,
            rootMargin: '0px',
            threshold: 0.7
        };

        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                    setCurrentItem(index);
                }
            });
        };

        observer.current = new IntersectionObserver(callback, options);
        const items = containerRef.current?.querySelectorAll('.feed-item');
        if (items) {
            items.forEach(item => observer.current?.observe(item));
        }

        return () => observer.current?.disconnect();
    }, [movies]);

    return (
        <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="h-screen w-screen -mt-24 overflow-y-scroll snap-y snap-mandatory scroll-smooth">
            {movies.map((movie, index) => (
                <div key={`${movie.id}-${index}`} data-index={index} className="feed-item h-screen w-screen">
                    <FeedItem movie={movie} isVisible={index === currentItem} />
                </div>
            ))}
            {isLoading && (
                <div className="h-screen w-screen flex items-center justify-center absolute bottom-0 bg-black bg-opacity-50">
                    <Loader />
                </div>
            )}
        </div>
    );
};

export default TikTokView;