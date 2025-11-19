import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItem, Movie, TVShow, Person, WatchProvider } from '../types';
import { useAppleTheme } from './AppleThemeProvider';
import {
  searchMulti,
  searchPerson,
  normalizeMovie,
  normalizeTVShow,
  getPersonMovieCredits,
  getPersonTVCredits,
  getPersonCombinedCredits,
  getMovieRecommendations,
  getTVShowRecommendations,
  searchMovies,
  searchTVShows,
  searchKeywords,
  getMovieCredits,
  getTVShowCredits,
  getMovieWatchProviders,
  getTVShowWatchProviders,
} from '../services/tmdbService';
import { computeMatchScore } from '../utils/searchRanking';
import { getAutocompleteSuggestions } from '../services/autocompleteService';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { buildAvailabilityDescriptors, getAvailabilityBuckets, hasAvailability } from '../utils/streamingAvailability';
import { getRegionServiceFilter, normalizeProviderName } from '../utils/regionServiceMap';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

type SearchCategory = 'movie_tv' | 'cast' | 'director' | 'producer';

interface SearchPageProps {
  apiKey: string;
  onSelectItem: (item: MediaItem) => void;
  onInvalidApiKey: () => void;
  imaxMode?: boolean;
}

const CategoryTabs: React.FC<{
  value: SearchCategory;
  onChange: (v: SearchCategory) => void;
}> = ({ value, onChange }) => {
  const { tokens } = useAppleTheme();
  const tabs: { id: SearchCategory; label: string }[] = [
    { id: 'movie_tv', label: 'Movie/TV Show' },
    { id: 'cast', label: 'Cast member' },
    { id: 'director', label: 'Director' },
    { id: 'producer', label: 'Producer' },
  ];

  return (
    <div
      role="tablist"
      aria-label="Search categories"
      style={{
        display: 'flex',
        gap: tokens.spacing.standard[1],
        padding: `${tokens.spacing.standard[1]}px`,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${tokens.colors.separator.opaque}`,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          role="tab"
          aria-selected={value === t.id}
          style={{
            padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[1]}px`,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontFamily: tokens.typography.families.text,
            fontSize: tokens.typography.sizes.caption1,
            fontWeight: tokens.typography.weights.medium,
            color: value === t.id ? tokens.colors.background.primary : tokens.colors.label.primary,
            background:
              value === t.id
                ? `linear-gradient(135deg, ${tokens.colors.system.blue}, ${tokens.colors.system.indigo})`
                : 'transparent',
            transition: 'all 220ms ease',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

const MediaCard: React.FC<{ item: MediaItem; onClick: (i: MediaItem) => void; castPreview?: string[]; availabilityDescriptors?: { type: string; text: string }[]; regionUnavailable?: boolean }> = ({ item, onClick, castPreview, availabilityDescriptors, regionUnavailable }) => {
  const { tokens } = useAppleTheme();
  const title = 'title' in item ? item.title : item.name;
  const year = 'release_date' in item && item.release_date
    ? item.release_date.substring(0, 4)
    : 'first_air_date' in item && item.first_air_date
      ? item.first_air_date.substring(0, 4)
      : '';
  const overview = (item as any).overview || '';
  const overviewSnippet = overview ? (overview.length > 120 ? overview.slice(0, 117) + '…' : overview) : '';

  return (
    <motion.div
      onClick={() => onClick(item)}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      style={{ width: '100%' }}
    >
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          aspectRatio: '2/3',
          background: `linear-gradient(135deg, ${tokens.colors.background.secondary}40, ${tokens.colors.background.primary}40)`,
          border: `1px solid ${tokens.colors.separator.opaque}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        <img
          src={item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            padding: `${tokens.spacing.standard[1]}px`,
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
          }}
        >
          {availabilityDescriptors && availabilityDescriptors.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {availabilityDescriptors.map((d, i) => (
                <span
                  key={`avail-${i}`}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: `1px solid ${tokens.colors.separator.opaque}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: tokens.colors.background.primary,
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.caption2,
                  }}
                >
                  {d.type}: {d.text}
                </span>
              ))}
            </div>
          )}
          
          <div
            style={{
              color: tokens.colors.background.primary,
              fontFamily: tokens.typography.families.text,
              fontSize: tokens.typography.sizes.body,
              fontWeight: tokens.typography.weights.semibold,
            }}
          >
            {title}
          </div>
          <div style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption1 }}>{year}</div>
          <div style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption2, marginTop: 4 }}>
            {castPreview && castPreview.length > 0
              ? `Cast: ${castPreview.join(', ')}`
              : overviewSnippet}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PersonCard: React.FC<{ person: Person; onClick?: (p: Person) => void }> = ({ person, onClick }) => {
  const { tokens } = useAppleTheme();
  return (
    <motion.div
      onClick={() => onClick?.(person)}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      style={{ width: '100%' }}
    >
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          aspectRatio: '1/1',
          background: `linear-gradient(135deg, ${tokens.colors.background.secondary}40, ${tokens.colors.background.primary}40)`,
          border: `1px solid ${tokens.colors.separator.opaque}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        <img
          src={person.profile_path ? `${IMAGE_BASE_URL}w500${person.profile_path}` : 'https://via.placeholder.com/500x500?text=No+Image'}
          alt={person.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>
      <div style={{ marginTop: tokens.spacing.micro[1], textAlign: 'center', color: tokens.colors.label.primary, fontFamily: tokens.typography.families.text }}>
        <div style={{ fontWeight: tokens.typography.weights.semibold }}>{person.name}</div>
        <div style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption1 }}>{person.known_for_department}</div>
      </div>
    </motion.div>
  );
};

const SearchPage: React.FC<SearchPageProps> = ({ apiKey, onSelectItem, onInvalidApiKey, imaxMode = false }) => {
  const { tokens } = useAppleTheme();
  const { country, status } = useGeolocation();
  const { providerIds } = useStreamingPreferences();
  const [category, setCategory] = useState<SearchCategory>('movie_tv');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(MediaItem | Person)[]>([]);
  const [related, setRelated] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  // Filmography state
  const [filmographyMovies, setFilmographyMovies] = useState<MediaItem[]>([]);
  const [filmographyTV, setFilmographyTV] = useState<MediaItem[]>([]);
  const [filmographyPage, setFilmographyPage] = useState({ movies: 1, tv: 1 });
  const FILMOGRAPHY_PAGE_SIZE = 24;
  // Simple in-memory cache keyed by category+query
  const filmographyCacheRef = useRef<Map<string, { movies: MediaItem[]; tv: MediaItem[] }>>(new Map());
  // Cast preview cache keyed by `${media_type}:${id}`
  const castPreviewRef = useRef<Map<string, string[]>>(new Map());
  const autoTimeoutRef = useRef<number | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const providerCacheRef = useRef<Map<string, { descriptors: { type: string; text: string }[]; regionUnavailable: boolean }>>(new Map());
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, { type: string; text: string }[]>>(new Map());
  const [unavailableMap, setUnavailableMap] = useState<Map<string, boolean>>(new Map());
  const [providersLoading, setProvidersLoading] = useState(false);
  const [imaxNotice, setImaxNotice] = useState<string | null>(null);

  // Match scoring now provided by shared util in utils/searchRanking

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setRelated([]);
    setSuggestions([]);
    setReportStatus(null);

    try {
      if (imaxMode) {
        // IMAX-only movie search: restrict to movies and filter by official IMAX trailers
        setImaxNotice(null);
        const mr = await searchMovies(apiKey, q);
        const movies = (mr.results || []) as MediaItem[];
        // Rank by match score
        const ranked = movies
          .map(item => {
            const title = 'title' in item ? item.title : (item as any).name;
            const score = computeMatchScore(title || '', q);
            return { item, score };
          })
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(r => r.item);
        const base = ranked.length > 0 ? ranked : movies;
        // Filter to those with official IMAX trailers
        const { getMovieVideosImaxOnly } = await import('../services/tmdbService');
        const limit = 60;
        const tasks = base
          .filter(i => (i as any).media_type === 'movie' || 'title' in i)
          .slice(0, limit)
          .map(async (m) => {
            try {
              const resp = await getMovieVideosImaxOnly(apiKey, m.id);
              return resp.results && resp.results.length > 0 ? m : null;
            } catch { return null; }
          });
        const filtered = (await Promise.all(tasks)).filter(Boolean) as MediaItem[];
        if (filtered.length > 0) {
          setResults(filtered);
        } else {
          // Graceful fallback: show best matches, with a notice
          const fallback = base.slice(0, limit);
          setResults(fallback);
          setImaxNotice('No IMAX-labeled trailers found for this query. Showing best matches.');
        }
        setRelated([]);
        // Skip provider fetching to reduce calls in IMAX mode
      } else if (category === 'movie_tv') {
        const res = await searchMulti(apiKey, q);
        let combined = res.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv') as MediaItem[];
        // Fallback: explicit movie/tv searches to ensure database coverage
        if (combined.length === 0) {
          const [mr, tr] = await Promise.all([
            searchMovies(apiKey, q),
            searchTVShows(apiKey, q),
          ]);
          combined = [
            ...(mr.results || []),
            ...(tr.results || []),
          ] as MediaItem[];
        }
        // Rank by match score (case-insensitive, partial)
        const ranked = combined
          .map(item => {
            const title = 'title' in item ? item.title : (item as any).name;
            const score = computeMatchScore(title || '', q);
            return { item, score };
          })
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score);

        const finalResults = ranked.length > 0 ? ranked.map(r => r.item) : combined;
        setResults(finalResults);

        // Fetch streaming availability for top results and apply region-based filters
        const filter = getRegionServiceFilter(country.code);
        const providerIdSet = providerIds || new Set<number>();
        const maxItems = 12; // limit to avoid rate limits
        setProvidersLoading(true);
        try {
          const tasks = finalResults
            .filter(r => 'media_type' in r)
            .slice(0, maxItems)
            .map(async (r) => {
              const item = r as MediaItem;
              const cacheKey = `${item.media_type}:${item.id}`;
              if (providerCacheRef.current.has(cacheKey)) {
                const cached = providerCacheRef.current.get(cacheKey)!;
                return { key: cacheKey, descriptors: cached.descriptors, regionUnavailable: cached.regionUnavailable };
              }
              try {
                const resp = item.media_type === 'movie'
                  ? await getMovieWatchProviders(apiKey, item.id, country.code)
                  : await getTVShowWatchProviders(apiKey, item.id, country.code);
                const providersForCountry = resp.results?.[country.code] ?? resp.results?.['US'];
                const buckets = getAvailabilityBuckets(providersForCountry, providerIdSet);
                let descriptors = buildAvailabilityDescriptors(buckets, 3);
                let regionUnavailable = !hasAvailability(buckets);
                if (filter) {
                  const include = new Set(filter.include.map(normalizeProviderName));
                  const pick = (list: WatchProvider[]) => list.filter(p => include.has(normalizeProviderName(p.provider_name)));
                  const filteredBuckets = {
                    stream: pick(buckets.stream),
                    rent: pick(buckets.rent),
                    buy: pick(buckets.buy),
                  };
                  descriptors = buildAvailabilityDescriptors(filteredBuckets, 3);
                  regionUnavailable = filteredBuckets.stream.length === 0 && filteredBuckets.rent.length === 0 && filteredBuckets.buy.length === 0;
                }
                providerCacheRef.current.set(cacheKey, { descriptors, regionUnavailable });
                return { key: cacheKey, descriptors, regionUnavailable };
              } catch (err) {
                // Soft-fail provider fetching per item
                providerCacheRef.current.set(cacheKey, { descriptors: [], regionUnavailable: false });
                return { key: cacheKey, descriptors: [], regionUnavailable: false };
              }
            });
          const resultsWithProviders = await Promise.all(tasks);
          const nextMap = new Map<string, { type: string; text: string }[]>();
          const nextUnavail = new Map<string, boolean>();
          for (const r of resultsWithProviders) {
            nextMap.set(r.key, r.descriptors);
            nextUnavail.set(r.key, r.regionUnavailable);
          }
          setAvailabilityMap(nextMap);
          setUnavailableMap(nextUnavail);
        } finally {
          setProvidersLoading(false);
        }

        if (finalResults.length === 0) {
          // No results: fetch keyword suggestions and show message
          try {
            const kw = await searchKeywords(apiKey, q);
            const names = (kw.results || []).map(k => k.name);
            const curated = ['Iron Man (2008)', 'Iron Man 2', 'Iron Man 3', 'Tony Stark', 'Robert Downey Jr', 'Avengers'];
            const sugg = Array.from(new Set([...(names || []).slice(0, 6), ...curated])).slice(0, 8);
            setSuggestions(sugg);
          } catch {}
          setError(`No results found for "${q}". Try different keywords or check spelling.`);
          return;
        }

        // Fetch cast previews for top 3 to validate metadata display
        const topForCast = finalResults.slice(0, 3);
        await Promise.all(topForCast.map(async (item) => {
          const key = `${item.media_type}:${item.id}`;
          if (castPreviewRef.current.has(key)) return;
          try {
            if (item.media_type === 'movie') {
              const c = await getMovieCredits(apiKey, item.id);
              const names = (c.cast || []).slice(0, 3).map(m => m.name);
              castPreviewRef.current.set(key, names);
            } else {
              const c = await getTVShowCredits(apiKey, item.id);
              const names = (c.cast || []).slice(0, 3).map(m => m.name);
              castPreviewRef.current.set(key, names);
            }
          } catch {}
        }));
        // Build related by aggregating recommendations from top 3 hits
        const top = finalResults.slice(0, 3);
        const recs: MediaItem[] = [];
        for (const item of top) {
          if (item.media_type === 'movie') {
            const r = await getMovieRecommendations(apiKey, item.id);
            recs.push(...(r.results || []).map(normalizeMovie));
          } else {
            const r = await getTVShowRecommendations(apiKey, item.id);
            recs.push(...(r.results || []).map(normalizeTVShow));
          }
        }
        // Deduplicate by id/media_type
        const dedup = Array.from(
          new Map(recs.map((i) => [`${i.media_type}:${i.id}`, i])).values()
        ).slice(0, 20);
        setRelated(dedup);
      } else if (category === 'cast') {
        const res = await searchPerson(apiKey, q);
        const people = res.results.slice(0, 12);
        setResults(people);
        // Filmography: complete movies and TV for the top person match; cache results
        const topPerson = people[0];
        if (topPerson) {
          const cacheKey = `cast:${topPerson.id}`;
          if (filmographyCacheRef.current.has(cacheKey)) {
            const cached = filmographyCacheRef.current.get(cacheKey)!;
            setFilmographyMovies(cached.movies);
            setFilmographyTV(cached.tv);
          } else {
            // Prefer combined credits to reduce calls
            const combined = await getPersonCombinedCredits(apiKey, topPerson.id);
            const movies = (combined.cast || [])
              .filter((c) => c.media_type === 'movie')
              .map((m) => normalizeMovie(m as any as Movie));
            const tv = (combined.cast || [])
              .filter((c) => c.media_type === 'tv')
              .map((t) => normalizeTVShow(t as any as TVShow));
            filmographyCacheRef.current.set(cacheKey, { movies, tv });
            setFilmographyMovies(movies);
            setFilmographyTV(tv);
          }
          setFilmographyPage({ movies: 1, tv: 1 });
        }
        // Related to cast: recommendations based on their acting credits
        const recs: MediaItem[] = [];
        const actors = people.slice(0, 3);
        for (const p of actors) {
          const [mc, tc] = await Promise.all([
            getPersonMovieCredits(apiKey, p.id),
            getPersonTVCredits(apiKey, p.id),
          ]);
          const actingMovies = (mc.cast || []).slice(0, 5);
          const actingTV = (tc.cast || []).slice(0, 5);
          for (const m of actingMovies) {
            const r = await getMovieRecommendations(apiKey, m.id);
            recs.push(...(r.results || []).map(normalizeMovie));
          }
          for (const tv of actingTV) {
            const r = await getTVShowRecommendations(apiKey, tv.id);
            recs.push(...(r.results || []).map(normalizeTVShow));
          }
        }
        const dedup = Array.from(new Map(recs.map((i) => [`${i.media_type}:${i.id}`, i])).values()).slice(0, 20);
        setRelated(dedup);
      } else if (category === 'director' || category === 'producer') {
        const res = await searchPerson(apiKey, q);
        const people = res.results.slice(0, 12);
        setResults(people);
        const job = category === 'director' ? 'Director' : 'Producer';
        const recs: MediaItem[] = [];
        const topPeople = people.slice(0, 3);
        // Filmography for top person match; cache results
        const topPerson = people[0];
        if (topPerson) {
          const cacheKey = `${job.toLowerCase()}:${topPerson.id}`;
          if (filmographyCacheRef.current.has(cacheKey)) {
            const cached = filmographyCacheRef.current.get(cacheKey)!;
            setFilmographyMovies(cached.movies);
            setFilmographyTV(cached.tv);
          } else {
            const combined = await getPersonCombinedCredits(apiKey, topPerson.id);
            const crewMovies = (combined.crew || [])
              .filter((c) => (c as any).job === job && c.media_type === 'movie')
              .map((m) => normalizeMovie(m as any as Movie));
            const crewTV = (combined.crew || [])
              .filter((c) => (c as any).job === job && c.media_type === 'tv')
              .map((t) => normalizeTVShow(t as any as TVShow));
            filmographyCacheRef.current.set(cacheKey, { movies: crewMovies, tv: crewTV });
            setFilmographyMovies(crewMovies);
            setFilmographyTV(crewTV);
          }
          setFilmographyPage({ movies: 1, tv: 1 });
        }
        for (const p of topPeople) {
          const [mc, tc] = await Promise.all([
            getPersonMovieCredits(apiKey, p.id),
            getPersonTVCredits(apiKey, p.id),
          ]);
          const crewMovies = (mc.crew || []).filter((c) => (c as any).job === job).slice(0, 6);
          const crewTV = (tc.crew || []).filter((c) => (c as any).job === job).slice(0, 6);
          for (const m of crewMovies) {
            const r = await getMovieRecommendations(apiKey, m.id);
            recs.push(...(r.results || []).map(normalizeMovie));
          }
          for (const tv of crewTV) {
            const r = await getTVShowRecommendations(apiKey, tv.id);
            recs.push(...(r.results || []).map(normalizeTVShow));
          }
        }
        const dedup = Array.from(new Map(recs.map((i) => [`${i.media_type}:${i.id}`, i])).values()).slice(0, 20);
        setRelated(dedup);
      }
    } catch (e: any) {
      if (e?.message?.includes('Invalid API Key')) {
        onInvalidApiKey();
      }
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [apiKey, category, onInvalidApiKey, query]);

  // Real-time debounced search while typing (400ms)
  useEffect(() => {
    const q = query.trim();
    // Clear any pending timer
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!q) {
      // Reset results when input is cleared
      setResults([]);
      setRelated([]);
      setError(null);
      setSuggestions([]);
      return;
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch();
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, category, handleSearch]);

  // Debounced autocomplete suggestions (OMDb first, TMDb fallback)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setAutoSuggestions([]);
      return;
    }
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
    }
    autoTimeoutRef.current = window.setTimeout(async () => {
      try {
        const sugg = await getAutocompleteSuggestions(apiKey, q, 8);
        setAutoSuggestions(sugg);
      } catch {
        setAutoSuggestions([]);
      }
    }, 200);

    return () => {
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
      }
    };
  }, [apiKey, query]);

  // Pagination helpers
  const pagedMovies = useMemo(() => {
    const start = (filmographyPage.movies - 1) * FILMOGRAPHY_PAGE_SIZE;
    return filmographyMovies.slice(start, start + FILMOGRAPHY_PAGE_SIZE);
  }, [filmographyMovies, filmographyPage.movies]);

  const pagedTV = useMemo(() => {
    const start = (filmographyPage.tv - 1) * FILMOGRAPHY_PAGE_SIZE;
    return filmographyTV.slice(start, start + FILMOGRAPHY_PAGE_SIZE);
  }, [filmographyTV, filmographyPage.tv]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing.standard[2],
      }}
    >
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.standard[1], justifyContent: 'space-between' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Trigger search immediately on Enter
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                handleSearch();
              }
            }}
            placeholder={imaxMode ? "Search IMAX movies..." : "Search movies, TV shows, cast, directors, producers..."}
            style={{
              width: '100%',
              padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.standard[1]}px`,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${tokens.colors.separator.opaque}`,
              color: tokens.colors.label.primary,
              fontFamily: tokens.typography.families.text,
              fontSize: tokens.typography.sizes.body,
            }}
          />
        </div>
        {imaxMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.micro[1] }}>
            <img
              src={'https://i.ibb.co/G47CHyhg/toppng-com-imax-michael-jackson-thriller-imax-445x87.png'}
              alt="IMAX"
              loading="lazy"
              style={{ height: '22px', width: 'auto' }}
            />
            <div style={{ color: tokens.colors.label.primary, fontFamily: tokens.typography.families.text, fontWeight: tokens.typography.weights.semibold }}>
              IMAX Search
            </div>
          </div>
        )}
      </div>

      {/* Autocomplete Suggestions */}
      {autoSuggestions.length > 0 && (
        <div style={{ marginTop: tokens.spacing.micro[1] }}>
          <div style={{ color: tokens.colors.label.secondary, marginBottom: tokens.spacing.micro[1] }}>
            Suggestions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.micro[1] }}>
            {autoSuggestions.map((s) => (
              <button
                key={`page-auto-${s}`}
                onClick={() => setQuery(s)}
                style={{
                  border: `1px solid ${tokens.colors.separator.opaque}`,
                  borderRadius: 12,
                  padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                  background: 'rgba(255,255,255,0.08)',
                  color: tokens.colors.label.primary,
                  cursor: 'pointer'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <CategoryTabs value={category} onChange={setCategory} />

      {/* Results */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: tokens.spacing.standard[1],
          }}
        >
          <h2
            style={{
              fontFamily: tokens.typography.families.text,
              fontSize: tokens.typography.sizes.title2,
              fontWeight: tokens.typography.weights.bold,
              color: tokens.colors.label.primary,
            }}
          >
            Results
          </h2>
          {status !== 'detected' && (
            <span style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption1 }}>
              Location {status === 'permission_denied' ? 'permission denied' : status === 'error' ? 'unavailable' : 'not detected'}; defaulting to {country.name}
            </span>
          )}
          {loading && (
            <span style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption1 }}>Loading…</span>
          )}
        </div>
        {error && (
          <div style={{ color: tokens.colors.system.red, marginBottom: tokens.spacing.standard[1] }}>{error}</div>
        )}
        {imaxMode && !loading && imaxNotice && (
          <div style={{ color: tokens.colors.label.secondary, marginBottom: tokens.spacing.standard[1] }}>{imaxNotice}</div>
        )}
        {/* Suggestions when no results */}
        {!loading && results.length === 0 && suggestions.length > 0 && (
          <div style={{ marginBottom: tokens.spacing.standard[1] }}>
            <div style={{ color: tokens.colors.label.secondary, marginBottom: tokens.spacing.micro[2] }}>
              Suggestions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.micro[1] }}>
              {suggestions.map((s, i) => (
                <button
                  key={`sugg-${i}`}
                  onClick={() => {
                    setQuery(s);
                    // Fire a new search immediately
                    setTimeout(() => handleSearch(), 0);
                  }}
                  style={{
                    padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[1]}px`,
                    borderRadius: 999,
                    border: `1px solid ${tokens.colors.separator.opaque}`,
                    background: 'transparent',
                    color: tokens.colors.label.primary,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ marginTop: tokens.spacing.standard[1], display: 'flex', gap: tokens.spacing.micro[1], alignItems: 'center' }}>
              <button
                onClick={async () => {
                  try {
                    setReportStatus('Reporting…');
                    const resp = await fetch('/api/reportMissingContent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ query: q, category, timestamp: Date.now() })
                    });
                    if (!resp.ok) throw new Error('Failed to report');
                    setReportStatus('Thanks! We will review the missing content.');
                  } catch {
                    setReportStatus('Could not send report. Please try again later.');
                  }
                }}
                style={{
                  padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[1]}px`,
                  borderRadius: 12,
                  border: `1px solid ${tokens.colors.separator.opaque}`,
                  background: 'transparent',
                  color: tokens.colors.label.primary,
                  cursor: 'pointer',
                }}
              >
                Report missing content
              </button>
              {reportStatus && (
                <span style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption1 }}>
                  {reportStatus}
                </span>
              )}
            </div>
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gap: tokens.spacing.standard[1],
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          }}
        >
          {results.map((item, idx) => (
            ('media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv')) ? (
              <MediaCard
                key={`m-${(item as MediaItem).media_type}-${(item as MediaItem).id}-${idx}`}
                item={item as MediaItem}
                onClick={onSelectItem}
                castPreview={castPreviewRef.current.get(`${(item as MediaItem).media_type}:${(item as MediaItem).id}`)}
                availabilityDescriptors={availabilityMap.get(`${(item as MediaItem).media_type}:${(item as MediaItem).id}`)}
                regionUnavailable={unavailableMap.get(`${(item as MediaItem).media_type}:${(item as MediaItem).id}`)}
              />
            ) : (
              <PersonCard key={`p-${(item as Person).id}-${idx}`} person={item as Person} />
            )
          ))}
        </div>
      </div>

      {/* Filmography Sections */}
      {(category === 'cast' || category === 'director' || category === 'producer') && (
        <div style={{ display: 'grid', gap: tokens.spacing.standard[2] }}>
          {/* Movies */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.standard[1] }}>
              <h3 style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.title3, fontWeight: tokens.typography.weights.bold, color: tokens.colors.label.primary }}>
                Movies
              </h3>
              {filmographyMovies.length > FILMOGRAPHY_PAGE_SIZE && (
                <div style={{ display: 'flex', gap: tokens.spacing.micro[1], alignItems: 'center' }}>
                  <button
                    onClick={() => setFilmographyPage((p) => ({ ...p, movies: Math.max(1, p.movies - 1) }))}
                    disabled={filmographyPage.movies === 1}
                    style={{ padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[1]}px`, borderRadius: 10, border: `1px solid ${tokens.colors.separator.opaque}`, background: 'transparent', color: tokens.colors.label.primary, cursor: 'pointer' }}
                  >
                    Prev
                  </button>
                  <span style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption1 }}>
                    Page {filmographyPage.movies} / {Math.max(1, Math.ceil(filmographyMovies.length / FILMOGRAPHY_PAGE_SIZE))}
                  </span>
                  <button
                    onClick={() => setFilmographyPage((p) => ({ ...p, movies: Math.min(Math.ceil(filmographyMovies.length / FILMOGRAPHY_PAGE_SIZE), p.movies + 1) }))}
                    disabled={filmographyPage.movies >= Math.ceil(filmographyMovies.length / FILMOGRAPHY_PAGE_SIZE)}
                    style={{ padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[1]}px`, borderRadius: 10, border: `1px solid ${tokens.colors.separator.opaque}`, background: 'transparent', color: tokens.colors.label.primary, cursor: 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: tokens.spacing.standard[1], gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {pagedMovies.map((item, idx) => (
                <MediaCard key={`fm-${item.media_type}-${item.id}-${idx}`} item={item} onClick={onSelectItem} />
              ))}
            </div>
          </div>
          {/* TV Shows */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.standard[1] }}>
              <h3 style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.title3, fontWeight: tokens.typography.weights.bold, color: tokens.colors.label.primary }}>
                TV Shows
              </h3>
              {filmographyTV.length > FILMOGRAPHY_PAGE_SIZE && (
                <div style={{ display: 'flex', gap: tokens.spacing.micro[1], alignItems: 'center' }}>
                  <button
                    onClick={() => setFilmographyPage((p) => ({ ...p, tv: Math.max(1, p.tv - 1) }))}
                    disabled={filmographyPage.tv === 1}
                    style={{ padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[1]}px`, borderRadius: 10, border: `1px solid ${tokens.colors.separator.opaque}`, background: 'transparent', color: tokens.colors.label.primary, cursor: 'pointer' }}
                  >
                    Prev
                  </button>
                  <span style={{ color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption1 }}>
                    Page {filmographyPage.tv} / {Math.max(1, Math.ceil(filmographyTV.length / FILMOGRAPHY_PAGE_SIZE))}
                  </span>
                  <button
                    onClick={() => setFilmographyPage((p) => ({ ...p, tv: Math.min(Math.ceil(filmographyTV.length / FILMOGRAPHY_PAGE_SIZE), p.tv + 1) }))}
                    disabled={filmographyPage.tv >= Math.ceil(filmographyTV.length / FILMOGRAPHY_PAGE_SIZE)}
                    style={{ padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[1]}px`, borderRadius: 10, border: `1px solid ${tokens.colors.separator.opaque}`, background: 'transparent', color: tokens.colors.label.primary, cursor: 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: tokens.spacing.standard[1], gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {pagedTV.map((item, idx) => (
                <MediaCard key={`ft-${item.media_type}-${item.id}-${idx}`} item={item} onClick={onSelectItem} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Related To… */}
      {related.length > 0 && (
        <div>
          <h3
            style={{
              fontFamily: tokens.typography.families.text,
              fontSize: tokens.typography.sizes.title3,
              fontWeight: tokens.typography.weights.bold,
              color: tokens.colors.label.primary,
              marginBottom: tokens.spacing.standard[1],
            }}
          >
            Related to {query.trim()}
          </h3>
          <div
            style={{
              display: 'grid',
              gap: tokens.spacing.standard[1],
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            }}
          >
            {related.map((item, idx) => (
              <MediaCard key={`rel-${item.media_type}-${item.id}-${idx}`} item={item} onClick={onSelectItem} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
