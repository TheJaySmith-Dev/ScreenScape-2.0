// api/auth/patreon/callback.ts

// The base URL of the frontend application.
const APP_BASE_URL = 'https://screenscape.space';

export default async function handler(req: any, res: any) {
  const code = req.query.code as string;

  const redirectUrl = new URL('/genscape', APP_BASE_URL);

  const failRedirect = (errorType: string) => {
    redirectUrl.searchParams.set('patreon_error', errorType);
    res.writeHead(302, { Location: redirectUrl.toString() });
    res.end();
  };

  if (!code) {
    return failRedirect('authentication_failed');
  }

  try {
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
      return failRedirect('authentication_failed');
    }

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
        return failRedirect('authentication_failed');
    }

    const userData = await userResponse.json();
    const membership = userData?.included?.find((item: any) => item.type === 'member');
    const isPatron = membership?.attributes?.patron_status === 'active_patron';

    if (isPatron) {
      redirectUrl.searchParams.set('patreon_token', tokenData.access_token);
    } else {
      redirectUrl.searchParams.set('patreon_error', 'not_an_active_patron');
    }

    res.writeHead(302, { Location: redirectUrl.toString() });
    res.end();

  } catch (error) {
    console.error('Patreon OAuth callback error:', error);
    failRedirect('authentication_failed');
  }
}
