import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.VITE_POLLINATIONS_API_KEY || '';
    const referer = (req.headers['referer'] as string) || process.env.PUBLIC_ORIGIN || '';
    const resp = await fetch('https://text.pollinations.ai/models', { headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...(referer ? { Referer: referer } : {}) } });
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