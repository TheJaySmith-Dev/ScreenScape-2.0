import { PaginatedResponse, Movie, TVShow, Video, WatchProviderResponse, MediaItem, MovieDetails, PersonMovieCredit, Person, CastMember, CrewMember } from '../types';

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

// POPULAR MOVIES
export const getPopularMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return apiFetch(apiKey, '/movie/popular', { page });
};

// MOVIE IMAGES
export const getMovieImages = (apiKey: string, movieId: number): Promise<{
  id: number;
  backdrops: Array<{
    aspect_ratio: number;
    file_path: string;
    height: number;
    width: number;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
  }>;
  logos: Array<{
    aspect_ratio: number;
    file_path: string;
    height: number;
    width: number;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
  }>;
  posters: Array<{
    aspect_ratio: number;
    file_path: string;
    height: number;
    width: number;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
  }>;
}> => {
  return apiFetch(apiKey, `/movie/${movieId}/images`);
};

// PERSON SEARCH AND CREDITS
// FIX: Update searchPerson to add media_type for consistency with the updated Person type.
export const searchPerson = async (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<Person>> => {
  const response = await apiFetch<PaginatedResponse<any>>(apiKey, '/search/person', { query, page });
  response.results = response.results.map((p: any) => ({ ...p, media_type: 'person' }));
  return response;
};

// // DUPLICATE PERSON MOVIE CREDITS - ALREADY DECLARED ABOVE
// export const getPersonMovieCredits = (apiKey: string, personId: number): Promise<{
//   id: number;
//   cast: PersonMovieCredit[];
//   crew: (Movie & { job: string })[];
// }> => {
//   return apiFetch(apiKey, `/person/${personId}/movie_credits`);
// };

// MOVIE CREDITS
export const getMovieCredits = (apiKey: string, movieId: number): Promise<{
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}> => {
  return apiFetch(apiKey, `/movie/${movieId}/credits`);
};

// NORMALIZE FUNCTIONS
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

// COLLECTION DETAILS
export const getCollectionDetails = (apiKey: string, collectionId: number): Promise<{
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}> => {
  return apiFetch(apiKey, `/collection/${collectionId}`);
};

// PERSON MOVIE CREDITS
export const getPersonMovieCredits = (apiKey: string, personId: number): Promise<{
  id: number;
  cast: PersonMovieCredit[];
  crew: (Movie & { job: string })[];
}> => {
  return apiFetch(apiKey, `/person/${personId}/movie_credits`);
};

// MOVIE DETAILS (for collections)
export const getMovieDetailsForCollections = (apiKey: string, movieId: number): Promise<MovieDetails> => {
  return apiFetch(apiKey, `/movie/${movieId}`);
};

// MOVIE DETAILS (with regional release info)
export const getMovieDetails = (apiKey: string, movieId: number, country?: string): Promise<MovieDetails> => {
  return apiFetch(apiKey, `/movie/${movieId}`, country ? { region: country } : {});
};

// MULTI SEARCH
export const searchMulti = async (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<MediaItem>> => {
  const response = await apiFetch<PaginatedResponse<any>>(apiKey, '/search/multi', { query, page });
  response.results = response.results.map((item: any) => {
    if (item.media_type === 'movie') {
      return normalizeMovie(item);
    } else if (item.media_type === 'tv') {
      return normalizeTVShow(item);
    } else if (item.media_type === 'person') {
      return { ...item, media_type: 'person' };
    }
    return item;
  });
  return response;
};

// TV SHOW DETAILS
export const getTVShowDetails = (apiKey: string, tvId: number): Promise<{
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  status: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  created_by: Array<{ id: number; name: string; profile_path: string | null }>;
  networks: Array<{ id: number; name: string; logo_path: string | null }>;
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ english_name: string; iso_639_1: string; name: string }>;
  media_type: 'tv';
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }>;
  };
}> => {
  return apiFetch(apiKey, `/tv/${tvId}`);
};

// MOVIE RELEASE DATES
export const getMovieReleaseDates = (apiKey: string, movieId: number): Promise<{
  id: number;
  results: Array<{
    iso_3166_1: string;
    release_dates: Array<{
      certification: string;
      descriptors: string[];
      iso_639_1: string;
      note: string;
      release_date: string;
      type: number;
    }>;
  }>;
}> => {
  return apiFetch(apiKey, `/movie/${movieId}/release_dates`);
};
