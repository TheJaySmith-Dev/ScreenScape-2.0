## Placement
- Add a discreet glass pill button labeled “Support” with helper copy: “Hey — if you can, please help support development.”
- Primary location: Top bar container next to Sync/Settings in `components/TopNavigation.tsx` so it’s visible but not intrusive.
- Secondary location: Settings page footer row for users who explore settings.

## Client Behavior
- On click, prefer a configured Stripe Payment Link URL (env: `VITE_STRIPE_DONATION_LINK`) and open in a new tab.
- If no payment link env is present, call your existing backend Stripe integration endpoint (e.g., `/api/createDonationSession`) and redirect to `session.url`.
- Show a small loading state on the pill (spinner or “…”), and gracefully handle errors with a non-blocking toast.

## Backend (reuse existing integration)
- If your integration provides a session-creation route, reuse it without exposing keys client-side.
- Expected payload: `{ mode: 'payment', line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }], success_url: origin + '/?donation=success', cancel_url: origin + '/?donation=cancel' }`.
- If your integration uses Payment Links, no backend call is needed.

## Implementation Details
- Add a small “Support” pill to `TopNavigation`:
  - Style: subtle glass pill (`apple-glass-regular`), 12–14px text, neutral color, no icon by default.
  - Tooltip/aria-label: “Donate via Stripe — optional”.
  - Copy: On hover or focus, show a tiny helper text bubble: “Hey — if you can, please help support development.”
- Client utility:
  - `utils/donations.ts`: `getDonationLink()` → read `import.meta.env.VITE_STRIPE_DONATION_LINK`, else return null.
  - `startDonation()`:
    - If link available: `window.open(link, '_blank', 'noopener')`.
    - Else: `fetch('/api/createDonationSession', { method: 'POST' })` → `{ url }` redirect.
    - Errors: `console.warn` and show non-intrusive message.

## Settings Page
- Add the same pill in a “Support” row with one-line copy to keep it friendly and optional.

## Accessibility & UX
- Keyboard accessible button with `aria-label`.
- Doesn’t steal focus; opens in a new tab or redirects only after user action.
- Minimizes visual prominence; no banners or modals.

## Verification
- With `VITE_STRIPE_DONATION_LINK` set → ensure button opens Stripe checkout in a new tab.
- Without link but with backend route → verify session creation and redirection to Stripe.
- Confirm success/cancel return to site and the experience remains unobtrusive.

## Fallbacks
- If neither env nor backend route exists, hide the button automatically to avoid broken UX.