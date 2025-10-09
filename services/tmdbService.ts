import type {
    PaginatedResponse,
    Movie,
    TVShow,
    Person,
    MediaItem,
    MovieDetails,
    TVShowDetails,
    WatchProviderResponse,
    CreditsResponse,
    ImageResponse,
    PersonMovieCreditsResponse,
    Video,
    Genre
} from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

class ApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

const apiCall = async <T,>(endpoint: string, apiKey: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=en-US`;
    try {
        const response = await fetch(url);
        if (response.status === 401) {
            throw new ApiError('Invalid API Key');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("TMDB API call failed:", error);
        throw error;
    }
};

export const normalizeMovie = (movie: Movie): MediaItem => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    overview: movie.overview,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    media_type: 'movie',
});

export const normalizeTVShow = (tvShow: TVShow): MediaItem => ({
    id: tvShow.id,
    title: tvShow.name,
    poster_path: tvShow.poster_path,
    backdrop_path: tvShow.backdrop_path,
    overview: tvShow.overview,
    release_date: tvShow.first_air_date,
    vote_average: tvShow.vote_average,
    media_type: 'tv',
});

// Search
export const searchMulti = (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Movie | TVShow | Person>> =>
    apiCall(`/search/multi?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`, apiKey);

export const searchPerson = (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Person>> =>
    apiCall(`/search/person?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`, apiKey);

// Movies
export const getMovieDetails = (apiKey: string, movieId: number): Promise<MovieDetails> =>
    apiCall(`/movie/${movieId}`, apiKey);

export const getMovieCredits = (apiKey: string, movieId: number): Promise<CreditsResponse> =>
    apiCall(`/movie/${movieId}/credits`, apiKey);

export const getMovieImages = (apiKey: string, movieId: number): Promise<ImageResponse> =>
    apiCall(`/movie/${movieId}/images?include_image_language=en,null,xx`, apiKey);

export const getMovieWatchProviders = (apiKey: string, movieId: number): Promise<WatchProviderResponse> =>
    apiCall(`/movie/${movieId}/watch/providers`, apiKey);
    
export const getMovieVideos = (apiKey: string, movieId: number): Promise<{ id: number, results: Video[] }> =>
    apiCall(`/movie/${movieId}/videos`, apiKey);

export const getPopularMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> =>
    apiCall(`/movie/popular?page=${page}`, apiKey);

export const getTrending = (apiKey: string, timeWindow: 'day' | 'week' = 'week'): Promise<PaginatedResponse<Movie | TVShow>> =>
    apiCall(`/trending/all/${timeWindow}`, apiKey);

export const getUpcomingMovies = (apiKey: string, region: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    // Using the official '/movie/upcoming' endpoint is more reliable for theatrical releases
    // and correctly filters by region to avoid showing movies already out elsewhere.
    return apiCall(`/movie/upcoming?page=${page}&region=${region}`, apiKey);
}

// TV Shows
export const getTVShowDetails = (apiKey: string, tvId: number): Promise<TVShowDetails> =>
    apiCall(`/tv/${tvId}`, apiKey);

export const getTVShowVideos = (apiKey: string, tvId: number): Promise<{ id: number, results: Video[] }> =>
    apiCall(`/tv/${tvId}/videos`, apiKey);

export const getTVShowImages = (apiKey: string, tvId: number): Promise<ImageResponse> =>
    apiCall(`/tv/${tvId}/images?include_image_language=en,null,xx`, apiKey);

export const getTVShowWatchProviders = (apiKey: string, tvId: number): Promise<WatchProviderResponse> =>
    apiCall(`/tv/${tvId}/watch/providers`, apiKey);
    
export const getOnTheAirTVShows = (apiKey: string, page: number = 1): Promise<PaginatedResponse<TVShow>> =>
    apiCall(`/tv/on_the_air?page=${page}`, apiKey);

export const getMediaVideos = (apiKey:string, mediaId: number, mediaType: 'movie' | 'tv'): Promise<{ id: number, results: Video[] }> => {
    if (mediaType === 'movie') {
        return getMovieVideos(apiKey, mediaId);
    } else {
        return getTVShowVideos(apiKey, mediaId);
    }
}

export const getMediaImages = (apiKey: string, mediaId: number, mediaType: 'movie' | 'tv'): Promise<ImageResponse> => {
    if (mediaType === 'movie') {
        return getMovieImages(apiKey, mediaId);
    } else {
        return getTVShowImages(apiKey, mediaId);
    }
}

export const getMediaWatchProviders = (apiKey: string, mediaId: number, mediaType: 'movie' | 'tv'): Promise<WatchProviderResponse> => {
    if (mediaType === 'movie') {
        return getMovieWatchProviders(apiKey, mediaId);
    } else {
        return getTVShowWatchProviders(apiKey, mediaId);
    }
}

// People
export const getPersonMovieCredits = (apiKey: string, personId: number): Promise<PersonMovieCreditsResponse> =>
    apiCall(`/person/${personId}/movie_credits`, apiKey);

// Discover
export const discoverMedia = (apiKey: string, params: Record<string, string | number>): Promise<PaginatedResponse<Movie>> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall(`/discover/movie?${query}`, apiKey);
};

export const getTopRatedMoviesByProvider = (apiKey: string, providerId: string, region: string): Promise<PaginatedResponse<Movie>> =>
    apiCall(`/discover/movie?sort_by=vote_average.desc&vote_count.gte=200&with_watch_providers=${providerId}&watch_region=${region}`, apiKey);

export const getTopRatedTVShowsByProvider = (apiKey: string, providerId: string, region: string): Promise<PaginatedResponse<TVShow>> =>
    apiCall(`/discover/tv?sort_by=vote_average.desc&vote_count.gte=200&with_watch_providers=${providerId}&watch_region=${region}`, apiKey);

export const getGenres = (apiKey: string): Promise<{ genres: Genre[] }> =>
    apiCall(`/genre/movie/list`, apiKey);