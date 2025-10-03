
import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import AIAssistant from './components/AIAssistant';
import type { ActiveFilter } from './types';

export type ViewType = 'home' | 'watchlist';

const App: React.FC = () => {
  const [tmdbApiKey, setTmdbApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewType>('home');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);

  useEffect(() => {
    const storedTmdbKey = localStorage.getItem('tmdbApiKey');
    if (storedTmdbKey) {
      setTmdbApiKey(storedTmdbKey);
    }
    setIsLoading(false);
  }, []);

  // FIX: Per Gemini API guidelines, the Gemini API key should not be managed through the UI.
  // The API key is now expected to be in `process.env.API_KEY`.
  // `handleApiKeySave` is updated to only handle the TMDb key.
  const handleApiKeySave = useCallback((tmdbKey: string) => {
    localStorage.setItem('tmdbApiKey', tmdbKey);
    setTmdbApiKey(tmdbKey);
  }, []);

  const handleInvalidApiKey = useCallback(() => {
    console.error("Invalid TMDb API Key detected. Clearing key.");
    localStorage.removeItem('tmdbApiKey');
    setTmdbApiKey(null);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-primary">
        {/* Can add a loader here if needed */}
      </div>
    );
  }

  const handleSetView = (newView: ViewType) => {
    setView(newView);
    setSearchQuery(''); // Clear search when changing views
    setActiveFilter(null);
  }

  const handleSetFilter = (filter: ActiveFilter | null) => {
    setActiveFilter(filter);
    setView('home'); // Switch to home view when a filter is selected
    setSearchQuery('');
  }
  
  // FIX: The app should be shown as long as the TMDb API key is available.
  const showApp = tmdbApiKey;

  return (
    <div className="min-h-screen text-white font-sans bg-primary">
      {!showApp ? (
        <ApiKeySetup onSave={handleApiKeySave} />
      ) : (
        <>
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            view={view}
            setView={handleSetView}
            activeFilter={activeFilter}
            setActiveFilter={handleSetFilter}
          />
          <main className="pt-36 md:pt-20">
            <NetflixView 
              apiKey={tmdbApiKey} 
              searchQuery={searchQuery} 
              onInvalidApiKey={handleInvalidApiKey} 
              view={view}
              activeFilter={activeFilter}
            />
          </main>
          {/* FIX: Removed geminiApiKey from props as it will be sourced from environment variables. */}
          <AIAssistant tmdbApiKey={tmdbApiKey} />
        </>
      )}
    </div>
  );
};

export default App;