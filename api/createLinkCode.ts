import type { VercelRequest, VercelResponse } from '@vercel/node';

// Generate secure link code
function generateLinkCode(): string {
  // 6-character alphanumeric code (excluding confusing chars)
  const chars = 'ABCDEFGHJKMNPQRSTWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
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

    // Generate unique 6-character link code
    let linkCode: string;
    let attempts = 0;

    do {
      linkCode = generateLinkCode();
      attempts++;
      if (attempts > 50) {
        throw new Error('Unable to generate unique link code');
      }

      // Check if link code is used (simple randomness check)
      // In production, you might want a centralized registry
      const existingCodes = JSON.parse(sessionStorage.getItem('linkCodes') || '{}');
      if (!existingCodes[linkCode] || Date.now() - existingCodes[linkCode].createdAt > 15 * 60 * 1000) {
        break; // Code is available
      }

    } while (true);

    // Generate guest ID for this device
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store link code mapping (temporary - expires in 15 minutes)
    const linkSession = {
      guestId,
      deviceName,
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
    };

    // Store link code in global session memory (simple approach)
    // In production with multiple server instances, you'd need shared storage
    if (!global.linkCodes) global.linkCodes = {};
    global.linkCodes[linkCode] = linkSession;

    console.log(`✅ Created link code: ${linkCode} for guest: ${guestId}`);

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
