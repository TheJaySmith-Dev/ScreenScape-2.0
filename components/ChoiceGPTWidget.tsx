import React, { useMemo, useState, useEffect } from 'react';
import { useAppleTheme } from './AppleThemeProvider';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface ChoiceGPTWidgetProps {
  onClose: () => void;
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

  useEffect(() => {
    try { localStorage.removeItem('pollinations_api_key'); } catch {}
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

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const payload = {
        model: 'openai',
        messages: [
          { role: 'system', content: 'You are ChoiceGPT, a helpful assistant for movies, TV, streaming availability, and recommendations.' },
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
      const url = `/api/choicegpt/search?q=${encodeURIComponent(query)}&model=gemini-search`;
      const resp = await fetch(url);
      const text = await resp.text();
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

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 10050 }}>
      <div style={{
        width: 420,
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
          <button onClick={onClose} style={{ marginLeft: 8, height: 28, padding: '0 10px', borderRadius: 8, border: 'none', background: '#1f6feb', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>Close</button>
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
              style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }}
            />
            <button onClick={searchMode ? runSearch : sendMessage} disabled={loading} style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: loading ? '#999999' : '#1f6feb', color: '#ffffff', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>{loading ? 'Working…' : searchMode ? 'Search' : 'Send'}</button>
            <button onClick={() => setSearchMode(s => !s)} style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 600, cursor: 'pointer' }}>{searchMode ? 'Search: On' : 'Search: Off'}</button>
          </div>
          {/* Model selection hidden when not needed */}
        </div>
      </div>
    </div>
  );
};

export default ChoiceGPTWidget;