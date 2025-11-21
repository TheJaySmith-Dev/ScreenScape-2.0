import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppleTheme } from './AppleThemeProvider';

type WeeklyGross = { weekStart: string; grossUsd: number };

interface Props {
  title: string;
  year?: string | null;
  imdbId?: string | null;
  tmdbId?: string | number | null;
  fallbackRevenue?: number | null;
}

const currency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n || 0)));
const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return iso; }
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const BoxOfficeSection: React.FC<Props> = ({ title, year, imdbId, tmdbId, fallbackRevenue }) => {
  const { tokens } = useAppleTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ totalGrossUsd: number; openingWeekendUsd: number; theaters: number; weeklyGrosses: WeeklyGross[]; updatedAt: string; sources: string[] } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; content: string } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cacheKey = useMemo(() => {
    const keyBase = imdbId ? `imdb:${imdbId}` : `${title}:${year || ''}`;
    return `boxoffice:data:${keyBase}:v1`;
  }, [title, year, imdbId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached && cached.ts && cached.val && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            setData(cached.val);
            setLoading(false);
            return;
          }
        }
        const resp = await fetch('/api/boxoffice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, year, imdbId, tmdbId }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const val = await resp.json();
        if (!cancelled) {
          setData(val);
          localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), val }));
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load box office data');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [cacheKey, title, year, imdbId, tmdbId]);

  const topMetrics = useMemo(() => {
    const total = data?.totalGrossUsd || 0;
    const opening = data?.openingWeekendUsd || 0;
    const theaters = data?.theaters || 0;
    const hasData = total > 0 || opening > 0 || theaters > 0;
    const fallback = !hasData && (typeof fallbackRevenue === 'number' && fallbackRevenue! > 0) ? { totalGrossUsd: fallbackRevenue!, openingWeekendUsd: 0, theaters: 0 } : null;
    return { total: hasData ? total : (fallback?.totalGrossUsd || 0), opening, theaters };
  }, [data, fallbackRevenue]);

  const series = useMemo(() => {
    const arr = (data?.weeklyGrosses || []).slice().filter(w => typeof w.grossUsd === 'number' && w.grossUsd > 0);
    const max = arr.length > 0 ? Math.max(...arr.map(w => w.grossUsd)) : 1;
    return { arr, max };
  }, [data]);

  const updatedAt = useMemo(() => {
    const iso = data?.updatedAt || '';
    return iso ? fmtDate(iso) : '';
  }, [data]);

  const showTooltip = (evt: React.MouseEvent, content: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = evt.clientX - (rect?.left || 0);
    const y = evt.clientY - (rect?.top || 0);
    setHover({ x, y, content });
  };

  const hideTooltip = () => setHover(null);

  return (
    <section ref={containerRef} style={{ marginTop: tokens.spacing.macro[0] }}>
      <h2 style={{ fontFamily: tokens.typography.families.display, fontSize: tokens.typography.sizes.title2, fontWeight: tokens.typography.weights.bold, color: tokens.colors.label.primary }}>Box Office</h2>

      <div className="rounded-xl backdrop-blur-xl border" style={{ padding: tokens.spacing.standard[1], background: `${tokens.colors.background.secondary}CC`, borderColor: tokens.colors.separator.opaque }}>
        {loading && (
          <div style={{ color: tokens.colors.label.secondary, fontFamily: tokens.typography.families.text }}>Loading box office data…</div>
        )}

        {!loading && error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.small }}>
            <div style={{ color: tokens.colors.label.secondary, fontFamily: tokens.typography.families.text }}>Box office data unavailable.</div>
            {typeof fallbackRevenue === 'number' && fallbackRevenue! > 0 && (
              <div style={{ color: tokens.colors.label.secondary, fontFamily: tokens.typography.families.text }}>TMDb reported revenue: {currency(fallbackRevenue!)}.</div>
            )}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: tokens.spacing.standard[1] }}>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: tokens.spacing.standard[0] }}>
              <div className="rounded-xl border" style={{ padding: tokens.spacing.small, background: tokens.colors.surface.primary, borderColor: tokens.colors.separator.opaque }}>
                <div style={{ color: tokens.colors.label.tertiary, fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>Total Gross</div>
                <div style={{ fontFamily: tokens.typography.families.mono, color: tokens.colors.label.primary, fontSize: tokens.typography.sizes.title3 }}>{currency(topMetrics.total)}</div>
              </div>
              <div className="rounded-xl border" style={{ padding: tokens.spacing.small, background: tokens.colors.surface.primary, borderColor: tokens.colors.separator.opaque }}>
                <div style={{ color: tokens.colors.label.tertiary, fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>Opening Weekend</div>
                <div style={{ fontFamily: tokens.typography.families.mono, color: tokens.colors.label.primary, fontSize: tokens.typography.sizes.title3 }}>{currency(topMetrics.opening)}</div>
              </div>
              <div className="rounded-xl border" style={{ padding: tokens.spacing.small, background: tokens.colors.surface.primary, borderColor: tokens.colors.separator.opaque }}>
                <div style={{ color: tokens.colors.label.tertiary, fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>Theaters</div>
                <div style={{ fontFamily: tokens.typography.families.mono, color: tokens.colors.label.primary, fontSize: tokens.typography.sizes.title3 }}>{topMetrics.theaters || 0}</div>
              </div>
            </div>

            <div className="rounded-xl border" style={{ padding: tokens.spacing.standard[0], background: tokens.colors.surface.primary, borderColor: tokens.colors.separator.opaque }}>
              <div style={{ marginBottom: tokens.spacing.small, color: tokens.colors.label.secondary, fontFamily: tokens.typography.families.text }}>Weekly Trends</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: tokens.spacing.micro[1], height: 160 }}>
                {series.arr.length === 0 && (
                  <div style={{ color: tokens.colors.label.tertiary, fontFamily: tokens.typography.families.text }}>No weekly data.</div>
                )}
                {series.arr.map((w, idx) => {
                  const pct = series.max > 0 ? Math.max(2, Math.round((w.grossUsd / series.max) * 100)) : 0;
                  const content = `${fmtDate(w.weekStart)}\n${currency(w.grossUsd)}`;
                  return (
                    <div key={`${w.weekStart}-${idx}`} onMouseEnter={(e) => showTooltip(e, content)} onMouseLeave={hideTooltip} style={{ width: 16, height: Math.max(8, Math.floor((pct / 100) * 140)), background: tokens.colors.accent.primary, borderRadius: 6, position: 'relative' }} />
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.small }}>
              {updatedAt && (
                <div style={{ color: tokens.colors.label.tertiary, fontFamily: tokens.typography.families.text }}>Updated {updatedAt}</div>
              )}
              {(data?.sources || []).slice(0, 2).map((s, i) => (
                <a key={`${s}-${i}`} href={s} target="_blank" rel="noopener noreferrer" className="rounded-xl border" style={{ padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.micro[2]}px`, background: tokens.colors.surface.accent, borderColor: tokens.colors.separator.opaque, color: tokens.colors.label.primary, fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>Source</a>
              ))}
            </div>
          </div>
        )}
      </div>

      {hover && (
        <div style={{ position: 'absolute', left: hover.x + 12, top: hover.y - 12, transform: 'translateY(-100%)', padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.small}px`, borderRadius: 8, background: tokens.colors.surface.accent, color: tokens.colors.label.primary, border: `1px solid ${tokens.colors.separator.opaque}`, fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1, boxShadow: tokens.shadows.medium, pointerEvents: 'none' }}>{hover.content}</div>
      )}
    </section>
  );
};

export default BoxOfficeSection;
