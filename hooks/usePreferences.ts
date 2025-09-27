
import { useState, useCallback, useEffect } from 'react';

const LIKED_KEY = 'screenScapeLikedIds';
const DISLIKED_KEY = 'screenScapeDislikedIds';

const getStoredSet = (key: string): Set<number> => {
  const stored = localStorage.getItem(key);
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

export const usePreferences = () => {
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLikedIds(getStoredSet(LIKED_KEY));
    setDislikedIds(getStoredSet(DISLIKED_KEY));
  }, []);

  const likeMovie = useCallback((movieId: number) => {
    setLikedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(movieId);
      localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    setDislikedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movieId)) {
        newSet.delete(movieId);
        localStorage.setItem(DISLIKED_KEY, JSON.stringify(Array.from(newSet)));
      }
      return newSet;
    });
  }, []);

  const dislikeMovie = useCallback((movieId: number) => {
    setDislikedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(movieId);
      localStorage.setItem(DISLIKED_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    setLikedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(movieId)) {
        newSet.delete(movieId);
        localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(newSet)));
      }
      return newSet;
    });
  }, []);
  
  const hasRated = useCallback((movieId: number) => {
    return likedIds.has(movieId) || dislikedIds.has(movieId);
  }, [likedIds, dislikedIds]);

  return { likedIds, dislikedIds, likeMovie, dislikeMovie, hasRated };
};
