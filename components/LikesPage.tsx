import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import { FaHeart, FaThumbsDown } from 'react-icons/fa';

interface LikesPageProps {
  apiKey: string;
  onSelectItem: (item: MediaItem) => void;
  onInvalidApiKey: () => void;
}

const LikesPage: React.FC<LikesPageProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
  const [likedMovies, setLikedMovies] = useState<MediaItem[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLikesDislikes = async () => {
      try {
        // Load from localStorage
        const storedLikes = localStorage.getItem('likedMovies');
        const storedDislikes = localStorage.getItem('dislikedMovies');

        if (storedLikes) {
          const likedIds = JSON.parse(storedLikes) as number[];
          // In a real app, you'd fetch full movie details here
          // For now, just store the IDs
          console.log('Liked movie IDs:', likedIds);
        }

        if (storedDislikes) {
          const dislikedIds = JSON.parse(storedDislikes) as number[];
          console.log('Disliked movie IDs:', dislikedIds);
        }

        // For demo purposes, create some sample movies
        const sampleLiked: MediaItem[] = [
          {
            id: 1,
            title: 'The Shawshank Redemption',
            poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
            backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDuH.jpg',
            overview: 'Two imprisoned men bond...',
            vote_average: 9.3,
            release_date: '1994-09-23',
            genre_ids: [18, 80],
            media_type: 'movie'
          }
        ];

        const sampleDisliked: MediaItem[] = [];

        setLikedMovies(sampleLiked);
        setDislikedMovies(sampleDisliked);
        setLoading(false);

      } catch (error) {
        console.error('Error loading likes/dislikes:', error);
        setLoading(false);
      }
    };

    loadLikesDislikes();
  }, []);

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
                    alt={movie.title || movie.name}
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
                    alt={movie.title || movie.name}
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
