// IMPORTANT: This file represents a server-side API route (e.g., a Vercel Serverless Function)
// and is designed to run in a Node.js environment, not in the browser.
// It securely handles the OAuth callback and token exchange.

// We are defining a type for the response to simulate how a serverless function would work.
// In a real Vercel/Next.js environment, you would use types from the framework (`VercelRequest`, `VercelResponse`).
type ServerResponse = {
  redirect: (url: string) => void;
  status: (code: number) => {
    json: (data: any) => void;
    send: (message: string) => void;
  };
};

type ServerRequest = {
  query: {
    code?: string;
  };
};

// This is the handler for the API route at /api/auth/patreon/callback
export default async function handler(req: ServerRequest, res: ServerResponse) {
  const code = req.query.code as string;
  // If code is missing, redirect to the frontend with an error.
  if (!code) {
    const errorUrl = new URL('/genscape', 'https://screenscape.space');
    errorUrl.searchParams.set('patreon_error', 'authentication_failed');
    return res.redirect(errorUrl.toString());
  }

  try {
    // Use environment variables for security
    const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID;
    const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
    const PATREON_REDIRECT_URI = 'https://screenscape.space/api/auth/patreon/callback'; 

    // 1. Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: PATREON_CLIENT_ID!,
        client_secret: PATREON_CLIENT_SECRET!,
        redirect_uri: PATREON_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    // If token exchange fails, redirect with an error.
    if (!tokenData.access_token) {
        console.error("Patreon token exchange failed:", tokenData);
        const errorUrl = new URL('/genscape', 'https://screenscape.space');
        errorUrl.searchParams.set('patreon_error', 'authentication_failed');
        return res.redirect(errorUrl.toString());
    }

    // 2. Use the access token to get the user's identity and membership status
    const userResponse = await fetch(
      'https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.currently_entitled_tiers',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user identity from Patreon.');
    }

    const userData = await userResponse.json();
    
    // The 'included' array contains membership info
    const membership = userData?.included?.find((item: any) => item.type === 'member');
    const isPatron = membership?.attributes?.patron_status === 'active_patron';

    // 3. Redirect the user based on their patron status
    if (isPatron) {
      // User is a valid patron. Redirect to GenScape with the access token.
      const successUrl = new URL('/genscape', 'https://screenscape.space');
      successUrl.searchParams.set('patreon_token', tokenData.access_token);
      res.redirect(successUrl.toString());
    } else {
      // User is not an active patron. Redirect with an error message.
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
