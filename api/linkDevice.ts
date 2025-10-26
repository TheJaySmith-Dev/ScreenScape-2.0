import type { VercelRequest, VercelResponse } from '@vercel/node';
import { head, get, put } from '@vercel/blob';

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

    if (!cleanLinkCode || cleanLinkCode.length !== 6) { // Updated to 6 chars to match createLinkCode
      console.log('❌ Link code validation failed: length !== 6');
      return res.status(400).json({ error: 'Invalid link code format' });
    }

    // Construct Blob URL for the link code file
    const linkCodeUrl = `https://${process.env.BLOB_STORE_ID}.public.blob.vercel-storage.com/linkcodes/${cleanLinkCode}.json`;

    // Fetch the link session from Blob storage
    const sessionResponse = await fetch(linkCodeUrl);
    if (!sessionResponse.ok) {
      if (sessionResponse.status === 404) {
        console.log('❌ Link code not found in Blob');
        return res.status(404).json({ error: 'Link code not found or expired' });
      }
      throw new Error(`Blob fetch failed: ${sessionResponse.status}`);
    }

    // Parse session data
    const linkSession = await sessionResponse.json();
    console.log('📄 Retrieved link session:', linkSession);

    // Check if link expired
    if (Date.now() > linkSession.expiresAt) {
      console.log('⏰ Link code expired');
      // Optionally clean up expired links, but for now just return error
      return res.status(404).json({ error: 'Link code expired' });
    }

    const { guestId } = linkSession;

    // Fetch the current user data from Blob storage
    const userDataUrl = `https://${process.env.BLOB_STORE_ID}.public.blob.vercel-storage.com/users/${guestId}/data.json`;
    const userDataResponse = await fetch(userDataUrl);

    if (!userDataResponse.ok) {
      console.error('❌ Failed to fetch user data:', userDataResponse.status);
      return res.status(500).json({ error: 'Failed to retrieve user data' });
    }

    const userData = await userDataResponse.json();
    console.log('📊 Retrieved user data for guest:', guestId);

    // Generate session token for the second device
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
