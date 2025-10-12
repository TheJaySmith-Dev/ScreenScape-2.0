import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import GameView, { Game } from './components/GameView';
import MediaDetail from './components/MediaDetail';
import AIAssistant, { AIStatus } from './components/AIAssistant';
import AIGlow from './components/AIGlow';
import Settings from './components/Settings';
import TypeToAssist from './components/TypeToAssist';
import GenScapeAccessGate from './components/GenScapeAccessGate';
import GenScape from './components/GenScape';
import { useTheme } from './hooks/useTheme';
import { MediaItem } from './types';
import { validateKey } from './utils/genscapeKeys';

export type ViewType = 'home' | 'watchlist' | 'game' | 'genscape';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isKeyInvalid, setIsKeyInvalid] = useState(false);
    const [view, setView] = useState<ViewType>('home');
    const [activeGame, setActiveGame] = useState<Game>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
    
    const { theme } = useTheme();

    useEffect(() => {
        document.documentElement.className = `theme-${theme} dark`;
    }, [theme]);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const path = window.location.pathname;

        // Handle GenScape Access Key from URL, e.g., /unlock?access=KEY
        const accessKey = params.get('access');
        if (path.includes('/unlock') && accessKey) {
            if (validateKey(accessKey)) {
                localStorage.setItem('genscape_verified', 'true');
                params.delete('access');
                params.set('view', 'genscape');
                window.history.replaceState({view: 'genscape'}, document.title, `?${params.toString()}`);
                setView('genscape');
            } else {
                params.delete('access');
                params.set('view', 'genscape');
                params.set('access_error', 'true');
                window.history.replaceState({view: 'genscape'}, document.title, `?${params.toString()}`);
                setView('genscape');
            }
        } else {
            // Set initial view from URL query parameter
            const viewFromUrl = params.get('view');
            if (viewFromUrl && ['home', 'watchlist', 'game', 'genscape'].includes(viewFromUrl)) {
                setView(viewFromUrl as ViewType);
            } else {
                setView('home');
            }
        }
        
        // Handle browser back/forward
        const handlePopState = () => {
            const popParams = new URLSearchParams(window.location.search);
            const viewFromUrl = popParams.get('view');
             if (viewFromUrl && ['home', 'watchlist', 'game', 'genscape'].includes(viewFromUrl)) {
                setView(viewFromUrl as ViewType);
            } else {
                setView('home');
            }
        };
        window.addEventListener('popstate', handlePopState);

        // API Key setup - Hardcoded as per user request
        const tmdbApiKey = '09b97a49759876f2fde9eadb163edc44';
        localStorage.setItem('tmdb_api_key', tmdbApiKey);
        setApiKey(tmdbApiKey);

        // Custom event for selecting media items
        const handleSelectMedia = (event: Event) => {
            const detail = (event as CustomEvent<MediaItem>).detail;
            if (detail && detail.id && detail.media_type) {
                setSelectedMedia(detail);
                // When selecting media, go to home view and update URL
                const newParams = new URLSearchParams(window.location.search);
                newParams.set('view', 'home');
                window.history.pushState({view: 'home'}, '', `?${newParams.toString()}`);
                setView('home'); 
            }
        };
        window.addEventListener('selectMediaItem', handleSelectMedia);

        return () => {
            window.removeEventListener('selectMediaItem', handleSelectMedia);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleInvalidApiKey = useCallback(() => {
        // The hardcoded key is invalid. Don't clear it, as that would cause a reload loop.
        // Instead, just set the invalid flag to show an error state.
        console.error("The hardcoded TMDb API key is invalid or has been rejected by the service.");
        setIsKeyInvalid(true);
    }, []);
    
    const handleSetView = (newView: ViewType) => {
        if (view === newView) return; // Avoid pushing same state
        
        setView(newView);
        const params = new URLSearchParams(window.location.search);
        params.set('view', newView);
        window.history.pushState({view: newView}, '', `?${params.toString()}`);
        
        setSelectedMedia(null);
        if (newView !== 'game') setActiveGame(null);
        if (newView === 'home' || newView === 'watchlist') setSearchQuery('');
    };

    const handleSelectGame = (game: Game) => {
        handleSetView('game');
        setActiveGame(game);
    };
    
    const renderContent = () => {
        if (view === 'genscape') {
            return (
                <GenScapeAccessGate>
                    <GenScape />
                </GenScapeAccessGate>
            );
        }
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
    
    if (isKeyInvalid) {
        return (
            <div className="flex items-center justify-center h-screen bg-primary text-white p-4">
              <div className="w-full max-w-md text-center bg-red-900/50 border border-red-500 rounded-2xl p-8 shadow-2xl">
                <h1 className="text-3xl font-bold mb-3">API Key Error</h1>
                <p className="text-zinc-300">
                  Could not connect to TMDb. The application's API key is invalid or the service is unavailable.
                </p>
              </div>
            </div>
        );
    }

    return (
        <div className={`theme-${theme}`}>
            <AIGlow status={aiStatus} />
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
            
            <AIAssistant 
                tmdbApiKey={apiKey} 
                setAiStatus={setAiStatus}
            />
            
            <TypeToAssist tmdbApiKey={apiKey} />

            {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};

export default App;