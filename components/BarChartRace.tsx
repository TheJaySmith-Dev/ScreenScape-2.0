import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppleTheme } from './AppleThemeProvider';

type Entry = { title: string; grossCumeUsd: number; sourceUrl?: string };
type Frame = { date: string; entries: Entry[] };

interface Props {
  frames: Frame[];
  durationMsPerFrame?: number;
  maxBars?: number;
}

const BarChartRace: React.FC<Props> = ({ frames = [], durationMsPerFrame = 1200, maxBars = 15 }) => {
  const { tokens } = useAppleTheme();
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const current = frames[Math.min(frameIndex, Math.max(0, frames.length - 1))] || { date: '', entries: [] };
  const top = useMemo(() => {
    const set = (current.entries || []).slice().sort((a, b) => (b.grossCumeUsd || 0) - (a.grossCumeUsd || 0)).slice(0, maxBars);
    const max = set.length > 0 ? Math.max(...set.map(e => e.grossCumeUsd || 0)) : 1;
    return set.map(e => ({ ...e, pct: max > 0 ? (e.grossCumeUsd || 0) / max : 0 }));
  }, [current, maxBars]);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const step = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const delta = ts - lastTsRef.current;
      if (delta >= durationMsPerFrame) {
        lastTsRef.current = ts;
        setFrameIndex(i => {
          const next = i + 1;
          if (next >= frames.length) {
            return i;
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = 0;
    };
  }, [playing, frames, durationMsPerFrame]);

  const toggle = () => setPlaying(p => !p);
  const reset = () => { setFrameIndex(0); lastTsRef.current = 0; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.micro[2] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.micro[1] }}>
        <button onClick={toggle} style={{ padding: '8px 12px', borderRadius: 999, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={reset} style={{ padding: '8px 12px', borderRadius: 999, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }}>
          Reset
        </button>
        <div style={{ marginLeft: 'auto', fontFamily: tokens.typography.families.mono, color: tokens.colors.label.secondary }}>
          {current.date || ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top.map((e, idx) => (
          <div key={`${current.date}-${e.title}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, textAlign: 'right', color: tokens.colors.label.secondary }}>{idx + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 28, borderRadius: 8, background: tokens.colors.fill.tertiary, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(e.pct * 100)}%`, height: '100%', background: tokens.colors.accent.primary, transition: 'width 400ms ease' }} />
              </div>
            </div>
            <div style={{ width: 320, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ color: tokens.colors.label.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
              <div style={{ fontFamily: tokens.typography.families.mono, color: tokens.colors.label.secondary }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(e.grossCumeUsd || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChartRace;
