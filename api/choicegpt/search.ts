import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.VITE_POLLINATIONS_API_KEY || '';
    const q = (req.query.q as string) || '';
    const model = (req.query.model as string) || 'gemini-search';
    const url = `https://text.pollinations.ai/${encodeURIComponent(q)}?model=${encodeURIComponent(model)}`;
    const resp = await fetch(url, { headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) } });
    const text = await resp.text();
    return res.status(resp.status).send(text);
  } catch (e: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: e?.message || String(e) });
  }
}