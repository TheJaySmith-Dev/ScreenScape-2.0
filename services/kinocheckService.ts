/**
 * KinoCheck API Service for Movie Trailer Retrieval
 * Fallback source for trailer data with proper authentication
 */

export interface KinoCheckMovie {
  id: number;
  title: string;
  original_title: string;
  year: number;
  imdb_id?: string;
  tmdb_id?: number;
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  genres?: string[];
  rating?: number;
}

export interface KinoCheckTrailer {
  id: number;
  movie_id: number;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  duration?: number;
  quality?: string;
  language?: string;
  type: 'trailer' | 'teaser' | 'clip' | 'featurette';
  published_at?: string;
}

export interface KinoCheckSearchResponse {
  results: KinoCheckMovie[];
  total_results: number;
  total_pages: number;
  page: number;
}

export interface KinoCheckTrailerResponse {
  results: KinoCheckTrailer[];
  total_results: number;
}

export interface TrailerResult {
  success: boolean;
  trailerUrl?: string;
  source: 'omdb' | 'kinocheck' | 'tmdb';
  error?: string;
  cached?: boolean;
}

export class KinoCheckService {
  private readonly baseUrl = 'https://api.kinocheck.com';
  private readonly apiKey: string;
  private readonly timeout = 15000; // 15 seconds
  private readonly maxRetries = 3;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for movies by title
   */
  async searchMovies(query: string, year?: number): Promise<KinoCheckMovie[]> {
    const params = new URLSearchParams({
      query,
      ...(year && { year: year.toString() })
    });

    const response = await this.makeRequest(`/search/movies?${params}`);
    if (!response) {
      console.warn('KinoCheck search unavailable; returning empty results');
      return [];
    }
    return response.results || [];
  }

  /**
   * Get movie details by ID
   */
  async getMovie(movieId: number): Promise<KinoCheckMovie | null> {
    const response = await this.makeRequest(`/movies/${movieId}`);
    if (!response) {
      console.warn('KinoCheck getMovie unavailable; returning null');
      return null;
    }
    return response;
  }

  /**
   * Get trailers for a specific movie
   */
  async getMovieTrailers(movieId: number): Promise<KinoCheckTrailer[]> {
    const response = await this.makeRequest(`/movies/${movieId}/trailers`);
    if (!response) {
      console.warn('KinoCheck getTrailers unavailable; returning empty');
      return [];
    }
    return response.results || [];
  }

  /**
   * Search for movie and get its best trailer
   */
  async getTrailerByTitle(title: string, year?: number): Promise<TrailerResult> {
    // Step 1: Search for the movie
    const movies = await this.searchMovies(title, year);
    
    if (movies.length === 0) {
      return {
        success: false,
        source: 'kinocheck',
        error: 'Movie not found in KinoCheck database'
      };
    }

    // Step 2: Get the best matching movie (first result or exact year match)
    let bestMatch = movies[0];
    if (year) {
      const exactMatch = movies.find(movie => movie.year === year);
      if (exactMatch) {
        bestMatch = exactMatch;
      }
    }

    // Step 3: Get trailers for the movie
    const trailers = await this.getMovieTrailers(bestMatch.id);
    
    if (trailers.length === 0) {
      return {
        success: false,
        source: 'kinocheck',
        error: 'No trailers found for this movie'
      };
    }

    // Step 4: Select the best trailer (prefer official trailers over teasers)
    const bestTrailer = this.selectBestTrailer(trailers);
    
    return {
      success: true,
      trailerUrl: bestTrailer.url,
      source: 'kinocheck'
    };
  }

  /**
   * Get trailer by IMDb ID
   */
  async getTrailerByImdbId(imdbId: string): Promise<TrailerResult> {
    // Search by IMDb ID if the API supports it
    const response = await this.makeRequest(`/movies/imdb/${imdbId}`);
    
    if (!response || !response.id) {
      return {
        success: false,
        source: 'kinocheck',
        error: 'Movie not found by IMDb ID'
      };
    }

    const trailers = await this.getMovieTrailers(response.id);
    
    if (trailers.length === 0) {
      return {
        success: false,
        source: 'kinocheck',
        error: 'No trailers found for this movie'
      };
    }

    const bestTrailer = this.selectBestTrailer(trailers);
    
    return {
      success: true,
      trailerUrl: bestTrailer.url,
      source: 'kinocheck'
    };
  }

  /**
   * Select the best trailer from available options
   */
  private selectBestTrailer(trailers: KinoCheckTrailer[]): KinoCheckTrailer {
    // Priority order: trailer > teaser > clip > featurette
    const priorityOrder = ['trailer', 'teaser', 'clip', 'featurette'];
    
    for (const type of priorityOrder) {
      const trailer = trailers.find(t => t.type === type);
      if (trailer) {
        return trailer;
      }
    }
    
    // Fallback to first available trailer
    return trailers[0];
  }

  /**
   * Make HTTP request with proper authentication and error handling
   */
  private async makeRequest(endpoint: string, retryCount = 0): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'ScreenScape/2.0',
          'X-API-Key': this.apiKey // Alternative auth header if needed
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid KinoCheck API key');
        }
        if (response.status === 429) {
          throw new Error('KinoCheck API rate limit exceeded');
        }
        if (response.status === 404) {
          throw new Error('Resource not found');
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      // Retry logic for transient errors
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.warn(`KinoCheck request failed, retrying... (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(1000 * Math.pow(2, retryCount)); // Exponential backoff
        return this.makeRequest(endpoint, retryCount + 1);
      }

      // Final failure: return null instead of throwing to avoid noisy logs
      console.warn('KinoCheck request failed:', error);
      return null;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      // Don't retry authentication or client errors
      if (error.message.includes('401') || error.message.includes('Invalid API key')) {
        return false;
      }
      
      // Retry on network errors, timeouts, and server errors
      return error.message.includes('timeout') || 
             error.message.includes('500') || 
             error.message.includes('502') || 
             error.message.includes('503') || 
             error.message.includes('504');
    }
    
    return false;
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
    // Try a simple search to validate the API key
    const results = await this.searchMovies('The Matrix');
    return Array.isArray(results);
  }

  /**
   * Get API status and rate limit info
   */
  async getApiStatus(): Promise<{ status: string; rateLimit?: any }> {
    const response = await this.makeRequest('/status');
    if (!response) return { status: 'error' };
    return { status: 'active', rateLimit: response.rate_limit };
  }
}

// Export a default instance with the provided API key
export const kinocheckService = new KinoCheckService('kb5sl3pObYuzcNE9wH7y4g9SJ30NoVzBek5jnuG0L1BQXVwcTtgqtmZO6dInrZKd');