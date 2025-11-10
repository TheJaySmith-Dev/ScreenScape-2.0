// MDBList API integration: lists and genres features
// Base URL resolver with dev proxy and production serverless fallback
function resolveBaseUrl(): string {
  // In browser: prefer dev proxy on localhost; otherwise serverless proxy
  if (typeof window !== 'undefined') {
    const host = window.location.host || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    return isLocal ? '/mdblist' : '/api/mdblist';
  }
  // Fallback for non-browser contexts
  return 'https://api.mdblist.com';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type FetchOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
};

export type MdbListApiError = {
  status: number;
  message: string;
};

// Generic API fetch with dual auth mechanisms and structured errors
async function mdbFetch<T>(
  path: string,
  apiKey: string,
  options: FetchOptions = {}
): Promise<T> {
  const base = resolveBaseUrl();
  // Build URL robustly so relative bases like '/mdblist' preserve the prefix
  let urlStr: string;
  if (base.startsWith('http')) {
    // Absolute base: standard resolve
    urlStr = new URL(path, base).toString();
  } else if (typeof window !== 'undefined') {
    // Relative base: join manually to avoid dropping the base path
    const origin = window.location.origin;
    const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
    const suffix = path.startsWith('/') ? path : `/${path}`;
    urlStr = new URL(`${prefix}${suffix}`, origin).toString();
  } else {
    // Non-browser fallback
    urlStr = new URL(path, 'https://api.mdblist.com').toString();
  }
  const url = new URL(urlStr);
  // Add apikey query to maximize compatibility
  url.searchParams.set('apikey', apiKey);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };
  // Also set an API key header variant commonly used
  headers['X-API-KEY'] = apiKey;

  let res: Response;
  try {
    res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    });
  } catch (networkErr) {
    // Fallback to direct API if proxy fails
    const direct = new URL(path, 'https://api.mdblist.com');
    direct.searchParams.set('apikey', apiKey);
    res = await fetch(direct.toString(), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  }

  // Rate-limit hint: capture headers when available
  const rlRemaining = res.headers.get('X-RateLimit-Remaining');
  const rlReset = res.headers.get('X-RateLimit-Reset');

  if (!res.ok) {
    let message = `MDBList error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    const err: MdbListApiError = { status: res.status, message };
    // Attach rate-limit info for callers
    (err as any).rateLimitRemaining = rlRemaining;
    (err as any).rateLimitReset = rlReset;
    throw err;
  }

  return res.json() as Promise<T>;
}

// Extract items from various possible response shapes
function extractItems(raw: any): MdbListItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as MdbListItem[];
  // Common shapes
  if (Array.isArray(raw.items)) return raw.items as MdbListItem[];
  if (raw.list && Array.isArray(raw.list.items)) return raw.list.items as MdbListItem[];
  // Some endpoints may split by media type
  const merged: MdbListItem[] = [];
  const maybeMerge = (arr: any) => { if (Array.isArray(arr)) merged.push(...arr); };
  maybeMerge(raw.shows);
  maybeMerge(raw.movies);
  if (merged.length) return merged;
  // Other common collection names
  if (Array.isArray(raw.results)) return raw.results as MdbListItem[];
  if (Array.isArray(raw.docs)) return raw.docs as MdbListItem[];
  // Nested under data
  const data = raw.data;
  if (data) {
    if (Array.isArray(data)) return data as MdbListItem[];
    if (Array.isArray(data?.items)) return data.items as MdbListItem[];
  }
  return [];
}

// Public JSON fallback for lists by username/listname when API endpoints are unavailable
async function fetchPublicListJson(username: string, listname: string): Promise<any> {
  // Prefer dev proxy to mdblist.com to avoid CORS; in production, route via serverless with site=public
  let base: string;
  if (typeof window !== 'undefined') {
    const host = window.location.host || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    base = isLocal ? '/mdblist_public' : '/api/mdblist';
  } else {
    base = 'https://mdblist.com';
  }

  // Build URL for public JSON without trailing slash to reduce redirects
  let urlStr: string;
  const subpath = `/lists/${encodeURIComponent(username)}/${encodeURIComponent(listname)}/json`;
  if (base.startsWith('http')) {
    urlStr = new URL(subpath, base).toString();
  } else if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
    urlStr = new URL(`${prefix}${subpath}`, origin).toString();
  } else {
    urlStr = new URL(subpath, 'https://mdblist.com').toString();
  }

  // If using serverless proxy, indicate public site routing
  const url = new URL(urlStr);
  if (base.includes('/api/mdblist')) url.searchParams.set('site', 'public');

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch public list JSON (${res.status})`);
  return res.json();
}

// Types
export type MdbListSummary = {
  // Internal canonical id for consistency across endpoints
  listid: string;
  // Original API fields
  id?: number; // numeric id as returned by search/top endpoints
  name: string;
  username?: string; // user_name
  slug?: string; // stable list slug
  mediatype?: 'movie' | 'show' | 'mixed';
  description?: string;
  likes?: number | null;
};

export type MdbListItem = {
  id?: number; // tmdb id
  imdb_id?: string;
  tmdb_id?: number;
  trakt_id?: number;
  title?: string;
  year?: number;
  media_type?: 'movie' | 'show';
  genres?: { name: string; slug?: string }[];
  poster?: string;
  rank?: number;
};

export type MdbGenre = {
  name: string;
  slug: string;
};

export type PaginationOpts = {
  limit?: number; // up to 1000
  offset?: number;
};

export type ListFilterOpts = PaginationOpts & {
  append_to_response?: string; // e.g., "genre,poster"
  filter_genre?: string | string[];
  genre_operator?: 'or' | 'and';
  mediatype?: 'movie' | 'show'; // for by-name typed endpoint
};

// Lists feature
export const mdbLists = {
  // My Limits
  async getMyLimits(apiKey: string): Promise<any> {
    return mdbFetch('/limits/my', apiKey);
  },

  // My Lists
  async getMyLists(apiKey: string): Promise<MdbListSummary[]> {
    try {
      const raw = await mdbFetch<any[]>('/lists/my', apiKey);
      // Normalize fields to our summary type for consistent UI behavior
      return (raw || []).map((r) => ({
        listid: String(r?.id ?? r?.listid ?? ''),
        id: r?.id,
        name: r?.name ?? '',
        username: r?.user_name ?? r?.username,
        slug: r?.slug,
        mediatype: r?.mediatype,
        description: r?.description,
        likes: r?.likes ?? null,
      })).filter((r: MdbListSummary) => r.listid !== '');
    } catch (e: any) {
      if (e?.status === 404) {
        // Treat "no lists" as empty result
        return [];
      }
      throw e;
    }
  },

  // User Lists by ID
  async getUserListsById(apiKey: string, userId: string | number): Promise<MdbListSummary[]> {
    return mdbFetch(`/lists/user/${userId}`, apiKey);
  },

  // User Lists by Name
  async getUserListsByName(apiKey: string, username: string): Promise<MdbListSummary[]> {
    return mdbFetch(`/lists/user/${encodeURIComponent(username)}`, apiKey);
  },

  // List by ID (GET)
  async getListById(apiKey: string, listId: string | number): Promise<MdbListSummary> {
    return mdbFetch(`/list/${listId}`, apiKey);
  },

  // List by ID (PUT - rename)
  async updateListNameById(apiKey: string, listId: string | number, newName: string): Promise<MdbListSummary> {
    return mdbFetch(`/list/${listId}`, apiKey, { method: 'PUT', body: { name: newName } });
  },

  // List by Name (GET)
  async getListByName(apiKey: string, username: string, listname: string): Promise<MdbListSummary | MdbListSummary[]> {
    return mdbFetch(`/lists/${encodeURIComponent(username)}/${encodeURIComponent(listname)}`, apiKey);
  },

  // List by Name (PUT - rename)
  async updateListNameByName(apiKey: string, username: string, listname: string, newName: string): Promise<MdbListSummary | MdbListSummary[]> {
    return mdbFetch(`/lists/${encodeURIComponent(username)}/${encodeURIComponent(listname)}`, apiKey, { method: 'PUT', body: { name: newName } });
  },

  // List Items by ID
  async getListItems(apiKey: string, listId: string | number, opts: ListFilterOpts = {}): Promise<MdbListItem[]> {
    const path = new URL(`/list/${listId}/items`, 'https://api.mdblist.com');
    if (opts.limit) path.searchParams.set('limit', String(opts.limit));
    if (opts.offset) path.searchParams.set('offset', String(opts.offset));
    if (opts.append_to_response) path.searchParams.set('append_to_response', opts.append_to_response);
    if (opts.filter_genre) {
      const val = Array.isArray(opts.filter_genre) ? opts.filter_genre.join(',') : opts.filter_genre;
      path.searchParams.set('filter_genre', val);
    }
    if (opts.genre_operator) path.searchParams.set('genre_operator', opts.genre_operator);
    // Delegate to mdbFetch via absolute path and normalize shape
    const raw = await mdbFetch<any>(path.pathname + path.search, apiKey);
    return extractItems(raw);
  },

  // List Items by Name (supports mediatype suffix)
  async getListItemsByName(apiKey: string, username: string, listname: string, opts: ListFilterOpts = {}): Promise<MdbListItem[]> {
    const base = `/lists/${encodeURIComponent(username)}/${encodeURIComponent(listname)}/items${opts.mediatype ? `/${opts.mediatype}` : ''}`;
    const path = new URL(base, 'https://api.mdblist.com');
    if (opts.limit) path.searchParams.set('limit', String(opts.limit));
    if (opts.offset) path.searchParams.set('offset', String(opts.offset));
    if (opts.append_to_response) path.searchParams.set('append_to_response', opts.append_to_response);
    if (opts.filter_genre) {
      const val = Array.isArray(opts.filter_genre) ? opts.filter_genre.join(',') : opts.filter_genre;
      path.searchParams.set('filter_genre', val);
    }
    if (opts.genre_operator) path.searchParams.set('genre_operator', opts.genre_operator);
    const raw = await mdbFetch<any>(path.pathname + path.search, apiKey);
    return extractItems(raw);
  },

  // List Changes (by ID)
  async getListChanges(apiKey: string, listId: string | number): Promise<{ trakt_ids: number[] }> {
    return mdbFetch(`/list/${listId}/changes`, apiKey);
  },

  // Public JSON fallback
  async getListItemsByNamePublic(username: string, listname: string): Promise<MdbListItem[]> {
    const json = await fetchPublicListJson(username, listname);
    return extractItems(json);
  },
};

// Genres feature
export const mdbGenres = {
  async getGenres(apiKey: string): Promise<MdbGenre[]> {
    return mdbFetch('/genres', apiKey);
  },
};

// Modify Static List feature (add/remove items)
export const mdbListEditor = {
  async addItems(apiKey: string, listId: string | number, items: { tmdb_id?: number; imdb_id?: string; media_type: 'movie' | 'show' }[]): Promise<{ success: boolean }>
  {
    return mdbFetch(`/list/${listId}/items`, apiKey, { method: 'POST', body: { items } });
  },
  async removeItems(apiKey: string, listId: string | number, items: { tmdb_id?: number; imdb_id?: string; media_type: 'movie' | 'show' }[]): Promise<{ success: boolean }>
  {
    return mdbFetch(`/list/${listId}/items`, apiKey, { method: 'DELETE', body: { items } });
  },
};

// Convenience: Top Lists and List Search
export const mdbDiscovery = {
  async getTopLists(apiKey: string, opts: PaginationOpts = {}): Promise<MdbListSummary[]> {
    const path = new URL('/lists/top', 'https://api.mdblist.com');
    if (opts.limit) path.searchParams.set('limit', String(opts.limit));
    if (opts.offset) path.searchParams.set('offset', String(opts.offset));
    const raw = await mdbFetch<any[]>(path.pathname + path.search, apiKey);
    // Normalize to MdbListSummary shape
    return (raw || []).map((r) => ({
      listid: String(r?.id ?? r?.listid ?? ''),
      id: r?.id,
      name: r?.name ?? '',
      username: r?.user_name ?? r?.username,
      slug: r?.slug,
      mediatype: r?.mediatype,
      description: r?.description,
      likes: r?.likes ?? null,
    })).filter((r: MdbListSummary) => r.listid !== '');
  },
  async searchLists(apiKey: string, query: string, opts: PaginationOpts = {}): Promise<MdbListSummary[]> {
    const path = new URL('/lists/search', 'https://api.mdblist.com');
    path.searchParams.set('query', query);
    if (opts.limit) path.searchParams.set('limit', String(opts.limit));
    if (opts.offset) path.searchParams.set('offset', String(opts.offset));
    const raw = await mdbFetch<any[]>(path.pathname + path.search, apiKey);
    // Normalize to MdbListSummary shape
    return (raw || []).map((r) => ({
      listid: String(r?.id ?? r?.listid ?? ''),
      id: r?.id,
      name: r?.name ?? '',
      username: r?.user_name ?? r?.username,
      slug: r?.slug,
      mediatype: r?.mediatype,
      description: r?.description,
      likes: r?.likes ?? null,
    })).filter((r: MdbListSummary) => r.listid !== '');
  },
};
