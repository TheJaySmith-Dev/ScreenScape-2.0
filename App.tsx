import React, { useState, useEffect, useCallback } from 'react';
import { MediaItem } from './types';
import Header from './components/Header';
import ScreenSearch from './components/ScreenSearch';
import NetflixView from './components/NetflixView';
import GameView, { Game } from './components/GameView';
import MediaDetail from './components/MediaDetail';
import ApiKeySetup from './components/ApiKeySetup';
import Settings from './components/Settings';
import ImageGenerator from './components/ImageGenerator';
import AIAssistant, { AIStatus } from './components/AIAssistant';
import TypeToAssist from './components/TypeToAssist';
import AIGlow from './components/AIGlow';
import QuickJump from './components/QuickJump';
import LiveView from './components/LiveView.tsx';
import Auth from './components/Auth';

import { useAuth } from './contexts/AuthContext';

export type ViewType = 'screenSearch' | 'explore' | 'watchlist' | 'game' | 'imageGenerator' | 'live';

const App: React.FC = () => {
    const { user, loading, userSettings, updateUserSettings, syncLoading } = useAuth();
    const [apiKey, setApiKey] = useState<string | null>('09b97a49759876f2fde9eadb163edc44'); // Temporary fix for mobile user
    const [isKeyInvalid, setIsKeyInvalid] = useState(false);
    const [view, setView] = useState<ViewType>('screenSearch');
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [aiStatus, setAiStatus] = useState<AIStatus>('idle');

    useEffect(() => {
        // Sync TMDB API key with database when user logs in
        if (user && userSettings) {
            const syncedKey = userSettings.tmdb_api_key;
            if (syncedKey) {
                setApiKey(syncedKey);
                localStorage.setItem('tmdb_api_key', syncedKey);
                setIsKeyInvalid(false);
            } else {
                // Check localStorage as fallback for first-time users
                const localKey = localStorage.getItem('tmdb_api_key');
                if (localKey) {
                    setApiKey(localKey);
                    setIsKeyInvalid(false);
                    // Sync to database for future logins
                    updateUserSettings({ tmdb_api_key: localKey }).catch(console.error);
                } else {
                    setIsKeyInvalid(true);
                }
            }
        } else if (!user) {
            // User not logged in, check localStorage
            const localKey = localStorage.getItem('tmdb_api_key');
            if (localKey) {
                setApiKey(localKey);
                setIsKeyInvalid(false);
            } else {
                setIsKeyInvalid(true);
            }
        }
    }, [user, userSettings, updateUserSettings]);

    const handleInvalidApiKey = useCallback(() => {
        localStorage.removeItem('tmdb_api_key');
        setApiKey(null);
        setIsKeyInvalid(true);
    }, []);

    const handleSelectItem = useCallback((item: MediaItem) => {
        setSelectedItem(item);
    }, []);

    const handleSelectGame = useCallback((game: Game) => {
        setView('game');
        setSelectedGame(game);
    }, []);
    
    const handleCloseDetail = useCallback(() => {
        setSelectedItem(null);
    }, []);

    useEffect(() => {
        const selectMediaItemHandler = (event: Event) => {
            const customEvent = event as CustomEvent<MediaItem>;
            handleSelectItem(customEvent.detail);
        };
        
        const setSearchViewHandler = (event: Event) => {
            const customEvent = event as CustomEvent<{ query: string }>;
            setView('explore');
            setSearchQuery(customEvent.detail.query);
        }

        window.addEventListener('selectMediaItem', selectMediaItemHandler);
        window.addEventListener('setSearchView', setSearchViewHandler);

        return () => {
            window.removeEventListener('selectMediaItem', selectMediaItemHandler);
            window.removeEventListener('setSearchView', setSearchViewHandler);
        };
    }, [handleSelectItem]);
    
    const renderView = () => {
        if (selectedItem) {
            return <MediaDetail key={selectedItem.id} item={selectedItem} apiKey={apiKey!} onClose={handleCloseDetail} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />;
        }

        switch (view) {
            case 'screenSearch':
                return <ScreenSearch apiKey={apiKey!} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />;
            case 'explore':
                return <NetflixView apiKey={apiKey!} searchQuery={searchQuery} onSelectItem={handleSelectItem} onSelectGame={handleSelectGame} onInvalidApiKey={handleInvalidApiKey} view={view} />;
            case 'game':
                return <GameView apiKey={apiKey!} onInvalidApiKey={handleInvalidApiKey} initialGame={selectedGame} />;
            case 'imageGenerator':
                return <ImageGenerator />;
            case 'live':
                return <LiveView />;
            case 'watchlist':
                 return <div className="container mx-auto px-4 py-8 text-center"><h1 className="text-3xl font-bold">Watchlist</h1><p className="text-slate-400 mt-4">This feature is coming soon!</p></div>;
            default:
                return <ScreenSearch apiKey={apiKey!} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />;
        }
    };

    // Show authentication screen if not authenticated
    if (loading) {
        return (
            <div className="min-h-screen bg-primary text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading ScreenScape...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Auth />;
    }

    if (!apiKey) {
        return <ApiKeySetup isKeyInvalid={isKeyInvalid} />;
    }

    return (
        <div className="bg-primary text-white min-h-screen font-sans">
            <AIGlow status={aiStatus} />
            <Header view={view} setView={setView} onSettingsClick={() => setIsSettingsOpen(true)} />

            <main className="pt-20">
                {renderView()}
            </main>

            {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}

            <AIAssistant tmdbApiKey={apiKey} setAiStatus={setAiStatus} />
            <TypeToAssist tmdbApiKey={apiKey} />
            <QuickJump apiKey={apiKey} />
        </div>
    );
};

export default App;
