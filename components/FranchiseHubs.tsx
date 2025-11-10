import React, { useEffect, useMemo, useState } from 'react';
import { useAppleTheme } from './AppleThemeProvider';
import MediaRow from './MediaRow';
import { MediaItem, Movie } from '../types';
import { franchiseKeywords } from '../services/franchiseService';
import { getCollectionDetails, normalizeMovie, getMovieDetails } from '../services/tmdbService';

interface FranchiseHubsProps {
  apiKey: string;
  onSelectItem: (item: MediaItem) => void;
}

type UniqueFranchise = {
  name: string;
  type: 'collection' | 'curated_list';
  id?: number;
  ids?: number[];
  key: string; // internal key for selection
};

const dedupeFranchises = (): UniqueFranchise[] => {
  const map = new Map<string, UniqueFranchise>();
  Object.entries(franchiseKeywords).forEach(([key, data]) => {
    const k = data.name; // use canonical display name as unique key
    if (!map.has(k)) {
      map.set(k, {
        name: data.name,
        type: data.type,
        id: data.id,
        ids: data.ids,
        key: key,
      });
    }
  });
  // Stable ordering by name
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const FranchiseCard: React.FC<{ franchise: UniqueFranchise; onClick: () => void }> = ({ franchise, onClick }) => {
  const { tokens } = useAppleTheme();
  return (
    <button
      onClick={onClick}
      className="rounded-xl backdrop-blur-xl border text-left"
      style={{
        padding: tokens.spacing.standard[1],
        background: `linear-gradient(135deg, ${tokens.colors.background.secondary}B3, ${tokens.colors.background.primary}B3)`,
        borderColor: tokens.colors.separator.opaque,
        boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.standard[0] }}>
        <div className="rounded-lg" style={{ width: 48, height: 48, background: `${tokens.colors.background.secondary}80`, border: `1px solid ${tokens.colors.separator.opaque}` }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: tokens.typography.families.display, fontSize: tokens.typography.sizes.title3, fontWeight: tokens.typography.weights.semibold, color: tokens.colors.label.primary }}>
            {franchise.name}
          </span>
          <span style={{ color: tokens.colors.label.tertiary, fontSize: tokens.typography.sizes.caption1 }}>
            {franchise.type === 'collection' ? 'Collection' : 'Curated'}
          </span>
        </div>
      </div>
    </button>
  );
};

const FranchiseHubs: React.FC<FranchiseHubsProps> = ({ apiKey, onSelectItem }) => {
  const { tokens } = useAppleTheme();
  const franchises = useMemo(() => dedupeFranchises(), []);
  const [selected, setSelected] = useState<UniqueFranchise | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!selected) return;
      setLoading(true);
      setError(null);
      try {
        if (selected.type === 'collection' && selected.id) {
          const coll = await getCollectionDetails(apiKey, selected.id);
          const normalized = (coll.parts || []).map((m: Movie) => normalizeMovie(m));
          // Sort by release date ascending for sensible order
          const sorted = normalized.slice().sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
          setItems(sorted);
        } else if (selected.type === 'curated_list' && selected.ids && selected.ids.length) {
          // Fetch details for curated list entries; keep original order
          const details = await Promise.all(selected.ids.map(async (id) => {
            try {
              const d = await getMovieDetails(apiKey, id);
              // Map MovieDetails into MediaItem shape
              const asMedia: MediaItem = {
                id: d.id,
                title: d.title,
                poster_path: d.poster_path,
                backdrop_path: d.backdrop_path,
                overview: d.overview,
                release_date: d.release_date,
                vote_average: d.vote_average,
                media_type: 'movie',
                genre_ids: d.genres?.map(g => g.id) || [],
                popularity: d.popularity || 0,
                revenue: d.revenue,
                belongs_to_collection: d.belongs_to_collection || null,
              } as MediaItem;
              return asMedia;
            } catch (e) {
              return null;
            }
          }));
          setItems(details.filter(Boolean) as MediaItem[]);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load hub titles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selected, apiKey]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.standard[1] }}>
        <div>
          <h1 style={{ fontFamily: tokens.typography.families.display, fontSize: tokens.typography.sizes.largeTitle, fontWeight: tokens.typography.weights.bold, color: tokens.colors.label.primary }}>
            Franchise Hubs
          </h1>
          <p style={{ color: tokens.colors.label.secondary }}>
            Browse grouped universes like Marvel, DC, Star Wars, and more.
          </p>
        </div>
        {selected && (
          <button
            onClick={() => { setSelected(null); setItems([]); setError(null); }}
            className="rounded-full backdrop-blur-xl border"
            style={{
              padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
              background: `${tokens.colors.background.secondary}80`,
              borderColor: tokens.colors.separator.opaque,
              color: tokens.colors.label.primary
            }}
          >
            Back to Hubs
          </button>
        )}
      </div>

      {!selected && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: tokens.spacing.standard[1], marginTop: tokens.spacing.standard[1] }}>
          {franchises.map(fr => (
            <FranchiseCard key={`${fr.name}-${fr.key}`} franchise={fr} onClick={() => setSelected(fr)} />
          ))}
        </div>
      )}

      {selected && (
        <div>
          <h2 style={{ fontFamily: tokens.typography.families.display, fontSize: tokens.typography.sizes.title2, fontWeight: tokens.typography.weights.bold, color: tokens.colors.label.primary, marginBottom: tokens.spacing.standard[0] }}>
            {selected.name}
          </h2>
          {error && (
            <div className="apple-callout" style={{ color: tokens.colors.label.primary, marginBottom: tokens.spacing.standard[0] }}>
              {error}
            </div>
          )}
          <div style={{ opacity: loading ? 0.6 : 1 }}>
            {items.length > 0 && (
              <MediaRow title="All Titles" items={items} onSelectItem={onSelectItem} apiKey={apiKey} />
            )}
            {!loading && items.length === 0 && (
              <div className="apple-callout" style={{ color: tokens.colors.label.secondary }}>
                No titles found for this hub.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseHubs;

