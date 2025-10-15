import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  const { userSettings, updateUserSettings, user } = useAuth();

  useEffect(() => {
    // Load from user settings if available, otherwise from localStorage
    if (user && userSettings?.streaming_preferences) {
      const syncedProviders = new Set(userSettings.streaming_preferences as number[]);
      setProviderIds(syncedProviders);
      // Also sync to localStorage
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(Array.from(syncedProviders)));
    } else {
      // Fall back to localStorage
      setProviderIds(getStoredSet());
    }
  }, [user, userSettings]);

  const toggleProvider = useCallback(async (providerId: number) => {
    setProviderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }

      // Sync to localStorage
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(Array.from(newSet)));

      // Sync to database if user is logged in
      if (user) {
        updateUserSettings({
          streaming_preferences: Array.from(newSet)
        }).catch(error => {
          console.error('Failed to sync streaming preferences:', error);
        });
      }

      return newSet;
    });
  }, [user, updateUserSettings]);

  const isProviderSelected = useCallback((providerId: number) => {
    return providerIds.has(providerId);
  }, [providerIds]);

  return { providerIds, toggleProvider, isProviderSelected, availableProviders };
};
