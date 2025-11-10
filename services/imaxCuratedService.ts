import { MediaItem } from '../types';
import { searchMulti, getMovieDetails, getTVShowDetails } from './tmdbService';

export interface ImaxCuratedEntry {
  title: string;
  youtubeUrl: string;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
}

// User-requested curated IMAX titles with explicit YouTube links
const CURATED_ENTRIES: ImaxCuratedEntry[] = [
  { title: 'Superman', youtubeUrl: 'http://www.youtube.com/watch?v=OfpXgjP4AOs' },
  { title: 'Avatar: The Way of Water', youtubeUrl: 'http://www.youtube.com/watch?v=a6VVrAZUnsc' },
  { title: 'Predator: Badlands', youtubeUrl: 'http://www.youtube.com/watch?v=5Iikh-x2W8k' },
  { title: 'Tron: Ares', youtubeUrl: 'http://www.youtube.com/watch?v=h8VJ0LSi5gQ' },
  // Ensure poster comes from TMDb movie 936075 (Michael)
  { title: 'Michael', youtubeUrl: 'http://www.youtube.com/watch?v=ABAm3QqKv2s', tmdbId: 936075, mediaType: 'movie' },
  { title: 'The Mandalorian and Grogu', youtubeUrl: 'http://www.youtube.com/watch?v=6lkh0QHnk0E' },
  { title: 'Avatar: Fire and Ash', youtubeUrl: 'http://www.youtube.com/watch?v=rv8CkgGItd4' },
  { title: 'Oppenheimer', youtubeUrl: 'http://www.youtube.com/watch?v=hPIzgZ16oac' },
  { title: 'Blue Beetle', youtubeUrl: 'http://www.youtube.com/watch?v=Zc_KPaXlHy8' },
  { title: 'The Creator', youtubeUrl: 'http://www.youtube.com/watch?v=oPMdo-mTuPo' },
  { title: 'Dune', youtubeUrl: 'http://www.youtube.com/watch?v=TfBCe93T_ec' },
  { title: 'F9', youtubeUrl: 'http://www.youtube.com/watch?v=s7uNUSgLH8Y' },
  { title: 'The Invisible Man', youtubeUrl: 'http://www.youtube.com/watch?v=DZ4BKjtnlfA' },
  { title: 'The Shining', youtubeUrl: 'http://www.youtube.com/watch?v=RmQPBzJKxcw' },
  { title: 'A Quiet Place Part II', youtubeUrl: 'http://www.youtube.com/watch?v=HQ24cx2b250' },
  { title: 'Apollo 11', youtubeUrl: 'http://www.youtube.com/watch?v=PSS8AtjvAcY' },
  { title: 'Gemini Man', youtubeUrl: 'http://www.youtube.com/watch?v=D8RC_Paj-qo' },
  { title: 'The Lion King', youtubeUrl: 'http://www.youtube.com/watch?v=BT3aBUBlEno' },
  { title: 'Ad Astra', youtubeUrl: 'http://www.youtube.com/watch?v=5oVPPGE4yes' },
  { title: 'Frozen 2', youtubeUrl: 'http://www.youtube.com/watch?v=HIejzQuGiUo' },
  { title: 'Avengers: Infinity War', youtubeUrl: 'https://youtu.be/8Rezjrc5WcQ?si=x3RMLF_0EdjmSYOg' },
  { title: 'Avengers: Endgame', youtubeUrl: 'https://youtu.be/ZeQ9Chg9_Fk?si=EySihTFTXDk5DnBp' },
];

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }
    // youtube.com/watch?v=<id>
    if (u.hostname.includes('youtube.com') || u.hostname.includes('www.youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return id;
      // Sometimes embed paths or shorts
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => p === 'embed' || p === 'shorts');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
};

const CURATED_TITLE_TO_YTID: Record<string, string> = Object.fromEntries(
  CURATED_ENTRIES.map(e => [normalize(e.title), extractYouTubeId(e.youtubeUrl) || ''])
);

export const isCuratedImaxTitle = (item: MediaItem | { title?: string; name?: string }): boolean => {
  const t = (item as any).title || (item as any).name || '';
  return !!CURATED_TITLE_TO_YTID[normalize(t)];
};

export const getCuratedTrailerKeyForItem = (item: MediaItem | { title?: string; name?: string }): string | null => {
  const t = (item as any).title || (item as any).name || '';
  const id = CURATED_TITLE_TO_YTID[normalize(t)];
  return id && id.length > 0 ? id : null;
};

export const getImaxCuratedEntries = (): ImaxCuratedEntry[] => CURATED_ENTRIES.slice();

export const resolveCuratedMediaItems = async (apiKey: string): Promise<MediaItem[]> => {
  const out: MediaItem[] = [];
  const seen = new Set<string>();

  for (const entry of CURATED_ENTRIES) {
    try {
      let pick: MediaItem | null = null;
      if (entry.tmdbId) {
        if ((entry.mediaType || 'movie') === 'movie') {
          const details = await getMovieDetails(apiKey, entry.tmdbId);
          pick = details as unknown as MediaItem;
        } else {
          const details = await getTVShowDetails(apiKey, entry.tmdbId);
          pick = details as unknown as MediaItem;
        }
      } else {
        const resp = await searchMulti(apiKey, entry.title, 1);
        const results = Array.isArray(resp.results) ? resp.results : [];
        // Prefer exact title match among movie/tv
        const target = normalize(entry.title);
        for (const r of results) {
          const title = (r as any).title || (r as any).name || '';
          if (normalize(title) === target) { pick = r as MediaItem; break; }
        }
        if (!pick && results.length > 0) pick = results[0] as MediaItem;
      }
      if (pick) {
        const key = normalize((pick as any).title || (pick as any).name || '');
        if (!seen.has(key)) {
          seen.add(key);
          out.push(pick);
        }
      }
    } catch {
      // ignore resolution errors for individual entries
    }
  }

  return out;
};
