import type { VercelRequest, VercelResponse } from '@vercel/node';

const MDBLIST_BASE = 'https://api.mdblist.com';
const MDBLIST_SITE_BASE = 'https://mdblist.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { path: pathParam, ...rawQuery } = req.query as Record<string, any>;

    const segments = Array.isArray(pathParam) ? pathParam : (typeof pathParam === 'string' ? [pathParam] : []);
    const subpath = '/' + segments.filter(Boolean).join('/');

    // Choose upstream base: default to API, but allow public site JSON via ?site=public
    const siteSelector = typeof rawQuery.site === 'string' ? rawQuery.site : (Array.isArray(rawQuery.site) ? rawQuery.site[0] : undefined);
    const upstreamBase = siteSelector === 'public' ? MDBLIST_SITE_BASE : MDBLIST_BASE;
    const url = new URL(subpath || '/', upstreamBase);

    // Merge incoming query (except 'path')
    Object.entries(rawQuery).forEach(([key, value]) => {
      if (key === 'path' || typeof value === 'undefined') return;
      // Do not forward internal site selector to upstream
      if (key === 'site') return;
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    // Forward API key header if provided
    const headers: Record<string, string> = {
      accept: 'application/json',
    };
    if (req.headers['x-api-key']) headers['x-api-key'] = String(req.headers['x-api-key']);
    if (req.headers['content-type']) headers['content-type'] = String(req.headers['content-type']);

    const init: RequestInit = {
      method: req.method,
      headers,
      body: req.method && !['GET', 'HEAD'].includes(req.method)
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined,
    };

    const upstream = await fetch(url.toString(), init);

    // Pass through rate limit headers
    const rlLimit = upstream.headers.get('x-ratelimit-limit');
    const rlRemain = upstream.headers.get('x-ratelimit-remaining');
    const rlReset = upstream.headers.get('x-ratelimit-reset');
    if (rlLimit) res.setHeader('x-ratelimit-limit', rlLimit);
    if (rlRemain) res.setHeader('x-ratelimit-remaining', rlRemain);
    if (rlReset) res.setHeader('x-ratelimit-reset', rlReset);

    const status = upstream.status;
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(status).json(data);
    } else {
      const text = await upstream.text();
      return res.status(status).send(text);
    }
  } catch (error: any) {
    console.error('MDBList proxy error:', error);
    return res.status(502).json({ error: 'Proxy to MDBList failed', detail: error?.message || 'Unknown error' });
  }
}
