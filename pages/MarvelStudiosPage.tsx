import React, { useState, useCallback } from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';
import { GlassPillButton } from '../components/GlassPillButton';
import { Link, useNavigate } from 'react-router-dom';
import { searchMovies } from '../services/tmdbService';
import VideoPlayer from '../components/VideoPlayer';
import MediaRow from '../components/MediaRow';
import { MediaItem } from '../types';

type Trailer = {
  title: string;
  url: string;
  releaseDate: string; // ISO date for sorting
};

// Robustly parse common YouTube URL formats to extract the video ID
function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      // Shorts or other path-based IDs
      const parts = u.pathname.split('/').filter(Boolean);
      // /shorts/VIDEO_ID or /embed/VIDEO_ID
      const idx = parts.findIndex(p => p === 'shorts' || p === 'embed');
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
    // youtu.be short links: https://youtu.be/VIDEO_ID
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      if (id) return id;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Marvel and Spider-Man MCU trailers (official IMAX channel) with release dates
const MARVEL_TRAILERS: Trailer[] = [
  { title: 'Spider-Man: Homecoming | IMAX Trailer', url: 'https://www.youtube.com/watch?v=bS1VvLlSVZQ', releaseDate: '2017-07-07' },
  { title: 'Avengers: Infinity War | IMAX Trailer', url: 'https://www.youtube.com/watch?v=6ZfuNTqbHE8', releaseDate: '2018-04-27' },
  { title: 'Captain Marvel | IMAX Trailer', url: 'https://www.youtube.com/watch?v=11NQ7ppQw-0', releaseDate: '2019-03-08' },
  { title: 'Avengers: Endgame | IMAX Trailer', url: 'https://www.youtube.com/watch?v=TcMBFSGVi1c', releaseDate: '2019-04-26' },
  { title: 'Spider-Man: Far From Home | IMAX Trailer', url: 'https://www.youtube.com/watch?v=Nt9L1jCKGnE', releaseDate: '2019-07-02' },
  { title: 'Black Widow | IMAX Trailer', url: 'https://www.youtube.com/watch?v=Fp9pNPdNwjI', releaseDate: '2021-07-09' },
  { title: 'Eternals | IMAX Trailer', url: 'https://www.youtube.com/watch?v=x_me3xsvDgk', releaseDate: '2021-11-05' },
  { title: 'Spider-Man: No Way Home | IMAX Trailer', url: 'https://www.youtube.com/watch?v=JfVOs4VSpmA', releaseDate: '2021-12-17' },
  { title: 'Doctor Strange in the Multiverse of Madness | IMAX Trailer', url: 'https://www.youtube.com/watch?v=aWzlQ2N6qqg', releaseDate: '2022-05-06' },
  { title: 'Thor: Love and Thunder | IMAX Trailer', url: 'https://www.youtube.com/watch?v=Go8nTmfrQd8', releaseDate: '2022-07-08' },
  { title: 'Black Panther: Wakanda Forever | IMAX Trailer', url: 'https://www.youtube.com/watch?v=RlOB3UALvrQ', releaseDate: '2022-11-11' },
  { title: 'Ant-Man and the Wasp: Quantumania | IMAX Trailer', url: 'https://www.youtube.com/watch?v=ZlNFpri-Y40', releaseDate: '2023-02-17' },
  { title: 'Guardians of the Galaxy Vol. 3 | IMAX Trailer', url: 'https://www.youtube.com/watch?v=u3V5KDHRQvk', releaseDate: '2023-05-05' },
  { title: 'Thunderbolts* | IMAX Teaser', url: 'https://www.youtube.com/watch?v=KVyPKn1_M6U', releaseDate: '2025-05-02' },
  { title: 'The Fantastic Four: First Steps', url: 'https://youtu.be/0uDUlDmGhUo?si=ZnKiUg_NBFGxnAoO', releaseDate: '2025-07-25' },
];

const sortByReleaseDate = (list: Trailer[]) =>
  [...list].sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());

const getApiKey = (): string => {
  return localStorage.getItem('tmdb_api_key') || '09b97a49759876f2fde9eadb163edc44';
};

function MarvelPosterRowNavigate() {
  const { tokens } = useAppleTheme();
  const sorted = sortByReleaseDate(MARVEL_TRAILERS);
  const [items, setItems] = useState<MediaItem[]>([]);
  const navigate = useNavigate();
  const apiKey = getApiKey();

  const baseTitle = (t: Trailer) => t.title.split(' | ')[0].trim();

  // Resolve TMDb IDs and build MediaItem list for row
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // Specific TMDb ID overrides where title-to-search may be ambiguous
      const OVERRIDES: Record<string, { id: number; title?: string }> = {
        'The Fantastic Four: First Steps': { id: 617126, title: 'The Fantastic Four: First Steps' },
      };

      const entries = await Promise.all(sorted.map(async (t) => {
        const key = baseTitle(t);
        try {
          const override = OVERRIDES[t.title];
          if (override) {
            const item: MediaItem = {
              id: override.id,
              title: override.title || t.title,
              poster_path: null,
              backdrop_path: null,
              release_date: t.releaseDate,
              media_type: 'movie',
              genre_ids: [],
              popularity: 0,
              vote_average: 0,
            };
            return item;
          }
          const res = await searchMovies(apiKey, key, 1);
          const first = (res.results || [])[0];
          if (first && first.id) {
            const item: MediaItem = {
              id: first.id,
              title: first.title || t.title,
              poster_path: (first as any).poster_path || null,
              backdrop_path: (first as any).backdrop_path || null,
              release_date: (first as any).release_date || t.releaseDate,
              media_type: 'movie',
              genre_ids: (first as any).genre_ids || [],
              popularity: (first as any).popularity || 0,
              vote_average: (first as any).vote_average || 0
            };
            return item;
          }
        } catch (e) {
          // ignore and fallback
        }
        return null;
      }));
      if (!cancelled) {
        const deduped: Record<number, MediaItem> = {};
        for (const it of entries) {
          if (it && !deduped[it.id]) deduped[it.id] = it;
        }
        setItems(Object.values(deduped));
      }
    })();
    return () => { cancelled = true; };
  }, [apiKey]);

  const handleSelect = useCallback((item: MediaItem) => {
    // Movies use simplified IMAX route without type prefix
    navigate(`/IMAX/${item.id}`);
  }, [navigate]);

  return (
    <div style={{ marginTop: 24 }}>
      <MediaRow
        title="Marvel Studios"
        items={items}
        onSelectItem={handleSelect}
        apiKey={apiKey}
        imaxOnlyTrailers={true}
      />
    </div>
  );
}

export default function MarvelStudiosPage() {
  return (
    <AppleThemeProvider>
      <MarvelStudiosPageInner />
    </AppleThemeProvider>
  );
}

function MarvelStudiosPageInner() {
  const { tokens } = useAppleTheme();
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="https://i.imgur.com/Z64ekqZ.png"
          alt="Marvel Studios"
          style={{ height: 36 }}
        />
        <div style={{ color: tokens.colors?.label?.secondary || '#aaa', fontSize: 14 }}>
          Official IMAX trailers • Sorted by release order
        </div>
      </div>

      <MarvelPosterRowNavigate />

      <div style={{ marginTop: 24 }}>
        <Link to="/IMAX" style={{ textDecoration: 'none' }}>
          <GlassPillButton>
            Back to IMAX
          </GlassPillButton>
        </Link>
      </div>
    </div>
  );
}
