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

  try {
    const kw = await searchKeywords(tmdbApiKey, q);
    const keywordNames = (kw.results || []).map((k: any) => k.name).filter(Boolean);
    suggestions = keywordNames;

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
    suggestions = [];
  }

  // Normalize and limit
  const cleaned = suggestions
    .map((s) => (s || '').trim())
    .filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  return unique.slice(0, limit);
}
