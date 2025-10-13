import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ExploreView from './components/NetflixView';
import MediaDetail from './components/MediaDetail';
import Settings from './components/Settings';
import GameView, { Game } from './components/GameView';
import AIAssistant, { AIStatus } from './components/AIAssistant';
import AIGlow from './components/AIGlow';
import { MediaItem } from './types';
import ScreenSearch from './components/ScreenSearch';
import TypeToAssist from './components/TypeToAssist';
import AuthCallback from './components/AuthCallback';
import MusicView from './components/MusicView';
import { SpotifyProvider, useSpotify } from './contexts/SpotifyContext';
import SpotifyMiniPlayer from './components/SpotifyMiniPlayer';


export type ViewType = 'screenSearch' | 'explore' | 'watchlist' | 'game' | 'music';

const TMDB_API_KEY = '09b97a49759876f2fde9eadb163edc44';

const AppContent: React.FC = () => {
    const apiKey = TMDB_API_KEY;
    const [isKeyInvalid, setIsKeyInvalid] = useState(false);
    const [view, setView] = useState<ViewType>('screenSearch');
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [initialGame, setInitialGame] = useState<Game | null>(null);
    const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
    const { isAuthenticated } = useSpotify();


    useEffect(() => {
        const handleSelectMediaItem = (event: Event) => {
            const customEvent = event as CustomEvent<MediaItem>;
            setSelectedItem(customEvent.detail);
        };
        
        const handleControlTrailerAudio = (event: Event) => {
             // This can be implemented if MediaDetail has a video player with controls
             console.log('Control trailer audio event:', (event as CustomEvent).detail);
        };

        const handleSetView = (event: Event) => {
            const customEvent = event as CustomEvent<{ view: ViewType }>;
            setView(customEvent.detail.view);
        };

        window.addEventListener('selectMediaItem', handleSelectMediaItem);
        window.addEventListener('controlTrailerAudio', handleControlTrailerAudio);
        window.addEventListener('setView', handleSetView);


        return () => {
            window.removeEventListener('selectMediaItem', handleSelectMediaItem);
            window.removeEventListener('controlTrailerAudio', handleControlTrailerAudio);
            window.removeEventListener('setView', handleSetView);
        };
    }, []);
    
    const handleInvalidApiKey = useCallback(() => {
        // The hardcoded key is invalid. Display an error state.
        setIsKeyInvalid(true);
    }, []);

    const handleSelectItem = (item: MediaItem) => {
        setSelectedItem(item);
    };
    
    const handleSelectGame = (game: Game) => {
        setView('game');
        setInitialGame(game);
    };

    const handleCloseDetail = () => {
        setSelectedItem(null);
    };
    
    if (isKeyInvalid) {
        return (
            <div className="flex items-center justify-center h-screen bg-primary text-white p-4">
                <div className="w-full max-w-md text-center bg-glass border border-red-500/50 rounded-2xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold mb-3 text-red-400">Configuration Error</h1>
                    <p className="text-zinc-300">
                        The embedded TMDb API key is invalid. The application cannot function.
                    </p>
                </div>
            </div>
        );
    }

    const renderView = () => {
        switch (view) {
            case 'screenSearch':
                return <ScreenSearch apiKey={apiKey} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />;
            case 'explore':
                return <ExploreView apiKey={apiKey} searchQuery="" onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} onSelectGame={handleSelectGame} view={view} />;
            case 'watchlist':
                return <div className="container mx-auto px-4 py-8 text-center pt-24"><h1 className="text-3xl font-bold">Watchlist</h1><p className="text-slate-400 mt-4">This feature is coming soon!</p></div>;
            case 'game':
                return <GameView apiKey={apiKey} onInvalidApiKey={handleInvalidApiKey} initialGame={initialGame} />;
            case 'music':
                return <MusicView />;
            default:
                return <ScreenSearch apiKey={apiKey} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />;
        }
    };

    return (
        <div className={`bg-primary text-white min-h-screen font-sans ${aiStatus !== 'idle' ? 'ai-active' : ''}`}>
            <AIGlow status={aiStatus} />
            <Header view={view} setView={setView} onSettingsClick={() => setIsSettingsOpen(true)} />
            <main className="pt-20">
                {renderView()}
            </main>
            {selectedItem && (
                <MediaDetail
                    item={selectedItem}
                    apiKey={apiKey}
                    onClose={handleCloseDetail}
                    onSelectItem={handleSelectItem}
                />
            )}
            {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
            <AIAssistant tmdbApiKey={apiKey} setAiStatus={setAiStatus} />
            <TypeToAssist tmdbApiKey={apiKey} />
            {isAuthenticated && <SpotifyMiniPlayer />}
        </div>
    );
};


const App: React.FC = () => {
  if (window.location.pathname === '/callback') {
    return <AuthCallback />;
  }

  return (
    <SpotifyProvider>
      <AppContent />
    </SpotifyProvider>
  );
};

export default App;
