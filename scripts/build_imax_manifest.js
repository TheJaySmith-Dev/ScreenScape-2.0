// Build an IMAX trailers manifest with metadata using TMDb
// Usage: TMDB_API_KEY=your_key node scripts/build_imax_manifest.js
// Output: assets/imax_collection/manifest.json

import fs from 'fs';
import path from 'path';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '09b97a49759876f2fde9eadb163edc44';
const OUT_DIR = path.join('assets', 'imax_collection');
const OUT_FILE = path.join(OUT_DIR, 'manifest.json');

const CURATED_TITLES = [
  'Fantasia 2000',
  'Space Station',
  'Spider-Man 2',
  'Superman Returns',
  'Transformers',
  'The Dark Knight',
  'Watchmen',
  'Avatar',
  'Alice in Wonderland',
  'Tron: Legacy',
  'Transformers: Dark of the Moon',
  'The Dark Knight Rises',
  'The Hobbit: An Unexpected Journey',
  'Gravity',
  'The Hobbit: The Desolation of Smaug',
  'Interstellar',
  'The Hobbit: The Battle of the Five Armies',
  'Mission: Impossible – Rogue Nation',
  'Star Wars: The Force Awakens',
  'Batman v Superman: Dawn of Justice',
  'Captain America: Civil War',
  'Independence Day: Resurgence',
  'Rogue One: A Star Wars Story',
  'Guardians of the Galaxy Vol. 2',
  'Dunkirk',
  'Star Wars: The Last Jedi',
  'Avengers: Infinity War',
  'Mission: Impossible – Fallout',
  'First Man',
  'Aquaman',
  'Avengers: Endgame',
  'Star Wars: The Rise of Skywalker',
  'Tenet',
  'Wonder Woman 1984',
  'No Time to Die',
  'Dune',
  'Top Gun: Maverick',
  'Jurassic World Dominion',
  'Nope',
  'Black Panther: Wakanda Forever',
  'Avatar: The Way of Water',
  'Mufasa: The Lion King',
  'Dune: Part Two',
  'Furiosa: A Mad Max Saga',
  'Deadpool & Wolverine',
  'Joker: Folie à Deux',
  'Gladiator II',
  'Wicked',
  'Moana 2',
  'Avatar: Fire and Ash'
];

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function tmdb(pathname, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3/${pathname}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb ${pathname} failed: ${res.status}`);
  return res.json();
}

function filterImaxVideos(videos) {
  const isImaxName = (name = '') => /imax/i.test(name);
  const primary = videos.filter(v => (
    v.site === 'YouTube' && isImaxName(v.name) && ['Trailer', 'Teaser', 'Clip', 'Featurette'].includes(v.type)
  ));
  const fallbackExpanded = videos.filter(v => (
    v.site === 'YouTube' && /imax/i.test(v.name) && /expanded/i.test(v.name) && v.type === 'Trailer'
  ));
  const pickFrom = primary.length ? primary : fallbackExpanded;
  // Sort by official first, then size/resolution desc, then recent
  return pickFrom.sort((a, b) => {
    if (a.official && !b.official) return -1;
    if (b.official && !a.official) return 1;
    const sizeDiff = (b.size || 0) - (a.size || 0);
    if (sizeDiff !== 0) return sizeDiff;
    return (new Date(b.published_at || 0)).getTime() - (new Date(a.published_at || 0)).getTime();
  });
}

async function resolveMovieByTitle(title) {
  const search = await tmdb('search/movie', { query: title, include_adult: 'false' });
  const results = Array.isArray(search.results) ? search.results : [];
  const target = normalize(title);
  let pick = null;
  for (const r of results) {
    const cand = normalize(r.title || r.original_title || '');
    if (cand === target) { pick = r; break; }
  }
  if (!pick && results.length > 0) pick = results[0];
  return pick;
}

async function buildManifest() {
  const entries = [];
  for (const title of CURATED_TITLES) {
    try {
      const movie = await resolveMovieByTitle(title);
      if (!movie) {
        entries.push({
          title,
          status: 'not_found'
        });
        continue;
      }

      const videosResp = await tmdb(`movie/${movie.id}/videos`, { language: 'en-US' });
      const details = await tmdb(`movie/${movie.id}`, { language: 'en-US' });
      const imaxVideos = filterImaxVideos(videosResp.results || []);

      const videoEntries = (imaxVideos || []).map(v => ({
        site: v.site,
        key: v.key,
        name: v.name,
        type: v.type,
        official: !!v.official,
        published_at: v.published_at || null,
        size: v.size || null,
        url: v.site === 'YouTube' ? `https://www.youtube-nocookie.com/embed/${v.key}` : null
      }));

      entries.push({
        tmdb_id: movie.id,
        title: details.title || title,
        original_title: details.original_title || null,
        release_date: details.release_date || null,
        runtime_minutes: details.runtime || null,
        original_language: details.original_language || null,
        backdrop_path: details.backdrop_path || null,
        poster_path: details.poster_path || null,
        imax_videos: videoEntries,
        status: videoEntries.length ? 'ok' : 'no_imax_video_found'
      });
    } catch (e) {
      entries.push({ title, status: 'error', error: String(e && e.message ? e.message : e) });
    }
  }

  return {
    generated_at: new Date().toISOString(),
    source: 'TMDb',
    titles_count: CURATED_TITLES.length,
    entries
  };
}

async function main() {
  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY is required');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = await buildManifest();
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`IMAX manifest written to ${OUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

