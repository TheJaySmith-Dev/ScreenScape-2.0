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
  ReleaseDatesResponse,
} from '../types';

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

export const getMovieReleaseDates = (apiKey: string, movieId: number): Promise<ReleaseDatesResponse> => {
    return apiFetch(apiKey, `/movie/${movieId}/release_dates`);
};

export const getMoviesByProviders = (apiKey: string, providerIds: number[], page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return apiFetch(apiKey, '/discover/movie', { 
        with_watch_providers: providerIds.join('|'),
        watch_region: 'US',
        page 
    });
};

export const discoverMedia = (apiKey: string, type: 'movie' | 'tv', params: Record<string, string | number | boolean>): Promise<PaginatedResponse<MediaItem>> => {
    return apiFetch(apiKey, `/discover/${type}`, params);
};

export const getMovieRecommendations = (apiKey: string, movieId: number): Promise<PaginatedResponse<Movie>> => {
    return apiFetch(apiKey, `/movie/${movieId}/recommendations`);
};

export const getGenres = async (apiKey: string): Promise<{movie: Record<string, number>, tv: Record<string, number>}> => {
    const [movieRes, tvRes] = await Promise.all([
        apiFetch<{genres: {id: number, name: string}[]}>(apiKey, '/genre/movie/list'),
        apiFetch<{genres: {id: number, name: string}[]}>(apiKey, '/genre/tv/list')
    ]);
    const genreMap = (res: {genres: {id: number, name: string}[]}) => 
        res.genres.reduce((acc, genre) => {
            acc[genre.name.toLowerCase()] = genre.id;
            return acc;
        }, {} as Record<string, number>);

    return { movie: genreMap(movieRes), tv: genreMap(tvRes) };
};

export const normalizeMovie = (movie: Movie): MediaItem => ({
  ...movie,
  media_type: 'movie',
});

export const normalizeTVShow = (tvShow: TVShow): TVShow => ({
  ...tvShow,
  title: tvShow.name,
  release_date: tvShow.first_air_date,
  media_type: 'tv',
});

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