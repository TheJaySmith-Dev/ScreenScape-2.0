
import React, { useState } from 'react';
import { LockIcon, SparklesIcon } from './Icons';

interface ApiKeySetupProps {
  // FIX: Updated onSave to only pass the TMDb key, as the Gemini key is no longer handled by the UI.
  onSave: (tmdbKey: string) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSave }) => {
  const [tmdbKey, setTmdbKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Removed check and save for Gemini key.
    if (tmdbKey.trim()) {
      onSave(tmdbKey.trim());
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center animate-text-focus-in p-4 bg-primary">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-8 bg-glass backdrop-blur-2xl rounded-3xl shadow-2xl border border-glass-edge">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Welcome to ScreenScape</h1>
          {/* FIX: Updated text to reflect only TMDb key is needed. */}
          <p className="mt-2 text-sm sm:text-base text-zinc-300">Please enter your TMDb API key to begin.</p>
          <p className="mt-1 text-xs text-zinc-400">Your key is stored only in your browser.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LockIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                id="tmdb-api-key"
                name="tmdb-api-key"
                type="password"
                required
                value={tmdbKey}
                onChange={(e) => setTmdbKey(e.target.value)}
                className="block w-full rounded-xl border-0 bg-white/5 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm sm:leading-6 transition-all"
                placeholder="TMDb API Key"
              />
            </div>
            {/* FIX: Removed Gemini API key input to comply with Gemini API guidelines. */}
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-cyan-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors duration-300"
            >
              Save & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeySetup;