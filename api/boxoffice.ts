import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const apiKey = process.env.POLLINATIONS_API_KEY || process.env.VITE_POLLINATIONS_API_KEY || '';
    const referer = (req.headers['referer'] as string) || process.env.PUBLIC_ORIGIN || '';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const title = String(body.title || '').trim();
    const year = String(body.year || '').trim();
    const imdbId = String(body.imdbId || '').trim();
    const tmdbId = body.tmdbId ? String(body.tmdbId) : '';
    if (!title && !imdbId) {
      return res.status(400).json({ error: 'Missing title or imdbId' });
    }

    const model = body.model || 'openai/gpt-4o-mini';

    const prompt = (
      imdbId
        ? `Return STRICT JSON for IMDb ${imdbId} box office metrics. Keys: totalGrossUsd(number), openingWeekendUsd(number), theaters(number), weeklyGrosses(array of {weekStart(ISO8601), grossUsd(number)}), updatedAt(ISO8601), sources(array of urls). Use BoxOfficeMojo as the primary source. Optionally cross-check with The Numbers. Ensure sources include at least one boxofficemojo.com URL. Only output JSON.`
        : `Return STRICT JSON for movie "${title}"${year ? ` (${year})` : ''} box office metrics. Keys: totalGrossUsd(number), openingWeekendUsd(number), theaters(number), weeklyGrosses(array of {weekStart(ISO8601), grossUsd(number)}), updatedAt(ISO8601), sources(array of urls). Use BoxOfficeMojo as the primary source. Optionally cross-check with The Numbers. Ensure sources include at least one boxofficemojo.com URL. Only output JSON.`
    );

    const resp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(referer ? { Referer: referer } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You return only valid JSON with numeric USD values and ISO dates. No prose.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    const text = await resp.text();
    let data: any = null;
    try {
      const json = JSON.parse(text);
      const content = json?.choices?.[0]?.message?.content?.trim();
      if (content) {
        try {
          data = JSON.parse(content);
        } catch {
          const start = content.indexOf('{');
          const end = content.lastIndexOf('}');
          if (start >= 0 && end > start) {
            data = JSON.parse(content.slice(start, end + 1));
          }
        }
      }
    } catch {
      try { data = JSON.parse(text); } catch {}
    }

    if (!data || typeof data !== 'object') {
      return res.status(502).json({ error: 'Invalid AI response' });
    }

    return res.status(200).json({
      totalGrossUsd: Number(data.totalGrossUsd || 0),
      openingWeekendUsd: Number(data.openingWeekendUsd || 0),
      theaters: Number(data.theaters || 0),
      weeklyGrosses: Array.isArray(data.weeklyGrosses) ? data.weeklyGrosses.map((w: any) => ({ weekStart: String(w.weekStart || ''), grossUsd: Number(w.grossUsd || 0) })) : [],
      updatedAt: String(data.updatedAt || new Date().toISOString()),
      sources: Array.isArray(data.sources) ? data.sources.map(String) : [],
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: e?.message || String(e) });
  }
}
