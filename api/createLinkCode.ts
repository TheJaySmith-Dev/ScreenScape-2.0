// Vercel serverless function: Generate link code and create sync session
import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for development (replace with Redis/memory cache in production)
let syncSessions: Record<string, {
  id: string;
  createdAt: number;
  deviceToken: string;
  preferences?: any;
  lastUpdated: number;
}> = {};

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
    // Generate unique link code
    let linkCode: string;
    let attempts = 0;
    do {
      linkCode = generateLinkCode();
      attempts++;
      if (attempts > 10) {
        throw new Error('Unable to generate unique link code');
      }
    } while (syncSessions[linkCode]);

    // Create device token for the initiating device
    const deviceToken = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store sync session (expires in 15 minutes)
    syncSessions[linkCode] = {
      id: linkCode,
      createdAt: Date.now(),
      deviceToken,
      lastUpdated: Date.now(),
    };

    // Clean up expired sessions (older than 15 minutes)
    Object.keys(syncSessions).forEach(code => {
      const session = syncSessions[code];
      if (Date.now() - session.createdAt > 15 * 60 * 1000) {
        delete syncSessions[code];
      }
    });

    console.log(`Created sync session: ${linkCode} for device: ${deviceToken}`);

    return res.status(200).json({
      linkCode,
      deviceToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Error creating link code:', error);
    return res.status(500).json({ error: 'Failed to create link code' });
  }
}
