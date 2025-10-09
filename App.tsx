import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import GameView, { Game } from './components/GameView';
import MediaDetail from './components/MediaDetail';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import { useTheme } from './hooks/useTheme';
import { MediaItem } from './types';

export type ViewType = 'home' | 'watchlist' | 'game';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isKeyInvalid, setIsKeyInvalid] = useState(false);
    const [view, setView] = useState<ViewType>('home');
    const [activeGame, setActiveGame] = useState<Game>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { theme } = useTheme();

    useEffect(() => {
        document.documentElement.className = `theme-${theme} dark`;
    }, [theme]);
    
    useEffect(() => {
        const apiKeyToSet = '09b97a49759876f2fde9eadb163edc44';
        let storedKey = localStorage.getItem('tmdb_api_key');

        if (!storedKey) {
            localStorage.setItem('tmdb_api_key', apiKeyToSet);
            storedKey = apiKeyToSet;
        }

        if (storedKey) {
            setApiKey(storedKey);
            setIsKeyInvalid(false);
        } else {
            setApiKey('');
        }

        const handleSelectMedia = (event: Event) => {
            const detail = (event as CustomEvent<MediaItem>).detail;
            if (detail && detail.id && detail.media_type) {
                setSelectedMedia(detail);
                setView('home'); // Ensure view is home to show detail over it
            }
        };

        window.addEventListener('selectMediaItem', handleSelectMedia);
        return () => window.removeEventListener('selectMediaItem', handleSelectMedia);
    }, []);

    const handleInvalidApiKey = useCallback(() => {
        localStorage.removeItem('tmdb_api_key');
        setApiKey('');
        setIsKeyInvalid(true);
    }, []);
    
    const handleSetView = (newView: ViewType) => {
        setView(newView);
        setSelectedMedia(null);
        if (newView !== 'game') setActiveGame(null);
        if (newView === 'home' || newView === 'watchlist') setSearchQuery('');
    };

    const handleSelectGame = (game: Game) => {
        setView('game');
        setActiveGame(game);
    };
    
    const renderContent = () => {
        if (view === 'game') {
            return <GameView apiKey={apiKey!} onInvalidApiKey={handleInvalidApiKey} initialGame={activeGame} />;
        }
        return (
            <NetflixView 
                apiKey={apiKey!}
                searchQuery={searchQuery}
                onInvalidApiKey={handleInvalidApiKey}
                onSelectItem={setSelectedMedia}
                view={view}
                onSelectGame={handleSelectGame}
            />
        );
    };

    if (apiKey === null) {
        return <div className="h-screen w-screen bg-primary" />; // Loading state
    }
    
    if (!apiKey) {
        return <ApiKeySetup isKeyInvalid={isKeyInvalid} />;
    }

    return (
        <div className={`theme-${theme}`}>
            <Header 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                view={view}
                setView={handleSetView}
                onSettingsClick={() => setIsSettingsOpen(true)}
            />
            <main className="pt-20">
                {renderContent()}
            </main>

            {selectedMedia && (
                <MediaDetail
                    apiKey={apiKey}
                    item={selectedMedia}
                    onClose={() => setSelectedMedia(null)}
                    onInvalidApiKey={handleInvalidApiKey}
                />
            )}
            
            <AIAssistant tmdbApiKey={apiKey} />

            {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};

export default App;
