// Vercel serverless function: Fetch current sync state/preferences
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { syncToken, deviceToken, lastKnownUpdate } = req.query as {
      syncToken?: string;
      deviceToken?: string;
      lastKnownUpdate?: string;
    };

    if (!syncToken || !deviceToken) {
      return res.status(400).json({ error: 'Missing required parameters: syncToken, deviceToken' });
    }

    // Find the sync session
    const session = syncSessions[syncToken];
    if (!session) {
      return res.status(404).json({ error: 'Sync session not found or expired' });
    }

    // Check if session expired (15 minutes)
    if (Date.now() - session.createdAt > 15 * 60 * 1000) {
      delete syncSessions[syncToken];
      return res.status(404).json({ error: 'Sync session expired' });
    }

    // Check if device has new updates
    const clientLastUpdate = parseInt(lastKnownUpdate || '0');
    const hasUpdates = session.lastUpdated > clientLastUpdate;

    if (!hasUpdates) {
      return res.status(204).json({ message: 'No updates available' });
    }

    console.log(`Fetching state for device: ${deviceToken} from session: ${syncToken}`);

    return res.status(200).json({
      preferences: session.preferences,
      lastUpdated: session.lastUpdated,
      hasUpdates: true
    });

  } catch (error) {
    console.error('Error fetching state:', error);
    return res.status(500).json({ error: 'Failed to fetch sync state' });
  }
}
