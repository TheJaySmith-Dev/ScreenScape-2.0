// Offline cache utility using localStorage with TTL and simple seen tracking

type Json = any;

interface CacheRecord<T = Json> {
  value: T;
  expiresAt: number | null; // epoch ms
}

const PREFIX = 'ss2-cache:';
const SEEN_PREFIX = 'ss2-seen:';

function now(): number { return Date.now(); }

export function read<T = Json>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const rec: CacheRecord<T> = JSON.parse(raw);
    if (rec.expiresAt && rec.expiresAt < now()) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return rec.value ?? null;
  } catch {
    return null;
  }
}

export function write<T = Json>(key: string, value: T, ttlSeconds?: number): void {
  try {
    const rec: CacheRecord<T> = {
      value,
      expiresAt: ttlSeconds ? now() + ttlSeconds * 1000 : null,
    };
    localStorage.setItem(PREFIX + key, JSON.stringify(rec));
  } catch (err) {
    console.warn('offlineCache write failed:', err);
  }
}

export async function getOrFetch<T = Json>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T> {
  const cached = read<T>(key);
  if (cached !== null) return cached;
  const value = await fetcher();
  write<T>(key, value, ttlSeconds);
  return value;
}

// Track seen items to filter out already-viewed content
export function markSeen(itemId: string | number, mediaType: 'movie' | 'tv'): void {
  try {
    const key = `${SEEN_PREFIX}${mediaType}`;
    const raw = localStorage.getItem(key);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    set.add(String(itemId));
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('offlineCache markSeen failed:', err);
  }
}

export function getSeen(mediaType: 'movie' | 'tv'): Set<string> {
  try {
    const raw = localStorage.getItem(`${SEEN_PREFIX}${mediaType}`);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

// Convenience for list caching with seen filtering
export async function getListWithCache<T extends { id: number; media_type: 'movie' | 'tv' }>(
  listKey: string,
  fetcher: () => Promise<T[]>,
  ttlSeconds: number = 24 * 3600,
  excludeSeen: boolean = true,
): Promise<T[]> {
  const items = await getOrFetch<T[]>(listKey, fetcher, ttlSeconds);
  if (!excludeSeen) return items;
  const moviesSeen = getSeen('movie');
  const tvSeen = getSeen('tv');
  return items.filter(i => (i.media_type === 'movie' ? !moviesSeen.has(String(i.id)) : !tvSeen.has(String(i.id))));
}