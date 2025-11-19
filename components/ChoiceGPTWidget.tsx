import React, { useMemo, useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { searchMulti } from '../services/tmdbService';
import { useAppleTheme } from './AppleThemeProvider';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface ChoiceGPTWidgetProps {
  onClose?: () => void;
  inline?: boolean;
}

const ChoiceGPTWidget: React.FC<ChoiceGPTWidgetProps> = ({ onClose }) => {
  const { tokens } = useAppleTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi, I am ChoiceGPT. Ask me anything about movies, TV, streaming, and availability.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(true);
  const [apiKey] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [searchModel, setSearchModel] = useState<string>('gemini-search');
  const [rememberedCountry, setRememberedCountry] = useState<string | null>(null);
  const [rememberStreaming, setRememberStreaming] = useState<boolean>(false);

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
      setMessages([...nextMessages, { role: 'assistant', content: replyText }]);
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
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
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
        width: 'min(640px, 100%)',
        maxHeight: '70vh',
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
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: 8, height: 28, padding: '0 10px', borderRadius: 8, border: 'none', background: '#1f6feb', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>Close</button>
          )}
        </div>
        {/* API key input removed from UI per request */}
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === 'user' ? bubbleStyles.user : bubbleStyles.assistant}>{m.content}</div>
          ))}
        </div>
        <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') (searchMode ? runSearch() : sendMessage()); }}
              placeholder={searchMode ? 'Search (web + AI)…' : 'Ask ChoiceGPT…'}
              style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, minWidth: 0 }}
            />
            <button onClick={searchMode ? runSearch : sendMessage} disabled={loading} style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: loading ? '#999999' : '#1f6feb', color: '#ffffff', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>{loading ? 'Working…' : searchMode ? 'Search' : 'Send'}</button>
            <button onClick={() => setSearchMode(s => !s)} aria-label={searchMode ? 'Search: On' : 'Search: Off'} title={searchMode ? 'Search: On' : 'Search: Off'} style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 600, cursor: 'pointer' }}>
              <SettingsIcon size={18} />
            </button>
          </div>
          {/* Model selection hidden when not needed */}
        </div>
      </div>
  );

  if (inline) {
    return container;
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 10050 }}>
      {container}
    </div>
  );
};

export default ChoiceGPTWidget;
