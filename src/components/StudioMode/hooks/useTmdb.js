import { useState, useEffect } from 'react';
import tmdbClient from '../lib/tmdbClient';

export const useTmdb = () => {
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [productionCompanies, setProductionCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTrendingData = async () => {
            try {
                setLoading(true);
                const { movies, companies } = await tmdbClient.fetchTrendingData();
                setTrendingMovies(movies);
                setProductionCompanies(companies);
            } catch (err) {
                setError('Failed to load trending data from TMDB');
                console.error('TMDB loading error:', err);
                // Set fallback data
                setTrendingMovies([]);
                setProductionCompanies([]);
            } finally {
                setLoading(false);
            }
        };

        loadTrendingData();
    }, []);

    // Generate a random movie title from our trending movies
    const getRandomMovieTitle = () => {
        if (trendingMovies.length === 0) {
            // Fallback titles if no data
            const fallbackTitles = [
                'Epic Adventures', 'Mystery Thriller', 'Romantic Comedy',
                'Sci-Fi Action', 'Horror Flicks', 'Documentary Series'
            ];
            return fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)];
        }
        const randomIndex = Math.floor(Math.random() * trendingMovies.length);
        return trendingMovies[randomIndex]?.title || 'Untitled Project';
    };

    // Get inspirations for content creation
    const getContentInspirations = (count = 5) => {
        const inspirations = [];
        for (let i = 0; i < count; i++) {
            inspirations.push(getRandomMovieTitle());
        }
        return [...new Set(inspirations)]; // Remove duplicates
    };

    // Get a random company name or generate one
    const getRandomCompanyName = () => {
        if (productionCompanies.length === 0) {
            const fallbackCompanies = [
                'Indie Films Inc', 'Blockbuster Studios', 'DreamWorks Prods',
                'Universal Nights', 'Paramount Visions', 'Warner Bros Animations'
            ];
            return fallbackCompanies[Math.floor(Math.random() * fallbackCompanies.length)];
        }
        const randomIndex = Math.floor(Math.random() * productionCompanies.length);
        return productionCompanies[randomIndex]?.name || 'Generic Studios';
    };

    return {
        trendingMovies,
        productionCompanies,
        loading,
        error,
        getRandomMovieTitle,
        getContentInspirations,
        getRandomCompanyName,
    };
};
