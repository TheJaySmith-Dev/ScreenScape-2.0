## Overview
- Enhance Studio Mogul with realistic media-industry deal structures and acquisition mechanics: licensing, first‑look/output deals, co‑productions, territorial pre‑sales, slate financing, outright library/studio purchases, and distribution windowing.
- Add due diligence and integration phases (chain‑of‑title checks, financing liens, P&A budgeting, ramp‑up yields).
- Keep gameplay approachable with clear tooltips, optional steps, and balanced path perks.

## Industry Concepts Incorporated
- Acquisition & distribution agreements: license vs outright purchase; library buys; distribution advances; net profit splits.
- Deal types: first‑look (right of first refusal), output deals (long‑term slate to one distributor), co‑production (shared costs/rights), territorial pre‑sales, negative pickup, production‑financing‑distribution (PFD), AVOD/SVOD/TVOD revenue share.
- Financing: slate financing, tax incentives, gap/mezzanine; P&A budgeting impacts release performance.
- Distribution windows: theatrical → TVOD → SVOD/Pay TV → AVOD/FAST; window choice affects revenue profile.
- Due diligence: clean chain‑of‑title; union/guild residuals; security interests; lien/participant waivers.

## Game Additions
### Data Model (types.ts)
- DealType: 'License' | 'Outright' | 'FirstLook' | 'Output' | 'CoPro' | 'TerritorialPreSale' | 'PFD' | 'NegativePickup'.
- WindowType: 'Theatrical' | 'TVOD' | 'SVOD' | 'AVOD' | 'FAST'.
- Territory: ISO country codes; rights ownership per territory/window with start/end dates.
- Deal struct: { id, type, counterparty, termYears, territories, windows, revShare%, MGAdvance, obligations: { P&A, delivery }, status: 'Negotiation'|'DueDiligence'|'Active'|'Expired' }.
- Library: { titles, estValue, annualYield, rightsMap }.

### Systems (reducer.ts)
- Actions:
  - START_DEAL_NEGOTIATION(dealDraft)
  - COMPLETE_DUE_DILIGENCE(dealId, pass:boolean)
  - ACTIVATE_DEAL(dealId)
  - CHOOSE_WINDOWS(dealId, windows[])
  - SIGN_FIRST_LOOK(counterparty)
  - SIGN_OUTPUT(counterparty, years, slateCount)
  - START_COPRO(projectSpec)
  - PRE_SALE_TERRITORIES(projectId, territories[], advance)
  - BUY_LIBRARY(target, price)
  - INTEGRATE_LIBRARY(dealId) // ramp yields over N days
  - SET_PNA_BUDGET(projectId, amount)
- Mechanics:
  - Path modifiers: Corporation discounts on acquisitions and faster integration; Indie higher likelihood of cult hits and better license terms with niche distributors; Medium synergy bonus when combining studio types and windows.
  - Windowing yields: theatrical boosts reputation + higher risk; SVOD steady; AVOD rev‑share fluctuates with reputation and staff; TVOD near‑term spike.
  - Due diligence gate: failed checks can delay or cancel deals (soft penalties only), success unlocks advances and rights activation.
  - Slate financing: commit to output slate → upfront cash + future delivery obligations; missing delivery triggers small reputation penalties.

### UI (StudioMogulUI.tsx)
- New tab: "Deals & Acquisitions" with sub‑sections:
  - Licensing & Windows: pick territories/windows; see expected yield and obligations.
  - First‑Look / Output: sign long‑term relationships; shows slate counter.
  - Co‑Pro / Pre‑Sales: raise advances; risk/obligation badges.
  - Library Purchases: list targets with valuation, integration timeline, synergy preview.
- Tooltips and helper copy explain each deal type; small badges for status (Negotiation, Due Diligence, Active).
- P&A budgeting slider on production; display forecast impact and cash outlay.
- Non‑intrusive notifications for deal milestones.

## Balancing & Numbers
- License rev‑share default 50/50 on AVOD/FAST; SVOD fixed annual license; TVOD per‑transaction split.
- First‑look: occasional advance, improves greenlight odds; Output: annual MG + delivery obligations.
- Co‑pro: reduce production costs by 30–50%, share net with partner.
- Library buys: pay price ~multiple of annual yield; yields ramp over ~30 days.
- Due diligence success rates influenced by reputation and staff counts (Director/Writer/Actor as proxies for professionalism).

## Persistence & Save
- Extend save schema with deals, libraries, rights maps, window choices, obligations, and active timers.

## Verification
- Simulate each deal type end‑to‑end; confirm windowing changes yields; test due diligence pass/fail; integration ramp; slate delivery effects.
- Ensure UI remains mobile‑friendly and optional; no blockers if player ignores deals.

## Implementation Steps
1) Extend types with Deal, Window, Territory, Library.
2) Add reducer actions and core calculations (yields, advances, penalties, ramps).
3) Build "Deals & Acquisitions" UI, tooltips, and statuses.
4) Add P&A budgeting to Production tab and window picker to releases.
5) Update storage save/load with new fields.
6) Playtest balance and adjust path perks and numbers.

## Notes
- Keep this feature fully client‑side; no external APIs required.
- All new mechanics are optional and tuned to be friendly but rewarding for engaged players.