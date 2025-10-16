import axios from 'axios';

const tmdbKey = import.meta.env.VITE_TMDB_KEY;
const baseUrl = 'https://api.themoviedb.org/3';

class TMDBClient {
    constructor() {
        this.client = axios.create({
            baseURL: baseUrl,
            params: {
                api_key: tmdbKey,
            },
        });
        this.lastFetch = {};
    }

    async fetchTrendingMovies() {
        // Cache for 7 days
        const cacheKey = 'trendingMovies';
        if (this.shouldUseCache(cacheKey, 7 * 24 * 60 * 60 * 1000)) {
            return this.lastFetch[cacheKey];
        }

        try {
            const response = await this.client.get('/trending/movie/week');
            const movies = response.data.results;
            this.lastFetch[cacheKey] = movies;
            return movies;
        } catch (error) {
            console.error('Error fetching trending movies:', error);
            return [];
        }
    }

    async fetchProductionCompanies(movies) {
        const companies = [];
        const usedIds = new Set();

        for (const movie of movies.slice(0, 10)) { // Limit to first 10 movies
            try {
                const response = await this.client.get(`/movie/${movie.id}`);
                const movieCompanies = response.data.production_companies || [];

                for (const company of movieCompanies) {
                    if (!usedIds.has(company.id) && company.logo_path) {
                        companies.push(company);
                        usedIds.add(company.id);
                        if (companies.length >= 20) break; // Limit to 20 companies
                    }
                }
                if (companies.length >= 20) break;
            } catch (error) {
                console.error(`Error fetching details for movie ${movie.id}:`, error);
            }
        }

        return companies;
    }

    // Combines both to get trending movies and their production companies
    async fetchTrendingData() {
        const movies = await this.fetchTrendingMovies();
        const companies = await this.fetchProductionCompanies(movies);
        return { movies, companies };
    }

    shouldUseCache(key, maxAge) {
        const cached = this.lastFetch[key];
        if (!cached) return false;

        const age = Date.now() - cached.timestamp;
        return age < maxAge;
    }
}

export default new TMDBClient();
