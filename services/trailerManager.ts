/**
 * Trailer Manager Service
 * Orchestrates trailer retrieval from multiple sources with fallback logic and caching
 */

import { OMDbService } from './omdbService';
import type { TrailerResult } from './omdbService';
import { KinoCheckService } from './kinocheckService';
import { MediaItem } from '../types';

export interface TrailerCacheEntry {
  trailerUrl: string;
  source: 'omdb' | 'kinocheck' | 'tmdb';
  timestamp: number;
  expiresAt: number;
  movieId: string;
  title: string;
}

export interface TrailerManagerConfig {
  omdbApiKey?: string;
  kinocheckApiKey?: string;
  cacheSize?: number;
  cacheTTL?: number; // Time to live in milliseconds
  enableLogging?: boolean;
}

export class TrailerManager {
  private omdbService?: OMDbService;
  private kinocheckService: KinoCheckService;
  private cache = new Map<string, TrailerCacheEntry>();
  private readonly maxCacheSize: number;
  private readonly cacheTTL: number;
  private readonly enableLogging: boolean;

  constructor(config: TrailerManagerConfig = {}) {
    // Initialize services
    if (config.omdbApiKey) {
      this.omdbService = new OMDbService(config.omdbApiKey);
    }
    
    this.kinocheckService = new KinoCheckService(
      config.kinocheckApiKey || 'kb5sl3pObYuzcNE9wH7y4g9SJ30NoVzBek5jnuG0L1BQXVwcTtgqtmZO6dInrZKd'
    );

    // Configuration
    this.maxCacheSize = config.cacheSize || 100;
    this.cacheTTL = config.cacheTTL || 24 * 60 * 60 * 1000; // 24 hours default
    this.enableLogging = config.enableLogging ?? true;
  }

  /**
   * Safely derive display title and year from a MediaItem
   */
  private getTitle(mediaItem: MediaItem): string {
    // Movies have `title`; TV shows have `name` (and may have optional `title`)
    const anyItem = mediaItem as any;
    return anyItem.title || anyItem.name || '';
  }

  private getYear(mediaItem: MediaItem): number | undefined {
    const anyItem = mediaItem as any;
    const dateStr: string | undefined = anyItem.release_date || anyItem.first_air_date;
    if (typeof dateStr === 'string' && dateStr.length >= 4) {
      const yr = parseInt(dateStr.slice(0, 4), 10);
      return Number.isFinite(yr) ? yr : undefined;
    }
    return undefined;
  }

  /**
   * Get trailer URL for a media item with fallback logic
   */
  async getTrailerUrl(mediaItem: MediaItem): Promise<TrailerResult> {
    const cacheKey = this.generateCacheKey(mediaItem);
    
    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.log(`Cache hit for ${mediaItem.title}`);
      return {
        success: true,
        trailerUrl: cachedResult.trailerUrl,
        source: cachedResult.source,
        cached: true
      };
    }

    const title = this.getTitle(mediaItem);
    const year = this.getYear(mediaItem);
    this.log(`Fetching trailer for: ${title}${year ? ` (${year})` : ''}`);

    // Try KinoCheck first
    try {
      const kinocheckResult = await this.tryKinoCheck(mediaItem);
      if (kinocheckResult.success && kinocheckResult.trailerUrl) {
        this.addToCache(cacheKey, kinocheckResult, mediaItem);
        return kinocheckResult;
      }
      this.log(`KinoCheck failed: ${kinocheckResult.error}`);
    } catch (error) {
      this.log(`KinoCheck error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Fallback to OMDb (if available)
    if (this.omdbService) {
      try {
        const omdbResult = await this.tryOMDb(mediaItem);
        if (omdbResult.success && omdbResult.trailerUrl) {
          this.addToCache(cacheKey, omdbResult, mediaItem);
          return omdbResult;
        }
        this.log(`OMDb failed: ${omdbResult.error}`);
      } catch (error) {
        this.log(`OMDb error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // All sources failed
    return {
      success: false,
      source: 'omdb',
      error: 'All trailer sources failed'
    };
  }

  /**
   * Try to get trailer from OMDb
   */
  private async tryOMDb(mediaItem: MediaItem): Promise<TrailerResult> {
    if (!this.omdbService) {
      return {
        success: false,
        source: 'omdb',
        error: 'OMDb service not configured'
      };
    }

    try {
      // Search by title and year derived from release/air date
      const title = this.getTitle(mediaItem);
      const year = this.getYear(mediaItem)?.toString();
      const movieData = await this.omdbService.searchMovie(title, year);
      
      if (!movieData) {
        return {
          success: false,
          source: 'omdb',
          error: 'Movie not found in OMDb'
        };
      }

      // Get trailer URL
      return await this.omdbService.getTrailerUrl(movieData);
    } catch (error) {
      return {
        success: false,
        source: 'omdb',
        error: error instanceof Error ? error.message : 'OMDb request failed'
      };
    }
  }

  /**
   * Try to get trailer from KinoCheck
   */
  private async tryKinoCheck(mediaItem: MediaItem): Promise<TrailerResult> {
    try {
      // Try by title and year derived from release/air date
      const title = this.getTitle(mediaItem);
      const year = this.getYear(mediaItem);
      return await this.kinocheckService.getTrailerByTitle(title, year);
    } catch (error) {
      return {
        success: false,
        source: 'kinocheck',
        error: error instanceof Error ? error.message : 'KinoCheck request failed'
      };
    }
  }

  /**
   * Generate cache key for media item
   */
  private generateCacheKey(mediaItem: MediaItem): string {
    const title = this.getTitle(mediaItem).toLowerCase().replace(/[^a-z0-9]/g, '');
    const year = this.getYear(mediaItem) ?? 'unknown';
    return `${title}_${year}`;
  }

  /**
   * Get trailer from cache
   */
  private getFromCache(key: string): TrailerCacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Add trailer to cache
   */
  private addToCache(key: string, result: TrailerResult, mediaItem: MediaItem): void {
    if (!result.trailerUrl) return;

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntry();
    }

    const entry: TrailerCacheEntry = {
      trailerUrl: result.trailerUrl,
      source: result.source,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheTTL,
      movieId: mediaItem.id.toString(),
      title: this.getTitle(mediaItem)
    };

    this.cache.set(key, entry);
    this.log(`Cached trailer for ${mediaItem.title}`);
  }

  /**
   * Evict oldest cache entry (LRU)
   */
  private evictOldestEntry(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log(`Evicted cache entry: ${oldestKey}`);
    }
  }

  /**
   * Clear expired cache entries
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      this.log(`Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; title: string; source: string; age: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      title: entry.title,
      source: entry.source,
      age: Date.now() - entry.timestamp
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries
    };
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }

  /**
   * Validate all configured services
   */
  async validateServices(): Promise<{
    omdb: boolean;
    kinocheck: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let omdbValid = false;
    let kinocheckValid = false;

    // Validate OMDb
    if (this.omdbService) {
      try {
        omdbValid = await this.omdbService.validateApiKey();
        if (!omdbValid) {
          errors.push('OMDb API key validation failed');
        }
      } catch (error) {
        errors.push(`OMDb validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      errors.push('OMDb service not configured');
    }

    // Validate KinoCheck
    try {
      kinocheckValid = await this.kinocheckService.validateApiKey();
      if (!kinocheckValid) {
        errors.push('KinoCheck API key validation failed');
      }
    } catch (error) {
      errors.push(`KinoCheck validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      omdb: omdbValid,
      kinocheck: kinocheckValid,
      errors
    };
  }

  /**
   * Preload trailers for a list of media items
   */
  async preloadTrailers(mediaItems: MediaItem[]): Promise<void> {
    this.log(`Preloading trailers for ${mediaItems.length} items`);
    
    const promises = mediaItems.map(async (item) => {
      try {
        await this.getTrailerUrl(item);
      } catch (error) {
        this.log(`Preload failed for ${item.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    await Promise.allSettled(promises);
    this.log('Trailer preloading completed');
  }

  /**
   * Logging utility
   */
  private log(message: string): void {
    if (this.enableLogging) {
      console.log(`[TrailerManager] ${message}`);
    }
  }
}

// Export default instance
export const trailerManager = new TrailerManager({
  omdbApiKey: 'c60b7091',
  kinocheckApiKey: 'kb5sl3pObYuzcNE9wH7y4g9SJ30NoVzBek5jnuG0L1BQXVwcTtgqtmZO6dInrZKd',
  cacheSize: 100,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  enableLogging: true
});