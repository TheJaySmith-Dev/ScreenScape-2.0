import React from 'react';
import { LockIcon } from './Icons';

interface ApiKeySetupProps {
    isKeyInvalid: boolean;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ isKeyInvalid }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-primary text-white p-4">
      <div className="w-full max-w-md text-center bg-glass border border-glass-edge rounded-2xl p-8 shadow-2xl animate-text-focus-in">
        <div className="mx-auto w-16 h-16 bg-cyan-900/50 border-2 border-cyan-500 rounded-full flex items-center justify-center mb-6">
            <LockIcon className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-3xl font-bold mb-3">TMDb API Key Required</h1>
        {isKeyInvalid && (
            <p className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-3 mb-4 text-sm">
                The API key you provided is invalid. Please check your key and try again.
            </p>
        )}
        <p className="text-zinc-300 mb-6">
          To unlock the world of movies and TV shows with ScreenScape, a TMDb API key is needed.
        </p>
        <div className="text-left bg-primary/50 p-4 rounded-lg border border-glass-edge">
            <p className="text-sm font-semibold text-zinc-200 mb-2">How to add your key:</p>
            <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-2">
                <li>Open your browser's Developer Tools (usually F12 or Ctrl/Cmd+Shift+I).</li>
                <li>Go to the `Application` or `Storage` tab, then select `Local Storage`.</li>
                <li>Add a new key named <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-cyan-400">tmdb_api_key</code>.</li>
                <li>Paste your TMDb API key v3 as the value.</li>
                <li>Refresh this page.</li>
            </ol>
        </div>
        <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="inline-block mt-6 text-cyan-400 hover:text-cyan-300 transition-colors">
            Don't have a key? Get one for free from TMDb.
        </a>
      </div>
    </div>
  );
};

export default ApiKeySetup;
