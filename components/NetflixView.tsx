import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from '../types';
import { getPopularMovies, searchMovies, getTrendingMovies } from '../services/tmdbService';
import Loader from './Loader';
import { PlayIcon } from './Icons';

interface NetflixViewProps {
  apiKey: string;
  searchQuery: string;
}

const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <div className="group relative rounded-md overflow-hidden transform hover:scale-105 transition-transform duration-200 cursor-pointer">
        <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <h3 className="text-white font-bold text-lg">{movie.title}</h3>
            <p className="text-zinc-300 text-sm line-clamp-3">{movie.overview}</p>
        </div>
    </div>
);

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [trendingMovie, setTrendingMovie] = useState<Movie | null>(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    
    const lastMovieElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    const fetchMovies = useCallback(async (isSearch: boolean, query: string, pageNum: number) => {
        setIsLoading(true);
        try {
            const data = isSearch
                ? await searchMovies(apiKey, query, pageNum)
                : await getPopularMovies(apiKey, pageNum);

            setMovies(prev => pageNum === 1 ? data.results : [...prev, ...data.results]);
            setHasMore(data.page < data.total_pages);
        } catch (error) {
            console.error("Failed to fetch movies:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey]);
    
    useEffect(() => {
        const fetchTrending = async () => {
             try {
                const data = await getTrendingMovies(apiKey);
                if (data.results.length > 0) {
                    setTrendingMovie(data.results[0]);
                }
            } catch (error) {
                console.error("Failed to fetch trending movie:", error);
            }
        }
        fetchTrending();
    }, [apiKey]);

    useEffect(() => {
        setMovies([]);
        setPage(1);
        setHasMore(true);
        fetchMovies(!!searchQuery, searchQuery, 1);
    }, [searchQuery, fetchMovies]);

    useEffect(() => {
        if (page > 1) {
            fetchMovies(!!searchQuery, searchQuery, page);
        }
    }, [page, searchQuery, fetchMovies]);

    const heroMovie = searchQuery ? null : trendingMovie;

    return (
        <div className="text-white">
            {heroMovie && (
                <div className="relative h-[60vh] -mt-24">
                    <img
                        src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}`}
                        alt={heroMovie.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl">
                        <h2 className="text-4xl md:text-6xl font-bold mb-4">{heroMovie.title}</h2>
                        <p className="text-zinc-200 mb-6 line-clamp-3">{heroMovie.overview}</p>
                        <button className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2 rounded-md hover:bg-zinc-200 transition-colors">
                            <PlayIcon className="h-6 w-6" />
                            <span>Play Trailer</span>
                        </button>
                    </div>
                </div>
            )}
            <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">{searchQuery ? `Results for "${searchQuery}"` : "Popular Movies"}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {movies.map((movie, index) => {
                        if (movies.length === index + 1) {
                            return <div ref={lastMovieElementRef} key={movie.id}><MovieCard movie={movie} /></div>;
                        } else {
                            return <MovieCard movie={movie} key={movie.id} />;
                        }
                    })}
                </div>
                {isLoading && <Loader />}
                {!hasMore && movies.length > 0 && <p className="text-center text-zinc-500 py-8">You've reached the end!</p>}
                 {movies.length === 0 && !isLoading && <p className="text-center text-zinc-500 py-8">No movies found.</p>}
            </div>
        </div>
    );
};

export default NetflixView;
