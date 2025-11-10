import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, category, timestamp } = req.body || {};
    if (!query || !category) {
      return res.status(400).json({ error: 'Missing required fields: query, category' });
    }

    const report = {
      query: String(query),
      category: String(category),
      timestamp: Number(timestamp) || Date.now(),
      userAgent: req.headers['user-agent'] || null,
      appVersion: process.env.VERCEL_GIT_COMMIT_SHA || null,
    };

    // Push to a list to retain reports history
    await redis.lpush('missing_content_reports', JSON.stringify(report));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error reporting missing content:', error);
    return res.status(500).json({ error: 'Failed to report missing content' });
  }
}

