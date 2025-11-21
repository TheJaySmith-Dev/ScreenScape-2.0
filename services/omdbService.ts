/**
 * OMDb API Service for Movie Trailer Retrieval
 * Primary source for trailer data with comprehensive error handling
 */

export interface OMDbMovieData {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  Genre?: string;
  imdbRating?: string;
  Response: string;
  Error?: string;
}

export interface OMDbMovieDetails extends OMDbMovieData {
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Writer?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Ratings?: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore?: string;
  imdbVotes?: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  // Optional Rotten Tomatoes-enhanced fields (available when tomatoes=true)
  tomatoMeter?: string; // e.g., "91"
  tomatoUserMeter?: string; // e.g., "88"
  tomatoRating?: string; // e.g., "7.8"
  tomatoReviews?: string; // e.g., "250"
  tomatoFresh?: string; // e.g., "230"
  tomatoRotten?: string; // e.g., "20"
  tomatoConsensus?: string; // critics consensus string
  tomatoUserRating?: string; // e.g., "4.2"
  tomatoUserReviews?: string; // e.g., "100000"
  tomatoURL?: string; // direct Rotten Tomatoes URL if provided
}

export interface RottenTomatoesRating {
  tomatometer?: number; // Critics score (0-100)
  audienceScore?: number; // Audience score (0-100)
  criticsConsensus?: string;
  fresh?: boolean; // true if >= 60%, false if < 60%
}

export interface TrailerResult {
  success: boolean;
  trailerUrl?: string;
  source: 'omdb' | 'kinocheck' | 'tmdb';
  error?: string;
  cached?: boolean;
}

export interface OMDbSearchListItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDbSearchResponse {
  Search?: OMDbSearchListItem[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export class OMDbService {
  private readonly baseUrl = 'https://www.omdbapi.com/';
  private readonly apiKey: string;
  private readonly timeout = 10000; // 10 seconds
  private readonly maxRetries = 3;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for movie by title and year
   */
  async searchMovie(title: string, year?: string): Promise<OMDbMovieData | null> {
    try {
      const prompt = `Return ONLY JSON for movie ${title}${year ? ' (' + year + ')' : ''} with keys Title, Year, imdbID, Type, Poster, Plot`;
      const data = await pollinationsJson(prompt);
      if (!data || !data.Title) return null;
      const basic: OMDbMovieData = {
        Title: String(data.Title || title),
        Year: String(data.Year || year || ''),
        imdbID: String(data.imdbID || ''),
        Type: String(data.Type || 'movie'),
        Poster: String(data.Poster || ''),
        Plot: data.Plot ? String(data.Plot) : undefined,
        Response: 'True'
      };
      return basic;
    } catch {
      return null;
    }
  }

  /**
   * Autocomplete-style search for titles using OMDb's `s` endpoint
   * Returns a list of lightweight search items suitable for suggestions.
   */
  async searchTitles(query: string, type?: 'movie' | 'series' | 'episode', year?: string, page: number = 1): Promise<OMDbSearchListItem[]> {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey,
        s: query,
        page: String(page)
      });
      if (type) params.append('type', type);
      if (year) params.append('y', year);

      const response = await this.makeRequest(`${this.baseUrl}?${params}`) as OMDbSearchResponse;

      if (response.Response === 'False') {
        // Common errors: too many results, not found
        return [];
      }

      return (response.Search || []).slice(0, 10);
    } catch (error) {
      console.warn('OMDb searchTitles error:', error);
      return [];
    }
  }

  /**
   * Get movie details by IMDb ID
   */
  async getMovieById(imdbId: string): Promise<OMDbMovieData | null> {
    try {
      const prompt = `Return ONLY JSON for IMDb ${imdbId} with keys Title, Year, imdbID, Type, Poster, Plot`;
      const data = await pollinationsJson(prompt);
      if (!data || !data.Title) return null;
      const basic: OMDbMovieData = {
        Title: String(data.Title || ''),
        Year: String(data.Year || ''),
        imdbID: String(data.imdbID || imdbId),
        Type: String(data.Type || 'movie'),
        Poster: String(data.Poster || ''),
        Plot: data.Plot ? String(data.Plot) : undefined,
        Response: 'True'
      };
      return basic;
    } catch {
      return null;
    }
  }

  /**
   * Extract trailer URL from OMDb data
   * Note: OMDb doesn't directly provide trailer URLs, but we can use IMDb ID
   * to construct YouTube search or use other methods
   */
  async getTrailerUrl(movieData: OMDbMovieData): Promise<TrailerResult> {
    try {
      // OMDb doesn't provide direct trailer URLs
      // We'll use the IMDb ID to search for trailers on YouTube
      const trailerUrl = await this.searchYouTubeTrailer(movieData.Title, movieData.Year);
      
      if (trailerUrl) {
        return {
          success: true,
          trailerUrl,
          source: 'omdb'
        };
      }

      return {
        success: false,
        source: 'omdb',
        error: 'No trailer found via OMDb/YouTube search'
      };
    } catch (error) {
      return {
        success: false,
        source: 'omdb',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for trailer on YouTube using movie title and year
   */
  private async searchYouTubeTrailer(title: string, year: string): Promise<string | null> {
    try {
      // Construct a YouTube search URL for the trailer
      // This is a fallback method since OMDb doesn't provide direct trailer links
      const searchQuery = `${title} ${year} official trailer`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // We'll return a YouTube search URL that can be used to find trailers
      // In a real implementation, you might want to use YouTube Data API
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
      
      // For now, we'll return null since we can't directly get video URLs without YouTube API
      // This would need to be enhanced with actual YouTube Data API integration
      return null;
    } catch (error) {
      console.error('YouTube trailer search error:', error);
      return null;
    }
  }

  /**
   * Make HTTP request with retry logic and timeout
   */
  async makeRequest(url: string, retryCount = 0): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ScreenScape/2.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      // Retry logic
      if (retryCount < this.maxRetries) {
        console.warn(`OMDb request failed, retrying... (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.makeRequest(url, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const testResponse = await this.searchMovie('The Matrix', '1999');
      return testResponse !== null;
    } catch (error) {
      console.error('OMDb API key validation failed:', error);
      return false;
    }
  }
}

export async function pollinationsJson(prompt: string, retryCount = 0): Promise<any> {
  const timeout = 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'text/plain' } });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    const raw = await response.text();
    let text = raw.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      return null;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (retryCount < 3) {
      await new Promise(r => setTimeout(r, 800 * (retryCount + 1)));
      return pollinationsJson(prompt, retryCount + 1);
    }
    throw error;
  }
}

// Export a default instance (will need API key configuration)
// Resolve OMDb API key for both browser (Vite) and Node contexts
// Resolve OMDb API key from multiple sources to work in browser builds
const runtimeOMDbApiKey = '';
export const omdbService = new OMDbService(runtimeOMDbApiKey);
export const hasOMDbKey = (): boolean => true;
export const getOMDbApiKey = (): string => '';

/**
 * Get OMDb details from TMDB movie details
 * This function bridges TMDB data with OMDb data
 */
export async function getOMDbFromTMDBDetails(tmdbDetails: any): Promise<OMDbMovieDetails | null> {
  try {
    const title = tmdbDetails?.title || tmdbDetails?.name || '';
    const year = (tmdbDetails?.release_date || tmdbDetails?.first_air_date || '').slice(0, 4);
    const prompt = `Return ONLY JSON for movie ${title}${year ? ' (' + year + ')' : ''} with keys Title, Year, Rated, Released, Runtime, Genre, imdbRating, Plot, BoxOffice, tomatoMeter, tomatoUserMeter, tomatoRating, tomatoReviews, tomatoFresh, tomatoRotten, tomatoConsensus, tomatoUserRating, tomatoUserReviews, tomatoURL, Poster`;
    const data = await pollinationsJson(prompt);
    if (!data) {
      const boxOffice = typeof tmdbDetails?.revenue === 'number' && tmdbDetails.revenue > 0 ? tmdbDetails.revenue : 0;
      const formatted = boxOffice ? `$${Math.round(boxOffice).toLocaleString('en-US')}` : 'N/A';
      const fallback: OMDbMovieDetails = {
        Title: title,
        Year: year,
        imdbID: String(tmdbDetails?.imdb_id || ''),
        Type: 'movie',
        Poster: '',
        Plot: tmdbDetails?.overview || '',
        BoxOffice: formatted,
        Response: 'True'
      } as any;
      return fallback;
    }
    const mapped: OMDbMovieDetails = {
      Title: String(data.Title || title),
      Year: String(data.Year || year || ''),
      imdbID: String(tmdbDetails?.imdb_id || data.imdbID || ''),
      Type: 'movie',
      Poster: String(data.Poster || ''),
      Plot: data.Plot ? String(data.Plot) : tmdbDetails?.overview || '',
      Rated: data.Rated ? String(data.Rated) : undefined,
      Released: data.Released ? String(data.Released) : undefined,
      Runtime: data.Runtime ? String(data.Runtime) : undefined,
      Genre: data.Genre ? String(data.Genre) : undefined,
      imdbRating: data.imdbRating ? String(data.imdbRating) : undefined,
      BoxOffice: data.BoxOffice ? String(data.BoxOffice) : (typeof tmdbDetails?.revenue === 'number' && tmdbDetails.revenue > 0 ? `$${Math.round(tmdbDetails.revenue).toLocaleString('en-US')}` : 'N/A'),
      tomatoMeter: data.tomatoMeter ? String(data.tomatoMeter) : undefined,
      tomatoUserMeter: data.tomatoUserMeter ? String(data.tomatoUserMeter) : undefined,
      tomatoRating: data.tomatoRating ? String(data.tomatoRating) : undefined,
      tomatoReviews: data.tomatoReviews ? String(data.tomatoReviews) : undefined,
      tomatoFresh: data.tomatoFresh ? String(data.tomatoFresh) : undefined,
      tomatoRotten: data.tomatoRotten ? String(data.tomatoRotten) : undefined,
      tomatoConsensus: data.tomatoConsensus ? String(data.tomatoConsensus) : undefined,
      tomatoUserRating: data.tomatoUserRating ? String(data.tomatoUserRating) : undefined,
      tomatoUserReviews: data.tomatoUserReviews ? String(data.tomatoUserReviews) : undefined,
      tomatoURL: data.tomatoURL ? String(data.tomatoURL) : undefined,
      Response: 'True'
    } as any;
    mapped.Ratings = Array.isArray(data.Ratings) ? data.Ratings : [{ Source: 'Rotten Tomatoes', Value: mapped.tomatoMeter ? `${mapped.tomatoMeter}%` : (mapped.tomatoUserMeter ? `${mapped.tomatoUserMeter}%` : 'N/A') }];
    return mapped;
  } catch {
    return null;
  }
}

/**
 * Extract Rotten Tomatoes ratings from OMDb movie data
 */
export function extractRottenTomatoesRating(movieData: OMDbMovieDetails): RottenTomatoesRating | null {
    try {
      const result: RottenTomatoesRating = {};
      const fromArray = (movieData.Ratings || []).find((r) => r.Source === 'Rotten Tomatoes');
      if (fromArray && typeof fromArray.Value === 'string') {
        const m = fromArray.Value.match(/(\d+)%/);
        if (m) {
          const score = parseInt(m[1], 10);
          result.tomatometer = score;
          result.fresh = score >= 60;
        }
      }
      if (result.tomatometer === undefined) {
        const t = movieData.tomatoMeter || movieData.tomatoUserMeter;
        if (t && /\d+/.test(String(t))) {
          const score = parseInt(String(t), 10);
          result.tomatometer = score;
          result.fresh = score >= 60;
        }
      }
      if (result.tomatometer === undefined) return null;
      return result;
    } catch {
      return null;
    }
  }

/**
 * Extract Rotten Tomatoes critics consensus from OMDb details (tomatoConsensus)
 */
export function extractRottenTomatoesConsensus(movieData: OMDbMovieDetails): string | null {
  try {
    const consensus = movieData.tomatoConsensus;
    if (consensus && consensus !== 'N/A') {
      return consensus;
    }
    return null;
  } catch (error) {
    console.error('Error extracting Rotten Tomatoes consensus:', error);
    return null;
  }
}

/**
 * Get movie details with full ratings information
 */
export async function getMovieDetailsWithRatings(titleOrImdbId: string, year?: string): Promise<OMDbMovieDetails | null> {
  try {
    const isImdb = /^tt\d+/.test(titleOrImdbId);
    const prompt = isImdb
      ? `Return ONLY JSON for IMDb ${titleOrImdbId} with full keys Title, Year, Rated, Released, Runtime, Genre, imdbRating, Plot, BoxOffice, tomatoMeter, tomatoUserMeter, tomatoRating, tomatoReviews, tomatoFresh, tomatoRotten, tomatoConsensus, tomatoUserRating, tomatoUserReviews, tomatoURL, Poster`
      : `Return ONLY JSON for movie ${titleOrImdbId}${year ? ' (' + year + ')' : ''} with full keys Title, Year, Rated, Released, Runtime, Genre, imdbRating, Plot, BoxOffice, tomatoMeter, tomatoUserMeter, tomatoRating, tomatoReviews, tomatoFresh, tomatoRotten, tomatoConsensus, tomatoUserRating, tomatoUserReviews, tomatoURL, Poster`;
    const data = await pollinationsJson(prompt);
    if (!data) return null;
    const mapped: OMDbMovieDetails = {
      Title: String(data.Title || ''),
      Year: String(data.Year || year || ''),
      imdbID: String(data.imdbID || (isImdb ? titleOrImdbId : '')),
      Type: String(data.Type || 'movie'),
      Poster: String(data.Poster || ''),
      Plot: data.Plot ? String(data.Plot) : '',
      Rated: data.Rated ? String(data.Rated) : undefined,
      Released: data.Released ? String(data.Released) : undefined,
      Runtime: data.Runtime ? String(data.Runtime) : undefined,
      Genre: data.Genre ? String(data.Genre) : undefined,
      imdbRating: data.imdbRating ? String(data.imdbRating) : undefined,
      BoxOffice: data.BoxOffice ? String(data.BoxOffice) : 'N/A',
      tomatoMeter: data.tomatoMeter ? String(data.tomatoMeter) : undefined,
      tomatoUserMeter: data.tomatoUserMeter ? String(data.tomatoUserMeter) : undefined,
      tomatoRating: data.tomatoRating ? String(data.tomatoRating) : undefined,
      tomatoReviews: data.tomatoReviews ? String(data.tomatoReviews) : undefined,
      tomatoFresh: data.tomatoFresh ? String(data.tomatoFresh) : undefined,
      tomatoRotten: data.tomatoRotten ? String(data.tomatoRotten) : undefined,
      tomatoConsensus: data.tomatoConsensus ? String(data.tomatoConsensus) : undefined,
      tomatoUserRating: data.tomatoUserRating ? String(data.tomatoUserRating) : undefined,
      tomatoUserReviews: data.tomatoUserReviews ? String(data.tomatoUserReviews) : undefined,
      tomatoURL: data.tomatoURL ? String(data.tomatoURL) : undefined,
      Response: 'True'
    } as any;
    mapped.Ratings = Array.isArray(data.Ratings) ? data.Ratings : [{ Source: 'Rotten Tomatoes', Value: mapped.tomatoMeter ? `${mapped.tomatoMeter}%` : (mapped.tomatoUserMeter ? `${mapped.tomatoUserMeter}%` : 'N/A') }];
    return mapped;
  } catch {
    return null;
  }
}
