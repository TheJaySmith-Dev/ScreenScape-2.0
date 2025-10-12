// pages/api/auth/patreon/callback.ts

// The base URL of the frontend application.
const APP_BASE_URL = 'https://screenscape.space';

export default async function handler(req: any, res: any) {
  const code = req.query.code as string;

  // The frontend will be redirected to the /genscape view upon return.
  const redirectUrl = new URL('/genscape', APP_BASE_URL);

  if (!code) {
    redirectUrl.searchParams.set('patreon_error', 'authentication_failed');
    return res.redirect(redirectUrl.toString());
  }

  try {
    // Exchange authorization code for an access token
    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.PATREON_CLIENT_ID!,
        client_secret: process.env.PATREON_CLIENT_SECRET!,
        redirect_uri: 'https://screenscape.space/api/auth/patreon/callback',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Patreon token exchange failed:', tokenData);
      redirectUrl.searchParams.set('patreon_error', 'authentication_failed');
      return res.redirect(redirectUrl.toString());
    }

    // Use the access token to fetch user identity and membership status
    const userResponse = await fetch(
      'https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.currently_entitled_tiers',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
        console.error('Patreon identity fetch failed:', await userResponse.text());
        redirectUrl.searchParams.set('patreon_error', 'authentication_failed');
        return res.redirect(redirectUrl.toString());
    }

    const userData = await userResponse.json();
    const membership = userData?.included?.find((item: any) => item.type === 'member');
    const isPatron = membership?.attributes?.patron_status === 'active_patron';

    if (isPatron) {
      // Success: User is an active patron. Redirect with the token for the client to handle.
      redirectUrl.searchParams.set('patreon_token', tokenData.access_token);
    } else {
      // Failure: User is not an active patron. Redirect with a specific error.
      redirectUrl.searchParams.set('patreon_error', 'not_an_active_patron');
    }

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Patreon OAuth callback error:', error);
    redirectUrl.searchParams.set('patreon_error', 'authentication_failed');
    return res.redirect(redirectUrl.toString());
  }
}
