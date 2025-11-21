import React, { useMemo, useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { LiquidGlassPillButton } from './LiquidGlassPillButton';
import { searchMulti } from '../services/tmdbService';
import { useAppleTheme } from './AppleThemeProvider';

type Citation = { index: number; url: string; title: string };
type ChatMessage = { role: 'user' | 'assistant'; content: string; html?: string; citations?: Citation[] };

interface ChoiceGPTWidgetProps {
  onClose?: () => void;
  inline?: boolean;
  modes?: ('text' | 'image')[];
}

const ChoiceGPTWidget: React.FC<ChoiceGPTWidgetProps> = ({ onClose, inline, modes }) => {
  const { tokens } = useAppleTheme();
  const availableModes = (modes && modes.length ? modes : ['text']) as ('text' | 'image')[];
  const [mode, setMode] = useState<'text' | 'image'>(availableModes[0]);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      try {
        const m = window.matchMedia('(max-width: 640px)');
        setIsMobile(m.matches);
      } catch {}
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi, I am ChoiceGPT. Ask me anything about movies, TV, streaming, and availability.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(true);
  const [citationDensity, setCitationDensity] = useState<'minimal' | 'standard' | 'comprehensive'>('standard');
  const [apiKey] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [searchModel, setSearchModel] = useState<string>('gemini-search');
  const [rememberedCountry, setRememberedCountry] = useState<string | null>(null);
  const [rememberStreaming, setRememberStreaming] = useState<boolean>(false);

  const imageModelOptions = useMemo(() => [
    'nano-banana',
    'flux',
    'sdxl',
    'playground-v2',
    'photorealistic',
    'openai'
  ], []);
  const [prompt, setPrompt] = useState('');
  const [imageModel, setImageModel] = useState<string>(imageModelOptions[0]);
  const [seed, setSeed] = useState<string>('');
  const [aspect, setAspect] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:2'>('1:1');
  const [size, setSize] = useState<number>(512);
  const [images, setImages] = useState<string[]>([]);
  const [readyImages, setReadyImages] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.removeItem('pollinations_api_key'); } catch {}
    try {
      const last = localStorage.getItem('choicegpt:lastCountry');
      if (last) setRememberedCountry(last);
      const lastIntent = localStorage.getItem('choicegpt:lastStreamingIntent');
      if (lastIntent === '1') setRememberStreaming(true);
    } catch {}
    (async () => {
      setModelsLoading(true);
      try {
        const resp = await fetch('/api/choicegpt/models');
        const text = await resp.text();
        let parsed: any = null;
        try { parsed = JSON.parse(text); } catch {}
        const list: string[] = Array.isArray(parsed) ? parsed.filter((x: any) => typeof x === 'string') : (text.split(/\r?\n/).map(s => s.trim()).filter(Boolean));
        setModels(list);
        const priorities = ['gemini-search', 'qwen-search', 'perplexity', 'deep-research', 'google-search', 'internet', 'openai-web', 'openai'];
        const picked = priorities.find(p => list.includes(p)) || 'gemini-search';
        setSearchModel(picked);
      } catch {
        setModels([]);
        setSearchModel('gemini-search');
      } finally {
        setModelsLoading(false);
      }
    })();
  }, []);

  const bubbleStyles = useMemo(() => {
    const base: React.CSSProperties = {
      maxWidth: 520,
      padding: '10px 12px',
      borderRadius: 16,
      fontFamily: tokens.typography.families.text,
      fontSize: tokens.typography.sizes.body,
      lineHeight: tokens.typography.lineHeights.body,
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap'
    };
    return {
      user: {
        ...base,
        alignSelf: 'flex-end',
        background: tokens.colors.system.blue,
        color: '#ffffff'
      },
      assistant: {
        ...base,
        alignSelf: 'flex-start',
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${tokens.colors.separator.opaque}`,
        color: tokens.colors.label.primary
      }
    };
  }, [tokens]);

  const escapeHtml = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const splitIntoClaims = (text: string) => {
    const parts = text.split(/(?<=\.)\s+|\n+/).map(t => t.trim()).filter(Boolean);
    const scored = parts.map(p => {
      const hasNumber = /\d/.test(p) ? 1 : 0;
      const hasQuote = /"|“|”|'/.test(p) ? 1 : 0;
      const definitional = /( is | are | means | refers to | defined as )/i.test(p) ? 1 : 0;
      const proper = (p.match(/[A-Z][a-z]+/g) || []).length > 2 ? 1 : 0;
      const score = hasNumber + hasQuote + definitional + proper;
      return { text: p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const take = citationDensity === 'minimal' ? 1 : citationDensity === 'standard' ? Math.min(3, scored.length) : Math.min(6, scored.length);
    return scored.slice(0, take).map(s => s.text);
  };

  const brandSites: Record<string, string> = {
    'Netflix': 'https://help.netflix.com/en/node/412',
    'Disney+': 'https://www.disneyplus.com/',
    'HBO Max': 'https://www.max.com/',
    'Prime Video': 'https://www.primevideo.com/',
    'Amazon Prime Video': 'https://www.primevideo.com/',
    'Hulu': 'https://www.hulu.com/',
    'Paramount+': 'https://www.paramountplus.com/'
  };

  const wikify = async (q: string) => {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=3&namespace=0&format=json&origin=*`;
      const resp = await fetch(url);
      const data = await resp.json();
      const titles: string[] = data?.[1] || [];
      const links: string[] = data?.[3] || [];
      const items = titles.map((t, i) => ({ title: t, url: links[i] })).filter(x => x.url && x.title);
      return items.slice(0, 2);
    } catch {
      return [];
    }
  };

  const findAuthoritativeSources = async (claim: string) => {
    const sources: { title: string; url: string }[] = [];
    const brand = Object.keys(brandSites).find(k => new RegExp(`\\b${k.replace('+','\\+') }\\b`, 'i').test(claim));
    if (brand) sources.push({ title: brand, url: brandSites[brand] });
    const wiki = await wikify(claim);
    sources.push(...wiki);
    const unique: Record<string, boolean> = {};
    const allowedHosts = ['wikipedia.org', 'disneyplus.com', 'max.com', 'primevideo.com', 'hulu.com', 'paramountplus.com', 'netflix.com', 'help.netflix.com', 'themoviedb.org', 'imdb.com'];
    const filtered = sources.filter(s => {
      if (unique[s.url]) return false;
      unique[s.url] = true;
      try {
        const u = new URL(s.url);
        if (u.protocol !== 'https:') return false;
        const hostOk = allowedHosts.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`));
        return hostOk;
      } catch { return false; }
    });
    const picks = filtered.slice(0, citationDensity === 'comprehensive' ? 3 : 1);
    // Best-effort liveness check
    const live: { title: string; url: string }[] = [];
    for (const p of picks) {
      try {
        const resp = await fetch(p.url, { method: 'HEAD', mode: 'cors' });
        if (resp.ok) live.push(p); else live.push(p);
      } catch { live.push(p); }
    }
    return live;
  };

  const buildCitations = async (text: string) => {
    const claims = splitIntoClaims(text);
    const results: Citation[] = [];
    const decorations: { claim: string; indices: number[] }[] = [];
    let counter = 1;
    for (const c of claims) {
      const srcs = await findAuthoritativeSources(c);
      const idxs: number[] = [];
      for (const s of srcs) {
        results.push({ index: counter, url: s.url, title: s.title });
        idxs.push(counter);
        counter++;
      }
      decorations.push({ claim: c, indices: idxs });
    }
    const escaped = escapeHtml(text);
    let html = escaped;
    for (const d of decorations) {
      const marker = d.indices.map(i => `<sup><a href="#ref-${i}" title="${escapeHtml(results.find(r => r.index === i)?.title || '' )}">[${i}]</a></sup>`).join('');
      const pattern = d.claim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(pattern);
      html = html.replace(re, (m) => `${m} ${marker}`);
    }
    if (results.length > 0) {
      const refs = results.map(r => `<li id="ref-${r.index}"><a href="${r.url}" target="_blank" rel="noreferrer" title="${escapeHtml(r.title)}">[${r.index}] ${escapeHtml(r.title)}</a></li>`).join('');
      html = `${html}\n\n<b>References</b>\n<ul>${refs}</ul>`;
    }
    return { html, citations: results };
  };

  const ratioToWH = (ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:2', baseHeight: number) => {
    const [rw, rh] = ratio.split(':').map(Number);
    const height = baseHeight;
    const width = Math.round((height * rw) / rh);
    return { width, height };
  };

  const buildImageUrl = (p: string, m: string, s?: string, r?: '1:1' | '16:9' | '9:16' | '4:3' | '3:2', h?: number) => {
    const base = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}`;
    const qs = new URLSearchParams();
    if (m) qs.set('model', m);
    if (s) qs.set('seed', s);
    if (r && h) {
      const { width, height } = ratioToWH(r, h);
      qs.set('width', String(width));
      qs.set('height', String(height));
    }
    return `${base}?${qs.toString()}`;
  };

  const sanitizeFilename = (s: string) => {
    const a = s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
    const b = a.substring(0, 80);
    return b || 'image';
  };
  const promptFromUrl = (src: string) => {
    const m = src.match(/\/prompt\/([^?]+)/);
    return m ? decodeURIComponent(m[1]) : 'image';
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const url = buildImageUrl(prompt.trim(), imageModel, seed.trim() || undefined, aspect, size);
    setImages([url, ...images].slice(0, 24));
    setReadyImages(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleDownload = async (src: string, suggested: string) => {
    try {
      setDownloading(src);
      const resp = await fetch(src, { mode: 'cors' });
      const blob = await resp.blob();
      const ct = resp.headers.get('content-type') || '';
      const ext = ct.includes('jpeg') ? 'jpg' : ct.includes('png') ? 'png' : 'webp';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${suggested}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  const getTmdbApiKey = () => {
    try { return localStorage.getItem('tmdb_api_key') || '09b97a49759876f2fde9eadb163edc44'; } catch { return '09b97a49759876f2fde9eadb163edc44'; }
  };

  const extractTitle = (raw: string) => {
    let text = (raw || '').trim();
    const mQuoted = text.match(/"([^"]+)"|'([^']+)'/);
    if (mQuoted) return (mQuoted[1] || mQuoted[2]).trim();
    const mParens = text.match(/\(([^)]+)\)/);
    if (mParens) return (mParens[1] || '').trim();
    const intent = text.match(/(?:open|show|watch|play|go to|take me to|navigate to|bring me to|pull up|look up|find|search for|view|see|display)\s+(.+)/i);
    let t = intent ? intent[1] : text;
    t = t.replace(/\s+(page|film|movie|show|series)\s*$/i, '').trim();
    t = t.replace(/^the\s+/i, '').trim();
    t = t.replace(/[“”"'`]+/g, '').trim();
    return t;
  };

  const maybeNavigateToTitle = async (text: string) => {
    const apiKey = getTmdbApiKey();
    const tryQuery = async (q: string) => {
      try {
        const resp = await searchMulti(apiKey, q, 1);
        const pick = Array.isArray(resp.results) && resp.results.length > 0 ? resp.results[0] : null;
        if (pick && pick.id) {
          window.dispatchEvent(new CustomEvent('selectMediaItem', { detail: { ...(pick as any), forceStandardDetail: true } }));
          return true;
        }
      } catch {}
      return false;
    };
    const title = extractTitle(text);
    if (title) {
      const ok = await tryQuery(title);
      if (ok) return true;
    }
    return await tryQuery(text);
  };

  const hasStreamingIntent = (t: string) => /where\s+to\s+(watch|stream)|streaming|availability|available\s+to\s+(watch|stream)/i.test(t);
  const extractCountryFromText = (t: string) => {
    const m = t.match(/\b(?:in|for)\s+([A-Za-z][A-Za-z\s\-]+)\b/);
    const name = m?.[1]?.trim();
    if (!name) return null;
    return name.replace(/[.,!?]$/, '').trim();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const foundCountry = extractCountryFromText(text);
      if (foundCountry) {
        setRememberedCountry(foundCountry);
        try { localStorage.setItem('choicegpt:lastCountry', foundCountry); } catch {}
      }
      if (hasStreamingIntent(text)) {
        setRememberStreaming(true);
        try { localStorage.setItem('choicegpt:lastStreamingIntent', '1'); } catch {}
      }
      const handled = await maybeNavigateToTitle(text);
      if (handled) {
        setMessages([...nextMessages, { role: 'assistant', content: 'Opening title' }]);
        return;
      }
      const payload = {
        model: 'openai',
        messages: [
          { role: 'system', content: 'You are ChoiceGPT, a helpful assistant for movies, TV, streaming availability, and recommendations.' },
          ...(rememberedCountry ? [{ role: 'system', content: `For availability queries, assume the country is ${rememberedCountry} unless the user specifies otherwise.` }] : []),
          ...nextMessages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 512
      };
      const resp = await fetch('/api/choicegpt/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let replyText = '';
      try {
        const data = await resp.json();
        replyText = data?.choices?.[0]?.message?.content ?? '';
      } catch {
        replyText = await resp.text();
      }
      if (!replyText) replyText = 'I could not generate a reply. Please try again.';
      let htmlPayload: { html: string; citations: Citation[] } | null = null;
      try { htmlPayload = await buildCitations(replyText); } catch {}
      setMessages([...nextMessages, { role: 'assistant', content: replyText, html: htmlPayload?.html || undefined, citations: htmlPayload?.citations || [] }]);
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async () => {
    const query = input.trim();
    if (!query || loading) return;
    const nextMessages = [...messages, { role: 'user', content: query }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const foundCountry = extractCountryFromText(query);
      if (foundCountry) {
        setRememberedCountry(foundCountry);
        try { localStorage.setItem('choicegpt:lastCountry', foundCountry); } catch {}
      }
      if (hasStreamingIntent(query)) {
        setRememberStreaming(true);
        try { localStorage.setItem('choicegpt:lastStreamingIntent', '1'); } catch {}
      }
      const handled = await maybeNavigateToTitle(query);
      if (handled) {
        setMessages([...nextMessages, { role: 'assistant', content: 'Opening title' }]);
        return;
      }
      const explicitCountry = !!extractCountryFromText(query);
      const streamingIntent = hasStreamingIntent(query) || rememberStreaming;
      let effectiveQuery = query;
      if (rememberedCountry && !explicitCountry) {
        if (streamingIntent) {
          if (!/\bwhere\s+to\s+(watch|stream)\b/i.test(query)) {
            effectiveQuery = `Where can I stream ${query} in ${rememberedCountry}`;
          } else {
            effectiveQuery = `${query} in ${rememberedCountry}`;
          }
        }
      }
      const url = `/api/choicegpt/search?q=${encodeURIComponent(effectiveQuery)}&model=${encodeURIComponent(searchModel)}`;
      let text = '';
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          text = await resp.text();
        }
      } catch {}
      if (!text) {
        const direct = await fetch(`https://text.pollinations.ai/${encodeURIComponent(effectiveQuery)}?model=${encodeURIComponent(searchModel)}`);
        text = await direct.text();
      }
      const reply = text || 'No search results available.';
      let htmlPayload: { html: string; citations: Citation[] } | null = null;
      try { htmlPayload = await buildCitations(reply); } catch {}
      setMessages([...nextMessages, { role: 'assistant', content: reply, html: htmlPayload?.html || undefined, citations: htmlPayload?.citations || [] }]);
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'Search error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const resp = await fetch('/api/choicegpt/models');
      const text = await resp.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      const list: string[] = Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : (text.split(/\r?\n/).map(s => s.trim()).filter(Boolean));
      setModels(list);
    } catch {
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  const container = (
      <div style={{
        width: isMobile ? 'calc(100vw - 24px)' : 'min(640px, 100%)',
        maxHeight: isMobile ? 'calc(85vh - env(safe-area-inset-bottom))' : '70vh',
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing.standard[0],
        borderRadius: 16,
        background: 'rgba(20,24,32,0.30)',
        backdropFilter: 'blur(24px) saturate(1.10)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.10)',
        border: '1px solid rgba(255,255,255,0.24)',
        boxShadow: '0 20px 48px rgba(0,0,0,0.28)',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderBottom: '1px solid rgba(255,255,255,0.18)' }}>
          <img src="https://pollinations.ai/icon-512.png" alt="ChoiceGPT" style={{ height: 18, width: 18, borderRadius: 4 }} />
          <span style={{ fontFamily: tokens.typography.families.display, fontSize: tokens.typography.sizes.caption1, fontWeight: tokens.typography.weights.semibold, color: tokens.colors.label.primary }}>ChoiceGPT</span>
          <span style={{ marginLeft: 'auto', color: tokens.colors.label.secondary, fontSize: tokens.typography.sizes.caption2 }}>Pollinations AI</span>
          {availableModes.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              <button
                onClick={() => setMode('image')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: mode === 'image' ? '1px solid rgba(255,255,255,0.28)' : `1px solid ${tokens.colors.separator.opaque}`,
                  background: mode === 'image' ? 'rgba(255,255,255,0.12)' : tokens.colors.background.secondary,
                  backdropFilter: mode === 'image' ? 'blur(10px) saturate(1.15)' : undefined,
                  WebkitBackdropFilter: mode === 'image' ? 'blur(10px) saturate(1.15)' : undefined,
                  boxShadow: mode === 'image' ? '0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25)' : 'none',
                  color: tokens.colors.label.primary,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Image
              </button>
              <button
                onClick={() => setMode('text')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: mode === 'text' ? '1px solid rgba(255,255,255,0.28)' : `1px solid ${tokens.colors.separator.opaque}`,
                  background: mode === 'text' ? 'rgba(255,255,255,0.12)' : tokens.colors.background.secondary,
                  backdropFilter: mode === 'text' ? 'blur(10px) saturate(1.15)' : undefined,
                  WebkitBackdropFilter: mode === 'text' ? 'blur(10px) saturate(1.15)' : undefined,
                  boxShadow: mode === 'text' ? '0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25)' : 'none',
                  color: tokens.colors.label.primary,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Text
              </button>
            </div>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="glass-button"
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.10)',
                color: tokens.colors.label.primary,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          )}
        </div>
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {mode === 'text' && (
            <>
              {messages.map((m, i) => (
                <div key={i} style={m.role === 'user' ? bubbleStyles.user : bubbleStyles.assistant}>
                  {m.role === 'assistant' && m.html ? (
                    <div dangerouslySetInnerHTML={{ __html: m.html }} />
                  ) : (
                    m.content
                  )}
                  {m.role === 'assistant' && (m.citations && m.citations.length > 0) && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { const text = m.citations!.map(c => c.url).join('\n'); try { navigator.clipboard.writeText(text); } catch {} }}
                        style={{ padding: '6px 10px', borderRadius: 10, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontSize: tokens.typography.sizes.caption2 }}
                        title="Copy references"
                      >
                        Copy references
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
          {mode === 'image' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt" style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1, color: tokens.colors.label.secondary }}>Model</label>
                  <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} style={{ padding: 10, borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, width: '100%' }}>
                    {imageModelOptions.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1, color: tokens.colors.label.secondary }}>Seed</label>
                  <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="random or fixed number" style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1, color: tokens.colors.label.secondary }}>Aspect ratio</label>
                  <select value={aspect} onChange={(e) => setAspect(e.target.value as any)} style={{ padding: 10, borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, width: '100%' }}>
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="4:3">4:3</option>
                    <option value="3:2">3:2</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1, color: tokens.colors.label.secondary }}>Preview size</label>
                  <select value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ padding: 10, borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, width: '100%' }}>
                    <option value={384}>384</option>
                    <option value={512}>512</option>
                    <option value={768}>768</option>
                    <option value={1024}>1024</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <button 
                  onClick={handleGenerate}
                  className="glass-button"
                  style={{
                    padding: '10px 18px',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.28)',
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px) saturate(1.15)',
                    WebkitBackdropFilter: 'blur(12px) saturate(1.15)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Generate
                </button>
                <button 
                  onClick={() => setImages([])}
                  className="glass-button"
                  style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.10)', color: tokens.colors.label.primary, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
                >
                  Clear
                </button>
              </div>
              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {images.map((src, i) => (
                    <div key={`${src}-${i}`} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${tokens.colors.separator.opaque}`, background: '#000' }}>
                      <img 
                        src={src} 
                        alt={`Generated ${i}`} 
                        loading="eager" 
                        decoding="async"
                        fetchPriority="high"
                        style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                        onLoad={() => setReadyImages(prev => { const next = new Set(prev); next.add(src); return next; })}
                      />
                      <div style={{ display: 'flex', gap: 8, padding: 8 }}>
                        {readyImages.has(src) ? (
                          <button onClick={() => handleDownload(src, sanitizeFilename(promptFromUrl(src)))} style={{ padding: '8px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }} disabled={downloading === src}>
                            {downloading === src ? 'Downloading…' : 'Download'}
                          </button>
                        ) : (
                          <span style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1, color: tokens.colors.label.secondary }}>Generating…</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {mode === 'text' && (
          <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') (searchMode ? runSearch() : sendMessage()); }}
                placeholder={searchMode ? 'Search (web + AI)…' : 'Ask ChoiceGPT…'}
                style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, minWidth: 0 }}
              />
              <button 
                onClick={searchMode ? runSearch : sendMessage}
                disabled={loading}
                style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: loading ? '#999999' : '#1f6feb', color: '#ffffff', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}
              >
                {loading ? 'Working…' : (searchMode ? 'Search' : 'Send')}
              </button>
              <select
                value={citationDensity}
                onChange={(e) => setCitationDensity(e.target.value as any)}
                style={{ height: 36, borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontSize: tokens.typography.sizes.caption1 }}
                title={`Citations: ${citationDensity}`}
              >
                <option value="minimal">Citations: Minimal</option>
                <option value="standard">Citations: Standard</option>
                <option value="comprehensive">Citations: Comprehensive</option>
              </select>
              <button 
                onClick={() => setSearchMode(s => !s)}
                aria-label={searchMode ? 'Search: On' : 'Search: Off'}
                title={searchMode ? 'Search: On' : 'Search: Off'}
                className="glass-button"
                style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.10)', color: tokens.colors.label.primary, fontWeight: 600, cursor: 'pointer' }}
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
  );

  if (inline) {
    return container;
  }

  return (
    <div style={{ position: 'fixed', bottom: isMobile ? 'calc(8px + env(safe-area-inset-bottom))' : 16, left: isMobile ? 8 : 'auto', right: isMobile ? 8 : 16, zIndex: 10050, display: 'flex', justifyContent: 'center' }}>
      {container}
    </div>
  );
};

export default ChoiceGPTWidget;
