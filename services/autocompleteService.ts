import { omdbService, hasOMDbKey } from './omdbService';
import { searchKeywords, searchMovies, searchTVShows } from './tmdbService';

/**
 * Unified autocomplete: tries OMDb first, falls back to TMDb if OMDb fails.
 */
export async function getAutocompleteSuggestions(
  tmdbApiKey: string,
  query: string,
  limit: number = 8
): Promise<string[]> {
  const q = (query || '').trim();
  if (!q) return [];

  let suggestions: string[] = [];

  // Try OMDb first (preferred source) if key is available
  try {
    if (hasOMDbKey()) {
      const list = await omdbService.searchTitles(q);
      suggestions = list.map((i) => i.Title).filter(Boolean);
    }
  } catch (e) {
    // swallow and allow fallback
  }

  // Fallback to TMDb if OMDb returned nothing
  if (suggestions.length === 0) {
    try {
      const kw = await searchKeywords(tmdbApiKey, q);
      const keywordNames = (kw.results || []).map((k: any) => k.name).filter(Boolean);
      suggestions = keywordNames;

      // If keyword suggestions are still sparse, include title names from movie/tv search
      if (suggestions.length < limit) {
        const [mr, tr] = await Promise.all([
          searchMovies(tmdbApiKey, q),
          searchTVShows(tmdbApiKey, q),
        ]);
        const titles = [
          ...((mr.results || []).map((m: any) => m.title).filter(Boolean)),
          ...((tr.results || []).map((t: any) => t.name).filter(Boolean)),
        ];
        const unique = Array.from(new Set([...suggestions, ...titles]));
        suggestions = unique;
      }
    } catch (e) {
      // If TMDb also fails, return empty suggestions
      suggestions = [];
    }
  }

  // Normalize and limit
  const cleaned = suggestions
    .map((s) => (s || '').trim())
    .filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  return unique.slice(0, limit);
}

