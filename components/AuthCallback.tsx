import React, { useEffect, useState } from 'react';
import Loader from './Loader';

const CLIENT_ID = 'fb4eb7f03647432fa68fe30883715906';
const REDIRECT_URI = 'https://screenscape.space/';
const CODE_VERIFIER_KEY = 'spotify_code_verifier';
const AUTH_TOKEN_KEY = 'spotify_auth_token';
const AUTH_EXPIRES_AT_KEY = 'spotify_auth_expires_at';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const exchangeCodeForToken = async (code: string, verifier: string) => {
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error_description || 'Failed to exchange token');
        }

        const data = await response.json();
        const { access_token, expires_in } = data;
        
        if (access_token && expires_in) {
            const expiresAt = new Date().getTime() + expires_in * 1000;
            localStorage.setItem(AUTH_TOKEN_KEY, access_token);
            localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(expiresAt));
            console.log('🎧 Spotify Connected (PKCE)');
            localStorage.removeItem(CODE_VERIFIER_KEY); // Clean up verifier
            window.location.href = '/';
        } else {
            throw new Error('Access token not found in response');
        }

      } catch (err) {
        console.error("Token exchange error:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        localStorage.removeItem(CODE_VERIFIER_KEY);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const authError = params.get('error');
    const verifier = localStorage.getItem(CODE_VERIFIER_KEY);

    if (authError) {
      setError(`Spotify authentication failed: ${authError}`);
      localStorage.removeItem(CODE_VERIFIER_KEY);
      return;
    }

    if (!code) {
      // User may have navigated to /callback manually. Redirect home.
      window.location.href = '/';
      return;
    }

    if (!verifier) {
      setError("Code verifier not found. Your session may have expired or you might be in private browsing mode. Please try logging in again.");
      return;
    }

    // If we have a code and verifier, proceed with token exchange
    exchangeCodeForToken(code, verifier);
    
  }, []);

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-primary text-white p-4">
        <div className="w-full max-w-md text-center bg-glass border border-red-500/50 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold mb-3 text-red-400">Authentication Error</h1>
            <p className="text-zinc-300 mb-4">{error}</p>
            <a href="/" className="glass-button glass-button-primary px-6 py-3 rounded-full font-bold">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen">
        <Loader />
        <p className="mt-4 text-lg">Connecting to Spotify...</p>
    </div>
  );
};

export default AuthCallback;