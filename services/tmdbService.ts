import type { Movie, TVShow, PaginatedResponse, Video, MovieDetails, TVShowDetails, CreditsResponse, ImageResponse, MediaItem, Episode, WatchProviderResponse } from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async <T>(apiKey: string, endpoint: string): Promise<T> => {
  const url = `${API_BASE_URL}/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=en-US`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(`Invalid API Key. Status: ${response.status}`);
    }
    throw new Error(`Failed to fetch from TMDB: ${response.statusText} (Status: ${response.status})`);
  }
  return response.json();
};

// --- Normalization ---
export const normalizeMovie = (movie: Movie): MediaItem => ({
    ...movie,
    media_type: 'movie',
});

export const normalizeTVShow = (tvShow: TVShow): MediaItem => ({
    ...tvShow,
    title: tvShow.name,
    release_date: tvShow.first_air_date,
    media_type: 'tv',
});


// --- Movie Specific ---
export const getPopularMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTMDB(apiKey, `movie/popular?page=${page}`);
};
export const getSimilarMovies = (apiKey: string, movieId: number): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTMDB(apiKey, `movie/${movieId}/similar`);
};
export const getMovieVideos = async (apiKey: string, movieId: number): Promise<Video[]> => {
  const response = await fetchFromTMDB<{ results: Video[] }>(apiKey, `movie/${movieId}/videos`);
  return response.results.filter(v => v.site === 'YouTube');
};
export const getMovieDetails = (apiKey: string, movieId: number): Promise<MovieDetails> => {
    return fetchFromTMDB(apiKey, `movie/${movieId}`);
};
export const getMovieCredits = (apiKey: string, movieId: number): Promise<CreditsResponse> => {
    return fetchFromTMDB(apiKey, `movie/${movieId}/credits`);
};
export const getMovieImages = (apiKey: string, movieId: number): Promise<ImageResponse> => {
    return fetchFromTMDB(apiKey, `movie/${movieId}/images?include_image_language=en,null`);
};
export const getUpcomingMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTMDB(apiKey, `movie/upcoming?page=${page}&region=US`);
};
export const discoverMovies = (apiKey: string, params: Record<string, string | number>, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    const query = new URLSearchParams({ ...params, page: page.toString() }).toString();
    return fetchFromTMDB(apiKey, `discover/movie?${query}`);
};
export const getMovieWatchProviders = (apiKey: string, movieId: number): Promise<WatchProviderResponse> => {
    return fetchFromTMDB(apiKey, `movie/${movieId}/watch/providers`);
};


// --- TV Show Specific ---
export const getPopularTVShows = (apiKey: string, page: number = 1): Promise<PaginatedResponse<TVShow>> => {
  return fetchFromTMDB(apiKey, `tv/popular?page=${page}`);
};
export const getOnTheAirTVShows = (apiKey: string, page: number = 1): Promise<PaginatedResponse<TVShow>> => {
  return fetchFromTMDB(apiKey, `tv/on_the_air?page=${page}`);
};
export const getTVShowDetails = (apiKey: string, tvId: number): Promise<TVShowDetails> => {
  return fetchFromTMDB(apiKey, `tv/${tvId}`);
};
export const getTVShowCredits = (apiKey: string, tvId: number): Promise<CreditsResponse> => {
    return fetchFromTMDB(apiKey, `tv/${tvId}/credits`);
};
export const getTVShowVideos = async (apiKey: string, tvId: number): Promise<Video[]> => {
  const response = await fetchFromTMDB<{ results: Video[] }>(apiKey, `tv/${tvId}/videos`);
  return response.results.filter(v => v.site === 'YouTube');
};
export const getTVShowImages = (apiKey: string, tvId: number): Promise<ImageResponse> => {
    return fetchFromTMDB(apiKey, `tv/${tvId}/images?include_image_language=en,null`);
};
export const getTVShowSeasonDetails = (apiKey: string, tvId: number, seasonNumber: number): Promise<{ episodes: Episode[] }> => {
  return fetchFromTMDB(apiKey, `tv/${tvId}/season/${seasonNumber}`);
};
export const getTVShowWatchProviders = (apiKey: string, tvId: number): Promise<WatchProviderResponse> => {
    return fetchFromTMDB(apiKey, `tv/${tvId}/watch/providers`);
};


// --- Combined / Generic ---
export const getTrendingAll = (apiKey: string): Promise<PaginatedResponse<Movie | TVShow>> => {
    return fetchFromTMDB(apiKey, 'trending/all/week');
};
export const searchMulti = (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Movie | TVShow>> => {
    return fetchFromTMDB(apiKey, `search/multi?query=${encodeURIComponent(query)}&page=${page}`);
};
export const getGenres = async (apiKey:string): Promise<Map<number, string>> => {
    const [movieGenres, tvGenres] = await Promise.all([
        fetchFromTMDB<{ genres: { id: number, name: string }[] }>(apiKey, 'genre/movie/list'),
        fetchFromTMDB<{ genres: { id: number, name: string }[] }>(apiKey, 'genre/tv/list')
    ]);
    const allGenres = [...movieGenres.genres, ...tvGenres.genres];
    return new Map(allGenres.map(g => [g.id, g.name]));
}
export const getMoviesByProvider = (apiKey: string, providerId: number, sortBy: string = 'popularity.desc', page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return fetchFromTMDB(apiKey, `discover/movie?with_watch_providers=${providerId}&watch_region=US&sort_by=${sortBy}&page=${page}`);
};
export const getTVShowsByProvider = (apiKey: string, providerId: number, sortBy: string = 'popularity.desc', page: number = 1): Promise<PaginatedResponse<TVShow>> => {
    return fetchFromTMDB(apiKey, `discover/tv?with_watch_providers=${providerId}&watch_region=US&sort_by=${sortBy}&page=${page}`);
};
export const discoverTVShows = (apiKey: string, params: Record<string, string | number>, page: number = 1): Promise<PaginatedResponse<TVShow>> => {
    const query = new URLSearchParams({ ...params, page: page.toString() }).toString();
    return fetchFromTMDB(apiKey, `discover/tv?${query}`);
}
export const getMoviesByCompany = (apiKey: string, companyId: number, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return fetchFromTMDB(apiKey, `discover/movie?with_companies=${companyId}&sort_by=popularity.desc&page=${page}`);
};
export const getMoviesByKeyword = (apiKey: string, keywordId: number, page: number = 1): Promise<PaginatedResponse<Movie>> => {
    return fetchFromTMDB(apiKey, `discover/movie?with_keywords=${keywordId}&sort_by=popularity.desc&page=${page}`);
};