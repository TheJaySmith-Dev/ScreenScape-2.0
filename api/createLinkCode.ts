import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

      // Check if link code already exists in Redis
      const exists = await redis.exists(`sync_session_${linkCode}`);
      if (!exists) break; // Code is available

    } while (true);

    // Create device token for the initiating device
    const deviceToken = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create sync session data
    const sessionData = {
      id: linkCode,
      createdAt: Date.now(),
      deviceToken,
      lastUpdated: Date.now(),
    };

    // Store in Redis with 15-minute expiration
    await redis.setex(`sync_session_${linkCode}`, 15 * 60, JSON.stringify(sessionData));

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
