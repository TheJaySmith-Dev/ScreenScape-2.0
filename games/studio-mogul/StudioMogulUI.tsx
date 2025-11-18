import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { useAppleTheme } from '../../components/AppleThemeProvider';
import TopNavigation from '../../components/TopNavigation';
import { initialState, reducer } from './reducer';
import { PathType, Genre, INDIE_STUDIOS, MEDIUM_STUDIOS, CORPORATION_STUDIOS, RIVALS, StaffKind } from './types';
import { generateStudioNames } from './openrouterNames';
import { autosave, exportSave, importSave, loadAutosave } from './storage';

const PillButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => {
  const { tokens } = useAppleTheme();
  return (
    <button
      {...props}
      style={{
        padding: `${tokens.spacing.small}px ${tokens.spacing.standard[1]}px`,
        borderRadius: 9999,
        border: `1px solid ${tokens.colors.separator.opaque}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(255,255,255,0.08)',
        color: tokens.colors.label.primary,
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
};

const Section: React.FC<{ title: string } & React.HTMLAttributes<HTMLDivElement>> = ({ title, children, ...props }) => {
  const { tokens } = useAppleTheme();
  return (
    <div {...props} style={{
      display: 'flex', flexDirection: 'column', gap: tokens.spacing.small,
      padding: tokens.spacing.standard[1], borderRadius: 16,
      border: `1px solid ${tokens.colors.separator.opaque}`,
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
    }}>
      <h2 style={{
        margin: 0,
        fontFamily: tokens.typography.families.display,
        fontSize: tokens.typography.sizes.title2,
        fontWeight: tokens.typography.weights.bold,
        color: tokens.colors.label.primary
      }}>{title}</h2>
      {children}
    </div>
  );
};

const HeaderStat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  const { tokens } = useAppleTheme();
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ color: tokens.colors.label.secondary, fontSize: 12 }}>{label}</div>
      <div style={{ color: tokens.colors.label.primary, fontWeight: tokens.typography.weights.bold }}>{value}</div>
    </div>
  );
};

const StudioMogulUI: React.FC = () => {
  const { tokens } = useAppleTheme();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tab, setTab] = useState<'Empire' | 'Production' | 'Rivals' | 'Rebirth'>('Empire');
  const [pathSel, setPathSel] = useState<PathType>('Indie');
  const genres: Genre[] = ['Action','Romance','Sci-Fi','Horror','Drama','Comedy'];

  useEffect(() => {
    const auto = loadAutosave();
    if (auto) {
      dispatch({ type: 'IMPORT_SAVE', state: { ...state, ...auto } });
    }
  }, []);

  useEffect(() => { autosave(state); }, [state]);

  const studiosForPath = useMemo(() => pathSel === 'Indie' ? INDIE_STUDIOS : pathSel === 'Medium' ? MEDIUM_STUDIOS : CORPORATION_STUDIOS, [pathSel]);

  const nameGen = async (p: PathType) => {
    const count = p === 'Corporation' ? 3 : p === 'Medium' ? 6 : 5;
    const names = await generateStudioNames({ path: p, count });
    dispatch({ type: 'START_NEW_GAME', path: p, names });
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      <TopNavigation onSettingsClick={() => {}} onSyncClick={() => {}} preferPerformance={true} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${tokens.spacing.standard[1]}px ${tokens.spacing.standard[0]}px`, paddingTop: `calc(${tokens.spacing.standard[2]}px + 64px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.standard[1] }}>
          <div style={{ display: 'flex', gap: tokens.spacing.standard[1] }}>
            <HeaderStat label="Day" value={state.day} />
            <HeaderStat label="Money" value={`$${state.money}`} />
            <HeaderStat label="Multiplier" value={`${state.globalMultiplier.toFixed(2)}x`} />
            <HeaderStat label="Rebirths" value={state.rebirths} />
            <HeaderStat label="Path" value={state.path || '-'} />
          </div>
          <div style={{ display: 'flex', gap: tokens.spacing.micro[2] }}>
            <PillButton onClick={() => exportSave(state)}>Download Save</PillButton>
            <PillButton onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'application/json';
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  const parsed = await importSave(file);
                  const confirmLoad = window.confirm(`Load ${parsed.path || 'Unknown'} save from Day ${parsed.day}?`);
                  if (confirmLoad) dispatch({ type: 'IMPORT_SAVE', state: { ...state, ...parsed } });
                } catch {}
              };
              input.click();
            }}>Upload Save</PillButton>
            <PillButton onClick={() => dispatch({ type: 'RESET_GAME' })}>Reset</PillButton>
          </div>
        </div>

        {!state.path && (
          <Section title="Choose Your Starting Path">
            <div style={{ display: 'flex', gap: tokens.spacing.micro[2], flexWrap: 'wrap' }}>
              <PillButton onClick={() => setPathSel('Indie')}>Indie</PillButton>
              <PillButton onClick={() => setPathSel('Medium')}>Medium Studio</PillButton>
              <PillButton onClick={() => setPathSel('Corporation')}>Corporation</PillButton>
              <PillButton onClick={() => nameGen(pathSel)}>New Game</PillButton>
            </div>
          </Section>
        )}

        {state.path && (
          <div style={{ display: 'grid', gap: tokens.spacing.standard[1] }}>
            <div style={{ display: 'flex', gap: tokens.spacing.micro[2], flexWrap: 'wrap' }}>
              {(['Empire','Production','Rivals','Rebirth'] as const).map(t => (
                <PillButton key={t} onClick={() => setTab(t)}>{t}</PillButton>
              ))}
            </div>

            {tab === 'Empire' && (
              <Section title="Empire">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: tokens.spacing.standard[1] }}>
                  {state.studios.map(s => (
                    <div key={s.id} style={{
                      padding: tokens.spacing.standard[1], borderRadius: 12,
                      border: `1px solid ${tokens.colors.separator.opaque}`,
                      background: 'rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ fontWeight: tokens.typography.weights.bold }}>{s.name}</div>
                      <div style={{ color: tokens.colors.label.secondary }}>{s.kind} Lv{s.level}</div>
                      <div style={{ display: 'flex', gap: tokens.spacing.micro[2], marginTop: tokens.spacing.micro[2] }}>
                        <PillButton onClick={() => dispatch({ type: 'UPGRADE_STUDIO', id: s.id })}>Upgrade (${s.level * 1000})</PillButton>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: tokens.spacing.micro[2], marginTop: tokens.spacing.standard[0], flexWrap: 'wrap' }}>
                  {studiosForPath.map(def => (
                    <PillButton key={def.kind} onClick={() => dispatch({ type: 'BUILD_STUDIO', kind: def.kind })}>Build {def.kind} (${def.cost})</PillButton>
                  ))}
                  {(['Actor','Director','Writer'] as StaffKind[]).map(k => (
                    <PillButton key={k} onClick={() => dispatch({ type: 'HIRE_STAFF', kind: k })}>Hire {k}</PillButton>
                  ))}
                </div>
              </Section>
            )}

            {tab === 'Production' && (
              <Section title="Production">
                <div style={{ display: 'flex', gap: tokens.spacing.micro[2], flexWrap: 'wrap', marginBottom: tokens.spacing.micro[2] }}>
                  {genres.map(g => (
                    <PillButton key={g} onClick={() => {
                      const s = state.studios[0];
                      if (s) dispatch({ type: 'PRODUCE_CONTENT', studioId: s.id, genre: g });
                    }}>{g}</PillButton>
                  ))}
                </div>
                <div style={{ color: tokens.colors.label.secondary }}>Cost: $1500 + variance. Success boosts money and reputation; failures reduce reputation with writer mitigation.</div>
              </Section>
            )}

            {tab === 'Rivals' && (
              <Section title="Rivals">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: tokens.spacing.standard[1] }}>
                  {RIVALS.map(r => (
                    <div key={r.name} style={{ padding: tokens.spacing.standard[1], borderRadius: 12, border: `1px solid ${tokens.colors.separator.opaque}`, background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ fontWeight: tokens.typography.weights.bold }}>{r.name}</div>
                      <div style={{ color: tokens.colors.label.secondary }}>Yield ${r.baseYieldPerDay}/day</div>
                      <div style={{ display: 'flex', gap: tokens.spacing.micro[2], marginTop: tokens.spacing.micro[2] }}>
                        <PillButton onClick={() => dispatch({ type: 'ACQUIRE_RIVAL', rival: r })}>Acquire</PillButton>
                        <PillButton onClick={() => dispatch({ type: 'ACQUIRE_RIVAL', rival: r, useReputationDiscount: 30 })}>Acquire (Rep)</PillButton>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {tab === 'Rebirth' && (
              <Section title="Rebirth">
                <div style={{ display: 'flex', gap: tokens.spacing.micro[2], flexWrap: 'wrap' }}>
                  <PillButton onClick={() => dispatch({ type: 'SELL_AND_REBIRTH' })}>Sell Empire & Rebirth</PillButton>
                </div>
              </Section>
            )}

            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 16, display: 'flex', justifyContent: 'center' }}>
              <PillButton onClick={() => dispatch({ type: 'NEXT_DAY' })}>Next Day</PillButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioMogulUI;

