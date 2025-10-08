import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import GameView, { Game } from './components/GameView';
import AIAssistant from './components/AIAssistant';
import { useTheme } from './hooks/useTheme';
import { ActiveFilter } from './types';

export type ViewType = 'home' | 'watchlist' | 'game';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isKeyInvalid, setIsKeyInvalid] = useState(false);
    const [view, setView] = useState<ViewType>('home');
    const [activeGame, setActiveGame] = useState<Game>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
    // In a real application, this would be determined dynamically via GeoIP or a user setting.
    // Defaulting to 'ZA' to fulfill the user request for South Africa / Disney+ UK content.
    const [userCountry, setUserCountry] = useState('US');

    useTheme();

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
            setApiKey(''); // Represents no key set
        }
        
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'tmdb_api_key') {
                const newKey = event.newValue;
                 if (newKey) {
                    setApiKey(newKey);
                    setIsKeyInvalid(false);
                } else {
                    setApiKey('');
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);

    }, []);

    useEffect(() => {
        const storedCountry = localStorage.getItem('tmdb_user_country');
        if (storedCountry) {
            setUserCountry(storedCountry);
            return;
        }

        let isMounted = true;

        const detectCountry = async () => {
            const fallbackCountry = () => {
                const locale = navigator?.language || navigator?.languages?.[0];
                if (!locale) return null;
                const parts = locale.split('-');
                if (parts.length > 1) {
                    return parts[1].toUpperCase();
                }
                return null;
            };

            try {
                const response = await fetch('https://ipapi.co/json/');
                if (!response.ok) {
                    throw new Error(`Failed to fetch IP info: ${response.status}`);
                }
                const data = await response.json();
                const countryCode = data?.country_code;
                if (countryCode && typeof countryCode === 'string' && isMounted) {
                    const normalized = countryCode.toUpperCase();
                    setUserCountry(normalized);
                    localStorage.setItem('tmdb_user_country', normalized);
                    return;
                }
            } catch (error) {
                console.warn('Unable to detect location via IP lookup. Falling back to locale.', error);
            }

            if (isMounted) {
                const fallback = fallbackCountry();
                if (fallback) {
                    setUserCountry(fallback);
                    localStorage.setItem('tmdb_user_country', fallback);
                }
            }
        };

        detectCountry();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleInvalidApiKey = useCallback(() => {
        localStorage.removeItem('tmdb_api_key');
        setApiKey('');
        setIsKeyInvalid(true);
    }, []);

    const handleSetView = (newView: ViewType) => {
        setView(newView);
        if (newView !== 'game') {
            setActiveGame(null);
        }
        // Reset search/filter when changing main views
        if (newView === 'home' || newView === 'watchlist') {
            setSearchQuery('');
            setActiveFilter(null);
        }
    };

    const handleSelectGame = (game: Game) => {
        setView('game');
        setActiveGame(game);
    };
    
    if (apiKey === null) {
        return <div className="h-screen w-screen bg-primary" />; // Loading state
    }
    
    if (!apiKey) {
        return <ApiKeySetup isKeyInvalid={isKeyInvalid} />;
    }

    return (
        <>
            <Header 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                view={view}
                setView={handleSetView}
                activeFilter={activeFilter}
                setActiveFilter={(filter) => {
                    setView('home'); // Filters apply to home view
                    setActiveFilter(filter);
                }}
                userCountry={userCountry}
            />
            <main className="pt-20">
                {view === 'game' ? (
                    <GameView apiKey={apiKey} onInvalidApiKey={handleInvalidApiKey} initialGame={activeGame} />
                ) : (
                    <NetflixView 
                        apiKey={apiKey}
                        searchQuery={searchQuery}
                        onInvalidApiKey={handleInvalidApiKey}
                        view={view}
                        activeFilter={activeFilter}
                        onSelectGame={handleSelectGame}
                        userCountry={userCountry}
                    />
                )}
            </main>
            <AIAssistant tmdbApiKey={apiKey} />
        </>
    );
};

export default App;