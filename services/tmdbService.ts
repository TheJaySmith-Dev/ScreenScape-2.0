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
  Collection,
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
    throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const getTrending = (apiKey: string, timeWindow: 'day' | 'week' = 'day'): Promise<PaginatedResponse<MediaItem>> => {
  return apiFetch(apiKey, `/trending/all/${timeWindow}`);
};

export const searchMulti = (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Movie | TVShow | Person>> => {
  return apiFetch(apiKey, '/search/multi', { query, page });
};

export const getPopularMovies = async (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  const response = await apiFetch<PaginatedResponse<Movie>>(apiKey, '/movie/popular', { page });
  response.results = response.results.map(movie => ({ ...movie, media_type: 'movie' }));
  return response;
};

export const getPopularTVShows = async (apiKey: string, page: number = 1): Promise<PaginatedResponse<TVShow>> => {
  const response = await apiFetch<PaginatedResponse<TVShow>>(apiKey, '/tv/popular', { page });
  response.results = response.results.map(show => ({ ...show, media_type: 'tv' }));
  return response;
};

export const getMovieDetails = (apiKey: string, movieId: number, region: string): Promise<MovieDetails> => {
  return apiFetch(apiKey, `/movie/${movieId}`, { append_to_response: 'videos,credits,watch/providers', region });
};

export const getTVShowDetails = (apiKey: string, tvId: number, region: string): Promise<TVShowDetails> => {
  return apiFetch(apiKey, `/tv/${tvId}`, { append_to_response: 'videos,credits,watch/providers', region });
};

export const getMovieReleaseDates = (apiKey: string, movieId: number): Promise<ReleaseDatesResponse> => {
    return apiFetch(apiKey, `/movie/${movieId}/release_dates`);
};

export const getMoviesByProviders = async (apiKey: string, providerIds: number[], region: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await apiFetch<PaginatedResponse<Movie>>(apiKey, '/discover/movie', { 
        with_watch_providers: providerIds.join('|'),
        watch_region: region,
        page 
    });
    response.results = response.results.map(movie => ({ ...movie, media_type: 'movie' }));
    return response;
};

export const discoverMedia = async (apiKey: string, type: 'movie' | 'tv', params: Record<string, string | number | boolean>): Promise<PaginatedResponse<MediaItem>> => {
    const response = await apiFetch<PaginatedResponse<MediaItem>>(apiKey, `/discover/${type}`, params);
    // FIX: The `media_type` property was being assigned a type of `'movie' | 'tv'`, which is too broad for the `MediaItem` union. Casting the created object to `MediaItem` resolves the type error.
    response.results = response.results.map(item => ({ ...item, media_type: type } as MediaItem));
    return response;
};

export const getMovieRecommendations = async (apiKey: string, movieId: number): Promise<PaginatedResponse<Movie>> => {
    const response = await apiFetch<PaginatedResponse<Movie>>(apiKey, `/movie/${movieId}/recommendations`);
    response.results = response.results.map(movie => ({ ...movie, media_type: 'movie' }));
    return response;
};

export const getCollectionDetails = (apiKey: string, collectionId: number): Promise<Collection> => {
    return apiFetch(apiKey, `/collection/${collectionId}`);
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

// FIX: Update searchPerson to add media_type for consistency with the updated Person type.
export const searchPerson = async (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Person>> => {
  const response = await apiFetch<PaginatedResponse<any>>(apiKey, '/search/person', { query, page });
  response.results = response.results.map((p: any) => ({ ...p, media_type: 'person' }));
  return response;
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