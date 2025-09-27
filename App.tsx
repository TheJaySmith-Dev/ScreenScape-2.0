import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import TinderView from './components/TinderView';
import TikTokView from './components/TikTokView';
import { ViewType } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>(ViewType.NETFLIX);
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

  const renderView = () => {
    if (!apiKey) return null;
    switch (viewType) {
      case ViewType.TINDER:
        return <TinderView apiKey={apiKey} />;
      case ViewType.TIKTOK:
        return <TikTokView apiKey={apiKey} />;
      case ViewType.NETFLIX:
      default:
        return <NetflixView apiKey={apiKey} searchQuery={searchQuery} />;
    }
  };

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
            currentView={viewType}
            setView={setViewType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <main className="pt-24">{renderView()}</main>
        </>
      )}
    </div>
  );
};

export default App;
