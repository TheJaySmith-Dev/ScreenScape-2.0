import React, { useState } from 'react';
import { LockIcon } from './Icons';

interface ApiKeySetupProps {
  onSave: (apiKey: string) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-4">
      <div className="max-w-md w-full text-center bg-zinc-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">ScreenScape</h1>
        <p className="text-zinc-400 mb-6">Enter your TMDB API Key to get started.</p>
        <div className="relative mb-4">
          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="TMDB API Key (v3 auth)"
            className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Save and Continue
        </button>
        <p className="text-xs text-zinc-500 mt-4">
          You can get a free API key from{' '}
          <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            The Movie Database (TMDB)
          </a>.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySetup;
