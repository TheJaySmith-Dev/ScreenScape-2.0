import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Basic Redis connection check
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('❌ Missing Upstash Redis environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { linkCode, deviceName } = req.body;

    console.log('🔗 Received linkCode request:', { linkCode, deviceName });

    // Clean the link code by removing spaces and converting to uppercase
    const cleanLinkCode = linkCode.replace(/\s/g, '').toUpperCase();

    console.log('🧹 Cleaned linkCode:', { original: linkCode, cleaned: cleanLinkCode, length: cleanLinkCode.length });

    if (!cleanLinkCode || cleanLinkCode.length !== 8) {
      console.log('❌ Link code validation failed');
      return res.status(400).json({ error: 'Invalid link code format' });
    }

    // Get the sync session from Redis
    const sessionData = await redis.get(`sync_session_${cleanLinkCode}`);
    if (!sessionData) {
      return res.status(404).json({ error: 'Link code not found or expired' });
    }

    // Parse session data
    const session = JSON.parse(sessionData as string);

    // Check if session expired (15 minutes) - though Redis TTL should handle this
    if (Date.now() - session.createdAt > 15 * 60 * 1000) {
      await redis.del(`sync_session_${cleanLinkCode}`);
      return res.status(404).json({ error: 'Link code expired' });
    }

    // Generate new device token for the second device
    const deviceToken = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update session with linked device info and mark as active
    session.lastUpdated = Date.now();
    session.deviceCount = 2;

    // Store updated session back in Redis
    await redis.setex(`sync_session_${cleanLinkCode}`, 15 * 60, JSON.stringify(session));

    console.log(`Device ${deviceName} linked to session: ${cleanLinkCode}`);

    return res.status(200).json({
      deviceToken,
      syncToken: session.id, // Use session ID as sync token
      preferences: session.preferences, // Current preferences from first device
      lastUpdated: session.lastUpdated
    });

  } catch (error) {
    console.error('Error linking device:', error);
    return res.status(500).json({ error: 'Failed to link device' });
  }
}
