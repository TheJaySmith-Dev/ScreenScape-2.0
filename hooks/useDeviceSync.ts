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

      // Try API first (for production/Vercel deployment)
      try {
        const response = await fetch(`${API_BASE}/createLinkCode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceName }),
        });

        if (response.ok) {
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
        }
      } catch (apiError) {
        console.log('API not available, using mock implementation for development');
      }

      // Fallback: Mock implementation for local development
      console.log('Using mock device sync for local development');

      // Generate a mock link code
      const mockLinkCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const mockDeviceToken = `mock_device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store mock sync session in localStorage (simulating server storage)
      const mockSyncSession = {
        linkCode: mockLinkCode,
        deviceToken: mockDeviceToken,
        deviceName,
        createdAt: Date.now(),
        preferences: {}
      };

      localStorage.setItem(`sync_session_${mockLinkCode}`, JSON.stringify(mockSyncSession));

      // Store device tokens for this device
      setDeviceInfo({
        deviceToken: mockDeviceToken,
        syncToken: mockLinkCode,
        deviceName
      });

      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        isSyncing: false
      }));

      console.log(`Generated mock link code: ${mockLinkCode}`);
      return { linkCode: mockLinkCode };

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

      // Try API first (for production/Vercel deployment)
      try {
        const response = await fetch(`${API_BASE}/linkDevice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ linkCode, deviceName }),
        });

        if (response.ok) {
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
        }
      } catch (apiError) {
        console.log('API not available, using mock implementation for development');
      }

      // Fallback: Mock implementation for local development
      console.log('Using mock device linking for local development');

      // Check if session exists in localStorage
      const mockSessionKey = `sync_session_${linkCode}`;
      const storedSession = localStorage.getItem(mockSessionKey);

      if (!storedSession) {
        throw new Error('Link code not found or expired');
      }

      const mockSession = JSON.parse(storedSession);

      // Check if session is expired (15 minutes)
      const FIFTEEN_MINUTES = 15 * 60 * 1000;
      if (Date.now() - mockSession.createdAt > FIFTEEN_MINUTES) {
        localStorage.removeItem(mockSessionKey);
        throw new Error('Link code expired');
      }

      // Generate new device token for second device
      const mockDeviceToken = `mock_device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update session with second device info
      mockSession.deviceCount = 2;
      mockSession.secondDevice = {
        deviceToken: mockDeviceToken,
        deviceName
      };
      localStorage.setItem(mockSessionKey, JSON.stringify(mockSession));

      // Store device tokens for this device
      setDeviceInfo({
        deviceToken: mockDeviceToken,
        syncToken: linkCode,
        deviceName
      });

      // Load initial preferences from first device
      if (mockSession.preferences) {
        setLocalPreferences(mockSession.preferences);
      }

      setSyncState(prev => ({
        ...prev,
        isConnected: true,
        isSyncing: false,
        lastSyncTime: mockSession.createdAt,
        deviceCount: 2
      }));

      // Start polling for updates (mock)
      startPollingSync();

      console.log(`Mock linked to device, sync token: ${linkCode}`);
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
      // Try API first (for production/Vercel deployment)
      try {
        const response = await fetch(
          `${API_BASE}/fetchState?syncToken=${deviceInfo.syncToken}&deviceToken=${deviceInfo.deviceToken}&lastKnownUpdate=${syncState.lastSyncTime || 0}`
        );

        if (response.ok) {
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
        }
      } catch (apiError) {
        // Fall through to mock implementation
      }

      // Fallback: Mock implementation for local development
      const mockSessionKey = `sync_session_${deviceInfo.syncToken}`;
      const storedSession = localStorage.getItem(mockSessionKey);

      if (storedSession) {
        const mockSession = JSON.parse(storedSession);
        const lastKnownUpdate = syncState.lastSyncTime || 0;

        // Check if session has updates since last known update
        if (mockSession.lastUpdated && mockSession.lastUpdated > lastKnownUpdate) {
          console.log('Mock sync update received:', mockSession.preferences);
          setLocalPreferences(mockSession.preferences || {});
          setSyncState(prev => ({
            ...prev,
            lastSyncTime: mockSession.lastUpdated
          }));

          // Update localStorage
          if (mockSession.preferences?.userSettings) {
            localStorage.setItem('userSettings', JSON.stringify(mockSession.preferences.userSettings));
          }
          if (mockSession.preferences?.watchlist) {
            localStorage.setItem('userWatchlist', JSON.stringify(mockSession.preferences.watchlist));
          }
          if (mockSession.preferences?.searchHistory) {
            localStorage.setItem('userSearchHistory', JSON.stringify(mockSession.preferences.searchHistory));
          }
          if (mockSession.preferences?.gameProgress) {
            localStorage.setItem('userGameProgress', JSON.stringify(mockSession.preferences.gameProgress));
          }

          return mockSession.preferences;
        }
      }

      return null; // No updates

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

      // Try API first (for production/Vercel deployment)
      try {
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

        if (response.ok) {
          const { lastUpdated } = await response.json();

          setSyncState(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncTime: lastUpdated
          }));

          return true;
        }
      } catch (apiError) {
        // Fall through to mock implementation
      }

      // Fallback: Mock implementation for local development
      console.log('Using mock send update for local development');

      const mockSessionKey = `sync_session_${deviceInfo.syncToken}`;
      const storedSession = localStorage.getItem(mockSessionKey);

      if (storedSession) {
        const mockSession = JSON.parse(storedSession);
        mockSession.preferences = { ...mockSession.preferences, ...preferences };
        mockSession.lastUpdated = Date.now();
        localStorage.setItem(mockSessionKey, JSON.stringify(mockSession));

        setSyncState(prev => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: mockSession.lastUpdated
        }));

        console.log('Mock update sent:', preferences);
        return true;
      }

      return false;

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
