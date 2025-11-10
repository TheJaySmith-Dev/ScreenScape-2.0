import React, { useEffect, useState, useCallback } from 'react';
import { useAppleTheme } from './AppleThemeProvider';
import { mdbGenres, MdbGenre } from '../services/mdblistService';

type Props = {
  initialApiKey?: string | null;
};

const MdbGenresView: React.FC<Props> = ({ initialApiKey }) => {
  const { tokens } = useAppleTheme();
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey || localStorage.getItem('mdblist_api_key'));
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<MdbGenre[]>([]);

  const handleSaveKey = useCallback(() => {
    if (!newKey.trim()) return;
    localStorage.setItem('mdblist_api_key', newKey.trim());
    setApiKey(newKey.trim());
    setNewKey('');
  }, [newKey]);

  const fetchGenres = useCallback(async () => {
    if (!apiKey) {
      setError('Enter MDBList API key to load genres.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await mdbGenres.getGenres(apiKey);
      setGenres(res || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch genres');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) {
      fetchGenres();
    }
  }, [apiKey, fetchGenres]);

  return (
    <div style={{ display: 'grid', gap: tokens.spacing.standard[1], color: tokens.colors.label.primary }}>
      <h2 style={{ margin: 0 }}>MDB Genres</h2>
      {!apiKey && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            aria-label="MDBList API Key"
            placeholder="Enter MDBList API key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              color: 'inherit'
            }}
          />
          <button onClick={handleSaveKey} style={{ padding: '10px 16px', borderRadius: 12 }}>Save Key</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={fetchGenres} style={{ padding: '10px 16px', borderRadius: 12 }}>Refresh Genres</button>
      </div>
      {error && (
        <div role="alert" style={{ color: '#ff6b6b' }}>{error}</div>
      )}
      {loading && <div>Loading…</div>}

      {!loading && genres?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {genres.map((g) => (
            <div key={g.slug} style={{
              padding: '8px 12px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 14
            }}>
              {g.name}
            </div>
          ))}
        </div>
      )}

      {!loading && genres?.length === 0 && !error && (
        <div>No genres available.</div>
      )}
    </div>
  );
};

export default MdbGenresView;

