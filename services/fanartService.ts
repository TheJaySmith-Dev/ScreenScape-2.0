// FanArt.tv Service: fetch movie/TV artwork using provided API key
// Uses v3 endpoints, prefers IMDb IDs for movies. TV typically requires TVDB IDs.

const FANART_API_KEY = '1d270eb9c6cff8abfe6c074eebba8d6f';

export interface FanArtImage {
  url: string;
  lang?: string | null;
  likes?: number;
  id?: string;
}

export interface FanArtMovieResponse {
  name?: string;
  imdb_id?: string;
  tmdb_id?: string;
  hdmovielogo?: FanArtImage[]; // logos
  movielogo?: FanArtImage[];
  movieposter?: FanArtImage[]; // posters
  moviebackground?: FanArtImage[]; // backdrops (plain)
  moviethumb?: FanArtImage[]; // backdrops with text/logos (16:9)
  moviebanner?: FanArtImage[];
}

export async function getMovieArtByImdbId(imdbId: string): Promise<FanArtMovieResponse | null> {
  try {
    const url = `https://webservice.fanart.tv/v3/movies/${encodeURIComponent(imdbId)}?api_key=${FANART_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data as FanArtMovieResponse;
  } catch (err) {
    console.warn('FanArt getMovieArtByImdbId failed:', err);
    return null;
  }
}

// Helper selectors
export function selectBestBackdrop(art: FanArtMovieResponse | null): string | null {
  if (!art) return null;
  // Prefer high-quality backgrounds, fallback to moviethumb, then banner
  const bg = (art.moviebackground || []).sort(sortByLikes)[0]?.url
    || (art.moviethumb || []).sort(sortByLikes)[0]?.url
    || (art.moviebanner || []).sort(sortByLikes)[0]?.url
    || null;
  return bg || null;
}

// Select backdrop with text/logo (for hero carousels) - English only
export function selectBestBackdropWithText(art: FanArtMovieResponse | null): string | null {
  if (!art) return null;
  // moviethumb contains backdrops with title text/logos - filter for English
  const englishThumbs = (art.moviethumb || []).filter(img => 
    !img.lang || img.lang === 'en' || img.lang === '00' // '00' means language-neutral
  );
  const thumb = englishThumbs.sort(sortByLikes)[0]?.url || null;
  return thumb;
}

export function selectBestPoster(art: FanArtMovieResponse | null): string | null {
  if (!art) return null;
  const poster = (art.movieposter || []).sort(sortByLikes)[0]?.url || null;
  return poster;
}

export function selectBestLogo(art: FanArtMovieResponse | null): string | null {
  if (!art) return null;
  const logo = (art.hdmovielogo || art.movielogo || []).sort(sortByLikes)[0]?.url || null;
  return logo;
}

function sortByLikes(a: FanArtImage, b: FanArtImage): number {
  const la = a.likes ?? 0;
  const lb = b.likes ?? 0;
  return lb - la; // desc
}

// --- TV Support (FanArt.tv requires TVDB IDs) ---
export interface FanArtTVResponse {
  name?: string;
  thetvdb_id?: string;
  hdtvlogo?: FanArtImage[];
  clearlogo?: FanArtImage[];
  tvposter?: FanArtImage[];
  showbackground?: FanArtImage[]; // backdrops with text (16:9)
  tvthumb?: FanArtImage[]; // alternative TV thumbs
}

export async function getTVArtByTvdbId(tvdbId: string): Promise<FanArtTVResponse | null> {
  try {
    const url = `https://webservice.fanart.tv/v3/tv/${encodeURIComponent(tvdbId)}?api_key=${FANART_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data as FanArtTVResponse;
  } catch (err) {
    console.warn('FanArt getTVArtByTvdbId failed:', err);
    return null;
  }
}

export function selectBestTVBackdrop(art: FanArtTVResponse | null): string | null {
  if (!art) return null;
  const bg = (art.showbackground || []).sort(sortByLikes)[0]?.url || null;
  return bg || null;
}

// Select TV backdrop with text/logo (for hero carousels) - English only
export function selectBestTVBackdropWithText(art: FanArtTVResponse | null): string | null {
  if (!art) return null;
  // showbackground for TV shows typically includes text - filter for English
  const englishBackgrounds = (art.showbackground || []).filter(img => 
    !img.lang || img.lang === 'en' || img.lang === '00' // '00' means language-neutral
  );
  const bg = englishBackgrounds.sort(sortByLikes)[0]?.url || null;
  return bg;
}

export function selectBestTVPoster(art: FanArtTVResponse | null): string | null {
  if (!art) return null;
  const poster = (art.tvposter || []).sort(sortByLikes)[0]?.url || null;
  return poster;
}

export function selectBestTVLogo(art: FanArtTVResponse | null): string | null {
  if (!art) return null;
  const logo = (art.hdtvlogo || art.clearlogo || []).sort(sortByLikes)[0]?.url || null;
  return logo;
}

export const fanartApiKey = FANART_API_KEY;
