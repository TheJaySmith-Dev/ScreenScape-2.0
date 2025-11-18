## Overview
- Add two titles to the IMAX curated row with correct trailers and posters.
- Update the existing Avatar: Fire and Ash entry to use the latest trailer.
- Add a new Mercy entry and ensure TMDb mapping for poster resolution.

## Where It Hooks In
- IMAX curated titles are defined in `services/imaxCuratedService.ts:12–36` and rendered via `components/ImaxView.tsx:388–402`.
- Trailer expansion prefers curated YouTube IDs (`components/ImaxView.tsx:160–171`, `293–317`).
- Posters are resolved from TMDb images in `components/MediaRow.tsx:60–76` with OMDb fallback at `components/MediaRow.tsx:78–86`.

## Changes
- Update Avatar: Fire and Ash trailer:
  - Edit `services/imaxCuratedService.ts:20` to set `youtubeUrl` to `https://youtu.be/8L5P5_lOjt8?si=lqeFDHYhufokg3DD`.
  - Optional: Set `tmdbId: 83533, mediaType: 'movie'` to lock correct poster/backdrop from TMDb (page: themoviedb.org/movie/83533).
- Add Mercy:
  - Append a new entry in `services/imaxCuratedService.ts:12–36`:
    - `{ title: 'Mercy', youtubeUrl: 'https://youtu.be/i_kL2yezoGU?si=tWVNB0_CdGPi1l2D', tmdbId: 1236153, mediaType: 'movie' }`.
  - Poster will be pulled from TMDb automatically; if TMDb posters are missing, the OMDb fallback may provide one. Your provided poster URL will be used if we add an optional override (see Enhancements).

## Enhancements (Optional)
- If you want to force specific poster URLs for curated items:
  - Extend `ImaxCuratedEntry` with `posterUrl?: string` in `services/imaxCuratedService.ts:4–9`.
  - In `resolveCuratedMediaItems`, when building `MediaItem`, attach a `poster_override` field if present.
  - Update `components/MediaRow.tsx` to use `item.poster_override` when available before calling TMDb/OMDb (`components/MediaRow.tsx:60–101`).
  - Use your poster URLs:
    - Avatar poster: `https://image.tmdb.org/t/p/original/5bxrxnRaxZooBAxgUVBZ13dpzC7.jpg`
    - Mercy poster: `https://images.ctfassets.net/c4ucztjx9pmu/l0NUpgki3ASezTUoiMkqO/46bc26a1c73afd1f478a355961ba27dd/mercy-MCY_KEY_Press_2765x4096_810_F7_F1_rgb.jpg`

## Verification
- Open the IMAX page route `path '/IMAX'` (see `index.tsx:31`) and confirm both titles appear in the "IMAX Curated" row.
- Click each card:
  - Confirm the expanded player uses the curated trailer (`components/ImaxView.tsx:160–171`).
  - Confirm backdrops/posters resolve.
- If poster overrides are enabled, confirm the cards show your supplied posters.

## Notes
- You asked for “Mercey”; proceeding with “Mercy” (Chris Pratt/Rebecca Ferguson) per studio materials.
- No changes are needed to `pages/ImaxPage.tsx` or routing; curated updates are sufficient.