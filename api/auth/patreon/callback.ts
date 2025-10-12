// IMPORTANT: This file represents a server-side API route (e.g., a Vercel Serverless Function)
// and is designed to run in a Node.js environment, not in the browser.
// It securely handles the OAuth callback and token exchange.

// We are defining a type for the response to simulate how a serverless function would work.
// In a real Vercel/Next.js environment, you would use types from the framework (`VercelRequest`, `VercelResponse`).
type ServerResponse = {
  redirect: (url: string) => void;
  status: (code: number) => {
    json: (data: any) => void;
  };
};

type ServerRequest = {
  query: {
    code?: string;
  };
};

// This is the handler for the API route at /api/auth/patreon/callback
export default async function handler(req: ServerRequest, res: ServerResponse) {
  const { code } = req.query;

  // Use environment variables for security
  const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID;
  const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
  // This must exactly match the URL in your Patreon developer settings
  const PATREON_REDIRECT_URI = 'https://screenscape.space/api/auth/patreon/callback'; 

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing.' });
  }

  try {
    // 1. Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        grant_type: 'authorization_code',
        client_id: PATREON_CLIENT_ID!,
        client_secret: PATREON_CLIENT_SECRET!,
        redirect_uri: PATREON_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Patreon token exchange failed: ${errorData.error_description || 'Unknown error'}`);
    }

    const { access_token } = await tokenResponse.json();

    // 2. Use the access token to get the user's identity and membership status
    const identityResponse = await fetch('https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields%5Bmember%5D=patron_status', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!identityResponse.ok) {
      throw new Error('Failed to fetch user identity from Patreon.');
    }

    const { data, included } = await identityResponse.json();

    const membership = included?.find((item: any) => item.type === 'member');
    const patronStatus = membership?.attributes?.patron_status;

    // 3. Redirect the user based on their patron status
    if (patronStatus === 'active_patron') {
      // User is a valid patron. Redirect to GenScape with the access token.
      const successUrl = new URL('/genscape', 'https://screenscape.space');
      successUrl.searchParams.set('patreon_token', access_token);
      res.redirect(successUrl.toString());
    } else {
      // User is not an active patron. Redirect to a locked state.
      const lockedUrl = new URL('/genscape', 'https://screenscape.space');
      lockedUrl.searchParams.set('patreon_error', 'not_an_active_patron');
      res.redirect(lockedUrl.toString());
    }
  } catch (error) {
    console.error('Patreon callback error:', error);
    const errorUrl = new URL('/genscape', 'https://screenscape.space');
    errorUrl.searchParams.set('patreon_error', 'authentication_failed');
    res.redirect(errorUrl.toString());
  }
}
