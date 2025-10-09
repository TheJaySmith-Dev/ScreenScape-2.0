import {
  PaginatedResponse,
  Movie,
  TVShow,
  Person,
  MediaItem,
  MovieDetails,
  TVShowDetails,
  CreditsResponse,
  PersonCreditsResponse,
  ImagesResponse,
} from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const apiFetch = async <T>(apiKey: string, endpoint: string, params: Record<string, string | number> = {}): Promise<T> => {
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
    throw new Error(`TMDb API error: ${response.statusText}`);
  }
  return response.json();
};

export const getTrending = (apiKey: string, timeWindow: 'day' | 'week' = 'day'): Promise<PaginatedResponse<MediaItem>> => {
  return apiFetch(apiKey, `/trending/all/${timeWindow}`);
};

export const searchMulti = (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Movie | TVShow | Person>> => {
  return apiFetch(apiKey, '/search/multi', { query, page });
};

export const getPopularMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return apiFetch(apiKey, '/movie/popular', { page });
};

export const getPopularTVShows = (apiKey: string, page: number = 1): Promise<PaginatedResponse<TVShow>> => {
  return apiFetch(apiKey, '/tv/popular', { page });
};

export const getMovieDetails = (apiKey: string, movieId: number): Promise<MovieDetails> => {
  return apiFetch(apiKey, `/movie/${movieId}`, { append_to_response: 'videos,credits,watch/providers' });
};

export const getTVShowDetails = (apiKey: string, tvId: number): Promise<TVShowDetails> => {
  return apiFetch(apiKey, `/tv/${tvId}`, { append_to_response: 'videos,credits,watch/providers' });
};

export const getMoviesByProviders = (apiKey: string, providerIds: number[], page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return apiFetch(apiKey, '/discover/movie', { 
        with_watch_providers: providerIds.join('|'),
        watch_region: 'US', // Or make this dynamic
        page 
    });
};

// Normalization functions
export const normalizeMovie = (movie: Movie): MediaItem => ({
  ...movie,
  media_type: 'movie',
});

// Fix: Update normalizeTVShow to correctly add 'title' and 'release_date' and return a valid TVShow type.
export const normalizeTVShow = (tvShow: TVShow): TVShow => ({
  ...tvShow,
  title: tvShow.name,
  release_date: tvShow.first_air_date,
  media_type: 'tv',
});

// Fix: Add missing service functions for games
export const searchPerson = (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Person>> => {
  return apiFetch(apiKey, '/search/person', { query, page });
};

export const getPersonMovieCredits = (apiKey: string, personId: number): Promise<PersonCreditsResponse> => {
    return apiFetch(apiKey, `/person/${personId}/movie_credits`);
};

export const getMovieCredits = (apiKey: string, movieId: number): Promise<CreditsResponse> => {
    return apiFetch(apiKey, `/movie/${movieId}/credits`);
};

export const getMovieImages = (apiKey: string, movieId: number): Promise<ImagesResponse> => {
    return apiFetch(apiKey, `/movie/${movieId}/images`);
};
