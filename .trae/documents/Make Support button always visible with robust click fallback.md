## Goal
- Ensure the Support button is visible consistently and works via Stripe Payment Link if configured, or via the backend checkout session fallback.

## Changes
- Remove conditional rendering tied to `VITE_STRIPE_DONATION_LINK` so the Support pill always shows.
- Keep click behavior:
  - If `VITE_STRIPE_DONATION_LINK` exists → open in a new tab.
  - Else POST `/api/createDonationSession` and redirect to its `url`.
  - If both unavailable → log a warning (unobtrusive) so the UI remains clean.

## Verification
- With env set → button opens Stripe.
- Without env but with backend route → redirects to Stripe checkout.
- Without both → button remains but does not disrupt UI.