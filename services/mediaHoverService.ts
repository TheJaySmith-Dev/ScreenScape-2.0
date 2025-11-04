import { MediaItem } from '../types';
import { getMovieImages, getTVShowImages, getMovieVideos, getTVShowVideos } from './tmdbService';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';

export interface HoverMediaData {
  backdropUrl: string | null;
  trailerUrl: string | null;
  trailerKey: string | null;
}

interface CachedMediaData extends HoverMediaData {
  id: string;
  timestamp: number;
  expiresAt: number;
}

class LRUCache {
  private cache = new Map<string, CachedMediaData>();
  private maxSize = 50;
  private expirationTime = 24 * 60 * 60 * 1000; // 24 hours

  get(key: string): CachedMediaData | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  set(key: string, data: CachedMediaData): void {
    // Remove if already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Add new item
    this.cache.set(key, {
      ...data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.expirationTime
    });
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

class MediaHoverService {
  private cache = new LRUCache();
  private activeRequests = new Map<string, Promise<HoverMediaData>>();
  private preloadedImages = new Set<string>();

  constructor() {
    // Cleanup expired cache entries every 30 minutes
    setInterval(() => {
      this.cache.cleanup();
    }, 30 * 60 * 1000);
  }

  async getHoverMedia(item: MediaItem, apiKey: string): Promise<HoverMediaData> {
    const cacheKey = `${item.media_type}-${item.id}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        backdropUrl: cached.backdropUrl,
        trailerUrl: cached.trailerUrl,
        trailerKey: cached.trailerKey
      };
    }

    // Check if request is already in progress
    if (this.activeRequests.has(cacheKey)) {
      return this.activeRequests.get(cacheKey)!;
    }

    // Create new request
    const request = this.fetchHoverMedia(item, apiKey, cacheKey);
    this.activeRequests.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  private async fetchHoverMedia(item: MediaItem, apiKey: string, cacheKey: string): Promise<HoverMediaData> {
    try {
      // Fetch backdrop and trailer data in parallel
      const [backdropData, videoData] = await Promise.allSettled([
        this.fetchBackdrop(item, apiKey),
        this.fetchTrailer(item, apiKey)
      ]);

      const backdropUrl = backdropData.status === 'fulfilled' ? backdropData.value : null;
      const trailerData = videoData.status === 'fulfilled' ? videoData.value : { trailerUrl: null, trailerKey: null };

      const result: HoverMediaData = {
        backdropUrl,
        trailerUrl: trailerData.trailerUrl,
        trailerKey: trailerData.trailerKey
      };

      // Cache the result
      this.cache.set(cacheKey, {
        id: cacheKey,
        ...result,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      });

      return result;
    } catch (error) {
      console.warn('Failed to fetch hover media:', error);
      return {
        backdropUrl: null,
        trailerUrl: null,
        trailerKey: null
      };
    }
  }

  private async fetchBackdrop(item: MediaItem, apiKey: string): Promise<string | null> {
    try {
      const images = item.media_type === 'movie'
        ? await getMovieImages(apiKey, item.id)
        : await getTVShowImages(apiKey, item.id);

      if (images.backdrops && images.backdrops.length > 0) {
        // Get the highest rated backdrop
        const backdrop = images.backdrops
          .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))[0];
        
        return `${IMAGE_BASE_URL}${backdrop.file_path}`;
      }

      return null;
    } catch (error) {
      console.warn('Failed to fetch backdrop:', error);
      return null;
    }
  }

  private async fetchTrailer(item: MediaItem, apiKey: string): Promise<{ trailerUrl: string | null; trailerKey: string | null }> {
    try {
      // Fetch videos from TMDb and select the best YouTube trailer
      const videosResponse = item.media_type === 'movie'
        ? await getMovieVideos(apiKey, item.id)
        : await getTVShowVideos(apiKey, item.id);

      const videos = Array.isArray(videosResponse?.results) ? videosResponse.results : [];
      const pick = (predicate: (v: any) => boolean) => videos.find(predicate);
      const primary =
        pick((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
        pick((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
        pick((v: any) => v.site === 'YouTube' && v.type === 'Teaser') ||
        pick((v: any) => v.site === 'YouTube');

      if (primary && primary.key) {
        const trailerKey = primary.key as string;
        return {
          trailerUrl: `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`,
          trailerKey
        };
      }

      return { trailerUrl: null, trailerKey: null };
    } catch (error) {
      console.warn('Failed to fetch hover media:', error);
      return { trailerUrl: null, trailerKey: null };
    }
  }

  async preloadBackdrop(url: string): Promise<void> {
    if (this.preloadedImages.has(url)) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(url);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  cancelActiveRequests(): void {
    this.activeRequests.clear();
  }

  clearCache(): void {
    this.cache.clear();
    this.preloadedImages.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size(),
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// Export singleton instance
export const mediaHoverService = new MediaHoverService();
export default mediaHoverService;