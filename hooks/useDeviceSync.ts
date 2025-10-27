import { useState, useEffect, useCallback, useRef } from 'react';

interface SyncPreferences {
  userSettings?: any;
  watchlist?: any[];
  searchHistory?: any[];
  gameProgress?: any;
  likedMovies?: number[];
  dislikedMovies?: number[];
}

interface SyncState {
  isConnected: boolean;
  lastSyncTime: number | null;
  isSyncing: boolean;
  error: string | null;
  deviceCount: number;
}

interface DeviceInfo {
  guestId: string;
  sessionToken: string;
  deviceName: string;
}

export const useDeviceSync = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    lastSyncTime: null,
    isSyncing: false,
    error: null,
    deviceCount: 1
  });
  const [localPreferences, setLocalPreferences] = useState<SyncPreferences>({});

  const stopPollingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // API base URL for Vercel deployment
  const API_BASE = '/api';

  // Set up BroadcastChannel for real-time tab-to-tab communication
  useEffect(() => {
    if (deviceInfo?.guestId) {
      broadcastChannelRef.current = new BroadcastChannel(`sync_${deviceInfo.guestId}`);

      const handleBroadcast = (event: MessageEvent) => {
        const { type, data } = event.data;

        if (type === 'preferences_updated') {
          console.log('📡 Received preferences update from another tab');
          setLocalPreferences(data.preferences);
          setSyncState(prev => ({
            ...prev,
            lastSyncTime: data.timestamp
          }));

          // Also update localStorage
          if (data.preferences.userSettings) {
            localStorage.setItem('userSettings', JSON.stringify(data.preferences.userSettings));
          }
          if (data.preferences.watchlist) {
            localStorage.setItem('userWatchlist', JSON.stringify(data.preferences.watchlist));
          }
          if (data.preferences.searchHistory) {
            localStorage.setItem('userSearchHistory', JSON.stringify(data.preferences.searchHistory));
          }
          if (data.preferences.gameProgress) {
            localStorage.setItem('userGameProgress', JSON.stringify(data.preferences.gameProgress));
          }
          if (data.preferences.likedMovies) {
            localStorage.setItem('likedMovies', JSON.stringify(data.preferences.likedMovies));
          }
          if (data.preferences.dislikedMovies) {
            localStorage.setItem('dislikedMovies', JSON.stringify(data.preferences.dislikedMovies));
          }
        }
      };

      broadcastChannelRef.current.addEventListener('message', handleBroadcast);

      return () => {
        broadcastChannelRef.current?.removeEventListener('message', handleBroadcast);
        broadcastChannelRef.current?.close();
      };
    }
  }, [deviceInfo?.guestId]);

  // Load persistent device info on mount
  useEffect(() => {
    const savedGuestId = localStorage.getItem('guestId');
    const savedSessionToken = localStorage.getItem('sessionToken');
    const savedDeviceName = localStorage.getItem('deviceName');

    if (savedGuestId && savedSessionToken) {
      console.log('🔄 Restoring device session:', savedGuestId);
      setDeviceInfo({
        guestId: savedGuestId,
        sessionToken: savedSessionToken,
        deviceName: savedDeviceName || 'Device'
      });
      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        deviceCount: 2
      }));

      // Load existing preferences
      const savedSettings = localStorage.getItem('userSettings');
      const savedWatchlist = localStorage.getItem('userWatchlist');
      const savedSearchHistory = localStorage.getItem('userSearchHistory');
      const savedGameProgress = localStorage.getItem('userGameProgress');
      const savedLikedMovies = localStorage.getItem('likedMovies');
      const savedDislikedMovies = localStorage.getItem('dislikedMovies');

      if (savedSettings || savedWatchlist || savedSearchHistory || savedGameProgress || savedLikedMovies || savedDislikedMovies) {
        setLocalPreferences({
          userSettings: savedSettings ? JSON.parse(savedSettings) : {},
          watchlist: savedWatchlist ? JSON.parse(savedWatchlist) : [],
          searchHistory: savedSearchHistory ? JSON.parse(savedSearchHistory) : [],
          gameProgress: savedGameProgress ? JSON.parse(savedGameProgress) : {},
          likedMovies: savedLikedMovies ? JSON.parse(savedLikedMovies) : [],
          dislikedMovies: savedDislikedMovies ? JSON.parse(savedDislikedMovies) : []
        });
      }
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPollingRef.current = true;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      broadcastChannelRef.current?.close();
    };
  }, []);

  const generateLinkCode = useCallback(async (deviceName: string = 'Device A'): Promise<{ linkCode: string } | null> => {
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

      const response = await fetch(`${API_BASE}/createLinkCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceName }),
      });

      if (response.ok) {
        const { linkCode, guestId } = await response.json();

        // Store guest info for this device
        setDeviceInfo({
          guestId,
          sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deviceName
        });

        setSyncState(prev => ({
          ...prev,
          isConnected: true,
          isSyncing: false
        }));

        console.log(`Generated link code: ${linkCode}`);
        return { linkCode };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate link code' }));
        throw new Error(errorData.error || 'Failed to generate link code');
      }

    } catch (error) {
      console.error('Error generating link code:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to generate link code'
      }));
      return null;
    }
  }, [API_BASE]);

  const linkDevice = useCallback(async (linkCode: string, deviceName: string = 'Device B'): Promise<boolean> => {
    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

      const response = await fetch(`${API_BASE}/linkDevice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkCode, deviceName }),
      });

      if (response.ok) {
        const { guestId, sessionToken, userData, lastUpdated } = await response.json();

        // Store guest info for this device
        setDeviceInfo({
          guestId,
          sessionToken,
          deviceName
        });

        // Persist device info in localStorage
        localStorage.setItem('guestId', guestId);
        localStorage.setItem('sessionToken', sessionToken);
        localStorage.setItem('deviceName', deviceName);

        // Load initial preferences from other device
        if (userData) {
          setLocalPreferences({
            userSettings: userData.userSettings,
            watchlist: userData.watchlist,
            searchHistory: userData.searchHistory,
            gameProgress: userData.gameProgress,
            likedMovies: userData.likedMovies,
            dislikedMovies: userData.dislikedMovies
          });
        }

        setSyncState(prev => ({
          ...prev,
          isConnected: true,
          isSyncing: false,
          lastSyncTime: lastUpdated,
          deviceCount: 2
        }));

        console.log(`Linked to device, guest ID: ${guestId}`);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to link device' }));
        throw new Error(errorData.error || 'Failed to link device');
      }

    } catch (error) {
      console.error('Error linking device:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to link device'
      }));
      return false;
    }
  }, [API_BASE]);

  // For BroadcastChannel sync, we don't need server polling
  const fetchState = useCallback(async () => {
    // BroadcastChannel handles real-time sync, no server polling needed
    return null;
  }, []);

  const sendUpdate = useCallback(async (preferences: SyncPreferences): Promise<boolean> => {
    if (!deviceInfo) {
      console.warn('Cannot send update: no device info');
      return false;
    }

    try {
      // Broadcast the preferences update to other tabs
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'preferences_updated',
          data: {
            preferences,
            timestamp: Date.now()
          }
        });
      }

      // Also update localStorage
      if (preferences.userSettings) {
        localStorage.setItem('userSettings', JSON.stringify(preferences.userSettings));
      }
      if (preferences.watchlist) {
        localStorage.setItem('userWatchlist', JSON.stringify(preferences.watchlist));
      }
      if (preferences.searchHistory) {
        localStorage.setItem('userSearchHistory', JSON.stringify(preferences.searchHistory));
      }
      if (preferences.gameProgress) {
        localStorage.setItem('userGameProgress', JSON.stringify(preferences.gameProgress));
      }
      if (preferences.likedMovies) {
        localStorage.setItem('likedMovies', JSON.stringify(preferences.likedMovies));
      }
      if (preferences.dislikedMovies) {
        localStorage.setItem('dislikedMovies', JSON.stringify(preferences.dislikedMovies));
      }

      console.log('📡 Broadcasted preferences update to other tabs');
      return true;

    } catch (error) {
      console.error('Error broadcasting update:', error);
      return false;
    }
  }, [deviceInfo]);

  const startPollingSync = useCallback(() => {
    stopPollingRef.current = false;

    // Poll for updates every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      if (stopPollingRef.current) return;

      await fetchState();
    }, 5000);
  }, [fetchState]);

  const stopPollingSync = useCallback(() => {
    stopPollingRef.current = true;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    stopPollingSync();
    setDeviceInfo(null);
    setLocalPreferences({});
    setSyncState({
      isConnected: false,
      lastSyncTime: null,
      isSyncing: false,
      error: null,
      deviceCount: 1
    });
  }, [stopPollingSync]);

  // Auto-poll if connected and polling isn't already started
  useEffect(() => {
    if (deviceInfo && syncState.isConnected && !pollingIntervalRef.current) {
      startPollingSync();
    }
  }, [deviceInfo, syncState.isConnected, startPollingSync]);

  return {
    // Device info
    deviceInfo,
    syncState,

    // Actions
    generateLinkCode,
    linkDevice,
    fetchState,
    sendUpdate,
    disconnect,

    // Local preferences (merged from sync)
    preferences: localPreferences,
    updateLocalPreferences: setLocalPreferences
  };
};

export default useDeviceSync;
