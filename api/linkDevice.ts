// Vercel serverless function: Link second device to sync session
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Shared in-memory storage (same as createLinkCode.ts)
// In production, this would be Redis or a proper data store
global.syncSessions = global.syncSessions || {};

const syncSessions = global.syncSessions as Record<string, {
  id: string;
  createdAt: number;
  deviceToken: string;
  preferences?: any;
  lastUpdated: number;
}>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { linkCode, deviceName } = req.body;

    if (!linkCode || linkCode.length !== 8) {
      return res.status(400).json({ error: 'Invalid link code format' });
    }

    // Find the sync session
    const session = syncSessions[linkCode];
    if (!session) {
      return res.status(404).json({ error: 'Link code not found or expired' });
    }

    // Check if session expired (15 minutes)
    if (Date.now() - session.createdAt > 15 * 60 * 1000) {
      delete syncSessions[linkCode];
      return res.status(404).json({ error: 'Link code expired' });
    }

    // Generate new device token for the second device
    const deviceToken = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update session with linked device info and mark as active
    session.lastUpdated = Date.now();

    console.log(`Device ${deviceName} linked to session: ${linkCode}`);

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
