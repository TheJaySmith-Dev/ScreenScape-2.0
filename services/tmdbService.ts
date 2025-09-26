import type { Movie, PaginatedResponse, Video, MovieDetails, CreditsResponse, ImageResponse, RequestTokenResponse, SessionResponse, AccountDetails } from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async <T>(apiKey: string, endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch from TMDB: ${errorData.status_message || response.statusText}`);
  }
  return response.json();
};


// --- Movie Data ---
export const getPopularMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTMDB(apiKey, `movie/popular?page=${page}`);
};

export const getSimilarMovies = (apiKey: string, movieId: number): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTMDB(apiKey, `movie/${movieId}/similar`);
};

export const getMovieVideos = async (apiKey: string, movieId: number): Promise<Video | null> => {
  const response = await fetchFromTMDB<{ results: Video[] }>(apiKey, `movie/${movieId}/videos`);
  return response.results.find(v => v.site === 'YouTube' && v.type === 'Trailer') || response.results.find(v => v.site === 'YouTube') || null;
};

export const searchMovies = (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return fetchFromTMDB(apiKey, `search/movie?query=${encodeURIComponent(query)}&page=${page}`);
};

export const getTrendingMovies = (apiKey: string): Promise<PaginatedResponse<Movie>> => {
    return fetchFromTMDB(apiKey, 'trending/movie/week');
};

export const getGenres = async (apiKey:string): Promise<Map<number, string>> => {
    const { genres } = await fetchFromTMDB<{ genres: { id: number, name: string }[] }>(apiKey, 'genre/movie/list');
    return new Map(genres.map(g => [g.id, g.name]));
}

export const getMovieDetails = (apiKey: string, movieId: number): Promise<MovieDetails> => {
    return fetchFromTMDB(apiKey, `movie/${movieId}`);
};

export const getMovieCredits = (apiKey: string, movieId: number): Promise<CreditsResponse> => {
    return fetchFromTMDB(apiKey, `movie/${movieId}/credits`);
};

export const getMovieImages = (apiKey: string, movieId: number): Promise<ImageResponse> => {
    return fetchFromTMDB(apiKey, `movie/${movieId}/images?include_image_language=en,null`);
};


// --- Authentication & Account ---
export const createRequestToken = (apiKey: string): Promise<RequestTokenResponse> => {
    return fetchFromTMDB(apiKey, 'authentication/token/new');
};

export const createSession = (apiKey: string, requestToken: string): Promise<SessionResponse> => {
    return fetchFromTMDB(apiKey, 'authentication/session/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_token: requestToken }),
    });
};

export const deleteSession = (apiKey: string, sessionId: string): Promise<{ success: boolean }> => {
    return fetchFromTMDB(apiKey, 'authentication/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
    });
}

export const getAccountDetails = (apiKey: string, sessionId: string): Promise<AccountDetails> => {
    return fetchFromTMDB(apiKey, `account?session_id=${sessionId}`);
};

export const getAccountWatchlist = (apiKey: string, accountId: number, sessionId: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return fetchFromTMDB(apiKey, `account/${accountId}/watchlist/movies?session_id=${sessionId}&page=${page}&sort_by=created_at.desc`);
};

export const getAccountRatedMovies = (apiKey: string, accountId: number, sessionId: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return fetchFromTMDB(apiKey, `account/${accountId}/rated/movies?session_id=${sessionId}&page=${page}&sort_by=created_at.desc`);
};

export const modifyWatchlist = (apiKey: string, accountId: number, sessionId: string, movieId: number, inWatchlist: boolean): Promise<{status_code: number, status_message: string}> => {
    return fetchFromTMDB(apiKey, `account/${accountId}/watchlist?session_id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_type: 'movie', media_id: movieId, watchlist: inWatchlist }),
    });
};

export const rateMovie = (apiKey: string, movieId: number, sessionId: string, rating: number): Promise<{status_code: number, status_message: string}> => {
     return fetchFromTMDB(apiKey, `movie/${movieId}/rating?session_id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: rating }),
    });
};

export const deleteRating = (apiKey: string, movieId: number, sessionId: string): Promise<{status_code: number, status_message: string}> => {
     return fetchFromTMDB(apiKey, `movie/${movieId}/rating?session_id=${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
};