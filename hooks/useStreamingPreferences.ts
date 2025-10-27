import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import syncManager from '../utils/syncOffline';

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
    if (user) {
      // Logged in: use database as source of truth
      if (userSettings?.streaming_preferences) {
        setProviderIds(new Set(userSettings.streaming_preferences as number[]));
      } else {
        // Check if we have local preferences to migrate
        const localPrefs = getStoredSet();
        if (localPrefs.size > 0) {
          // Migrate local preferences to database
          const prefsArray = Array.from(localPrefs);
          updateUserSettings({ streaming_preferences: prefsArray }).catch(error => {
            console.error('Failed to migrate streaming preferences:', error);
          });
          setProviderIds(localPrefs);
        } else {
          setProviderIds(new Set());
        }
      }
    } else {
      // Not logged in: use localStorage
      setProviderIds(getStoredSet());
    }
  }, [user, userSettings, updateUserSettings]);

  // Listen for import events to refresh streaming preferences
  useEffect(() => {
    const handlePreferencesChanged = () => {
      console.log('🎬 Streaming preferences changed, reloading from localStorage');
      setProviderIds(getStoredSet());
    };

    window.addEventListener('streamingPreferencesChanged', handlePreferencesChanged);

    // Also listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY) {
        console.log('📱 Storage change detected for streaming preferences');
        setProviderIds(getStoredSet());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('streamingPreferencesChanged', handlePreferencesChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleProvider = useCallback(async (providerId: number) => {
    setProviderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }

      const prefsArray = Array.from(newSet);

      if (user) {
        // For logged in users: sync to both localStorage and database (via syncManager for offline support)
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefsArray));
        syncManager.addToOfflineQueue('user_settings', {
          user_id: user.id,
          settings: { streaming_preferences: prefsArray }
        });
      } else {
        // For non-logged in users: only localStorage
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefsArray));
      }

      return newSet;
    });
  }, [user]);

  const isProviderSelected = useCallback((providerId: number) => {
    return providerIds.has(providerId);
  }, [providerIds]);

  return { providerIds, toggleProvider, isProviderSelected, availableProviders };
};
