import React, { useState, useEffect, useCallback } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import Header from './components/Header';
import NetflixView from './components/NetflixView';
import TinderView from './components/TinderView';
import TikTokView from './components/TikTokView';
import LoginPrompt from './components/LoginPrompt';
import { ViewType, AccountDetails } from './types';
import { getAccountDetails, createSession, deleteSession } from './services/tmdbService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [viewType, setViewType] = useState<ViewType>(ViewType.NETFLIX);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  const clearSession = useCallback(() => {
    localStorage.removeItem('tmdbSessionId');
    setSessionId(null);
    setAccount(null);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const storedApiKey = localStorage.getItem('tmdbApiKey');
      const storedSessionId = localStorage.getItem('tmdbSessionId');
      
      if (storedApiKey) {
        setApiKey(storedApiKey);
        if (storedSessionId) {
          try {
            const accountDetails = await getAccountDetails(storedApiKey, storedSessionId);
            setSessionId(storedSessionId);
            setAccount(accountDetails);
          } catch (error) {
            console.error("Session validation failed", error);
            clearSession();
          }
        }
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const requestToken = urlParams.get('request_token');
      const approved = urlParams.get('approved');

      if (requestToken && approved && storedApiKey) {
        setIsAuthenticating(true);
        try {
          const sessionResponse = await createSession(storedApiKey, requestToken);
          localStorage.setItem('tmdbSessionId', sessionResponse.session_id);
          const accountDetails = await getAccountDetails(storedApiKey, sessionResponse.session_id);
          setSessionId(sessionResponse.session_id);
          setAccount(accountDetails);
        } catch (error) {
          console.error("Failed to create session:", error);
          clearSession();
        } finally {
          setIsAuthenticating(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      setIsLoading(false);
    };
    initialize();
  }, [clearSession]);

  const handleApiKeySave = useCallback((key: string) => {
    localStorage.setItem('tmdbApiKey', key);
    setApiKey(key);
  }, []);

  const handleLogout = useCallback(async () => {
    if (apiKey && sessionId) {
        try {
            await deleteSession(apiKey, sessionId);
        } catch (error) {
            console.error("Failed to delete session on server:", error);
        }
    }
    clearSession();
  }, [apiKey, sessionId, clearSession]);

  const renderView = () => {
    if (!apiKey || !sessionId || !account) return null;
    switch (viewType) {
      case ViewType.TINDER:
        return <TinderView apiKey={apiKey} sessionId={sessionId} account={account} />;
      case ViewType.TIKTOK:
        return <TikTokView apiKey={apiKey} sessionId={sessionId} account={account} />;
      case ViewType.NETFLIX:
      default:
        return <NetflixView apiKey={apiKey} searchQuery={searchQuery} />;
    }
  };

  const renderContent = () => {
    if (isLoading || isAuthenticating) {
       return <div className="h-screen w-screen flex items-center justify-center bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;
    }
    if (!apiKey) {
      return <ApiKeySetup onSave={handleApiKeySave} />;
    }
    if (!sessionId || !account) {
      return <LoginPrompt apiKey={apiKey} />;
    }
    return (
      <>
        <Header
          currentView={viewType}
          setView={setViewType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          user={account}
          onLogout={handleLogout}
        />
        <main className="pt-24">{renderView()}</main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans">
      {renderContent()}
    </div>
  );
};

export default App;
