import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    if (!cleanLinkCode || cleanLinkCode.length !== 6) { // 6 chars to match createLinkCode
      console.log('❌ Link code validation failed: length !== 6');
      return res.status(400).json({ error: 'Invalid link code format' });
    }

    // Check link code in global memory
    if (!global.linkCodes || !global.linkCodes[cleanLinkCode]) {
      console.log('❌ Link code not found in memory');
      return res.status(404).json({ error: 'Link code not found or expired' });
    }

    const linkSession = global.linkCodes[cleanLinkCode];

    // Check if link expired
    if (Date.now() > linkSession.expiresAt) {
      console.log('⏰ Link code expired');
      delete global.linkCodes[cleanLinkCode]; // Clean up expired code
      return res.status(404).json({ error: 'Link code expired' });
    }

    const { guestId } = linkSession;

    // Generate session token for the second device
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create initial user data (stored in localStorage on client side)
    const userData = {
      guestId,
      deviceName,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      preferences: {},
      gameProgress: {},
      userSettings: {},
      watchlist: [],
      searchHistory: [],
    };

    // Clean up the used link code
    delete global.linkCodes[cleanLinkCode];

    console.log(`✅ Linked device ${deviceName} to guest ${guestId}`);

    return res.status(200).json({
      guestId,
      sessionToken,
      deviceName,
      userData,
      lastUpdated: userData.lastUpdated
    });

  } catch (error) {
    console.error('Error linking device:', error);
    return res.status(500).json({ error: 'Failed to link device' });
  }
}
