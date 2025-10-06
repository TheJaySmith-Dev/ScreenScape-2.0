
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import GameView from './components/GameView';
import AIAssistant from './components/AIAssistant';
import type { ActiveFilter } from './types';

export type ViewType = 'home' | 'watchlist' | 'game';

const TMDB_API_KEY = '09b97a49759876f2fde9eadb163edc44';


// --- Main App Component ---
const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewType>('home');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);

  const handleSetView = (newView: ViewType) => {
    setView(newView);
    setSearchQuery('');
    setActiveFilter(null);
  }

  const handleSetFilter = (filter: ActiveFilter | null) => {
    setActiveFilter(filter);
    setView('home');
    setSearchQuery('');
  }
  
  const handleInvalidApiKey = useCallback(() => {
    // In a real app, you might show a persistent error message
    // For now, we'll just log it, as the key is hardcoded.
    console.error("The hardcoded TMDb API Key is invalid or has been revoked.");
  }, []);

  const renderMainContent = () => {
    switch (view) {
      case 'game':
        return <GameView apiKey={TMDB_API_KEY} onInvalidApiKey={handleInvalidApiKey} />;
      case 'home':
      case 'watchlist':
      default:
        return (
          <NetflixView 
            apiKey={TMDB_API_KEY} 
            searchQuery={searchQuery} 
            onInvalidApiKey={handleInvalidApiKey} 
            view={view}
            activeFilter={activeFilter}
          />
        );
    }
  };

  return (
    <div className="min-h-screen text-white font-sans bg-primary">
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
            {renderMainContent()}
          </main>
          <AIAssistant tmdbApiKey={TMDB_API_KEY} />
        </>
    </div>
  );
};

export default App;
