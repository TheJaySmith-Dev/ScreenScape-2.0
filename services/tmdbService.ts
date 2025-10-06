
import type { Movie, TVShow, MediaItem, PaginatedResponse, Video, MovieDetails, TVShowDetails, CreditsResponse, ImageResponse, WatchProviderResponse } from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async <T>(apiKey: string, endpoint: string, params: Record<string, string | number> = {}): Promise<T> => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  url.searchParams.append('api_key', apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, String(value)));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const status = errorData.status_code || response.status;
    const message = errorData.status_message || `An error occurred (Status: ${response.status})`;
    
    if (status === 7 || status === 34) { // Invalid API Key or resource not found
      throw new Error("Invalid API Key or resource not found.");
    }
    
    throw new Error(`${message} (Status: ${response.status})`);
  }
  return response.json();
};

export const normalizeMovie = (movie: Movie): MediaItem => ({
  ...movie,
  title: movie.title,
  release_date: movie.release_date,
  media_type: 'movie',
});

export const normalizeTVShow = (tvShow: TVShow): MediaItem => ({
  ...tvShow,
  title: tvShow.name,
  release_date: tvShow.first_air_date,
  media_type: 'tv',
});

export const getTrendingAll = (apiKey: string) => fetchFromTMDB<PaginatedResponse<Movie | TVShow>>(apiKey, 'trending/all/week');
export const searchMulti = (apiKey: string, query: string, page: number = 1) => fetchFromTMDB<PaginatedResponse<Movie | TVShow>>(apiKey, 'search/multi', { query, page });
export const getPopularMovies = (apiKey: string) => fetchFromTMDB<PaginatedResponse<Movie>>(apiKey, 'movie/popular');
export const getPopularTVShows = (apiKey: string) => fetchFromTMDB<PaginatedResponse<TVShow>>(apiKey, 'tv/popular');
export const getUpcomingMovies = (apiKey: string) => fetchFromTMDB<PaginatedResponse<Movie>>(apiKey, 'movie/upcoming');
export const getOnTheAirTVShows = (apiKey: string) => fetchFromTMDB<PaginatedResponse<TVShow>>(apiKey, 'tv/on_the_air');
export const getMovieVideos = (apiKey: string, id: number) => fetchFromTMDB<{id: number; results: Video[]}>(apiKey, `movie/${id}/videos`).then(res => res.results);
export const getTVShowVideos = (apiKey: string, id: number) => fetchFromTMDB<{id: number; results: Video[]}>(apiKey, `tv/${id}/videos`).then(res => res.results);
export const getMovieDetails = (apiKey: string, id: number) => fetchFromTMDB<MovieDetails>(apiKey, `movie/${id}`);
export const getTVShowDetails = (apiKey: string, id: number) => fetchFromTMDB<TVShowDetails>(apiKey, `tv/${id}`);
export const getMovieCredits = (apiKey: string, id: number) => fetchFromTMDB<CreditsResponse>(apiKey, `movie/${id}/credits`);
export const getTVShowCredits = (apiKey: string, id: number) => fetchFromTMDB<CreditsResponse>(apiKey, `tv/${id}/credits`);
export const getSimilarMovies = (apiKey: string, id: number) => fetchFromTMDB<PaginatedResponse<Movie>>(apiKey, `movie/${id}/similar`);
export const getMovieImages = (apiKey: string, id: number) => fetchFromTMDB<ImageResponse>(apiKey, `movie/${id}/images`, { include_image_language: 'en' });
export const getTVShowImages = (apiKey: string, id: number) => fetchFromTMDB<ImageResponse>(apiKey, `tv/${id}/images`, { include_image_language: 'en' });
export const getMovieWatchProviders = (apiKey: string, id: number) => fetchFromTMDB<WatchProviderResponse>(apiKey, `movie/${id}/watch/providers`);
export const getTVShowWatchProviders = (apiKey: string, id: number) => fetchFromTMDB<WatchProviderResponse>(apiKey, `tv/${id}/watch/providers`);

export const discoverMovies = (apiKey: string, params: Record<string, any>) => fetchFromTMDB<PaginatedResponse<Movie>>(apiKey, 'discover/movie', params);
export const discoverTVShows = (apiKey: string, params: Record<string, any>) => fetchFromTMDB<PaginatedResponse<TVShow>>(apiKey, 'discover/tv', params);

export const getMoviesByProvider = (apiKey: string, providerId: number) => discoverMovies(apiKey, { with_watch_providers: providerId, watch_region: 'GB', sort_by: 'popularity.desc' });
export const getTVShowsByProvider = (apiKey: string, providerId: number) => discoverTVShows(apiKey, { with_watch_providers: providerId, watch_region: 'GB', sort_by: 'popularity.desc' });
export const getNewMoviesByProvider = (apiKey: string, providerId: number) => discoverMovies(apiKey, { with_watch_providers: providerId, watch_region: 'GB', 'primary_release_date.gte': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
export const getNewTVShowsByProvider = (apiKey: string, providerId: number) => discoverTVShows(apiKey, { with_watch_providers: providerId, watch_region: 'GB', 'first_air_date.gte': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
export const getMoviesByCompany = (apiKey: string, companyId: number) => discoverMovies(apiKey, { with_companies: companyId, sort_by: 'popularity.desc' });
export const getTopRatedMoviesByCompany = (apiKey: string, companyId: number) => discoverMovies(apiKey, { with_companies: companyId, sort_by: 'vote_average.desc', 'vote_count.gte': 200 });
export const getTopRatedTVShowsByNetwork = (apiKey: string, networkId: number) => discoverTVShows(apiKey, { with_networks: networkId, sort_by: 'vote_average.desc', 'vote_count.gte': 100 });

export const getTVShowSeasonDetails = (apiKey: string, tvId: number, seasonNumber: number) => fetchFromTMDB<any>(apiKey, `tv/${tvId}/season/${seasonNumber}`);
