import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDeviceSync } from '../hooks/useDeviceSync';

interface UserPreference {
  media_id: number;
  media_type: string;
  preference: 'like' | 'dislike';
  timestamp: string;
}

interface UserSettings {
  tmdb_api_key?: string;
  theme_preferences?: any;
  streaming_preferences?: any;
  voice_preferences?: any;
  content_preferences?: UserPreference[];
  updated_at?: string;
}

interface WatchlistItem {
  id: string;
  media_id: string;
  media_type: string;
  media_data: any;
  added_at: string;
  updated_at: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  searched_at: string;
}

interface GameProgress {
  [gameType: string]: any;
}

interface AuthContextType {
  userSettings: UserSettings | null;
  watchlist: WatchlistItem[];
  searchHistory: SearchHistoryItem[];
  gameProgress: GameProgress;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  addToWatchlist: (mediaId: string, mediaType: string, mediaData?: any) => Promise<void>;
  removeFromWatchlist: (mediaId: string, mediaType: string) => Promise<void>;
  addSearchHistory: (query: string) => Promise<void>;
  updateGameProgress: (gameType: string, progress: any) => Promise<void>;
  addContentPreference: (mediaId: number, mediaType: string, preference: 'like' | 'dislike') => Promise<void>;
  removeContentPreference: (mediaId: number, mediaType: string) => Promise<void>;
  getContentPreference: (mediaId: number, mediaType: string) => 'like' | 'dislike' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { UserPreference };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [gameProgress, setGameProgress] = useState<GameProgress>({});

  // Sync hook for device-to-device sync
  const { syncState, sendUpdate, preferences: syncPreferences } = useDeviceSync();

  // Load data from localStorage on mount
  useEffect(() => {
    // Load user settings
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        setUserSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    }

    // Load watchlist
    const savedWatchlist = localStorage.getItem('userWatchlist');
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (error) {
        console.error('Error loading watchlist:', error);
      }
    }

    // Load search history
    const savedSearchHistory = localStorage.getItem('userSearchHistory');
    if (savedSearchHistory) {
      try {
        setSearchHistory(JSON.parse(savedSearchHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }

    // Load game progress
    const savedGameProgress = localStorage.getItem('userGameProgress');
    if (savedGameProgress) {
      try {
        setGameProgress(JSON.parse(savedGameProgress));
      } catch (error) {
        console.error('Error loading game progress:', error);
      }
    }
  }, []);

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    const newSettings = {
      ...userSettings,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    setUserSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
  };

  const addToWatchlist = async (mediaId: string, mediaType: string, mediaData?: any) => {
    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      media_id: mediaId,
      media_type: mediaType,
      media_data: mediaData,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedWatchlist = [
      newItem,
      ...watchlist.filter(item => !(item.media_id === mediaId && item.media_type === mediaType))
    ];

    setWatchlist(updatedWatchlist);
    localStorage.setItem('userWatchlist', JSON.stringify(updatedWatchlist));
  };

  const removeFromWatchlist = async (mediaId: string, mediaType: string) => {
    const updatedWatchlist = watchlist.filter(item => !(item.media_id === mediaId && item.media_type === mediaType));
    setWatchlist(updatedWatchlist);
    localStorage.setItem('userWatchlist', JSON.stringify(updatedWatchlist));
  };

  const addSearchHistory = async (query: string) => {
    if (!query.trim()) return;

    const newSearch: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      searched_at: new Date().toISOString(),
    };

    const updatedHistory = [newSearch, ...searchHistory.slice(0, 49)]; // Keep last 50
    setSearchHistory(updatedHistory);
    localStorage.setItem('userSearchHistory', JSON.stringify(updatedHistory));
  };

  const updateGameProgress = async (gameType: string, progress: any) => {
    const updatedProgress = {
      ...gameProgress,
      [gameType]: progress,
    };

    setGameProgress(updatedProgress);
    localStorage.setItem('userGameProgress', JSON.stringify(updatedProgress));
  };

  const addContentPreference = async (mediaId: number, mediaType: string, preference: 'like' | 'dislike') => {
    const currentPreferences = userSettings?.content_preferences || [];
    const existingIndex = currentPreferences.findIndex(
      p => p.media_id === mediaId && p.media_type === mediaType
    );

    let newPreferences: UserPreference[];
    if (existingIndex >= 0) {
      // Update existing preference
      newPreferences = [...currentPreferences];
      newPreferences[existingIndex] = {
        media_id: mediaId,
        media_type: mediaType,
        preference,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Add new preference
      newPreferences = [...currentPreferences, {
        media_id: mediaId,
        media_type: mediaType,
        preference,
        timestamp: new Date().toISOString(),
      }];
    }

    // Update userSettings
    const updatedSettings = {
      ...userSettings,
      content_preferences: newPreferences,
      updated_at: new Date().toISOString(),
    };

    setUserSettings(updatedSettings);
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));

    // Also store separately for quick access
    localStorage.setItem('user_content_preferences', JSON.stringify(newPreferences));
  };

  const removeContentPreference = async (mediaId: number, mediaType: string) => {
    const currentPreferences = userSettings?.content_preferences || [];
    const newPreferences = currentPreferences.filter(
      p => !(p.media_id === mediaId && p.media_type === mediaType)
    );

    const updatedSettings = {
      ...userSettings,
      content_preferences: newPreferences,
      updated_at: new Date().toISOString(),
    };

    setUserSettings(updatedSettings);
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    localStorage.setItem('user_content_preferences', JSON.stringify(newPreferences));
  };

  const getContentPreference = (mediaId: number, mediaType: string): 'like' | 'dislike' | null => {
    const preferences = userSettings?.content_preferences || [];
    const preference = preferences.find(
      p => p.media_id === mediaId && p.media_type === mediaType
    );
    return preference ? preference.preference : null;
  };

  // Auto-sync when data changes (only for connected devices)
  useEffect(() => {
    const syncData = async () => {
      if (syncState.isConnected && !syncState.isSyncing) {
        const contentPrefs = userSettings?.content_preferences || [];
        const likedMovieIds = contentPrefs.filter(p => p.preference === 'like').map(p => p.media_id);
        const dislikedMovieIds = contentPrefs.filter(p => p.preference === 'dislike').map(p => p.media_id);

        const preferences = {
          userSettings,
          watchlist,
          searchHistory,
          gameProgress,
          likedMovies: likedMovieIds,
          dislikedMovies: dislikedMovieIds
        };

        // Include current timestamp for last write wins merging
        preferences.userSettings = {
          ...userSettings,
          updated_at: new Date().toISOString()
        };

        await sendUpdate(preferences);
      }
    };

    if (userSettings || watchlist.length || searchHistory.length || Object.keys(gameProgress).length) {
      const timeoutId = setTimeout(syncData, 1000); // Debounce syncs
      return () => clearTimeout(timeoutId);
    }
  }, [userSettings, watchlist, searchHistory, gameProgress, syncState.isConnected, syncState.isSyncing, sendUpdate]);

  // Handle incoming sync data - apply synced preferences to local state
  useEffect(() => {
    if (syncState.isConnected && syncPreferences) {
      console.log('Applying synced preferences to local state:', syncPreferences);

      if (syncPreferences.userSettings) {
        setUserSettings(syncPreferences.userSettings);
      }
      if (syncPreferences.watchlist) {
        setWatchlist(syncPreferences.watchlist);
      }
      if (syncPreferences.searchHistory) {
        setSearchHistory(syncPreferences.searchHistory);
      }
      if (syncPreferences.gameProgress) {
        setGameProgress(syncPreferences.gameProgress);
      }

      // Merge synced likes/dislikes into content preferences
      if (syncPreferences.likedMovies || syncPreferences.dislikedMovies) {
        const currentPrefs = userSettings?.content_preferences || [];
        const newPrefs: UserPreference[] = [...currentPrefs];

        // Add liked movies
        if (syncPreferences.likedMovies) {
          syncPreferences.likedMovies.forEach(mediaId => {
            if (!newPrefs.some(p => p.media_id === mediaId && p.preference === 'like')) {
              newPrefs.push({
                media_id: mediaId,
                media_type: 'movie', // Assuming movies for now, could be extended
                preference: 'like',
                timestamp: new Date().toISOString()
              });
            }
          });
        }

        // Add disliked movies
        if (syncPreferences.dislikedMovies) {
          syncPreferences.dislikedMovies.forEach(mediaId => {
            if (!newPrefs.some(p => p.media_id === mediaId && p.preference === 'dislike')) {
              newPrefs.push({
                media_id: mediaId,
                media_type: 'movie', // Assuming movies for now, could be extended
                preference: 'dislike',
                timestamp: new Date().toISOString()
              });
            }
          });
        }

        const updatedSettings = {
          ...userSettings,
          content_preferences: newPrefs,
          updated_at: new Date().toISOString()
        };

        setUserSettings(updatedSettings);
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      }
    }
  }, [syncPreferences, syncState.isConnected, userSettings]);

  const value = {
    userSettings,
    watchlist,
    searchHistory,
    gameProgress,
    updateUserSettings,
    addToWatchlist,
    removeFromWatchlist,
    addSearchHistory,
    updateGameProgress,
    addContentPreference,
    removeContentPreference,
    getContentPreference,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
