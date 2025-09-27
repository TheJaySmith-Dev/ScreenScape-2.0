import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans">
      {!apiKey ? (
        <ApiKeySetup onSave={handleApiKeySave} />
      ) : (
        <>
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <main className="pt-24">
            <NetflixView apiKey={apiKey} searchQuery={searchQuery} onInvalidApiKey={handleInvalidApiKey} />
          </main>
        </>
      )}
    </div>
  );
};

export default App;