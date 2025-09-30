import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import AiView from './components/AiView';

export type ViewType = 'home' | 'movies' | 'tv' | 'likes' | 'ai';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewType>('home');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('tmdbApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    setIsLoading(false);
  }, []);

  const handleApiKeySave = useCallback((key: string) => {
    localStorage.setItem('tmdbApiKey', key);
    setApiKey(key);
  }, []);

  const handleInvalidApiKey = useCallback(() => {
    console.error("Invalid API Key detected. Clearing key and prompting for new one.");
    localStorage.removeItem('tmdbApiKey');
    setApiKey(null);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        {/* Can add a loader here if needed */}
      </div>
    );
  }

  const handleSetView = (newView: ViewType) => {
    setView(newView);
    setSearchQuery(''); // Clear search when changing views
  }

  return (
    <div className="min-h-screen text-white font-sans">
      {!apiKey ? (
        <ApiKeySetup onSave={handleApiKeySave} />
      ) : (
        <>
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            view={view}
            setView={handleSetView}
          />
          <main>
            {view === 'ai' ? (
              <AiView />
            ) : (
              <NetflixView
                apiKey={apiKey}
                searchQuery={searchQuery}
                onInvalidApiKey={handleInvalidApiKey}
                view={view}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;