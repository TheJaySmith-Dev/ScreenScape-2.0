import { useState, useCallback, useEffect } from 'react';

const WATCHLIST_KEY = 'screenScapeWatchlistIds';
const DISLIKED_KEY = 'screenScapeDislikedIds';

const getStoredSet = (key: string): Set<number> => {
  const stored = localStorage.getItem(key);
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

export const usePreferences = () => {
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setWatchlistIds(getStoredSet(WATCHLIST_KEY));
    setDislikedIds(getStoredSet(DISLIKED_KEY));
  }, []);

  const toggleWatchlist = useCallback((itemId: number) => {
    // Add to or remove from watchlist
    setWatchlistIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });

    // If it's being added to watchlist, remove it from disliked
    if (!watchlistIds.has(itemId)) {
        setDislikedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
                localStorage.setItem(DISLIKED_KEY, JSON.stringify(Array.from(newSet)));
            }
            return newSet;
        });
    }
  }, [watchlistIds]);

  const dislikeItem = useCallback((itemId: number) => {
    // Add to disliked
    setDislikedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(itemId);
      localStorage.setItem(DISLIKED_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });

    // Remove from watchlist
    setWatchlistIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(Array.from(newSet)));
      }
      return newSet;
    });
  }, []);
  
  const isInWatchlist = useCallback((itemId: number) => {
    return watchlistIds.has(itemId);
  }, [watchlistIds]);

  const isDisliked = useCallback((itemId: number) => {
    return dislikedIds.has(itemId);
  }, [dislikedIds]);

  return { watchlistIds, dislikedIds, toggleWatchlist, dislikeItem, isInWatchlist, isDisliked };
};