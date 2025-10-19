import { PaginatedResponse, Movie, Video, WatchProviderResponse, MediaItem } from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const apiFetch = async <T>(apiKey: string, endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', apiKey);
  for (const key in params) {
    url.searchParams.append(key, String(params[key]));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 401) {
        throw new Error("Invalid API Key");
    }
    throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// STREAMING AVAILABILITY FUNCTIONS (Only kept functions)
export const getMovieWatchProviders = (apiKey: string, movieId: number, region: string): Promise<WatchProviderResponse> => {
  return apiFetch(apiKey, `/movie/${movieId}/watch/providers`);
};

export const getTVShowWatchProviders = (apiKey: string, tvId: number, region: string): Promise<WatchProviderResponse> => {
  return apiFetch(apiKey, `/tv/${tvId}/watch/providers`);
};

// VIDEO/TRAILER FUNCTIONS (kept for fallback)
export const getMovieVideos = (apiKey: string, movieId: number): Promise<{results: Video[]}> => {
  return apiFetch(apiKey, `/movie/${movieId}/videos`);
};

export const getTVShowVideos = (apiKey: string, tvId: number): Promise<{results: Video[]}> => {
  return apiFetch(apiKey, `/tv/${tvId}/videos`);
};

// RECOMMENDATIONS
export const getMovieRecommendations = async (apiKey: string, movieId: number): Promise<PaginatedResponse<Movie>> => {
    const response = await apiFetch<PaginatedResponse<Movie>>(apiKey, `/movie/${movieId}/recommendations`);
    response.results = response.results.map(movie => ({ ...movie, media_type: 'movie' }));
    return response;
};

// TRENDING
export const getTrending = (apiKey: string, timeWindow: 'day' | 'week' = 'day'): Promise<PaginatedResponse<MediaItem>> => {
  return apiFetch(apiKey, `/trending/all/${timeWindow}`);
};
