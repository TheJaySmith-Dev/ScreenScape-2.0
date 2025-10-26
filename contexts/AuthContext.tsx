import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import syncManager from '../utils/syncOffline';

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
  user: User | null;
  loading: boolean;
  syncLoading: boolean;
  userSettings: UserSettings | null;
  watchlist: WatchlistItem[];
  searchHistory: SearchHistoryItem[];
  gameProgress: GameProgress;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  addToWatchlist: (mediaId: string, mediaType: string, mediaData?: any) => Promise<void>;
  removeFromWatchlist: (mediaId: string, mediaType: string) => Promise<void>;
  addSearchHistory: (query: string) => Promise<void>;
  updateGameProgress: (gameType: string, progress: any) => Promise<void>;
  addContentPreference: (mediaId: number, mediaType: string, preference: 'like' | 'dislike') => Promise<void>;
  removeContentPreference: (mediaId: number, mediaType: string) => Promise<void>;
  getContentPreference: (mediaId: number, mediaType: string) => 'like' | 'dislike' | null;
  syncData: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [gameProgress, setGameProgress] = useState<GameProgress>({});

  // Sync data from database
  const syncData = async () => {
    if (!user) return;

    setSyncLoading(true);
    try {
      // Sync user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserSettings(settings);

      // Sync content preferences
      const { data: contentPrefs } = await supabase
        .from('user_content_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      // Convert content preferences to the expected format for userSettings
      const preferencesForSettings = (contentPrefs || []).map(pref => ({
        media_id: pref.media_id,
        media_type: pref.media_type,
        preference: pref.preference,
        timestamp: pref.updated_at
      }));

      setUserSettings(currentSettings => ({
        ...currentSettings,
        content_preferences: preferencesForSettings
      }));

      // Sync watchlist
      const { data: watchlistData } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });
      setWatchlist(watchlistData || []);

      // Sync search history (last 50 items)
      const { data: history } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(50);
      setSearchHistory(history || []);

      // Sync game progress
      const { data: games } = await supabase
        .from('user_game_progress')
        .select('*')
        .eq('user_id', user.id);
      const progressMap: GameProgress = {};
      games?.forEach(game => {
        progressMap[game.game_type] = game.game_data;
      });
      setGameProgress(progressMap);

    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      // Set a timeout to force loading false after 5 seconds to prevent stuck loading
      const timeoutId = setTimeout(() => {
        console.warn('Auth loading timeout - forcing no user state');
        setUser(null);
        setLoading(false);
      }, 5000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
        }
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Failed to get session:', err);
        // Set user to null for guest mode if Supabase fails
        setUser(null);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        // Sync data when user signs in
        await syncData();
      } else if (event === 'SIGNED_OUT') {
        // Clear synced data on sign out
        setUserSettings(null);
        setWatchlist([]);
        setSearchHistory([]);
        setGameProgress({});
        // Clear local streaming preferences from user data
        localStorage.removeItem('screenScapeStreamingProviders');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setUserSettings(data);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  };

  const addToWatchlist = async (mediaId: string, mediaType: string, mediaData?: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .upsert({
          user_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
          media_data: mediaData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setWatchlist(prev => {
        const filtered = prev.filter(item => !(item.media_id === mediaId && item.media_type === mediaType));
        return [data, ...filtered];
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  };

  const removeFromWatchlist = async (mediaId: string, mediaType: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType);

      if (error) throw error;
      setWatchlist(prev => prev.filter(item => !(item.media_id === mediaId && item.media_type === mediaType)));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  };

  const addSearchHistory = async (query: string) => {
    if (!user || !query.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_search_history')
        .insert({
          user_id: user.id,
          query: query.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setSearchHistory(prev => [data, ...prev.slice(0, 49)]); // Keep only latest 50
    } catch (error) {
      console.error('Error adding search history:', error);
      throw error;
    }
  };

  const updateGameProgress = async (gameType: string, progress: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_game_progress')
        .upsert({
          user_id: user.id,
          game_type: gameType,
          game_data: progress,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setGameProgress(prev => ({
        ...prev,
        [gameType]: progress,
      }));
    } catch (error) {
      console.error('Error updating game progress:', error);
      throw error;
    }
  };

  const addContentPreference = async (mediaId: number, mediaType: string, preference: 'like' | 'dislike') => {
    if (!user) return;

    // Always update local state immediately for smooth UX
    const currentPreferences = userSettings?.content_preferences || [];
    const existingIndex = currentPreferences.findIndex(
      p => p.media_id === mediaId && p.media_type === mediaType
    );

    let newPreferences;
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

    // Update local state immediately
    setUserSettings(currentSettings => ({
      ...currentSettings,
      content_preferences: newPreferences
    }));

    // Store in localStorage as backup
    const localPrefs = JSON.parse(localStorage.getItem('user_content_preferences') || '[]');
    const existingLocalIndex = localPrefs.findIndex(
      (p: any) => p.media_id === mediaId && p.media_type === mediaType
    );

    if (existingLocalIndex >= 0) {
      localPrefs[existingLocalIndex] = {
        media_id: mediaId,
        media_type: mediaType,
        preference,
        timestamp: new Date().toISOString(),
      };
    } else {
      localPrefs.push({
        media_id: mediaId,
        media_type: mediaType,
        preference,
        timestamp: new Date().toISOString(),
      });
    }
    localStorage.setItem('user_content_preferences', JSON.stringify(localPrefs));

    // Try to sync with database (but don't fail if it's not available)
    try {
      const { error } = await supabase
        .from('user_content_preferences')
        .upsert({
          user_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
          preference: preference,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Database sync failed, but local storage works:', error.message);
      }
    } catch (syncError) {
      console.warn('Failed to sync to database, but preference saved locally');
    }
  };

  const removeContentPreference = async (mediaId: number, mediaType: string) => {
    if (!user) return;

    try {
      // Delete from user_content_preferences table
      const { error } = await supabase
        .from('user_content_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType);

      if (error) throw error;

      // Update the local userSettings to reflect the removal
      const currentPreferences = userSettings?.content_preferences || [];
      const newPreferences = currentPreferences.filter(
        p => !(p.media_id === mediaId && p.media_type === mediaType)
      );

      setUserSettings(currentSettings => ({
        ...currentSettings,
        content_preferences: newPreferences
      }));

    } catch (error) {
      console.error('Error removing content preference:', error);
      throw error;
    }
  };

  const getContentPreference = (mediaId: number, mediaType: string): 'like' | 'dislike' | null => {
    const preferences = userSettings?.content_preferences || [];
    const preference = preferences.find(
      p => p.media_id === mediaId && p.media_type === mediaType
    );
    return preference ? preference.preference : null;
  };

  const value = {
    user,
    loading,
    syncLoading,
    userSettings,
    watchlist,
    searchHistory,
    gameProgress,
    signUp,
    signIn,
    signOut,
    updateUserSettings,
    addToWatchlist,
    removeFromWatchlist,
    addSearchHistory,
    updateGameProgress,
    addContentPreference,
    removeContentPreference,
    getContentPreference,
    syncData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
