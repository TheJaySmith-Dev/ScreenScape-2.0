import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import AIAssistant from './components/AIAssistant';

export type ViewType = 'home' | 'movies' | 'tv' | 'likes';

const App: React.FC = () => {
  const [tmdbApiKey, setTmdbApiKey] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewType>('home');

  useEffect(() => {
    const storedTmdbKey = localStorage.getItem('tmdbApiKey');
    const storedGeminiKey = localStorage.getItem('geminiApiKey');
    if (storedTmdbKey) {
      setTmdbApiKey(storedTmdbKey);
    }
    if (storedGeminiKey) {
        setGeminiApiKey(storedGeminiKey);
    }
    setIsLoading(false);
  }, []);

  const handleApiKeySave = useCallback((tmdbKey: string, geminiKey: string) => {
    localStorage.setItem('tmdbApiKey', tmdbKey);
    localStorage.setItem('geminiApiKey', geminiKey);
    setTmdbApiKey(tmdbKey);
    setGeminiApiKey(geminiKey);
  }, []);

  const handleInvalidApiKey = useCallback(() => {
    console.error("Invalid TMDb API Key detected. Clearing key.");
    localStorage.removeItem('tmdbApiKey');
    setTmdbApiKey(null);
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
  
  const showApp = tmdbApiKey && geminiApiKey;

  return (
    <div className="min-h-screen text-white font-sans">
      {!showApp ? (
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
            <NetflixView 
              apiKey={tmdbApiKey} 
              searchQuery={searchQuery} 
              onInvalidApiKey={handleInvalidApiKey} 
              view={view}
            />
          </main>
          <AIAssistant tmdbApiKey={tmdbApiKey} geminiApiKey={geminiApiKey} />
        </>
      )}
    </div>
  );
};

export default App;
