import {
  PaginatedResponse,
  Movie,
  TVShow,
  Person,
  MediaItem,
  MovieDetails,
  TVShowDetails,
  CreditsResponse,
  ImagesResponse,
  Video
} from '../types';

const API_BASE_URL = 'https://api4.thetvdb.com/v4';
const API_KEY = import.meta.env.VITE_THE_TVDB_API_KEY;

// Authentication
let authToken: string | null = null;
let tokenExpiry: Date | null = null;

const getAuthToken = async (): Promise<string> => {
  if (authToken && tokenExpiry && new Date() < tokenExpiry) {
    return authToken;
  }

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey: API_KEY,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API Key for TheTVDB. Please check your VITE_THE_TVDB_API_KEY environment variable.');
    }
    throw new Error(`TheTVDB Auth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  authToken = data.data.token;

  // Token is valid for 24 hours
  tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return authToken!;
};

const thetvdbFetch = async <T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> => {
  const token = await getAuthToken();
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  for (const key in params) {
    url.searchParams.append(key, String(params[key]));
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TheTVDB API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data as T;
};

// Search functions
export const searchMovies = async (query: string, limit: number = 10): Promise<Movie[]> => {
  const data = await thetvdbFetch<{movie: any[], series: any[]}>('/search', { query, limit });

  return data.movie.map(movie => ({
    id: movie.id,
    title: movie.name,
    poster_path: movie.image,
    backdrop_path: movie.image,
    overview: '', // Will be populated from extended details
    release_date: movie.year ? `${movie.year}-01-01` : '',
    vote_average: movie.score || 0,
    media_type: 'movie',
    genre_ids: [],
    popularity: 0,
    revenue: 0,
  }));
};

export const searchTVShows = async (query: string, limit: number = 10): Promise<TVShow[]> => {
  const data = await thetvdbFetch<{movie: any[], series: any[]}>('/search', { query, limit });

  return data.series.map(series => ({
    id: series.id,
    name: series.name,
    poster_path: series.image,
    backdrop_path: series.image,
    overview: '', // Will be populated from extended details
    first_air_date: series.year ? `${series.year}-01-01` : '',
    vote_average: series.score || 0,
    media_type: 'tv',
    genre_ids: [],
    popularity: 0,
  }));
};

export const searchMulti = async (query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Movie | TVShow | Person>> => {
  const data = await thetvdbFetch<{movie: any[], series: any[], people: any[]}>('/search', { query, limit });

  const results: (Movie | TVShow | Person)[] = [
    ...data.movie.map(movie => ({
      id: movie.id,
      title: movie.name,
      poster_path: movie.image,
      backdrop_path: movie.image,
      overview: '',
      release_date: movie.year ? `${movie.year}-01-01` : '',
      vote_average: movie.score || 0,
      media_type: 'movie' as const,
      genre_ids: [],
      popularity: 0,
      revenue: 0,
    })),
    ...data.series.map(series => ({
      id: series.id,
      name: series.name,
      poster_path: series.image,
      backdrop_path: series.image,
      overview: '',
      first_air_date: series.year ? `${series.year}-01-01` : '',
      vote_average: series.score || 0,
      media_type: 'tv' as const,
      genre_ids: [],
      popularity: 0,
    })),
  ];

  return {
    page,
    results,
    total_pages: 1, // TheTVDB doesn't use pagination like TMDb
    total_results: results.length,
  };
};

// Detail functions
export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  const movieData = await thetvdbFetch<any>(`/movies/${movieId}`);
  const extendedData = await thetvdbFetch<any>(`/movies/${movieId}/extended`);

  return {
    id: movieData.id,
    title: movieData.name || '',
    poster_path: movieData.image || null,
    backdrop_path: movieData.image || null,
    overview: movieData.overview || extendedData.overview || '',
    release_date: movieData.year ? `${movieData.year}-01-01` : '',
    vote_average: movieData.score || 0,
    media_type: 'movie',
    genre_ids: movieData.genres?.map((g: any) => g.id) || [],
    popularity: 0,
    genres: movieData.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
    runtime: movieData.runtime || null,
    production_companies: [],
    videos: { results: [] }, // Will be handled by TMDb fallback
    credits: { cast: [], crew: [] },
    'watch/providers': { id: movieId, results: {} }, // Will be handled by TMDb
    images: {
      id: movieId,
      backdrops: [],
      logos: [],
      posters: [],
    },
    revenue: 0,
  };
};

export const getTVShowDetails = async (tvId: number): Promise<TVShowDetails> => {
  const seriesData = await thetvdbFetch<any>(`/series/${tvId}`);
  const extendedData = await thetvdbFetch<any>(`/series/${tvId}/extended`);

  return {
    id: seriesData.id,
    name: seriesData.name,
    poster_path: seriesData.image,
    backdrop_path: seriesData.image,
    overview: seriesData.overview || extendedData.overview || '',
    first_air_date: seriesData.year ? `${seriesData.year}-01-01` : '',
    vote_average: seriesData.score || 0,
    media_type: 'tv',
    genre_ids: seriesData.genres?.map((g: any) => g.id) || [],
    popularity: 0,
    genres: seriesData.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
    number_of_seasons: extendedData.seasons?.length || 0,
    number_of_episodes: extendedData.seasons?.reduce((total: number, season: any) => total + season.episodeCount, 0) || 0,
    episode_run_time: [extendedData.airTime || ''],
    production_companies: [],
    videos: { results: [] }, // Will be handled by TMDb fallback
    credits: { cast: [], crew: [] },
    'watch/providers': { id: tvId, results: {} }, // Will be handled by TMDb
    images: {
      id: tvId,
      backdrops: [],
      logos: [],
      posters: [],
    },
  };
};

// Cast and crew functions
export const getMovieCredits = async (movieId: number): Promise<CreditsResponse> => {
  try {
    const extendedData = await thetvdbFetch<any>(`/movies/${movieId}/extended`);

    const cast = (extendedData.cast || []).slice(0, 10).map((person: any) => ({
      id: person.id,
      name: person.name,
      character: person.roleName || 'Unknown',
      profile_path: person.image,
    }));

    return {
      id: movieId,
      cast,
      crew: [],
    };
  } catch (error) {
    console.warn('TheTVDB cast data not available, returning empty:', error);
    return {
      id: movieId,
      cast: [],
      crew: [],
    };
  }
};

export const getTVShowCredits = async (tvId: number): Promise<CreditsResponse> => {
  try {
    const extendedData = await thetvdbFetch<any>(`/series/${tvId}/extended`);

    const cast = (extendedData.cast || []).slice(0, 10).map((person: any) => ({
      id: person.id,
      name: person.name,
      character: person.roleName || 'Unknown',
      profile_path: person.image,
    }));

    return {
      id: tvId,
      cast,
      crew: [],
    };
  } catch (error) {
    console.warn('TheTVDB cast data not available, returning empty:', error);
    return {
      id: tvId,
      cast: [],
      crew: [],
    };
  }
};

// Images function
export const getMovieImages = async (movieId: number): Promise<ImagesResponse> => {
  try {
    const artworks = await thetvdbFetch<any[]>(`/movies/${movieId}/artworks`);

    const backdrops = artworks.filter((art: any) => art.type === 3).map((art: any) => ({
      aspect_ratio: 1.77,
      height: 1080,
      iso_639_1: null,
      file_path: art.url,
      vote_average: 0,
      vote_count: 0,
      width: 1920,
    }));

    const posters = artworks.filter((art: any) => art.type === 2).map((art: any) => ({
      aspect_ratio: 0.67,
      height: 1500,
      iso_639_1: null,
      file_path: art.url,
      vote_average: 0,
      vote_count: 0,
      width: 1000,
    }));

    const logos = artworks.filter((art: any) => art.type === 15).map((art: any) => ({
      aspect_ratio: 1.0,
      height: 300,
      iso_639_1: 'en',
      file_path: art.url,
      vote_average: 0,
      vote_count: 0,
      width: 300,
    }));

    return {
      id: movieId,
      backdrops,
      logos,
      posters,
    };
  } catch (error) {
    console.warn('TheTVDB images data not available, returning empty:', error);
    return {
      id: movieId,
      backdrops: [],
      logos: [],
      posters: [],
    };
  }
};

export const getTVShowImages = async (tvId: number): Promise<ImagesResponse> => {
  try {
    const artworks = await thetvdbFetch<any[]>(`/series/${tvId}/artworks`);

    const backdrops = artworks.filter((art: any) => art.type === 3).map((art: any) => ({
      aspect_ratio: 1.77,
      height: 1080,
      iso_639_1: null,
      file_path: art.url,
      vote_average: 0,
      vote_count: 0,
      width: 1920,
    }));

    const posters = artworks.filter((art: any) => art.type === 2).map((art: any) => ({
      aspect_ratio: 0.67,
      height: 1500,
      iso_639_1: null,
      file_path: art.url,
      vote_average: 0,
      vote_count: 0,
      width: 1000,
    }));

    const logos = artworks.filter((art: any) => art.type === 15).map((art: any) => ({
      aspect_ratio: 1.0,
      height: 300,
      iso_639_1: 'en',
      file_path: art.url,
      vote_average: 0,
      vote_count: 0,
      width: 300,
    }));

    return {
      id: tvId,
      backdrops,
      logos,
      posters,
    };
  } catch (error) {
    console.warn('TheTVDB images data not available, returning empty:', error);
    return {
      id: tvId,
      backdrops: [],
      logos: [],
      posters: [],
    };
  }
};

// Popular/trending functions (limited in TheTVDB v4)
export const getPopularMovies = async (page: number = 1): Promise<PaginatedResponse<Movie>> => {
  // TheTVDB v4 doesn't have a popular movies endpoint, return empty
  return {
    page,
    results: [],
    total_pages: 1,
    total_results: 0,
  };
};

export const getPopularTVShows = async (page: number = 1): Promise<PaginatedResponse<TVShow>> => {
  // TheTVDB v4 doesn't have a popular shows endpoint, return empty
  return {
    page,
    results: [],
    total_pages: 1,
    total_results: 0,
  };
};

// Recommendation function (not available in TheTVDB v4)
export const getMovieRecommendations = async (movieId: number): Promise<PaginatedResponse<Movie>> => {
  // TheTVDB v4 doesn't have recommendations, return empty
  return {
    page: 1,
    results: [],
    total_pages: 1,
    total_results: 0,
  };
};

// Genre function (limited in TheTVDB v4)
export const getGenres = async (): Promise<{movie: Record<string, number>, tv: Record<string, number>}> => {
  // TheTVDB v4 genre endpoint is limited, return empty mappings
  return {
    movie: {},
    tv: {},
  };
};
