import React, { useMemo, useState } from 'react';
import ChoiceGPTWidget from '../components/ChoiceGPTWidget';
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

  const [mode, setMode] = useState<'image' | 'text'>('image');

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


  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0b0e14 0%, #0f1420 60%, #0b0e14 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[0]}px` }}>
        <section style={sectionStyle}>
          <h1 style={{ ...titleStyle, fontSize: tokens.typography.sizes.largeTitle }}>ChoiceGen</h1>
          <p style={{ fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.body, color: tokens.colors.label.secondary }}>
            Choice — switch between Text (ChoiceGPT) and Image (ChoiceGen).
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMode('image')} style={{ ...buttonSecondary, background: mode === 'image' ? 'rgba(31,111,235,0.18)' : tokens.colors.background.secondary }}>
              Image
            </button>
            <button onClick={() => setMode('text')} style={{ ...buttonSecondary, background: mode === 'text' ? 'rgba(31,111,235,0.18)' : tokens.colors.background.secondary }}>
              Text
            </button>
          </div>
        </section>

        <section style={sectionStyle}>
          <ChoiceGPTWidget inline modes={['image','text']} />
        </section>
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
