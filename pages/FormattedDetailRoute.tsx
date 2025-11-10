import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AppleThemeProvider } from '../components/AppleThemeProvider';
import Loader from '../components/Loader';
import MediaDetail from '../components/MediaDetail';
import { MediaItem, Movie, TVShow } from '../types';
import { getMovieDetails, getTVShowDetails } from '../services/tmdbService';

// Resolve API key consistently
const getApiKey = (): string => {
  return localStorage.getItem('tmdb_api_key') || '09b97a49759876f2fde9eadb163edc44';
};

const FormattedDetailRoute: React.FC = () => {
  const { type, id } = useParams<{ type?: string; id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = getApiKey();

  const preferImaxTrailer = useMemo(() => location.pathname.startsWith('/IMAX'), [location.pathname]);
  // When type prefix is omitted (e.g., /IMAX/:id), default to 'movie'
  const mediaType: 'movie' | 'tv' = type === 't' ? 'tv' : 'movie';
  const numericId = Number(id);

  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (mediaType === 'movie') {
          const details = await getMovieDetails(apiKey, numericId);
          // Ensure media_type is present for downstream logic
          const withType = { ...(details as unknown as Movie), media_type: 'movie' } as MediaItem;
          if (!cancelled) setItem(withType);
        } else {
          const details = await getTVShowDetails(apiKey, numericId);
          // Ensure media_type is present for downstream logic
          const withType = { ...(details as unknown as TVShow), media_type: 'tv' } as MediaItem;
          if (!cancelled) setItem(withType);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load media');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiKey, mediaType, numericId]);

  const handleClose = useCallback(() => {
    // Go back to IMAX or previous page
    if (location.pathname.startsWith('/IMAX')) {
      navigate('/IMAX');
    } else {
      navigate(-1);
    }
  }, [location.pathname, navigate]);

  const handleSelectItem = useCallback((next: MediaItem) => {
    const prefix = location.pathname.startsWith('/IMAX') ? '/IMAX' : '/Browse';
    if (prefix === '/IMAX') {
      // For IMAX, drop movie prefix for simpler URLs; keep 't.' for TV
      if (next.media_type === 'tv') {
        navigate(`${prefix}/t.${next.id}`);
      } else {
        navigate(`${prefix}/${next.id}`);
      }
    } else {
      const t = next.media_type === 'tv' ? 't' : 'm';
      navigate(`${prefix}/${t}.${next.id}`);
    }
  }, [navigate, location.pathname]);

  const handleInvalidApiKey = useCallback(() => {
    console.warn('Invalid TMDb API key');
  }, []);

  return (
    <AppleThemeProvider>
      {loading ? (
        <Loader />
      ) : error ? (
        <div style={{ padding: 16, color: '#ef4444' }}>{error}</div>
      ) : item ? (
        <MediaDetail
          item={item}
          apiKey={apiKey}
          onClose={handleClose}
          onSelectItem={handleSelectItem}
          onInvalidApiKey={handleInvalidApiKey}
          preferImaxTrailer={preferImaxTrailer}
        />
      ) : (
        <div style={{ padding: 16 }}>Not found</div>
      )}
    </AppleThemeProvider>
  );
};

export default FormattedDetailRoute;
