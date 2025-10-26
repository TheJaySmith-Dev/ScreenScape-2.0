import { useState, useEffect, useCallback, useRef } from 'react';

interface SyncPreferences {
  userSettings?: any;
  watchlist?: any[];
  searchHistory?: any[];
  gameProgress?: any;
}

interface SyncState {
  isConnected: boolean;
  lastSyncTime: number | null;
  isSyncing: boolean;
  error: string | null;
  deviceCount: number;
}

interface DeviceInfo {
  deviceToken: string;
  syncToken: string;
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

  // API base URL - in production this would be your Vercel deployment URL
  const API_BASE = '/api';

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPollingRef.current = true;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
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

      if (!response.ok) {
        throw new Error('Failed to create link code');
      }

      const { linkCode, deviceToken } = await response.json();

      // Store device tokens for this device
      setDeviceInfo({
        deviceToken,
        syncToken: linkCode, // First device uses link code as sync token
        deviceName
      });

      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        isSyncing: false
      }));

      console.log(`Generated link code: ${linkCode}`);
      return { linkCode };

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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link device');
      }

      const { deviceToken, syncToken, preferences, lastUpdated } = await response.json();

      // Store device tokens
      setDeviceInfo({
        deviceToken,
        syncToken,
        deviceName
      });

      // Load initial preferences from other device
      if (preferences) {
        setLocalPreferences(preferences);
      }

      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        isSyncing: false,
        lastSyncTime: lastUpdated,
        deviceCount: 2
      }));

      // Start polling for updates
      startPollingSync();

      console.log(`Linked to device, sync token: ${syncToken}`);
      return true;

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

  const fetchState = useCallback(async () => {
    if (!deviceInfo) return null;

    try {
      const response = await fetch(
        `${API_BASE}/fetchState?syncToken=${deviceInfo.syncToken}&deviceToken=${deviceInfo.deviceToken}&lastKnownUpdate=${syncState.lastSyncTime || 0}`
      );

      if (!response.ok) {
        if (response.status === 204) {
          return null; // No updates
        }
        throw new Error('Failed to fetch state');
      }

      const { preferences, lastUpdated } = await response.json();

      if (preferences) {
        console.log('Received sync update:', preferences);
        setLocalPreferences(preferences);
        setSyncState(prev => ({
          ...prev,
          lastSyncTime: lastUpdated
        }));

        // Also update localStorage from the synced data
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
      }

      return preferences;

    } catch (error) {
      console.error('Error fetching sync state:', error);
      return null;
    }
  }, [deviceInfo, syncState.lastSyncTime, API_BASE]);

  const sendUpdate = useCallback(async (preferences: SyncPreferences): Promise<boolean> => {
    if (!deviceInfo) {
      console.warn('Cannot send update: no device info');
      return false;
    }

    try {
      setSyncState(prev => ({ ...prev, isSyncing: true }));

      const response = await fetch(`${API_BASE}/sendUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncToken: deviceInfo.syncToken,
          deviceToken: deviceInfo.deviceToken,
          preferences
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send update');
      }

      const { lastUpdated } = await response.json();

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: lastUpdated
      }));

      return true;

    } catch (error) {
      console.error('Error sending update:', error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to send update'
      }));
      return false;
    }
  }, [deviceInfo, API_BASE]);

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
