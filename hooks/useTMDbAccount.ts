import { useState, useCallback, useEffect } from 'react';
import { AccountDetails } from '../types';
import { getAccountWatchlist, getAccountRatedMovies, modifyWatchlist, rateMovie, deleteRating } from '../services/tmdbService';

interface UseTMDbAccountProps {
    apiKey: string;
    sessionId: string;
    account: AccountDetails | null;
}

export const useTMDbAccount = ({ apiKey, sessionId, account }: UseTMDbAccountProps) => {
    const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
    const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!account || !sessionId) {
            setIsLoading(false);
            return;
        };

        const fetchPreferences = async () => {
            setIsLoading(true);
            try {
                // Fetch all pages for watchlist and rated movies
                const fetchAll = async (fetcher: (page: number) => Promise<any>) => {
                    let allItems: any[] = [];
                    let currentPage = 1;
                    let totalPages = 1;
                    do {
                        const response = await fetcher(currentPage);
                        allItems = allItems.concat(response.results);
                        totalPages = response.total_pages;
                        currentPage++;
                    } while (currentPage <= totalPages);
                    return allItems;
                };

                const [watchlistMovies, ratedMovies] = await Promise.all([
                    fetchAll(page => getAccountWatchlist(apiKey, account.id, sessionId, page)),
                    fetchAll(page => getAccountRatedMovies(apiKey, account.id, sessionId, page)),
                ]);

                setLikedIds(new Set(watchlistMovies.map(m => m.id)));
                
                // We consider a low rating as a dislike
                const disliked = ratedMovies.filter(m => m.rating <= 1).map(m => m.id);
                setDislikedIds(new Set(disliked));

            } catch (error) {
                console.error("Failed to fetch user preferences:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreferences();
    }, [apiKey, sessionId, account]);

    const likeMovie = useCallback(async (movieId: number) => {
        if (!account) return;
        // Optimistic update
        setLikedIds(prev => new Set(prev).add(movieId));
        if (dislikedIds.has(movieId)) {
            setDislikedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(movieId);
                return newSet;
            });
        }
        
        try {
            await modifyWatchlist(apiKey, account.id, sessionId, movieId, true);
            // If it was disliked (rated), remove the rating
            if (dislikedIds.has(movieId)) {
                await deleteRating(apiKey, movieId, sessionId);
            }
        } catch (error) {
            console.error("Failed to like movie:", error);
            // Revert on failure
            setLikedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(movieId);
                return newSet;
            });
        }
    }, [apiKey, sessionId, account, dislikedIds]);

    const dislikeMovie = useCallback(async (movieId: number) => {
        if (!account) return;
        // Optimistic update
        setDislikedIds(prev => new Set(prev).add(movieId));
        if (likedIds.has(movieId)) {
            setLikedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(movieId);
                return newSet;
            });
        }

        try {
            // Use a low rating (0.5 is the minimum) to signify a dislike
            await rateMovie(apiKey, movieId, sessionId, 0.5);
            // If it was on the watchlist, remove it
            if (likedIds.has(movieId)) {
                await modifyWatchlist(apiKey, account.id, sessionId, movieId, false);
            }
        } catch (error) {
            console.error("Failed to dislike movie:", error);
            // Revert
             setDislikedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(movieId);
                return newSet;
            });
        }
    }, [apiKey, sessionId, account, likedIds]);
    
    const hasRated = useCallback((movieId: number) => {
        return likedIds.has(movieId) || dislikedIds.has(movieId);
    }, [likedIds, dislikedIds]);

    return { likedIds, dislikedIds, likeMovie, dislikeMovie, hasRated, isLoading };
};
