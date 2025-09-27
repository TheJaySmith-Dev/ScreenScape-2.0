import React, { useState } from 'react';
import { LockIcon } from './Icons';

interface ApiKeySetupProps {
  onSave: (apiKey: string) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-900 animate-text-focus-in p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-8 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-glass-edge">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Welcome to ScreenScape</h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400">Please enter your TMDb API key to begin.</p>
          <p className="mt-1 text-xs text-zinc-500">Your key is stored only in your browser.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <LockIcon className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              id="api-key"
              name="api-key"
              type="password"
              autoComplete="current-password"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="block w-full rounded-xl border-0 bg-white/5 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
              placeholder="TMDb API Key"
            />
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-300"
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