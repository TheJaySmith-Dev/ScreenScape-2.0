import type { Movie, PaginatedResponse, Video, MovieDetails, CreditsResponse, ImageResponse } from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async <T>(apiKey: string, endpoint: string): Promise<T> => {
  const url = `${API_BASE_URL}/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=en-US`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from TMDB: ${response.statusText}`);
  }
  return response.json();
};

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
