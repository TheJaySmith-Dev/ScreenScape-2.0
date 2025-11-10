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
      const params = new URLSearchParams({
        apikey: this.apiKey,
        t: title,
        type: 'movie',
        plot: 'short',
        tomatoes: 'true'
      });

      if (year) {
        params.append('y', year);
      }

      const response = await this.makeRequest(`${this.baseUrl}?${params}`);
      
      if (response.Response === 'False') {
        console.warn(`OMDb: Movie not found - ${response.Error}`);
        return null;
      }

      return response;
    } catch (error) {
      console.error('OMDb search error:', error);
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
      const params = new URLSearchParams({
        apikey: this.apiKey,
        i: imdbId,
        plot: 'short',
        tomatoes: 'true'
      });

      const response = await this.makeRequest(`${this.baseUrl}?${params}`);
      
      if (response.Response === 'False') {
        console.warn(`OMDb: Movie not found by ID - ${response.Error}`);
        return null;
      }

      return response;
    } catch (error) {
      console.error('OMDb getById error:', error);
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
  private async makeRequest(url: string, retryCount = 0): Promise<any> {
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
  private delay(ms: number): Promise<void> {
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

// Export a default instance (will need API key configuration)
// Resolve OMDb API key for both browser (Vite) and Node contexts
// Resolve OMDb API key from multiple sources to work in browser builds
const runtimeOMDbApiKey = (
  // Prefer environment variables for global consistency
  (typeof import.meta !== 'undefined' && (import.meta as any).env && ((import.meta as any).env.VITE_OMDB_API_KEY as string))
  // Fallback to LocalStorage for ad-hoc browser setups
  || (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('omdb_api_key'))
  // Fallback for Node or server-side contexts
  || (typeof process !== 'undefined' && process.env && process.env.OMDB_API_KEY)
  || ''
);

if (!runtimeOMDbApiKey) {
  console.warn('OMDb API key is not configured. Set VITE_OMDB_API_KEY or OMDB_API_KEY to enable review data.');
}

export const omdbService = new OMDbService(runtimeOMDbApiKey);

export const hasOMDbKey = (): boolean => !!runtimeOMDbApiKey && runtimeOMDbApiKey.trim().length > 0;
export const getOMDbApiKey = (): string => runtimeOMDbApiKey;

/**
 * Get OMDb details from TMDB movie details
 * This function bridges TMDB data with OMDb data
 */
export async function getOMDbFromTMDBDetails(tmdbDetails: any): Promise<OMDbMovieDetails | null> {
  try {
    if (!hasOMDbKey()) {
      console.warn('OMDb key missing: skipping OMDb fetch');
      return null;
    }
    // Extract IMDb ID from TMDB details
    const imdbId = tmdbDetails?.imdb_id;
    
    if (!imdbId) {
      console.warn('No IMDb ID found in TMDB details');
      return null;
    }

    // Use the OMDb service to get detailed information
    const omdbData = await omdbService.getMovieById(imdbId);
    
    if (!omdbData) {
      console.warn('No OMDb data found for IMDb ID:', imdbId);
      return null;
    }

    // Return the OMDb data as OMDbMovieDetails
    return omdbData as OMDbMovieDetails;
  } catch (error) {
    console.error('Error getting OMDb data from TMDB details:', error);
    return null;
  }
}

/**
 * Extract Rotten Tomatoes ratings from OMDb movie data
 */
export function extractRottenTomatoesRating(movieData: OMDbMovieDetails): RottenTomatoesRating | null {
    try {
      if (!movieData.Ratings || movieData.Ratings.length === 0) {
        return null;
      }

      const result: RottenTomatoesRating = {};

      // Find Rotten Tomatoes ratings in the ratings array
      for (const rating of movieData.Ratings) {
        if (rating.Source === 'Rotten Tomatoes') {
          // Parse the percentage value (e.g., "91%" -> 91)
          const percentageMatch = rating.Value.match(/(\d+)%/);
          if (percentageMatch) {
            const score = parseInt(percentageMatch[1], 10);
            result.tomatometer = score;
            result.fresh = score >= 60; // Fresh if 60% or higher
          }
        }
      }

      // Return null if no Rotten Tomatoes data found
      if (result.tomatometer === undefined) {
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error extracting Rotten Tomatoes rating:', error);
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
    let movieData: OMDbMovieData | null = null;

    // Check if it's an IMDb ID (starts with 'tt')
    if (titleOrImdbId.startsWith('tt')) {
      movieData = await omdbService.getMovieById(titleOrImdbId);
    } else {
      movieData = await omdbService.searchMovie(titleOrImdbId, year);
    }

    if (!movieData) {
      return null;
    }

    // Get full details with ratings by making another request with plot=full
  const params = new URLSearchParams({
    apikey: runtimeOMDbApiKey,
    i: movieData.imdbID,
    plot: 'full',
    tomatoes: 'true'
  });

    const response = await fetch(`https://www.omdbapi.com/?${params}`);
    const detailedResponse = await response.json();
    
    if (detailedResponse.Response === 'False') {
      console.warn(`OMDb: Detailed movie data not found - ${detailedResponse.Error}`);
      return movieData as OMDbMovieDetails;
    }

    return detailedResponse as OMDbMovieDetails;
  } catch (error) {
    console.error('OMDb getMovieDetailsWithRatings error:', error);
    return null;
  }
}
