export const liquidTokens = {
  blur: {
    small: 6, // subtle UI chips
    medium: 16, // nav/cards
    large: 30, // hero/overlays
  },
  saturationBoost: 1.8, // ~1.6–2.0×
  glassFill: {
    base: 'rgba(255,255,255,0.08)', // low‑alpha neutral base
    tint: 'rgba(80,160,255,0.12)', // brand tint mixed in
  },
  hairline: {
    color: 'rgba(255,255,255,0.22)',
    width: 1,
  },
  radii: {
    small: 10,
    medium: 16,
    large: 24,
  },
  shadow: {
    card: '0 8px 24px rgba(0,0,0,0.25)',
    sheet: '0 24px 60px rgba(0,0,0,0.35)',
  },
  motion: {
    fast: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    default: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const supportsBackdropFilter = () => (
  typeof CSS !== 'undefined' && (CSS as any).supports && (CSS as any).supports('backdrop-filter', 'blur(10px)')
);

export const glassSurfaceStyle = (opts?: { blur?: number; tintAlpha?: number }) => {
  const blur = opts?.blur ?? liquidTokens.blur.medium;
  const tintAlpha = opts?.tintAlpha ?? 0.12;
  const tint = `rgba(80,160,255,${tintAlpha})`;
  return {
    background: supportsBackdropFilter()
      ? `linear-gradient(135deg, ${liquidTokens.glassFill.base}, ${tint})`
      : 'rgba(16,16,20,0.65)',
    backdropFilter: `blur(${blur}px) saturate(${liquidTokens.saturationBoost})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${liquidTokens.saturationBoost})`,
    border: `${liquidTokens.hairline.width}px solid ${liquidTokens.hairline.color}`,
  } as React.CSSProperties;
};

