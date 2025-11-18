import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppleThemeProvider, useAppleTheme } from '../components/AppleThemeProvider';
import Loader from '../components/Loader';
import TopNavigation from '../components/TopNavigation';
import { LiquidPillNavigation } from '../components/LiquidPillNavigation';
import { useNavigate } from 'react-router-dom';
import BarChartRace from '../components/BarChartRace';
import { discoverTopRevenueMovies, getMovieDetails, searchPerson, getActorTopRevenueMovies } from '../services/tmdbService';
import { getOMDbFromTMDBDetails, hasOMDbKey } from '../services/omdbService';

type RankedItem = {
  id: number;
  title: string;
  revenue: number;
  release_date?: string | null;
  omdb?: any | null;
};

const getApiKey = (): string => {
  return localStorage.getItem('tmdb_api_key') || '09b97a49759876f2fde9eadb163edc44';
};

const currency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tokens } = useAppleTheme();
  return (
    <h2 style={{
      fontFamily: tokens.typography.families.display,
      fontSize: tokens.typography.sizes.title3,
      fontWeight: tokens.typography.weights.bold,
      color: tokens.colors.label.primary,
      margin: 0
    }}>{children}</h2>
  );
};

const RankedList: React.FC<{ items: RankedItem[] }> = ({ items }) => {
  const { tokens } = useAppleTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.micro[2] }}>
      {items.map((it, idx) => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.standard[0], border: `1px solid ${tokens.colors.separator.opaque}`, borderRadius: 12, padding: 8, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ width: 28, textAlign: 'right', color: tokens.colors.label.secondary }}>{idx + 1}</div>
          <div style={{ width: 64, height: 96, borderRadius: 8, background: tokens.colors.fill.quaternary, overflow: 'hidden' }}>
            {it.omdb?.Poster ? (
              <img src={it.omdb.Poster} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <div style={{ color: tokens.colors.label.primary }}>{it.title}</div>
            <div style={{ fontFamily: tokens.typography.families.mono, color: tokens.colors.label.secondary }}>{currency(it.revenue)}</div>
            {it.omdb?.Plot ? (
              <div style={{ color: tokens.colors.label.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.omdb.Plot}</div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const Content: React.FC = () => {
  const { tokens } = useAppleTheme();
  const apiKey = getApiKey();
  const navigate = useNavigate();
  const [view, setView] = useState<'screenSearch' | 'search' | 'live' | 'likes' | 'game' | 'settings' | 'sync' | 'prototype' | 'genres' | 'liquidGlassDemo' | 'imax'>('genres');
  const [global, setGlobal] = useState<RankedItem[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [actorName, setActorName] = useState('Tom Cruise');
  const [actorItems, setActorItems] = useState<RankedItem[]>([]);
  const [actorLoading, setActorLoading] = useState(false);
  const [raceFrames, setRaceFrames] = useState<any>(null);
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceMode, setRaceMode] = useState<'global' | 'actor'>('global');

  const hasOmdb = hasOMDbKey();

  const loadGlobal = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const cacheKey = 'boxoffice:global:top15:v1';
      const raw = localStorage.getItem(cacheKey);
      let items: RankedItem[] | null = null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ts && Array.isArray(parsed.items) && (Date.now() - parsed.ts) < (12 * 60 * 60 * 1000)) {
          items = parsed.items;
        }
      }
      if (!items) {
        const disc = await discoverTopRevenueMovies(apiKey, 1);
        const base = (disc.results || []).slice(0, 30);
        const detailed = await Promise.all(base.map(async m => {
          const d = await getMovieDetails(apiKey, m.id);
          const omdb = hasOmdb ? await getOMDbFromTMDBDetails(d) : null;
          return { id: d.id, title: d.title, revenue: d.revenue || 0, release_date: d.release_date, omdb } as RankedItem;
        }));
        items = detailed.filter(x => x.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items }));
      }
      setGlobal(items || []);
    } catch (_) {
      setGlobal([]);
    } finally {
      setGlobalLoading(false);
    }
  }, [apiKey, hasOmdb]);

  const loadActor = useCallback(async () => {
    setActorLoading(true);
    try {
      const cacheKey = `boxoffice:actor:${actorName}:top15:v1`;
      const raw = localStorage.getItem(cacheKey);
      let items: RankedItem[] | null = null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ts && Array.isArray(parsed.items) && (Date.now() - parsed.ts) < (12 * 60 * 60 * 1000)) {
          items = parsed.items;
        }
      }
      if (!items) {
        const personSearch = await searchPerson(apiKey, actorName, 1);
        const pick = (personSearch.results || [])[0];
        if (!pick) {
          items = [];
        } else {
          const agg = await getActorTopRevenueMovies(apiKey, pick.id, 15);
          const detailed = await Promise.all(agg.map(async r => {
            const d = r.movie;
            const omdb = hasOmdb ? await getOMDbFromTMDBDetails(d) : null;
            return { id: d.id, title: d.title, revenue: r.revenue || 0, release_date: d.release_date, omdb } as RankedItem;
          }));
          items = detailed;
        }
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items }));
      }
      setActorItems(items || []);
    } catch (_) {
      setActorItems([]);
    } finally {
      setActorLoading(false);
    }
  }, [apiKey, actorName, hasOmdb]);

  useEffect(() => { loadGlobal(); }, [loadGlobal]);
  useEffect(() => { loadActor(); }, [loadActor]);

  const generateRace = useCallback(async () => {
    setRaceLoading(true);
    try {
      const { generateBoxOfficeRaceData } = await import('../components/openrouter.js');
      const cacheKey = raceMode === 'actor' ? `race:actor:${actorName}:v1` : 'race:global:v1';
      const raw = localStorage.getItem(cacheKey);
      let frames = null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ts && parsed.frames && (Date.now() - parsed.ts) < (6 * 60 * 60 * 1000)) {
          frames = parsed.frames;
        }
      }
      if (!frames) {
        const resp = await generateBoxOfficeRaceData({ mode: raceMode, actorName });
        frames = resp && resp.frames ? resp.frames : null;
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), frames }));
      }
      setRaceFrames(frames);
    } catch (_) {
      setRaceFrames(null);
    } finally {
      setRaceLoading(false);
    }
  }, [raceMode, actorName]);

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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0b0e14 0%, #0f1420 60%, #0b0e14 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[0]}px`, display: 'flex', flexDirection: 'column', gap: tokens.spacing.macro[0] }}>
        <TopNavigation onSettingsClick={() => {}} onSyncClick={() => {}} onImaxClick={() => navigate('/IMAX')} onBoxOfficeClick={() => navigate('/Stats/BoxOffice')} preferPerformance />
        <header style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.standard[0] }}>
          <SectionTitle>Box Office Stats</SectionTitle>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: tokens.spacing.standard[0] }}>
            <select value={raceMode} onChange={e => setRaceMode(e.target.value === 'actor' ? 'actor' : 'global')} style={{ padding: '8px 10px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }}>
              <option value="global">Global Race</option>
              <option value="actor">Actor Race</option>
            </select>
            <button onClick={generateRace} style={{ padding: '8px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }}>Generate Race</button>
          </div>
        </header>

        <section style={sectionStyle}>
          <SectionTitle>Global Top 15 (TMDb revenue)</SectionTitle>
          {globalLoading ? <Loader /> : <RankedList items={global} />}
        </section>

        <section style={sectionStyle}>
          <SectionTitle>Actor Top 15 (TMDb revenue)</SectionTitle>
          <div style={{ display: 'flex', gap: tokens.spacing.standard[0], alignItems: 'center' }}>
            <input value={actorName} onChange={e => setActorName(e.target.value)} placeholder="Actor name" style={{ flex: 1, padding: '8px 10px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }} />
            <button onClick={loadActor} style={{ padding: '8px 12px', borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: tokens.colors.background.secondary, color: tokens.colors.label.primary }}>Refresh</button>
          </div>
          {actorLoading ? <Loader /> : <RankedList items={actorItems} />}
        </section>

        <section style={sectionStyle}>
          <SectionTitle>Bar Chart Race (BoxOfficeMojo via OpenRouter)</SectionTitle>
          {raceLoading ? <Loader /> : raceFrames ? <BarChartRace frames={raceFrames} /> : (
            <div style={{ color: tokens.colors.label.secondary }}>No race data yet. Choose mode and click Generate Race.</div>
          )}
        </section>

        <div style={{ height: 80 }} />
      </div>
      <LiquidPillNavigation
        view={view}
        setView={(v) => {
          setView(v);
          if (v === 'genres') {
            navigate('/Stats/BoxOffice');
          } else {
            navigate('/Home');
          }
        }}
        onSearchClick={() => { navigate('/Home'); }}
        enableLiquidEffects
      />
    </div>
  );
};

const BoxOfficeStatsPage: React.FC = () => {
  return (
    <AppleThemeProvider>
      <Content />
    </AppleThemeProvider>
  );
};

export default BoxOfficeStatsPage;
