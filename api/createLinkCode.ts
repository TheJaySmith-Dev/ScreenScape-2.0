import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, del, list } from '@vercel/blob';

// Generate secure link code
function generateLinkCode(): string {
  // 8-character alphanumeric code (excluding confusing chars)
  const chars = 'ABCDEFGHJKMNPQRSTWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceName = 'Device A' } = req.body;

    // Generate unique 6-character link code (shorter for better UX)
    let linkCode: string;
    let attempts = 0;

    do {
      linkCode = generateLinkCode().substring(0, 6); // 6 chars instead of 8
      attempts++;
      if (attempts > 15) {
        throw new Error('Unable to generate unique link code');
      }

      // Check if link code already exists in Blob storage (linkcodes directory)
      try {
        const existing = await fetch(`${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.BLOB_STORE_ID}.public.blob.vercel-storage.com/linkcodes/${linkCode}.json`);
        if (existing.status !== 200) break; // Code is available
      } catch (blobError) {
        // If file doesn't exist, code is available
        break;
      }

    } while (true);

    // Generate guest ID for this device
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session data for temporary link (link code -> guestId lookup)
    const linkSession = {
      guestId,
      deviceName,
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
    };

    // Store link code in Blob (temporary link table)
    try {
      await put(`linkcodes/${linkCode}.json`, JSON.stringify(linkSession), {
        access: 'public',
      });
    } catch (blobError) {
      console.error('Failed to store link code in Blob:', blobError);
      throw new Error('Failed to create link session');
    }

    // Create initial user data in Blob storage
    const initialUserData = {
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

    try {
      await put(`users/${guestId}/data.json`, JSON.stringify(initialUserData), {
        access: 'public',
      });
    } catch (blobError) {
      console.error('Failed to create user data in Blob:', blobError);
      // Clean up linkcode since user data creation failed
      try {
        await del(`linkcodes/${linkCode}.json`);
      } catch (cleanupError) {
        console.error('Failed to cleanup linkcode after blob error:', cleanupError);
      }
      throw new Error('Failed to initialize user storage');
    }

    console.log(`✅ Created link: ${linkCode} for guest: ${guestId}`);

    return res.status(200).json({
      linkCode,
      guestId,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Error creating link code:', error);
    return res.status(500).json({ error: 'Failed to create link code' });
  }
}
