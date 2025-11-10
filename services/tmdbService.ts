import { PaginatedResponse, Movie, TVShow, Video, WatchProviderResponse, MediaItem, MovieDetails, PersonMovieCredit, Person, CastMember, CrewMember, WatchProviderCountry, WatchProvider } from '../types';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const apiFetch = async <T>(
  apiKey: string, 
  endpoint: string, 
  params: Record<string, string | number | boolean> = {},
  retries: number = 2
): Promise<T> => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', apiKey);
  for (const key in params) {
    url.searchParams.append(key, String(params[key]));
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API Key");
        }
        if (response.status === 429 && attempt < retries) {
          // Rate limited - wait and retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (attempt < retries) {
          // Network error - wait and retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(`Network error: Unable to reach TMDb API after ${retries + 1} attempts`);
      }
      
      // Re-throw other errors immediately
      throw error;
    }
  }
  
  throw new Error(`Failed to fetch after ${retries + 1} attempts`);
};

// STREAMING AVAILABILITY FUNCTIONS (Only kept functions)
const DISNEY_PLUS_ID = 337;

const mergeUniqueByProviderId = (base: WatchProvider[] = [], adds: WatchProvider[] = []): WatchProvider[] => {
  const ids = new Set(base.map(p => p.provider_id));
  const merged = base.slice();
  for (const p of adds) {
    if (!ids.has(p.provider_id)) merged.push(p);
  }
  return merged;
};

const applyRegionOverridesToProviders = (resp: WatchProviderResponse, region: string): WatchProviderResponse => {
  try {
    if (region === 'ZA' && resp?.results) {
      const gb = resp.results['GB'];
      if (!gb) return resp;
      const za = resp.results['ZA'] || { link: gb.link, flatrate: [], rent: [], buy: [] } as WatchProviderCountry;

      const disneyFlatGB = (gb.flatrate || []).filter(p => p.provider_id === DISNEY_PLUS_ID);
      const disneyRentGB = (gb.rent || []).filter(p => p.provider_id === DISNEY_PLUS_ID);
      const disneyBuyGB = (gb.buy || []).filter(p => p.provider_id === DISNEY_PLUS_ID);

      resp.results['ZA'] = {
        ...za,
        flatrate: mergeUniqueByProviderId(za.flatrate || [], disneyFlatGB),
        rent: mergeUniqueByProviderId(za.rent || [], disneyRentGB),
        buy: mergeUniqueByProviderId(za.buy || [], disneyBuyGB),
        link: za.link || gb.link,
      };
    }
  } catch (_) {
    // ignore mapping errors
  }
  return resp;
};

export const getMovieWatchProviders = async (apiKey: string, movieId: number, region: string): Promise<WatchProviderResponse> => {
  const resp = await apiFetch<WatchProviderResponse>(apiKey, `/movie/${movieId}/watch/providers`);
  return applyRegionOverridesToProviders(resp, region);
};

export const getTVShowWatchProviders = async (apiKey: string, tvId: number, region: string): Promise<WatchProviderResponse> => {
  const resp = await apiFetch<WatchProviderResponse>(apiKey, `/tv/${tvId}/watch/providers`);
  return applyRegionOverridesToProviders(resp, region);
};

// VIDEO/TRAILER FUNCTIONS (kept for fallback)
export const getMovieVideos = (apiKey: string, movieId: number): Promise<{results: Video[]}> => {
  return apiFetch(apiKey, `/movie/${movieId}/videos`);
};

export const getTVShowVideos = (apiKey: string, tvId: number): Promise<{results: Video[]}> => {
  return apiFetch(apiKey, `/tv/${tvId}/videos`);
};

// IMAX-only video helpers and cache
type ImaxCacheEntry = { results: Video[]; ts: number };
const IMAX_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const imaxMemoryCache = new Map<string, ImaxCacheEntry>();

const IMAX_CACHE_STORAGE_KEY = 'imaxVideoCacheV3';

const readImaxLocalCache = (): Record<string, ImaxCacheEntry> => {
  try {
    const raw = localStorage.getItem(IMAX_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch (_) {
    return {};
  }
};

const writeImaxLocalCache = (cacheObj: Record<string, ImaxCacheEntry>) => {
  try {
    localStorage.setItem(IMAX_CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
  } catch (_) {
    // ignore quota or serialization errors
  }
};

export const filterImaxVideos = (videos: Video[] = []): Video[] => {
  const toLower = (s?: string) => (s || '').toLowerCase();

  // Broaden IMAX detection to capture common marketing phrases
  const isImaxNamed = (name?: string) => {
    const n = toLower(name);
    if (!n) return false;
    const markers = [
      'imax',
      'imax®',
      'exclusive look',
      'extended look',
      'sneak peek',
      'special look',
      'experience it in imax',
      'in imax',
      'expanded aspect ratio',
      'imax expanded',
      'imax exclusive'
    ];
    return markers.some(m => n.includes(m));
  };

  // Accept YouTube videos explicitly mentioning IMAX or common IMAX phrasing.
  // Prefer Trailer, but allow Teaser/Clip/Featurette to reduce false negatives.
  const primary = videos.filter(v =>
    v.site === 'YouTube' &&
    isImaxNamed(v.name) &&
    (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip' || v.type === 'Featurette')
  );

  // Conservative fallback: Trailer that hints at IMAX expanded ratio even if not caught above.
  const fallbackExpanded = primary.length > 0 ? [] : videos.filter(v =>
    v.site === 'YouTube' &&
    v.type === 'Trailer' &&
    toLower(v.name).includes('expanded') && (toLower(v.name).includes('ratio') || toLower(v.name).includes('imax'))
  );

  const pickFrom = primary.length > 0 ? primary : fallbackExpanded;

  // Sort to prefer official first, then titles with "official", then higher resolution
  const sorted = pickFrom.slice().sort((a, b) => {
    const aOfficial = a.official ? 1 : 0;
    const bOfficial = b.official ? 1 : 0;
    if (aOfficial !== bOfficial) return bOfficial - aOfficial;
    const aNameOfficial = toLower(a.name).includes('official') ? 1 : 0;
    const bNameOfficial = toLower(b.name).includes('official') ? 1 : 0;
    if (aNameOfficial !== bNameOfficial) return bNameOfficial - aNameOfficial;
    return (b.size || 0) - (a.size || 0);
  });

  return sorted;
};

export const getMovieVideosImaxOnly = async (apiKey: string, movieId: number): Promise<{ results: Video[] }> => {
  const key = `imax:v2:movie:${movieId}`;
  // Check memory cache first
  const memHit = imaxMemoryCache.get(key);
  const now = Date.now();
  if (memHit && (now - memHit.ts) < IMAX_CACHE_TTL_MS) {
    return { results: filterImaxVideos(memHit.results) };
  }
  // Check localStorage cache
  const localCache = readImaxLocalCache();
  const localHit = localCache[key];
  if (localHit && (now - localHit.ts) < IMAX_CACHE_TTL_MS) {
    imaxMemoryCache.set(key, localHit);
    return { results: filterImaxVideos(localHit.results) };
  }
  // Fetch and filter
  const resp = await getMovieVideos(apiKey, movieId);
  const filtered = filterImaxVideos(resp.results);
  // Cache RAW TMDb results to allow future heuristics to re-evaluate
  const entry: ImaxCacheEntry = { results: resp.results, ts: now };
  imaxMemoryCache.set(key, entry);
  localCache[key] = entry;
  writeImaxLocalCache(localCache);
  return { results: filtered };
};

export const getTVShowVideosImaxOnly = async (apiKey: string, tvId: number): Promise<{ results: Video[] }> => {
  const key = `imax:v2:tv:${tvId}`;
  // Check memory cache first
  const memHit = imaxMemoryCache.get(key);
  const now = Date.now();
  if (memHit && (now - memHit.ts) < IMAX_CACHE_TTL_MS) {
    return { results: filterImaxVideos(memHit.results) };
  }
  // Check localStorage cache
  const localCache = readImaxLocalCache();
  const localHit = localCache[key];
  if (localHit && (now - localHit.ts) < IMAX_CACHE_TTL_MS) {
    imaxMemoryCache.set(key, localHit);
    return { results: filterImaxVideos(localHit.results) };
  }
  // Fetch and filter
  const resp = await getTVShowVideos(apiKey, tvId);
  const filtered = filterImaxVideos(resp.results);
  // Cache RAW TMDb results to allow future heuristics to re-evaluate
  const entry: ImaxCacheEntry = { results: resp.results, ts: now };
  imaxMemoryCache.set(key, entry);
  localCache[key] = entry;
  writeImaxLocalCache(localCache);
  return { results: filtered };
};

// EXTERNAL IDS (bridge to OMDb and FanArt)
export const getMovieExternalIds = (apiKey: string, movieId: number): Promise<{
  id: number;
  imdb_id: string | null;
}> => {
  return apiFetch(apiKey, `/movie/${movieId}/external_ids`);
};

export const getTVExternalIds = (apiKey: string, tvId: number): Promise<{
  id: number;
  imdb_id: string | null;
  tvdb_id: number | null;
}> => {
  return apiFetch(apiKey, `/tv/${tvId}/external_ids`);
};

// RECOMMENDATIONS
export const getMovieRecommendations = async (apiKey: string, movieId: number): Promise<PaginatedResponse<Movie>> => {
    const response = await apiFetch<PaginatedResponse<Movie>>(apiKey, `/movie/${movieId}/recommendations`);
    response.results = response.results.map(movie => ({ ...movie, media_type: 'movie' }));
    return response;
};

// TV SHOW RECOMMENDATIONS
export const getTVShowRecommendations = async (apiKey: string, tvId: number): Promise<PaginatedResponse<TVShow>> => {
    const response = await apiFetch<PaginatedResponse<TVShow>>(apiKey, `/tv/${tvId}/recommendations`);
    response.results = response.results.map(tv => ({ ...tv, media_type: 'tv' }));
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

// POPULAR TV SHOWS
export const getPopularTVShows = (apiKey: string, page: number = 1): Promise<PaginatedResponse<TVShow>> => {
  return apiFetch(apiKey, '/tv/popular', { page });
};

// TOP RATED MOVIES
export const getTopRatedMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return apiFetch(apiKey, '/movie/top_rated', { page });
};

// TOP RATED TV SHOWS
export const getTopRatedTVShows = (apiKey: string, page: number = 1): Promise<PaginatedResponse<TVShow>> => {
  return apiFetch(apiKey, '/tv/top_rated', { page });
};

// UPCOMING MOVIES
export const getUpcomingMovies = (apiKey: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return apiFetch(apiKey, '/movie/upcoming', { page });
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
  // Restrict to English-labeled images to ensure posters are in English
  return apiFetch(apiKey, `/movie/${movieId}/images`, { include_image_language: 'en' });
};

// TV SHOW IMAGES
export const getTVShowImages = (apiKey: string, tvId: number): Promise<{
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
  // Restrict to English-labeled images to ensure posters are in English
  return apiFetch(apiKey, `/tv/${tvId}/images`, { include_image_language: 'en' });
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

// TV SHOW CREDITS
export const getTVShowCredits = (apiKey: string, tvId: number): Promise<{
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}> => {
  return apiFetch(apiKey, `/tv/${tvId}/credits`);
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

// PERSON TV CREDITS
export const getPersonTVCredits = (apiKey: string, personId: number): Promise<{
  id: number;
  cast: (TVShow & { character: string })[];
  crew: (TVShow & { job: string })[];
}> => {
  return apiFetch(apiKey, `/person/${personId}/tv_credits`);
};

// PERSON COMBINED CREDITS (cast and crew across movies and TV)
export const getPersonCombinedCredits = (apiKey: string, personId: number): Promise<{
  id: number;
  cast: Array<(
    (Movie & { media_type: 'movie' }) |
    (TVShow & { media_type: 'tv' })
  ) & { character?: string }>
  crew: Array<(
    (Movie & { media_type: 'movie' }) |
    (TVShow & { media_type: 'tv' })
  ) & { job?: string }>
}> => {
  return apiFetch(apiKey, `/person/${personId}/combined_credits`);
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

// MOVIE SEARCH (explicit)
export const searchMovies = async (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<MediaItem>> => {
  const response = await apiFetch<PaginatedResponse<any>>(apiKey, '/search/movie', { query, page });
  response.results = (response.results || []).map((m: any) => normalizeMovie(m));
  return response as PaginatedResponse<MediaItem>;
};

// TV SHOW SEARCH (explicit)
export const searchTVShows = async (apiKey: string, query: string, page: number = 1): Promise<PaginatedResponse<MediaItem>> => {
  const response = await apiFetch<PaginatedResponse<any>>(apiKey, '/search/tv', { query, page });
  response.results = (response.results || []).map((t: any) => normalizeTVShow(t));
  return response as PaginatedResponse<MediaItem>;
};

// KEYWORD SEARCH (for suggestions)
export const searchKeywords = async (
  apiKey: string,
  query: string,
  page: number = 1
): Promise<PaginatedResponse<{ id: number; name: string }>> => {
  return apiFetch(apiKey, '/search/keyword', { query, page });
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

// TV SEASON DETAILS
export const getTVSeasonDetails = (apiKey: string, tvId: number, seasonNumber: number): Promise<{
  _id: string;
  id: number;
  air_date: string | null;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episodes: Array<{
    air_date: string | null;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    runtime?: number | null;
    still_path?: string | null;
    vote_average: number;
    vote_count: number;
  }>;
}> => {
  return apiFetch(apiKey, `/tv/${tvId}/season/${seasonNumber}`);
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
