import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

    // Get the sync session from Redis
    const sessionData = await redis.get(`sync_session_${syncToken}`);
    if (!sessionData) {
      return res.status(404).json({ error: 'Sync session not found or expired' });
    }

    // Parse session data
    const session = JSON.parse(sessionData as string);

    // Check if session expired (15 minutes) - though Redis TTL should handle this
    if (Date.now() - session.createdAt > 15 * 60 * 1000) {
      await redis.del(`sync_session_${syncToken}`);
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
