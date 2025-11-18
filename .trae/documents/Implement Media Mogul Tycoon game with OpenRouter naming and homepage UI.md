## Scope
- Build a client‑side tycoon game named “Media Mogul Tycoon” with JSON save/load, three starting paths, production, acquisitions, upgrades, rebirths, achievements.
- Integrate OpenRouter to generate studio names on new saves using `meta-llama/llama-3.3-8b-instruct:free`.
- Route at `/play/studio-mogul` and match the homepage UI style (AppleTheme, Liquid glass surfaces, TopNavigation, pill navigation).

## Files & Structure
- `games/studio-mogul/types.ts`
  - Core types: `PathType = 'Indie' | 'Medium' | 'Corporation'`
  - `GameState`, `Studio`, `Staff`, `RivalStudio`, `Achievement`, `SaveFileV1`
- `games/studio-mogul/reducer.ts`
  - Actions: `START_NEW_GAME(path)`, `APPLY_OPENROUTER_NAMES(names)`, `NEXT_DAY()`, `BUILD_STUDIO(kind)`, `UPGRADE_STUDIO(id)`, `HIRE_STAFF(kind)`, `PRODUCE_CONTENT({genre, studioId})`, `ACQUIRE_RIVAL(name)`, `SELL_AND_REBIRTH()`, `IMPORT_SAVE(data)`, `RESET_GAME()`
  - Path perks/constraints baked into reducers (Indie cult classic chance, Corporation free hire every 5 days + reputation erosion, Medium synergies)
- `games/studio-mogul/openrouterNames.ts`
  - `generateStudioNames({ path, count })` using `import.meta.env.VITE_OPENROUTER_API_KEY`
  - Endpoint `https://openrouter.ai/api/v1/chat/completions`
  - Model `meta-llama/llama-3.3-8b-instruct:free`
  - Prompt: per spec; names 2–4 words; JSON array output only
  - Payload: `{ model, messages: [{role:'user',content:prompt}], max_tokens:200, temperature:0.8, response_format:{type:'json_object'} }`
  - Headers: `Authorization: Bearer <key>`, `Content-Type: application/json`, `HTTP-Referer: window.location.origin`, `X-Title: ChoiceForReels Studio Mogul`
  - Parse `choices[0].message.content` → JSON array; soft fallback to static name lists on error (console.warn)
- `games/studio-mogul/storage.ts`
  - `exportSave(state)` → triggers download `studio_mogul_save.json`
  - `importSave(file)` → validate version, return parsed object
  - Autosave in `localStorage` (`studioMogulAutosaveV1`) for interim persistence
- `games/studio-mogul/StudioMogulUI.tsx`
  - `useReducer(GameReducer, initialState)` with path selection
  - Header: day, money, multiplier, rebirths, path chip (AppleTheme typography/colors)
  - Stats bar: reputation, staff counts, passive forecast
  - Tabs (Empire, Production, Rivals, Rebirth) using liquid/glass surfaces; mobile‑first collapsible sections
  - Bottom bar: `Next Day` button, `Save/Load` panel (JSON export/import/reset)
  - Achievements badges with clear thresholds
  - New Game flow: path picker → OpenRouter call (one time) → assign names to starting studios (Indie: 1, Medium: 2, Corporation: 3)
  - Fallback static names if API fails
- `pages/StudioMogulPage.tsx`
  - Wrap with `AppleThemeProvider`; reuse homepage layout:
    - Top bar with `TopNavigation`
    - `LiquidPillNavigation` style container
    - Content body hosting `StudioMogulUI`
- `index.tsx`
  - Add lazy route `<Route path="/play/studio-mogul" element={<StudioMogulPage />} />`
- (Optional) Add a `GameView` card for “Media Mogul Tycoon” for discovery alongside existing games

## Game Logic Details
- Starting paths
  - Indie: `$500`, one studio, `x0.8` multiplier, 15% chance to “Cult Classic” (triple revenue), higher production failure chance
  - Medium: `$5000`, two studios, `x1.0` multiplier, +10% passive when combining studio types; early NPC surcharge
  - Corporation: `$20000`, three studios, `x1.2` multiplier, −20% acquisition cost, free staff every 5 days, −2 reputation per failure
- Studios
  - Costs/yields per spec; upgrades cost `level * $1000`; yield +$25–$40/day; naming from OpenRouter pool (or static fallback)
- Staff
  - Actor: +5% success; Director: +10%; Writer: 3% chance per to recoup 50% on failures; Corporation free hire cadence
- Production
  - Cost: `$1500 + [0..$1500]`; success probability from reputation/staff with path modifier; success revenue `$1000..$7000 * global multiplier`, rep +5..18; Indie cult classic multiplier; failure loses full cost, rep −5 (Corp: −7), writer mitigations applied
- NPC acquisitions
  - 10 named rivals; cost `$5k..$60k * (1 + rebirths * 0.5)`; daily yield `$80..$1200 * (1 + rebirths * 0.3)`; Corporation −20% cost; Indie can spend reputation for discounts (1 rep → $100 discount up to 30% cap)
- Rebirth
  - Auction proceeds: 82% of money + studio valuations (`cost * level * 1.6`) + staff valuations (`hire cost * 0.75`)
  - Reset money/studios/staff/day; preserve rebirths/path/global multiplier (add +0.5x per rebirth)
  - Phoenix Mode for `rebirths >= 5`: x2 initial capital + one free path‑aligned studio
- Passive Income
  - Triggered by `Next Day`; sum `(studio yield * level factor) * global multiplier * path coefficient (Indie 0.9, Medium 1.0, Corp 1.15)` with animated notification
- Achievements
  - First Hit, Path Master (3 rebirths), Takeover (8 acquisitions), Phoenix Eternal (10 rebirths), Trillion Dollar Empire (lifetime $1T)

## OpenRouter Integration
- Use dedicated `generateStudioNames` that forces `meta-llama/llama-3.3-8b-instruct:free`
- Reference env key `VITE_OPENROUTER_API_KEY` (aligns with existing `components/openrouter.js` pattern)
- One invocation per new save; log warnings and fall back cleanly

## UI Parity With Homepage
- Reuse `AppleThemeProvider` tokens, glass materials (`apple-glass-regular/apple-depth-*`), `TopNavigation`, and liquid pill motifs to make the experience visually consistent with the homepage
- Maintain responsive grid and spacing scales already present in `GameView` and other components

## Routing & Navigation
- New route `/play/studio-mogul`; deep‑linkable
- Optional: add “Media Mogul Tycoon” entry into `GameView` selection for intra‑site discovery

## Persistence & Safety
- Export as `studio_mogul_save.json` with version field; import flow validates schema and prompts confirmation
- Interim autosave to `localStorage` to avoid loss on refresh; no server writes

## Verification
- Run through New Game for each path; confirm OpenRouter names assign correctly; repeat with network disabled to verify fallbacks
- Validate production probabilities and revenue ranges match spec via test runs
- Test acquisitions pricing/yield scaling with rebirth progression
- Verify export/import round‑trip preserves state and version
- Check mobile collapse behavior and animations for clarity

## Notes
- No external dependencies added beyond existing `lucide-react`; notifications implemented with lightweight in‑app banners for now
- Honors “homepage UI” directive by reusing the same theme, navigation, and glass patterns