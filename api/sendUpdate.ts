// Vercel serverless function: Send preference updates to sync session
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Shared in-memory storage (same as other endpoints)
global.syncSessions = global.syncSessions || {};

const syncSessions = global.syncSessions as Record<string, {
  id: string;
  createdAt: number;
  deviceToken: string;
  preferences?: any;
  lastUpdated: number;
}>;

// Timestamp-based merge algorithm
function mergePreferences(existingPrefs: any = {}, newPrefs: any = {}) {
  if (typeof existingPrefs !== 'object' || Array.isArray(existingPrefs)) {
    // Simple values or arrays - use newer data
    return newPrefs;
  }

  const result = { ...existingPrefs };

  // Merge each preference type
  Object.keys(newPrefs).forEach(key => {
    if (!newPrefs[key]) return; // Skip null values

    if (key === 'userSettings') {
      // Deep merge user settings with timestamp resolution
      result[key] = mergeUserSettings(result[key], newPrefs[key]);
    } else if (key === 'watchlist') {
      result[key] = mergeWatchlist(result[key], newPrefs[key]);
    } else if (key === 'searchHistory') {
      result[key] = mergeSearchHistory(result[key], newPrefs[key]);
    } else if (key === 'gameProgress') {
      result[key] = mergeGameProgress(result[key], newPrefs[key]);
    } else {
      // For other simple values
      result[key] = newPrefs[key];
    }
  });

  return result;
}

function mergeUserSettings(existing: any, newData: any) {
  if (!existing) return newData;
  if (!newData) return existing;

  const merged = { ...existing };
  const newUpdated = new Date(newData.updated_at || 0);
  const existingUpdated = new Date(existing.updated_at || 0);

  // If newer data is more recent, use it entirely
  if (newUpdated > existingUpdated) {
    return newData;
  }

  // Otherwise keep existing but sync content preferences
  if (newData.content_preferences) {
    merged.content_preferences = mergeContentPreferences(
      existing.content_preferences || [],
      newData.content_preferences
    );
  }

  return merged;
}

function mergeContentPreferences(existing: any[], newPrefs: any[]) {
  const merged = [...existing];
  const byKey = new Map(merged.map(item =>
    [`${item.media_id}-${item.media_type}`, item]
  ));

  // Add/update with newer preferences
  newPrefs.forEach(pref => {
    const key = `${pref.media_id}-${pref.media_type}`;
    const existingPref = byKey.get(key);

    if (!existingPref ||
        new Date(pref.timestamp) > new Date(existingPref.timestamp)) {
      byKey.set(key, pref);

      // Replace if exists, append if not
      const index = merged.findIndex(item => item.media_id === pref.media_id &&
                                          item.media_type === pref.media_type);
      if (index >= 0) {
        merged[index] = pref;
      } else {
        merged.push(pref);
      }
    }
  });

  return merged;
}

function mergeWatchlist(existing: any[] = [], newItems: any[] = []) {
  const merged = [...existing];
  const byKey = new Map(merged.map(item =>
    [`${item.media_id}-${item.media_type}`, item]
  ));

  // Add/update with newer items
  newItems.forEach(item => {
    const key = `${item.media_id}-${item.media_type}`;
    const existingItem = byKey.get(key);

    if (!existingItem ||
        new Date(item.updated_at) > new Date(existingItem.updated_at)) {
      byKey.set(key, item);

      // Replace if exists, append if not
      const index = merged.findIndex(existing => existing.media_id === item.media_id &&
                                                   existing.media_type === item.media_type);
      if (index >= 0) {
        merged[index] = item;
      } else {
        merged.push(item);
      }
    }
  });

  return merged;
}

function mergeSearchHistory(existing: any[] = [], newItems: any[] = []) {
  const merged = [...existing];
  const byQuery = new Map(merged.map(item => [item.query, item]));

  // Add/update with newer searches
  newItems.forEach(item => {
    const existingItem = byQuery.get(item.query);

    if (!existingItem ||
        new Date(item.searched_at) > new Date(existingItem.searched_at)) {
      byQuery.set(item.query, item);

      // Replace if exists, append if not
      const index = merged.findIndex(existing => existing.query === item.query);
      if (index >= 0) {
        merged[index] = item;
      } else {
        merged.push(item);
      }
    }
  });

  return merged.slice(0, 50); // Keep recent 50 items
}

function mergeGameProgress(existing: any = {}, newData: any = {}) {
  const merged = { ...existing };

  Object.keys(newData).forEach(gameType => {
    merged[gameType] = newData[gameType];
  });

  return merged;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { syncToken, deviceToken, preferences } = req.body;

    if (!syncToken || !deviceToken || !preferences) {
      return res.status(400).json({ error: 'Missing required parameters: syncToken, deviceToken, preferences' });
    }

    // Find the sync session
    const session = syncSessions[syncToken];
    if (!session) {
      return res.status(404).json({ error: 'Sync session not found' });
    }

    // Validate device token (any device in the sync session can send updates)
    // In production, you might want stricter validation

    // Merge preferences using timestamp-based resolution
    const existingPrefs = session.preferences || {};
    session.preferences = mergePreferences(existingPrefs, preferences);
    session.lastUpdated = Date.now();

    console.log(`Updated sync session: ${syncToken} by device: ${deviceToken}`);

    return res.status(200).json({
      success: true,
      lastUpdated: session.lastUpdated,
      preferenceCount: session.preferences ? Object.keys(session.preferences).length : 0
    });

  } catch (error) {
    console.error('Error sending update:', error);
    return res.status(500).json({ error: 'Failed to send update' });
  }
}
