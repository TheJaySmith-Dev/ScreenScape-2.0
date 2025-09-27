

import React, { useState, useEffect } from 'react';
import type { Movie, MovieDetails, CreditsResponse, LogoImage } from '../types';
import { getPopularMovies, getTrendingMovies, searchMovies, getGenres, getMovieVideos, getMovieDetails, getMovieCredits, getMovieImages } from '../services/tmdbService';
import { usePreferences } from '../hooks/usePreferences';
import Loader from './Loader';
import VideoPlayer from './VideoPlayer';
import { PlayIcon, HeartIcon, XIcon, HeartIconSolid } from './Icons';

interface NetflixViewProps {
  apiKey: string;
  searchQuery: string;
}

const MovieCard: React.FC<{ movie: Movie; onSelect: (movie: Movie) => void; }> = ({ movie, onSelect }) => {
  if (!movie.poster_path) return null;
  return (
    <div className="flex-shrink-0 relative w-40 md:w-48 cursor-pointer transform hover:scale-105 transition-transform duration-300 group" onClick={() => onSelect(movie)}>
      <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="rounded-lg shadow-lg" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
        <PlayIcon className="w-12 h-12 text-white" />
      </div>
    </div>
  );
};

const MovieRow: React.FC<{ title: string; movies: Movie[]; onSelect: (movie: Movie) => void; }> = ({ title, movies, onSelect }) => (
  <section className="mb-8">
    <h2 className="text-xl md:text-2xl font-bold mb-4 px-6 md:px-12">{title}</h2>
    <div className="flex overflow-x-auto space-x-4 px-6 md:px-12 pb-4 scrollbar-hide">
      {movies.map(movie => <MovieCard key={movie.id} movie={movie} onSelect={onSelect} />)}
    </div>
  </section>
);

const MovieModal: React.FC<{ 
    movie: Movie; 
    apiKey: string; 
    onClose: () => void;
    likedIds: Set<number>;
    likeMovie: (id: number) => void;
    dislikeMovie: (id: number) => void;
}> = ({ movie, apiKey, onClose, likedIds, likeMovie, dislikeMovie }) => {
    const [details, setDetails] = useState<MovieDetails | null>(null);
    const [credits, setCredits] = useState<CreditsResponse | null>(null);
    const [videoKey, setVideoKey] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllDetails = async () => {
            setIsLoading(true);
            try {
                const [detailsRes, creditsRes, videoRes, imagesRes] = await Promise.all([
                    getMovieDetails(apiKey, movie.id),
                    getMovieCredits(apiKey, movie.id),
                    getMovieVideos(apiKey, movie.id),
                    getMovieImages(apiKey, movie.id),
                ]);
                
                setDetails(detailsRes);
                setCredits(creditsRes);
                if(videoRes) setVideoKey(videoRes.key);

                const bestLogo = imagesRes.logos?.find(l => l.iso_639_1 === 'en' && l.aspect_ratio > 2) || imagesRes.logos?.[0];
                if (bestLogo) {
                    setLogoUrl(`https://image.tmdb.org/t/p/original${bestLogo.file_path}`);
                }
            } catch (error) {
                console.error("Failed to fetch all movie details:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllDetails();
    }, [apiKey, movie.id]);

    const formatRuntime = (runtime: number) => {
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return `${hours}h ${minutes}m`;
    };

    const handleDislike = () => {
        dislikeMovie(movie.id);
        onClose();
    };

    const isLiked = likedIds.has(movie.id);

    const director = credits?.crew.find(c => c.job === 'Director');
    const producers = credits?.crew.filter(c => c.job === 'Producer').slice(0, 2);
    const writers = credits?.crew.filter(c => c.job === 'Screenplay' || c.job === 'Writer').slice(0, 2);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-scale-up-center" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl overflow-hidden w-full max-w-4xl h-[90vh] shadow-2xl relative border border-glass-edge mx-2 sm:mx-4" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 z-20 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="absolute inset-0 z-0">
                    {videoKey ? <VideoPlayer videoKey={videoKey} /> : <img src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} alt="" className="w-full h-full object-cover"/> }
                </div>

                <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide">
                    <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 p-6 md:p-12">
                       <div className="h-[55vh] sm:h-[40vh]"></div> {/* Spacer */}

                        {logoUrl ? (
                            <img src={logoUrl} alt={`${movie.title} logo`} className="max-w-[70%] md:max-w-md max-h-12 sm:max-h-16 md:max-h-20 lg:max-h-24 mb-6" />
                        ) : (
                            <h2 className="text-3xl md:text-5xl font-black mb-6">{movie.title}</h2>
                        )}

                        {isLoading ? <Loader /> : details && (
                            <div className="space-y-8">
                                <div className="flex items-center space-x-4 text-sm md:text-base">
                                    <span className="text-green-400 font-semibold">{(details.vote_average * 10).toFixed(0)}% Match</span>
                                    <span className="text-zinc-400">{details.release_date.split('-')[0]}</span>
                                    <span className="text-zinc-400">{formatRuntime(details.runtime)}</span>
                                </div>
                                <div className="flex items-center space-x-4 mt-4">
                                     <button onClick={() => likeMovie(movie.id)} className={`p-3 rounded-full transition-all duration-300 ${isLiked ? 'bg-green-500/30' : 'bg-white/10 backdrop-blur-xl border border-glass-edge hover:bg-green-500/30'}`}>
                                        {isLiked ? <HeartIconSolid className="w-6 h-6 text-green-400" /> : <HeartIcon className="w-6 h-6 text-green-400" />}
                                    </button>
                                    <button onClick={handleDislike} className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-glass-edge hover:bg-red-500/30 transition-all duration-300">
                                        <XIcon className="w-6 h-6 text-red-400" />
                                    </button>
                                </div>
                                <p className="text-zinc-300 max-w-3xl text-sm md:text-base pt-4">{details.overview}</p>
                                
                                {credits && credits.cast.length > 0 && (
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold mb-4">Top Billed Cast</h3>
                                        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                                            {credits.cast.slice(0, 10).map(member => member.profile_path && (
                                                <div key={member.id} className="flex-shrink-0 w-28 md:w-32 text-center">
                                                    <img src={`https://image.tmdb.org/t/p/w300${member.profile_path}`} alt={member.name} className="rounded-lg shadow-md mb-2 w-full h-40 md:h-44 object-cover"/>
                                                    <p className="font-semibold text-xs md:text-sm">{member.name}</p>
                                                    <p className="text-xs text-zinc-400">{member.character}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs md:text-sm text-zinc-400 max-w-3xl">
                                    <p><span className="font-semibold text-zinc-300">Genres: </span>{details.genres.map(g => g.name).join(', ')}</p>
                                    {director && <p><span className="font-semibold text-zinc-300">Director: </span>{director.name}</p>}
                                    {producers && producers.length > 0 && <p><span className="font-semibold text-zinc-300">Producers: </span>{producers.map(p => p.name).join(', ')}</p>}
                                    {writers && writers.length > 0 && <p><span className="font-semibold text-zinc-300">Writers: </span>{writers.map(w => w.name).join(', ')}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery }) => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Map<number, string>>(new Map());
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [heroVideoKey, setHeroVideoKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { likedIds, likeMovie, dislikeMovie } = usePreferences();


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [trendingRes, popularRes, genresMap] = await Promise.all([
          getTrendingMovies(apiKey),
          getPopularMovies(apiKey),
          getGenres(apiKey)
        ]);
        setTrending(trendingRes.results);
        setPopular(popularRes.results);
        setGenres(genresMap);

        const hero = trendingRes.results[0];
        if (hero) {
          setHeroMovie(hero);
          const video = await getMovieVideos(apiKey, hero.id);
          if (video) {
            setHeroVideoKey(video.key);
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [apiKey]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 2) {
        try {
          setIsLoading(true);
          const res = await searchMovies(apiKey, searchQuery);
          setSearchResults(res.results);
        } catch (error) {
          console.error('Failed to perform search:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    };
    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, apiKey]);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
  };
  
  const handleCloseModal = () => {
    setSelectedMovie(null);
  }

  if (isLoading && !heroMovie) {
    return <div className="flex justify-center items-center h-screen"><Loader /></div>;
  }

  const renderContent = () => {
    if (searchQuery.trim().length > 2) {
      if (isLoading) return <Loader />;
      return <MovieRow title={`Results for "${searchQuery}"`} movies={searchResults} onSelect={handleSelectMovie} />;
    }
    return (
      <>
        <MovieRow title="Trending Now" movies={trending} onSelect={handleSelectMovie} />
        <MovieRow title="Popular on ScreenScape" movies={popular} onSelect={handleSelectMovie} />
      </>
    );
  };

  return (
    <div className="animate-fade-in">
      {heroMovie && !searchQuery && (
        <div className="relative h-[60vh] -mt-24">
          <div className="absolute inset-0">
            {heroVideoKey ? (
              <div className="absolute inset-0 h-[150%] -top-[25%] pointer-events-none">
                 <VideoPlayer videoKey={heroVideoKey} isMuted={true} />
              </div>
            ) : (
              <img src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}`} alt={heroMovie.title} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
          <div className="absolute bottom-10 left-6 md:left-12 max-w-lg">
            <h1 className="text-3xl md:text-6xl font-black text-white">{heroMovie.title}</h1>
            <p className="mt-4 text-sm text-zinc-200 line-clamp-3">{heroMovie.overview}</p>
            <div className="flex space-x-2 mt-2">
              {heroMovie.genre_ids.slice(0, 3).map(id => (
                genres.get(id) ? <span key={id} className="text-xs text-zinc-400">{genres.get(id)}</span> : null
              ))}
            </div>
            <button onClick={() => handleSelectMovie(heroMovie)} className="mt-6 flex items-center space-x-2 bg-white text-black font-bold px-6 py-3 rounded hover:bg-zinc-200 transition-colors">
              <PlayIcon className="w-6 h-6" />
              <span>More Info</span>
            </button>
          </div>
        </div>
      )}

      <div className={heroMovie && !searchQuery ? 'mt-8' : 'mt-0'}>
        {renderContent()}
      </div>

      {selectedMovie && <MovieModal 
        movie={selectedMovie} 
        apiKey={apiKey} 
        onClose={handleCloseModal}
        likedIds={likedIds}
        likeMovie={likeMovie}
        dislikeMovie={dislikeMovie}
      />}
    </div>
  );
};

export default NetflixView;