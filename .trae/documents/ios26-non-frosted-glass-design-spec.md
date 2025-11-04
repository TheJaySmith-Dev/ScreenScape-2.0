# iOS 26 Non‑Frosted Glass Aesthetic — Comprehensive Spec

## Color System
- System palette: `#0A84FF` (blue), `#34C759` (green), `#FF9500` (orange), `#FF3B30` (red), `#AF52DE` (purple), `#FF2D92` (pink), `#FFCC00` (yellow), `#5856D6` (indigo), `#5AC8FA` (teal), `#00C7BE` (mint), `#A2845E` (brown), `#8E8E93` (gray)
- Light mode labels: `#000000`, `#3C3C43`, `#3C3C4399`, `#3C3C432E`
- Dark mode labels: `#FFFFFF`, `#EBEBF5`, `#EBEBF599`, `#EBEBF52E`
- Background (light): `#FFFFFF`, `#F2F2F7` grouped
- Background (dark): `#000000`, `#111114`, `#1A1A1D` grouped
- State colors:
  - Active: use system colors at 18–32% alpha overlays
  - Disabled: label `tertiary`
  - Pressed: increase border opacity by ~0.06 and reduce background by ~0.04 alpha

## Typography
- Font families: SF Pro Display/Text; fallback: `-apple-system`, `system-ui`
- Weight map: 100–900 (Ultralight → Black)
- Scale (pt → px at 1x, 0.5pt precision):
  - Large Title: 34
  - Title 1: 28
  - Title 2: 22
  - Title 3: 19.5
  - Headline: 17
  - Body: 17
  - Callout: 16
  - Subheadline: 15
  - Footnote: 12.5
  - Caption 1: 11.5
  - Caption 2: 11
- Baselines: Display 1.3, Text 1.4–1.5; kerning: enabled; `text-rendering: optimizeLegibility`

## Visual Hierarchy
- Z‑Depth layers (offset x/y, blur, spread, opacity):
  - Layer 0: none
  - Layer 1: `0/1`, blur `2`, opacity `0.08`
  - Layer 2: `0/4`, blur `8`, opacity `0.12`
  - Layer 3: `0/8`, blur `16`, opacity `0.16`
  - Layer 4: `0/12`, blur `24`, opacity `0.18`
- Corner radii: `4`, `8`, `12`, `16`, `24`, `full` per HIG

## Spatial Relationships
- Grid: 8pt baseline; half increments allowed (`4`)
- Spacing system: micro `[4,8,12]`, standard `[16,24,32]`, macro `[48,64,80]`
- Alignment guides: center, baseline, keyline edges; pill/button radii `24`

## Motion Design
- Springs: gentle `damping: 20, stiffness: 180`; snappy `damping: 24, stiffness: 240`
- Durations: fast `150ms`, standard `200ms`, emphasized `250ms`
- Timing: `cubic-bezier(0.4, 0.0, 0.2, 1)`; elastic `0.68, -0.55, 0.265, 1.55`
- Micro‑interactions: hover scale `1.02`, active scale `0.98`, focus outline `2px`

## Asset Fidelity
- SVG stroke weights: 1.5–2px for UI icons; rounded caps/joins
- Asset variants: `@1x/@2x/@3x`; keep vector primitives responsive
- Style rules: no inner glows; minimal drop shadows consistent with depth system

## Glass Material (Non‑Frosted)
- Backdrop blur: `0.5px` (or `0px` for ultra‑clear contexts)
- Luminance: brightness `1.08–1.15`; saturation `1.18–1.3`
- Borders: `rgba(255,255,255,0.14–0.3)`; reduce on pressed
- Shadows: match layer depth; avoid heavy occlusion

## Accessibility
- Touch targets: `≥44px`
- Contrast: labels against glass `>= 4.5:1` body text
- Focus: 2px high‑contrast outline, offset 2px
- Motion: honor `prefers-reduced-motion` and reduced transparency

## Testing
- Visual regression: ≤1px tolerance against reference screenshots
- Device matrix: iPhone, iPad, Mac at `@1x/@2x/@3x`

This spec maps to implemented tokens and components in the app and is intended to be exhaustive for the iOS 26 aesthetic.

