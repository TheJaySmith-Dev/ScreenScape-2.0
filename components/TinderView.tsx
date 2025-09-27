import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// FIX: Import AccountDetails type
import { Movie, AccountDetails } from '../types';
import { getPopularMovies } from '../services/tmdbService';
import { useTMDbAccount } from '../hooks/useTMDbAccount';
import TinderCard from 'react-tinder-card';
import { HeartIcon, XIcon } from './Icons';
import Loader from './Loader';

interface TinderViewProps {
  apiKey: string;
  sessionId: string;
  // FIX: Use the full AccountDetails type for the account prop.
  account: AccountDetails;
}

const TinderView: React.FC<TinderViewProps> = ({ apiKey, sessionId, account }) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const { hasRated, likeMovie, dislikeMovie, isLoading: isLoadingPreferences } = useTMDbAccount({ apiKey, sessionId, account });

    const currentIndexRef = useRef(0);

    const fetchMovies = useCallback(async (pageNum: number) => {
        setIsLoading(true);
        try {
            const data = await getPopularMovies(apiKey, pageNum);
            const unratedMovies = data.results.filter(movie => !hasRated(movie.id));
            setMovies(prev => [...prev, ...unratedMovies]);
            if (unratedMovies.length === 0 && data.page < data.total_pages) {
                // If all movies on this page were rated, fetch next page
                setPage(p => p + 1);
            }
        } catch (error) {
            console.error("Failed to fetch movies for swiping:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, hasRated]);

    useEffect(() => {
        if (!isLoadingPreferences) {
            fetchMovies(page);
        }
    }, [page, fetchMovies, isLoadingPreferences]);

    const swiped = (direction: string, movie: Movie) => {
        if (direction === 'right') {
            likeMovie(movie.id);
        } else if (direction === 'left') {
            dislikeMovie(movie.id);
        }
        currentIndexRef.current += 1;
        if (currentIndexRef.current >= movies.length - 2) {
            setPage(p => p + 1);
        }
    };
    
    const childRefs = useMemo(() => Array(movies.length).fill(0).map(() => React.createRef<any>()), [movies]);

    const swipe = async (dir: 'left' | 'right') => {
        if (movies.length > 0 && currentIndexRef.current < movies.length) {
            await childRefs[currentIndexRef.current].current.swipe(dir);
        }
    };

    if (isLoadingPreferences || (isLoading && movies.length === 0)) {
        return <Loader />;
    }
    
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center -mt-24">
            <div className="relative w-[300px] h-[500px] md:w-[350px] md:h-[550px]">
                {movies.map((movie, index) => (
                     <TinderCard
                        ref={childRefs[index]}
                        className="absolute"
                        key={movie.id}
                        onSwipe={(dir) => swiped(dir, movie)}
                        preventSwipe={['up', 'down']}
                    >
                        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl bg-zinc-800">
                           {movie.poster_path ? (
                             <img
                                className="w-full h-full object-cover"
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title}
                            />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-zinc-400">No Image</div>
                           )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                                <h3 className="text-white text-2xl font-bold">{movie.title}</h3>
                                <p className="text-zinc-300 text-sm">{new Date(movie.release_date).getFullYear()}</p>
                            </div>
                        </div>
                    </TinderCard>
                ))}
                 {movies.length > 0 && currentIndexRef.current >= movies.length && (
                    <div className="text-center p-8">
                        <h2 className="text-xl font-bold">No more movies to swipe!</h2>
                        <p>Come back later for more.</p>
                    </div>
                )}
            </div>
            {movies.length > 0 && currentIndexRef.current < movies.length && (
              <div className="flex gap-8 mt-8">
                  <button onClick={() => swipe('left')} className="bg-white p-4 rounded-full shadow-lg transform hover:scale-110 transition-transform">
                      <XIcon className="h-8 w-8 text-red-500" />
                  </button>
                  <button onClick={() => swipe('right')} className="bg-white p-4 rounded-full shadow-lg transform hover:scale-110 transition-transform">
                      <HeartIcon className="h-8 w-8 text-green-500" />
                  </button>
              </div>
            )}
        </div>
    );
};

export default TinderView;