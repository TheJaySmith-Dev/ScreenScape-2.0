import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.VITE_POLLINATIONS_API_KEY || 'plln_sk_lBikUu7qswK4bzb5QMk1CfNtnTcmJMJ8';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const referer = (req.headers['referer'] as string) || process.env.PUBLIC_ORIGIN || '';
    const resp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(referer ? { Referer: referer } : {}),
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