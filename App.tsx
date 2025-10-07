
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import GameView from './components/GameView';
import type { Game } from './components/GameView';
import AIAssistant from './components/AIAssistant';
import type { ActiveFilter } from './types';
import { useTheme } from './hooks/useTheme';

export type ViewType = 'home' | 'watchlist' | 'game';

const TMDB_API_KEY = '09b97a49759876f2fde9eadb163edc44';


// --- Main App Component ---
const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewType>('home');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [initialGame, setInitialGame] = useState<Game>(null);

  // Initialize theme
  useTheme();

  const handleSetView = (newView: ViewType) => {
    setView(newView);
    setSearchQuery('');
    setActiveFilter(null);
    if (newView !== 'game') {
      setInitialGame(null);
    }
  }

  const handleSetFilter = (filter: ActiveFilter | null) => {
    setActiveFilter(filter);
    setView('home');
    setSearchQuery('');
  }

  const handleSelectGame = (game: Game) => {
    setView('game');
    setInitialGame(game);
  };
  
  const handleInvalidApiKey = useCallback(() => {
    // In a real app, you might show a persistent error message
    // For now, we'll just log it, as the key is hardcoded.
    console.error("The hardcoded TMDb API Key is invalid or has been revoked.");
  }, []);

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
            <div style={{ display: view === 'game' ? 'block' : 'none' }}>
                <GameView apiKey={TMDB_API_KEY} onInvalidApiKey={handleInvalidApiKey} initialGame={initialGame} />
            </div>
            <div style={{ display: view !== 'game' ? 'block' : 'none' }}>
                <NetflixView 
                    apiKey={TMDB_API_KEY} 
                    searchQuery={searchQuery} 
                    onInvalidApiKey={handleInvalidApiKey} 
                    view={view}
                    activeFilter={activeFilter}
                    onSelectGame={handleSelectGame}
                />
            </div>
          </main>
          <AIAssistant tmdbApiKey={TMDB_API_KEY} />
        </>
    </div>
  );
};

export default App;