import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MediaItem } from './types';
import { LiquidPillNavigation } from './components/LiquidPillNavigation';
import IOS26Prototype from './components/IOS26Prototype';
import TopNavigation from './components/TopNavigation';
import NetflixView from './components/NetflixView';
import GameView, { Game } from './components/GameView';
import MediaDetail from './components/MediaDetail';
import ApiKeySetup from './components/ApiKeySetup';
import Settings from './components/Settings';
import QuickJump from './components/QuickJump';
import LiveView from './components/LiveView.tsx';
import ExportSettings from './components/ExportSettings';
import ImportSettings from './components/ImportSettings';
import SyncSelector from './components/SyncSelector';
import LikesPage from './components/LikesPage';
import SearchModal from './components/SearchModal';
import SearchPage from './components/SearchPage';
import MdbGenresView from './components/MdbGenresView';
import LiquidGlassPillMenuDemo from './pages/LiquidGlassPillMenuDemo';
// Hubs now live inside the IMAX page only
import ImaxView from './components/ImaxView';
import { MDBLIST_API_KEY } from './utils/genscapeKeys';

import { useAuth } from './contexts/AuthContext';
import { ImageGeneratorProvider } from './contexts/ImageGeneratorContext';
import { AppleThemeProvider, useAppleTheme } from './components/AppleThemeProvider';
// ScrollLiquidPanel demo removed; effect now lives in pill navigation

export type ViewType = 'screenSearch' | 'search' | 'live' | 'likes' | 'game' | 'settings' | 'sync' | 'prototype' | 'genres' | 'liquidGlassDemo' | 'imax';

type SyncViewType = 'none' | 'selector' | 'export' | 'import';

const AppContent: React.FC = () => {
    // Prefer performance in dev builds to keep interactions snappy
    const performanceMode = (import.meta as any)?.env?.DEV ?? false;
    const { userSettings, updateUserSettings } = useAuth();
    const { tokens } = useAppleTheme();
    const [apiKey, setApiKey] = useState<string | null>('09b97a49759876f2fde9eadb163edc44');
    const [isKeyInvalid, setIsKeyInvalid] = useState(false);
    const [view, setView] = useState<ViewType>('screenSearch');
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    // Remove IMAX Search variant; Search is always standard

    const [syncView, setSyncView] = useState<SyncViewType>('none');

    // Get user data for export
    const getUserData = () => ({
      userSettings,
      streamingPreferences: JSON.parse(localStorage.getItem('screenScapeStreamingProviders') || '[]'),
      watchlist: [], // TODO: Add watchlist from state/context
      searchHistory: [], // TODO: Add search history from state/context
      gameProgress: {}, // TODO: Add game progress from state/context
      exportTimestamp: Date.now()
    });

    // Handle importing data
    const handleImportData = (importedData: any) => {
      if (importedData.userSettings) {
        updateUserSettings(importedData.userSettings);
      }

      // Restore streaming preferences
      if (importedData.streamingPreferences && Array.isArray(importedData.streamingPreferences)) {
        localStorage.setItem('screenScapeStreamingProviders', JSON.stringify(importedData.streamingPreferences));
      }

      // TODO: Update other data stores (watchlist, searchHistory, gameProgress)
      // Force refresh of streaming preferences by dispatching a custom event
      window.dispatchEvent(new CustomEvent('streamingPreferencesChanged'));

      // Store synced timestamp
      localStorage.setItem('lastSyncTime', Date.now().toString());
    };

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

    const handleOpenSearchModal = useCallback(() => {
        setIsSearchModalOpen(true);
    }, []);

    const handleCloseSearchModal = useCallback(() => {
        setIsSearchModalOpen(false);
    }, []);

    useEffect(() => {
        const selectMediaItemHandler = (event: Event) => {
            const customEvent = event as CustomEvent<MediaItem>;
            handleSelectItem(customEvent.detail);
        };

        const setSearchViewHandler = (event: Event) => {
            const customEvent = event as CustomEvent<{ query: string }>;
            setView('screenSearch');
            setSearchQuery(customEvent.detail.query);
        }

        window.addEventListener('selectMediaItem', selectMediaItemHandler);
        window.addEventListener('setSearchView', setSearchViewHandler);

        return () => {
            window.removeEventListener('selectMediaItem', selectMediaItemHandler);
            window.removeEventListener('setSearchView', setSearchViewHandler);
        };
    }, [handleSelectItem]);

    // Initialize MDBList API key into localStorage if not present
    useEffect(() => {
        try {
            const existing = localStorage.getItem('mdblist_api_key');
            if (!existing && MDBLIST_API_KEY) {
                localStorage.setItem('mdblist_api_key', MDBLIST_API_KEY);
            }
        } catch (e) {
            // ignore storage errors in restricted environments
        }
    }, []);

    const renderView = () => {
        switch (view) {
            case 'screenSearch':
                return <NetflixView apiKey={apiKey!} searchQuery={searchQuery} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} onNavigateProvider={() => {}} />;
            case 'search':
                return <SearchPage apiKey={apiKey!} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} imaxMode={false} />;
            case 'live':
                return <LiveView />;
            case 'game':
                return <GameView apiKey={apiKey!} onInvalidApiKey={handleInvalidApiKey} initialGame={selectedGame} />;
            case 'likes':
                 return <LikesPage apiKey={apiKey!} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />;
            case 'settings':
                return <Settings onClose={() => setView('screenSearch')} />;
            case 'sync':
                return (
                    <SyncSelector
                        onExportClick={() => setSyncView('export')}
                        onImportClick={() => setSyncView('import')}
                        onBack={() => setView('screenSearch')}
                    />
                );
            case 'prototype':
                return <IOS26Prototype />;
            case 'genres':
                return <MdbGenresView initialApiKey={localStorage.getItem('mdblist_api_key') || MDBLIST_API_KEY} />;
            case 'imax':
                return <ImaxView apiKey={apiKey!} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} />;
            case 'liquidGlassDemo':
                return <LiquidGlassPillMenuDemo />;
            default:
                return <NetflixView apiKey={apiKey!} searchQuery={searchQuery} onSelectItem={handleSelectItem} onInvalidApiKey={handleInvalidApiKey} onNavigateProvider={() => {}} />;
        }
    };

    if (!apiKey) {
        return <ApiKeySetup isKeyInvalid={isKeyInvalid} />;
    }

    return (
        <ImageGeneratorProvider>
            <div 
                style={{
                    minHeight: '100vh',
                    fontFamily: tokens.typography.families.text,
                    fontSize: `${tokens.typography.sizes.body}px`,
                    fontWeight: tokens.typography.weights.regular,
                    lineHeight: tokens.typography.lineHeights.body,
                    color: tokens.colors.label.primary,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    // Solid background for IMAX page per requirement; keep theme elsewhere
                    backgroundColor: view === 'imax' ? '#0072CE' : (tokens.colors.background?.primary || 'transparent')
                }}
            >
                {/* Background Image */}
                {view !== 'imax' && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'url(https://i.postimg.cc/RF9HdRB4/4655BF78-0300-403B-BC19-5ED83796642D.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundAttachment: 'fixed',
                            zIndex: -1
                        }}
                    />
                )}

                {/* Top Navigation - provides quick access when bottom nav is obscured */}
                <TopNavigation
                    onSettingsClick={() => setView('settings')}
                    onSyncClick={() => setSyncView('selector')}
                    onImaxClick={!selectedItem && view !== 'imax' ? () => setView('imax') : undefined}
                    preferPerformance={performanceMode}
                />

                {/* Liquid panel demo removed per requirement; pill menu drives effect */}



                <div 
                    style={{
                        padding: `${tokens.spacing.standard[1]}px ${tokens.spacing.standard[0]}px`,
                        paddingTop: `${tokens.spacing.standard[2]}px`,
                        paddingBottom: `calc(${tokens.spacing.standard[3]}px + 64px + env(safe-area-inset-bottom))`, // Space for pill navigation
                        maxWidth: '1400px',
                        margin: '0 auto',
                        width: '100%',
                        minHeight: '100vh',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    {/* Header removed per request; pill menu provides primary navigation */}
                    {!selectedItem && renderView()}
                    
                    <AnimatePresence mode="wait">
                        {selectedItem && (
                            <MediaDetail 
                                key={selectedItem.id} 
                                item={selectedItem} 
                                apiKey={apiKey!} 
                                onClose={handleCloseDetail} 
                                onSelectItem={handleSelectItem} 
                                onInvalidApiKey={handleInvalidApiKey}
                                preferImaxTrailer={view === 'imax'}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Pill Navigation */}
                <LiquidPillNavigation
                    view={view}
                    setView={setView}
                    onSearchClick={() => { setView('search'); }}
                    enableLiquidEffects={!performanceMode}
                />



                {/* Sync Components - Simple Export/Import */}
                {syncView === 'selector' && (
                    <SyncSelector
                        onExportClick={() => setSyncView('export')}
                        onImportClick={() => setSyncView('import')}
                        onBack={() => setSyncView('none')}
                    />
                )}
                {syncView === 'export' && (
                    <ExportSettings
                        onClose={() => setSyncView('none')}
                        userData={getUserData()}
                    />
                )}
                {syncView === 'import' && (
                    <ImportSettings
                        onClose={() => setSyncView('none')}
                        onImportData={handleImportData}
                    />
                )}

                <QuickJump apiKey={apiKey} />

                {/* Search Modal */}
                <SearchModal
                    isOpen={isSearchModalOpen}
                    onClose={handleCloseSearchModal}
                    apiKey={apiKey!}
                    onSelectItem={handleSelectItem}
                    onInvalidApiKey={handleInvalidApiKey}
                />
            </div>
        </ImageGeneratorProvider>
    );
};

const App: React.FC = () => {
    return (
        <AppleThemeProvider>
            <AppContent />
        </AppleThemeProvider>
    );
};

export default App;
