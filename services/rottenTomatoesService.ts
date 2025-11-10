// Lightweight Rotten Tomatoes fetcher utilities to get critic reviews.
// Uses r.jina.ai proxy to avoid CORS in browser during development.

export interface RtCriticReview {
  quote?: string;
  critic?: { name?: string } | null;
  publication?: { name?: string } | null;
  originalScore?: string | null;
  date?: string | null;
  url?: string | null;
}

export interface RtCriticReviewsResponse {
  reviews: RtCriticReview[];
  pageInfo?: {
    hasNextPage?: boolean;
    endCursor?: string | null;
    startCursor?: string | null;
  };
}

const RT_BASE = 'https://www.rottentomatoes.com';
const JINA_PROXY = 'https://r.jina.ai/http://';

// Fetch a URL through Jina proxy (http only), or direct if allowed.
async function proxyFetch(url: string): Promise<Response> {
  // Jina proxy requires http URLs; RottenTomatoes is https, so transform accordingly.
  const httpUrl = url.replace('https://', 'http://');
  const proxied = `${JINA_PROXY}${httpUrl.replace('http://', '')}`;
  return fetch(proxied, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (ScreenScape)'
    }
  });
}

// Normalize an incoming Rotten Tomatoes URL or slug to a path like "/m/forrest_gump".
function normalizeRtPath(input?: string | null): string | null {
  if (!input) return null;
  try {
    // If full URL (http/https), extract pathname
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const u = new URL(input);
      return u.pathname || null;
    }
  } catch (_) {
    // fall through
  }
  // If contains rottentomatoes.com without protocol, strip domain
  const domainIdx = input.indexOf('rottentomatoes.com');
  if (domainIdx !== -1) {
    const after = input.slice(domainIdx + 'rottentomatoes.com'.length);
    return after.startsWith('/') ? after : `/${after}`;
  }
  // Already a path
  if (input.startsWith('/')) return input;
  // Otherwise treat as slug
  return `/${input}`;
}

// Attempt to resolve the Rotten Tomatoes movie ID (emsId/movieId) from URL or search.
export async function resolveRtMovieId(params: {
  title: string;
  year?: number;
  tomatoURL?: string;
}): Promise<{ movieId: string | null; urlPath: string | null }> {
  // If we have a tomatoURL (e.g., /m/forrest_gump), try to extract movieId from the reviews page
  const candidatePath = normalizeRtPath(params.tomatoURL);
  const rtReviewsPath = candidatePath ? `${candidatePath}/reviews` : null;

  try {
    if (rtReviewsPath) {
      const res = await proxyFetch(`${RT_BASE}${rtReviewsPath}`);
      const text = await res.text();
      const idMatch = text.match(/movieId":"([^"]+)"/);
      if (idMatch && idMatch[1]) {
        return { movieId: idMatch[1], urlPath: candidatePath };
      }
      // Fallback: attempt to find emsId in context
      const emsMatch = text.match(/fandangoData\s*=\s*\{[^}]*?"emsId":"([^"]+)"/);
      if (emsMatch && emsMatch[1]) {
        return { movieId: emsMatch[1], urlPath: candidatePath };
      }
    }
  } catch (_) {
    // ignore and continue to search
  }

  // If extraction failed or no tomatoURL, use private search API to find URL and ID
  try {
    const query = encodeURIComponent(params.year ? `${params.title} ${params.year}` : params.title);
    const searchUrl = `${RT_BASE}/api/private/v2.0/search?q=${query}`;
    const res = await proxyFetch(searchUrl);
    const text = await res.text();
    const data = JSON.parse(text);
    // The structure typically has 'movies' with items containing 'name', 'year', 'url', and sometimes 'emsId'
    const candidates: any[] = data?.movies ?? data?.results ?? [];
    const normalizeText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedTitle = normalizeText(params.title);
    let best: any = null;
    for (const c of candidates) {
      const name = normalizeText(c?.name ?? c?.title ?? '');
      const cYear = c?.year ?? c?.releaseYear;
      if (name && (name.includes(normalizedTitle) || normalizedTitle.includes(name))) {
        if (!params.year || !cYear || Number(cYear) === Number(params.year)) {
          best = c;
          break;
        }
      }
    }
    if (!best && candidates.length > 0) {
      best = candidates[0];
    }
    if (best) {
      const urlPath: string | null = best?.url ?? best?.path ?? null;
      const emsId: string | null = best?.emsId ?? best?.emsID ?? null;
      if (emsId) {
        return { movieId: emsId, urlPath };
      }
      if (urlPath) {
        // Fetch the reviews page to extract movieId
        const res2 = await proxyFetch(`${RT_BASE}${urlPath}${urlPath.endsWith('/reviews') ? '' : '/reviews'}`);
        const text2 = await res2.text();
        const idMatch2 = text2.match(/movieId":"([^"]+)"/);
        if (idMatch2 && idMatch2[1]) {
          return { movieId: idMatch2[1], urlPath };
        }
        const emsMatch2 = text2.match(/fandangoData\s*=\s*\{[^}]*?"emsId":"([^"]+)"/);
        if (emsMatch2 && emsMatch2[1]) {
          return { movieId: emsMatch2[1], urlPath };
        }
      }
    }
  } catch (err) {
    // swallow and return null
  }

  return { movieId: null, urlPath: null };
}

// Get critic reviews (first page/all) for a Rotten Tomatoes movieId.
export async function getRtCriticReviews(movieId: string): Promise<RtCriticReviewsResponse> {
  const url = `${RT_BASE}/napi/movie/${movieId}/criticsReviews/all`;
  const res = await proxyFetch(url);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    const reviews = (json?.reviews ?? []) as RtCriticReview[];
    return {
      reviews,
      pageInfo: json?.pageInfo ?? {},
    };
  } catch (e) {
    // If the proxy returned non-JSON or was blocked
    throw new Error('Failed to parse RT reviews');
  }
}

export async function fetchRtCriticReviews(params: {
  title: string;
  year?: number;
  tomatoURL?: string;
}): Promise<{ reviews: RtCriticReview[]; sourceUrl?: string | null }> {
  const { movieId, urlPath } = await resolveRtMovieId(params);
  if (!movieId) {
    throw new Error('Could not resolve Rotten Tomatoes movie ID');
  }
  const resp = await getRtCriticReviews(movieId);
  return { reviews: resp.reviews ?? [], sourceUrl: urlPath ? `${RT_BASE}${urlPath}` : null };
}
