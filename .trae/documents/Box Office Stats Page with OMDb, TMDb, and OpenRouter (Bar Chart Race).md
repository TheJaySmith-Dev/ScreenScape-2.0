## Goals
- Add a new "Box Office Stats" page using OMDb for posters/facts and TMDb for all box office numbers.
- Provide Top 15 lists: Global Box Office and Actor-focused (e.g., Tom Cruise).
- Generate a bar chart race timeline by querying BoxOfficeMojo via the existing OpenRouter free model.

## Data Sources & Rules
- Posters, facts, extra metadata: OMDb via existing client (`services/omdbService.ts`).
- Box office numbers: TMDb `MovieDetails.revenue` field only (`types.ts` lines 148–157; `tmdbService.ts` movie details).
- Bar chart race timeline: Use OpenRouter free model (`meta-llama/llama-3.3-8b-instruct:free`) to extract date-stamped snapshots from BoxOfficeMojo with sources and dates.

## Routing & Page Skeleton
- Add route in `index.tsx` (lines 26–40): `Route path="/Stats/BoxOffice" element={<BoxOfficeStatsPage />} />`.
- New page: `pages/BoxOfficeStatsPage.tsx` with sections:
  - Global Top 15 (worldwide revenue).
  - Actor Top 15 (select actor, default Tom Cruise).
  - Bar Chart Race (timeline; global or actor mode).
- Reuse UI: `TopNavigation`, `GlassPanel`, `Loader`, `GlassPosterCard`, `MediaRow` patterns.

## Global Top 15 (TMDb)
- Add a TMDb discover helper in `services/tmdbService.ts`:
  - `discoverTopRevenueMovies(apiKey: string, page = 1): Promise<{ results: Movie[] }>` to call `/discover/movie?sort_by=revenue.desc&include_adult=false&include_video=false`.
  - Alternatively, use existing `getMovieDetails(apiKey, id)` for each result to ensure `revenue` is present.
- In `BoxOfficeStatsPage`, fetch top results, then enrich with OMDb:
  - For each movie, call `getOMDbFromTMDBDetails(details)` to get `Poster`, `Plot`, `Runtime`, `Awards`, etc (see `services/omdbService.ts` usage in `components/MediaDetail.tsx:1510–1519`).
  - Display ranked cards (1–15) with OMDb poster preferred; TMDb image fallback when OMDb poster missing (use TMDb image base as seen in `GlassPosterCard.tsx`).

## Actor Top 15 (TMDb + OMDb)
- Use existing person endpoints in `services/tmdbService.ts` (lines 378–469 for person search/credits):
  - `searchPerson(apiKey, name)` → choose the first match (Tom Cruise by default).
  - `getPersonCombinedCredits(apiKey, personId)` → filter `cast` for `media_type === 'movie'`.
- For each film, call `getMovieDetails(apiKey, id)` and read `revenue` to rank Top 15.
- Enrich each with OMDb via `getOMDbFromTMDBDetails(details)` to show poster and facts.
- Provide an input to change the actor; debounce search and re-render.

## Bar Chart Race (BoxOfficeMojo via OpenRouter)
- Extend `components/openrouter.js` (lines 10–72 baseline): add `generateBoxOfficeRaceData(query: { mode: 'global'|'actor', actorName?: string })`.
  - Prompt instructs the model to:
    - Search BoxOfficeMojo for relevant pages.
    - Extract a timeline of date-stamped snapshots (e.g., weekly or monthly) of cumulative worldwide grosses and rankings.
    - Return strict JSON: `{ frames: Array<{ date: string, entries: Array<{ title: string, grossCumeUsd: number, sourceUrl: string }> }> }`.
    - Include `sourceUrl` per entry; prefer canonical pages (yearly/weekend/ALLTIME) and ensure dates are valid ISO.
  - Use the configured free model (`games/studio-mogul/openrouterNames.ts` shows `meta-llama/llama-3.3-8b-instruct:free`).
- New component: `components/BarChartRace.tsx` (no external chart libs):
  - Props: `frames`, `durationMsPerFrame`, `maxBars = 15`.
  - Compute per-frame normalization (max gross for width scaling).
  - Animate bars and labels over time via `requestAnimationFrame` and CSS transitions.
  - Provide play/pause, speed control, and mode toggle (Global vs Actor).
- Fallbacks:
  - If OpenRouter cannot produce valid frames (network/CORS/model limits), fallback to a static ranking progression synthesized from TMDb `revenue` and `release_date` (simple linear accrual placeholder) with a clear "estimated" badge.

## Types & Data Flow
- Use existing `MediaItem`, `Movie`, `MovieDetails` (`types.ts` lines 1–203).
- Preserve TMDb as the single source for `revenue`.
- Prefer OMDb poster/facts; when missing, fallback to TMDb images (`image.tmdb.org` used across components like `GlassPosterCard.tsx`, `GlassHero.tsx`).

## Caching & Performance
- LocalStorage cache with TTL (pattern in `services/imaxCuratedService.ts` lines 82–106):
  - Cache Global Top 15 results and Actor Top 15 for 12h.
  - Cache OpenRouter race frames for 6h.
- Show `Loader` while fetching; soft-fail with informative messages.

## Keys & Config
- OMDb key: `localStorage('omdb_api_key')` or `import.meta.env.VITE_OMDB_API_KEY` (`services/omdbService.ts` lines 299–317; UI key notice in `components/MediaDetail.tsx:2639–2655`).
- TMDb key: `localStorage('tmdb_api_key')` fallback present (`pages/FormattedDetailRoute.tsx:9–13`, `pages/MarvelStudiosPage.tsx:63–66`).
- OpenRouter key/model: `VITE_OPENROUTER_API_KEY`, `VITE_OPENROUTER_MODEL` (`components/openrouter.js` lines 1–3).

## Error Handling
- Invalid `tmdb_api_key`: reuse `onInvalidApiKey` pattern (`App.tsx:80–88`).
- OMDb unavailable: show notice (pattern in `components/MediaDetail.tsx:2639–2655`).
- OpenRouter failures: present a clear banner and switch to fallback estimated timeline.

## Verification
- Navigate to `/Stats/BoxOffice` and confirm:
  - Global Top 15 shows OMDb posters/facts and TMDb revenue rankings.
  - Actor Top 15 (Tom Cruise default) ranks correctly by `revenue` and displays OMDb metadata.
  - Bar Chart Race plays with valid dates and sources; when unavailable, shows fallback.
- Spot-check entries against BoxOfficeMojo links rendered in the UI.

## Implementation Steps
1) Add route and create `pages/BoxOfficeStatsPage.tsx` with three sections and shared UI.
2) Implement `discoverTopRevenueMovies` in `services/tmdbService.ts` and wire Global Top 15.
3) Implement actor flow using `searchPerson` + `getPersonCombinedCredits` + `getMovieDetails` revenue aggregation.
4) Extend `components/openrouter.js` with `generateBoxOfficeRaceData` and build `components/BarChartRace.tsx` for animation.
5) Add caching, error states, and OMDb/TMDb tie-ins.
6) Validate with real data and adjust prompts for OpenRouter to maximize structured, source-linked frames.

If you approve this plan, I’ll implement the new page, services, and components, wire the route, and verify the experience end-to-end.