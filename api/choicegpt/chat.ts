import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.VITE_POLLINATIONS_API_KEY || '';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const resp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    try {
      const json = JSON.parse(text);
      return res.status(resp.status).json(json);
    } catch {
      return res.status(resp.status).send(text);
    }
  } catch (e: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: e?.message || String(e) });
  }
}