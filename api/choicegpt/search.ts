import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.VITE_POLLINATIONS_API_KEY || '';
    const q = (req.query.q as string) || '';
    const model = (req.query.model as string) || 'gemini-search';
    const referer = (req.headers['referer'] as string) || process.env.PUBLIC_ORIGIN || '';
    const url = `https://text.pollinations.ai/${encodeURIComponent(q)}?model=${encodeURIComponent(model)}`;
    let resp = await fetch(url, { headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...(referer ? { Referer: referer } : {}) } });
    if (resp.status === 402 || !resp.ok) {
      const fallbackUrl = `https://text.pollinations.ai/${encodeURIComponent(q)}?model=openai`;
      resp = await fetch(fallbackUrl, { headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...(referer ? { Referer: referer } : {}) } });
      if (resp.status === 402 || !resp.ok) {
        const plainUrl = `https://text.pollinations.ai/${encodeURIComponent(q)}`;
        resp = await fetch(plainUrl, { headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...(referer ? { Referer: referer } : {}) } });
      }
    }
    const text = await resp.text();
    return res.status(resp.status).send(text);
  } catch (e: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: e?.message || String(e) });
  }
}