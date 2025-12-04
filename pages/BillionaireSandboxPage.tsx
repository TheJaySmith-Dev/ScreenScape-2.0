import React, { useMemo, useState } from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';
import { Link, useNavigate } from 'react-router-dom';
import { POLLINATIONS_API_KEY } from '../utils/genscapeKeys';

type BillionaireProfile = {
  name: string;
  prompt: string;
  defaultNetWorthUsd: number;
  holdings: string[];
};

const formatUsd = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const SandboxContent: React.FC = () => {
  const { tokens } = useAppleTheme();
  const navigate = useNavigate();
  const profiles: BillionaireProfile[] = useMemo(
    () => [
      {
        name: 'Elon Musk',
        prompt: 'photo portrait of Elon Musk, ultra-realistic, cinematic lighting, 4k',
        defaultNetWorthUsd: 280_000_000_000,
        holdings: ['Tesla', 'SpaceX', 'xAI', 'Neuralink', 'The Boring Company']
      },
      {
        name: 'Jeff Bezos',
        prompt: 'photo portrait of Jeff Bezos, ultra-realistic, cinematic lighting, 4k',
        defaultNetWorthUsd: 210_000_000_000,
        holdings: ['Amazon', 'Blue Origin', 'Bezos Expeditions']
      },
      {
        name: 'Bernard Arnault',
        prompt: 'photo portrait of Bernard Arnault, ultra-realistic, cinematic lighting, 4k',
        defaultNetWorthUsd: 200_000_000_000,
        holdings: ['LVMH', 'Dior', 'Louis Vuitton', 'Moët & Chandon']
      },
      {
        name: 'Bill Gates',
        prompt: 'photo portrait of Bill Gates, ultra-realistic, cinematic lighting, 4k',
        defaultNetWorthUsd: 130_000_000_000,
        holdings: ['Microsoft', 'Breakthrough Energy', 'Gates Foundation']
      },
      {
        name: 'Mark Zuckerberg',
        prompt: 'photo portrait of Mark Zuckerberg, ultra-realistic, cinematic lighting, 4k',
        defaultNetWorthUsd: 150_000_000_000,
        holdings: ['Meta Platforms', 'Instagram', 'WhatsApp']
      }
    ],
    []
  );

  const [selected, setSelected] = useState<BillionaireProfile | null>(profiles[0]);
  const [netWorth, setNetWorth] = useState<number>(profiles[0].defaultNetWorthUsd);
  const [feed, setFeed] = useState<string[]>([]);

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.micro[2],
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

  const bodyStyle: React.CSSProperties = {
    fontFamily: tokens.typography.families.text,
    fontSize: tokens.typography.sizes.body,
    color: tokens.colors.label.secondary,
    lineHeight: 1.5
  };

  const portraitUrl = selected
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(selected.prompt)}?nologo=true&private=true&key=${POLLINATIONS_API_KEY}`
    : '';

  const appendEvent = (label: string, delta: number) => {
    setFeed(f => [`${new Date().toLocaleTimeString()}: ${label}`, ...f].slice(0, 24));
    setNetWorth(n => Math.max(0, n + delta));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0b0e14 0%, #0f1420 60%, #0b0e14 100%)'
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[0]}px` }}>
        <section style={sectionStyle}>
          <h1 style={{ ...titleStyle, fontSize: tokens.typography.sizes.largeTitle }}>Billionaire Sandbox</h1>
          <p style={bodyStyle}>
            Experience a dynamic, AI-powered simulation that lets you live out the unpredictable life of one of the world’s richest people. Select a real profile with portrait imagery from Pollinations AI, make narrative choices, and watch an ever-evolving scenario feed shape your legacy.
          </p>
          <div style={{ display: 'flex', gap: tokens.spacing.standard[0], flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profiles.map(p => (
                <button
                  key={p.name}
                  onClick={() => {
                    setSelected(p);
                    setNetWorth(p.defaultNetWorthUsd);
                    setFeed([]);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 999,
                    border: selected?.name === p.name ? '2px solid #1f6feb' : `1px solid ${tokens.colors.separator.opaque}`,
                    background: selected?.name === p.name ? 'rgba(31,111,235,0.18)' : tokens.colors.background.secondary,
                    color: tokens.colors.label.primary,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/Home')}
              style={{
                marginLeft: 'auto',
                padding: '10px 14px',
                borderRadius: 999,
                border: `1px solid ${tokens.colors.separator.opaque}`,
                background: tokens.colors.background.secondary,
                color: tokens.colors.label.primary,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Back to Home
            </button>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={titleStyle}>Profile</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: tokens.spacing.standard[0] }}>
            <div style={{ display: 'flex', gap: tokens.spacing.standard[0], alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img
                src={portraitUrl}
                alt={selected?.name || 'Portrait'}
                loading="lazy"
                style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 12, background: '#000' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 240, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: tokens.typography.families.display, fontSize: tokens.typography.sizes.title3, fontWeight: tokens.typography.weights.bold, color: tokens.colors.label.primary }}>
                    {selected?.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: tokens.colors.label.secondary }}>Net worth</span>
                  <span style={{ fontWeight: 700, color: tokens.colors.label.primary }}>{formatUsd(netWorth)}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(selected?.holdings || []).map(h => (
                    <span key={h} style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${tokens.colors.separator.opaque}`, color: tokens.colors.label.primary }}>{h}</span>
                  ))}
                </div>
              </div>
            </div>
            <p style={bodyStyle}>
              Every decision becomes the seed for a unique narrative. Invest, spend, donate, or expand your empire; the scenario feed adapts in real time with outcomes and opportunities.
            </p>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={titleStyle}>Make a choice</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.standard[0] }}>
            <button
              onClick={() => appendEvent('Backed a breakthrough startup; markets rally', Math.round(netWorth * 0.01))}
              style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: '#1f6feb', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
            >
              Invest in startup
            </button>
            <button
              onClick={() => appendEvent('Resolved a business scandal; reputation up, legal costs incurred', Math.round(netWorth * -0.002))}
              style={{ padding: '12px 18px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 700, cursor: 'pointer' }}
            >
              Resolve scandal
            </button>
            <button
              onClick={() => appendEvent('Funded a global cause; influence rises', Math.round(netWorth * -0.001))}
              style={{ padding: '12px 18px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 700, cursor: 'pointer' }}
            >
              Donate to cause
            </button>
            <button
              onClick={() => appendEvent('Acquired a luxury asset; lifestyle index spikes', Math.round(netWorth * -0.0005))}
              style={{ padding: '12px 18px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 700, cursor: 'pointer' }}
            >
              Buy luxury asset
            </button>
            <button
              onClick={() => appendEvent('Expanded empire with strategic merger', Math.round(netWorth * 0.005))}
              style={{ padding: '12px 18px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 700, cursor: 'pointer' }}
            >
              Expand empire
            </button>
          </div>
          <p style={bodyStyle}>Time advances dynamically as you play; every action updates your wealth and opens new branches of opportunity, challenge, or unexpected drama.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={titleStyle}>Scenario feed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feed.length === 0 && (
              <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, color: tokens.colors.label.secondary }}>
                Make a choice to begin the story. Each round adapts to your decisions.
              </div>
            )}
            {feed.map((e, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${tokens.colors.separator.opaque}`, color: tokens.colors.label.primary }}>
                {e}
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={titleStyle}>About</h2>
          <p style={bodyStyle}>
            There is no scoring or competition—just an ongoing story as unpredictable as real life, told through a constantly evolving dashboard and scenario feed. Enhanced by real-time imagery and company data, your journey reflects headlines, markets, and the creative potential of generative AI.
          </p>
          <div style={{ display: 'flex', gap: tokens.spacing.standard[0] }}>
            <Link to="/play/studio-mogul" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '12px 18px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 700, cursor: 'pointer' }}>
                Try Studio Mogul
              </button>
            </Link>
            <a href="https://pollinations.ai/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '12px 18px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary, fontWeight: 700, cursor: 'pointer' }}>
                Powered by Pollinations AI
              </button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

const BillionaireSandboxPage: React.FC = () => {
  return (
    <AppleThemeProvider>
      <SandboxContent />
    </AppleThemeProvider>
  );
};

export default BillionaireSandboxPage;

