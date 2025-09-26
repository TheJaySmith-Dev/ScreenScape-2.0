import React, { useState } from 'react';
import { createRequestToken } from '../services/tmdbService';
import { UserIcon } from './Icons';

interface LoginPromptProps {
  apiKey: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ apiKey }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { request_token } = await createRequestToken(apiKey);
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      // TMDb will append the approved request_token to our redirect_to URL
      window.location.href = `https://www.themoviedb.org/authenticate/${request_token}?redirect_to=${encodeURIComponent(redirectUrl)}`;
    } catch (err) {
      setError('Failed to start login process. Please check your API key and try again.');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-900 animate-text-focus-in">
      <div className="w-full max-w-md p-8 space-y-8 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-glass-edge">
        <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/20">
                <UserIcon className="h-7 w-7 text-indigo-400" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Connect Your Account</h1>
            <p className="mt-2 text-zinc-400">To sync your preferences, please log in with your TMDb account.</p>
        </div>
        
        {error && <p className="text-sm text-center text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>}
        
        <div>
            <button
                onClick={handleLogin}
                disabled={isLoading}
                className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-300 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Redirecting...' : 'Login with TMDb'}
            </button>
        </div>
        <p className="text-xs text-zinc-500 text-center">You will be redirected to The Movie Database website to authorize ScreenScape.</p>
      </div>
    </div>
  );
};

export default LoginPrompt;
