import { useState, useCallback, useEffect } from 'react';

const PREFERENCES_KEY = 'screenScapeStreamingProviders';

// From https://www.themoviedb.org/settings/api/watch_providers
export const availableProviders = [
    { id: 8, name: 'Netflix', imageUrl: 'https://pbs.twimg.com/profile_images/1872671711700582400/6WLZxYpq_400x400.jpg' },
    { id: 337, name: 'Disney+', imageUrl: 'https://pbs.twimg.com/profile_images/1772896893682524160/_gfqHUV6_400x400.jpg' },
    { id: 9, name: 'Prime Video', imageUrl: 'https://pbs.twimg.com/profile_images/1877027093483237380/dH33kIep_400x400.jpg' },
    { id: 1899, name: 'Max', imageUrl: 'https://pbs.twimg.com/profile_images/1942950903616565248/kpdYwNGJ_400x400.jpg' },
    { id: 2, name: 'Apple TV+', imageUrl: 'https://pbs.twimg.com/profile_images/1763709816566841344/fVdFS0gD_400x400.jpg' },
    { id: 15, name: 'Hulu', imageUrl: 'https://nextgen.teamwass.com/wp-content/uploads/2020/05/hulu0-square.jpg' },
];

const getStoredSet = (): Set<number> => {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

export const useStreamingPreferences = () => {
  const [providerIds, setProviderIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setProviderIds(getStoredSet());
  }, []);

  const toggleProvider = useCallback((providerId: number) => {
    setProviderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);
  
  const isProviderSelected = useCallback((providerId: number) => {
    return providerIds.has(providerId);
  }, [providerIds]);

  return { providerIds, toggleProvider, isProviderSelected, availableProviders };
};