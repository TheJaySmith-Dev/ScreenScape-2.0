## Diagnose
- The Support button may appear but do nothing if no Stripe Payment Link is configured and no backend route exists. When neither is available, clicks result in no visible action.
- Ensure the button is only shown when a donation path is configured, and make the click reliably trigger a user-gesture redirect.

## Changes
- Add `isDonationConfigured()` in `utils/donations.ts` to check `VITE_STRIPE_DONATION_LINK`.
- Update `components/TopNavigation.tsx` to conditionally render the Support pill only when configured.
- Keep behavior unobtrusive: if unconfigured, hide the button; if configured, open Payment Link in a new tab.

## Optional
- If you have a backend session route (e.g., `/api/createDonationSession`), we can also detect it and show the button when either path is available. For now, we’ll rely on the Payment Link env to avoid false positives.

## Verification
- With `VITE_STRIPE_DONATION_LINK` set, clicking Support opens Stripe checkout.
- Without the env, the button is hidden to avoid a non-functional click.