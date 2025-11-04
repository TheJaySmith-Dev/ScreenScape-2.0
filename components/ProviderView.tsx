import React, { useEffect, useMemo, useRef, useState } from 'react';
import HeroCarousel from './HeroCarousel';
import MediaRow from './MediaRow';
import Loader from './Loader';
import StreamingHubs from './StreamingHubs';
import { MediaItem, Movie } from '../types';
import { getTrending, getMovieWatchProviders } from '../services/tmdbService';
import { useGeolocation } from '../hooks/useGeolocation';
import { availableProviders } from '../hooks/useStreamingPreferences';
import { isMobileDevice } from '../utils/deviceDetection';

interface ProviderViewProps {
  apiKey: string;
  providerId: number;
  providerName: string;
  onSelectItem: (item: MediaItem) => void;
  onInvalidApiKey: () => void;
  onBack: () => void;
}

// Map provider names to hover GIFs (as provided)
const providerGifMap: Record<string, string> = {
  'Disney+': 'https://media.giphy.com/media/LtAjCYgjUsUVeYNbQl/giphy.gif',
  'Netflix': 'https://media.giphy.com/media/c69RGBBRK8SKwMO78n/giphy.gif',
  'HBO Max': 'https://media.giphy.com/media/wzK2hDKussGKwa7CiB/giphy.gif',
  'Max': 'https://media.giphy.com/media/wzK2hDKussGKwa7CiB/giphy.gif',
  'Hulu': 'https://media.giphy.com/media/UIwMMKYYRRbUtfBFEf/giphy.gif',
  'Paramount+': 'https://media.giphy.com/media/alfSqlC9s7wdqDAOZY/giphy.gif',
  'Amazon Prime Video': 'https://media.giphy.com/media/gvfw1b9opaAFgOTBDI/giphy.gif',
  'Prime Video': 'https://media.giphy.com/media/gvfw1b9opaAFgOTBDI/giphy.gif',
};

const ProviderView: React.FC<ProviderViewProps> = ({ apiKey, providerId, providerName, onSelectItem, onInvalidApiKey, onBack }) => {
  const { country } = useGeolocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ title: string; items: Movie[] }[]>([]);
  const [activeHub, setActiveHub] = useState<number | null>(providerId);
  const [hoveredProviderName, setHoveredProviderName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const trending = await getTrending(apiKey, 'week');
        let movies = trending.results.filter(i => i.media_type === 'movie');

        // Filter by selected provider
        const filtered: Movie[] = [] as Movie[];
        for (const m of movies) {
          try {
            const providers = await getMovieWatchProviders(apiKey, m.id, country.code);
            const c = providers.results[country.code];
            const has = c && (
              (c.flatrate && c.flatrate.some(p => p.provider_id === providerId)) ||
              (c.rent && c.rent.some(p => p.provider_id === providerId)) ||
              (c.buy && c.buy.some(p => p.provider_id === providerId))
            );
            if (has) filtered.push(m as Movie);
          } catch (err) {
            // ignore individual failures
          }
        }

        if (!mounted) return;
        setRows([
          { title: `Top picks on ${providerName}`, items: filtered.slice(0, 10) },
          { title: 'Trending Now', items: filtered.slice(10, 20) },
        ]);
      } catch (err: any) {
        console.error(err);
        if (err?.message?.includes('Invalid API Key')) onInvalidApiKey();
        setError('Failed to load provider content.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [apiKey, providerId, providerName, country.code, onInvalidApiKey]);

  const currentGif = hoveredProviderName && providerGifMap[hoveredProviderName];
  const isMobile = isMobileDevice();

  const headerTitle = useMemo(() => {
    const p = availableProviders.find(p => p.id === providerId);
    return p ? p.name : providerName;
  }, [providerId, providerName]);

  return (
    <div className="flex flex-col space-y-4 md:space-y-8">
      {/* Hero area: mobile always visible; desktop swapped to GIF on hover */}
      {(!isMobile && currentGif) ? (
        <div className="relative min-h-[520px] sm:h-[80vh] w-full overflow-hidden">
          <img src={currentGif} alt={`${hoveredProviderName} animation`} className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-primary/60" />
        </div>
      ) : (
        <HeroCarousel apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col space-y-8 -mt-24 md:-mt-32 relative z-10 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Top channels for you: {headerTitle}</h2>
          <button onClick={onBack} className="px-4 py-2 rounded-lg bg-white text-black font-semibold">Back</button>
        </div>

        {/* Streaming hubs to allow switching providers and hover GIF on desktop */}
        <StreamingHubs
          activeHub={activeHub}
          setActiveHub={(id) => setActiveHub(id)}
          onHoverProvider={(name) => setHoveredProviderName(name)}
        />

        {isLoading && <Loader />}
        {error && <div className="text-red-400">{error}</div>}
        {!isLoading && !error && rows.map((row, idx) => (
          <MediaRow key={`${row.title}-${idx}`} title={row.title} items={row.items} onSelectItem={onSelectItem} apiKey={apiKey} />
        ))}
      </div>
    </div>
  );
};

export default ProviderView;
