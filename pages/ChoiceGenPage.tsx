import React, { useMemo, useState } from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';

const ChoiceGenContent: React.FC = () => {
  const { tokens } = useAppleTheme();
  const modelOptions = useMemo(() => [
    'nano-banana',
    'flux',
    'sdxl',
    'playground-v2',
    'photorealistic',
    'openai',
  ], []);

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>(modelOptions[0]);
  const [seed, setSeed] = useState<string>('');
  const [aspect, setAspect] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:2'>('1:1');
  const [size, setSize] = useState<number>(512);
  const [images, setImages] = useState<string[]>([]);
  const [readyImages, setReadyImages] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.standard[0],
    padding: tokens.spacing.standard[1],
    borderRadius: 16,
    border: `1px solid ${tokens.colors.separator.opaque}`,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)'
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: tokens.typography.families.display,
    fontSize: tokens.typography.sizes.title2,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.label.primary,
    margin: 0
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: tokens.typography.families.text,
    fontSize: tokens.typography.sizes.caption1,
    color: tokens.colors.label.secondary
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 12,
    border: `1px solid ${tokens.colors.separator.opaque}`,
    background: tokens.colors.background.secondary,
    color: tokens.colors.label.primary,
    outline: 'none'
  };

  const buttonPrimary: React.CSSProperties = {
    padding: '12px 18px',
    borderRadius: 12,
    border: 'none',
    background: '#1f6feb',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer'
  };

  const buttonSecondary: React.CSSProperties = {
    padding: '12px 18px',
    borderRadius: 12,
    border: `1px solid ${tokens.colors.separator.opaque}`,
    background: tokens.colors.background.secondary,
    color: tokens.colors.label.primary,
    fontWeight: 700,
    cursor: 'pointer'
  };

  const ratioToWH = (ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:2', baseHeight: number) => {
    const [rw, rh] = ratio.split(':').map(Number);
    const height = baseHeight;
    const width = Math.round((height * rw) / rh);
    return { width, height };
  };

  const buildImageUrl = (p: string, m: string, s?: string, ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:2', baseHeight?: number) => {
    const base = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}`;
    const qs = new URLSearchParams();
    if (m) qs.set('model', m);
    if (s) qs.set('seed', s);
    if (ratio && baseHeight) {
      const { width, height } = ratioToWH(ratio, baseHeight);
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
    const url = buildImageUrl(prompt.trim(), model, seed.trim() || undefined, aspect, size);
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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0b0e14 0%, #0f1420 60%, #0b0e14 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[0]}px` }}>
        <section style={sectionStyle}>
          <h1 style={{ ...titleStyle, fontSize: tokens.typography.sizes.largeTitle }}>ChoiceGen</h1>
          <p style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.body, color: tokens.colors.label.secondary }}>
            Generate images with selectable Pollinations.ai models. Choose a model like Nano Banana, craft prompts, and produce visuals instantly.
          </p>
        </section>

        {
          <section style={sectionStyle}>
            <h2 style={titleStyle}>Image generation</h2>
            <label style={labelStyle}>Prompt</label>
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., cinematic portrait, neon glow, 35mm" style={inputStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} style={{ ...inputStyle, padding: 10 }}>
                  {modelOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Seed (optional)</label>
                <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="random or fixed number" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Aspect ratio</label>
                <select value={aspect} onChange={(e) => setAspect(e.target.value as any)} style={{ ...inputStyle, padding: 10 }}>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="4:3">4:3</option>
                  <option value="3:2">3:2</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Preview size</label>
                <select value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ ...inputStyle, padding: 10 }}>
                  <option value={384}>384 (fastest)</option>
                  <option value={512}>512</option>
                  <option value={768}>768</option>
                  <option value={1024}>1024 (slower)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleGenerate} style={buttonPrimary}>Generate</button>
              <button onClick={() => setImages([])} style={buttonSecondary}>Clear</button>
            </div>
          </section>
        }


        {images.length > 0 && (
          <section style={sectionStyle}>
            <h2 style={titleStyle}>Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
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
                      <button onClick={() => handleDownload(src, sanitizeFilename(promptFromUrl(src)))} style={buttonSecondary} disabled={downloading === src}>
                        {downloading === src ? 'Downloading…' : 'Download'}
                      </button>
                    ) : (
                      <span style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1, color: tokens.colors.label.secondary }}>Generating…</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const ChoiceGenPage: React.FC = () => {
  return (
    <AppleThemeProvider>
      <ChoiceGenContent />
    </AppleThemeProvider>
  );
};

export default ChoiceGenPage;
