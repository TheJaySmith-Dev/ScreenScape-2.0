import React, { useState, useEffect, useMemo } from 'react';
import { MediaItem, Movie } from '../types';
import { FaHeart, FaThumbsDown } from 'react-icons/fa';
import { useDeviceSync } from '../hooks/useDeviceSync';

interface LikesPageProps {
  apiKey: string;
  onSelectItem: (item: MediaItem) => void;
  onInvalidApiKey: () => void;
}

const LikesPage: React.FC<LikesPageProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
  const { preferences } = useDeviceSync();
  const [likedMovies, setLikedMovies] = useState<MediaItem[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get movie IDs from sync preferences
  const likedMovieIds = useMemo(() => preferences.likedMovies || [], [preferences.likedMovies]);
  const dislikedMovieIds = useMemo(() => preferences.dislikedMovies || [], [preferences.dislikedMovies]);

  useEffect(() => {
    const fetchLikedMoviesData = async () => {
      if (!likedMovieIds.length && !dislikedMovieIds.length) {
        setLikedMovies([]);
        setDislikedMovies([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const likedMovieData: MediaItem[] = [];
        const dislikedMovieData: MediaItem[] = [];

        // Fetch details for liked movies
        for (const movieId of likedMovieIds) {
          try {
            // You would need to implement a getMovieDetails function
            // For now, we'll create placeholder items with proper IDs
            const placeholder: MediaItem = {
              id: movieId,
              title: `Movie ${movieId}`, // Would be replaced with actual title from API
              poster_path: null,
              backdrop_path: null,
              overview: 'Loading...',
              vote_average: 0,
              popularity: 0,
              release_date: '',
              genre_ids: [],
              media_type: 'movie'
            };
            likedMovieData.push(placeholder);
          } catch (error) {
            console.error(`Error fetching movie ${movieId}:`, error);
          }
        }

        // Fetch details for disliked movies
        for (const movieId of dislikedMovieIds) {
          try {
            const placeholder: MediaItem = {
              id: movieId,
              title: `Movie ${movieId}`,
              poster_path: null,
              backdrop_path: null,
              overview: 'Loading...',
              vote_average: 0,
              popularity: 0,
              release_date: '',
              genre_ids: [],
              media_type: 'movie'
            };
            dislikedMovieData.push(placeholder);
          } catch (error) {
            console.error(`Error fetching movie ${movieId}:`, error);
          }
        }

        setLikedMovies(likedMovieData);
        setDislikedMovies(dislikedMovieData);
        setLoading(false);

      } catch (error) {
        console.error('Error loading likes/dislikes data:', error);
        setLoading(false);
      }
    };

    fetchLikedMoviesData();
  }, [likedMovieIds, dislikedMovieIds]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading your likes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">My Likes & Dislikes</h1>

      {/* Liked Movies */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FaHeart className="text-red-500 text-2xl" />
          <h2 className="text-2xl font-semibold text-white">Liked Movies ({likedMovies.length})</h2>
        </div>

        {likedMovies.length === 0 ? (
          <div className="text-center py-8">
            <FaHeart className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-slate-400">No liked movies yet. Find movies you love and hit the heart!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {likedMovies.map((movie) => (
              <div
                key={movie.id}
                className="bg-glass rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => onSelectItem(movie)}
              >
                <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden">
                  <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-movie.jpg';
                    }}
                  />
                </div>
                <h3 className="font-medium text-white text-sm truncate">{movie.title}</h3>
                <div className="flex items-center mt-1">
                  <FaHeart className="text-red-500 mr-1" />
                  <span className="text-green-400 text-xs">Liked</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Disliked Movies */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <FaThumbsDown className="text-blue-500 text-2xl" />
          <h2 className="text-2xl font-semibold text-white">Disliked Movies ({dislikedMovies.length})</h2>
        </div>

        {dislikedMovies.length === 0 ? (
          <div className="text-center py-8">
            <FaThumbsDown className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-slate-400">No disliked movies yet. Don't like a movie? Use the thumbs down!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dislikedMovies.map((movie) => (
              <div
                key={movie.id}
                className="bg-glass rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => onSelectItem(movie)}
              >
                <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden opacity-50">
                  <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
                    alt={movie.title}
                    className="w-full h-full object-cover grayscale"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-movie.jpg';
                    }}
                  />
                </div>
                <h3 className="font-medium text-white text-sm truncate">{movie.title}</h3>
                <div className="flex items-center mt-1">
                  <FaThumbsDown className="text-blue-500 mr-1" />
                  <span className="text-blue-400 text-xs">Disliked</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* No content message */}
      {likedMovies.length === 0 && dislikedMovies.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">Start Rating Movies!</h3>
          <p className="text-slate-400">
            Browse movies and click the heart button to like them, or use the thumbs down for dislikes.
            All your ratings will sync across your devices.
          </p>
        </div>
      )}
    </div>
  );
};

export default LikesPage;
