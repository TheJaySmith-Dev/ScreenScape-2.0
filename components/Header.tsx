import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Settings, Gamepad2, Play, Heart, Bot, User, X, RefreshCw } from 'lucide-react';
import { ViewType } from '../App';
import { useImageGenerator } from '../contexts/ImageGeneratorContext';
import { useDeviceSync } from '../hooks/useDeviceSync';
import { searchMulti, normalizeMovie, normalizeTVShow } from '../services/tmdbService';
import { getAutocompleteSuggestions } from '../services/autocompleteService';
import { MediaItem, Movie, TVShow, Person } from '../types';
import Loader from './Loader';
import { useAppleTheme } from './AppleDesignSystem';
import GlassPanel from './GlassPanel';

interface HeaderProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onSettingsClick: () => void;
  onSyncClick?: () => void;
  apiKey: string;
  onSelectItem: (item: MediaItem) => void;
}

interface NavItem {
  viewName: ViewType | 'more';
  icon: any;
  label: string;
  unique?: boolean;
  pulse?: boolean;
  badge?: number;
  isMore?: boolean;
  isGamesIcon?: boolean;
}

// Simple frosted glass navigation container
const NavContainer: React.FC<{ isSearchMode: boolean; children: React.ReactNode }> = ({ isSearchMode, children }) => {
  const { tokens } = useAppleTheme();

  return (
    <motion.div
      style={{
        position: 'fixed',
        bottom: `max(${tokens.spacing.standard[3]}px, env(safe-area-inset-bottom, 0px) + ${tokens.spacing.standard[1]}px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: isSearchMode ? 'auto' : 'auto',
        minWidth: isSearchMode ? '320px' : 'auto',
        maxWidth: isSearchMode ? '500px' : '90vw',
        transition: 'all 0.3s ease',
      }}
    >
      <GlassPanel
        variant="primary"
        material="regular"
        padding="small"
        borderRadius="full"
        className="flex flex-row items-center justify-center gap-2 backdrop-blur-3xl border-white/20 shadow-2xl"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing.standard[1],
        }}
      >
        {children}
      </GlassPanel>
    </motion.div>
  );
};

// Simple frosted glass navigation button
const NavButton: React.FC<{
  active: boolean;
  isGamesIcon?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}> = ({ active, isGamesIcon, children, onClick, title }) => {
  const { tokens } = useAppleTheme();

  return (
    <motion.button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing.standard[1],
        margin: '1px',
        borderRadius: isGamesIcon ? '0 10px 10px 0' : '12px',
        background: active ? 'rgba(0, 122, 255, 0.2)' : 'transparent',
        color: tokens.colors.label.primary,
        fontFamily: tokens.typography.families.text,
        fontSize: tokens.typography.sizes.caption1,
        fontWeight: tokens.typography.weights.medium,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        minWidth: '38px',
      }}
      whileHover={{ scale: 1.08, background: 'rgba(255, 255, 255, 0.1)' }}
      whileTap={{ scale: 0.95 }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${tokens.colors.system.blue}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      {children}
    </motion.button>
  );
};

// Simple navigation icon
const NavIcon: React.FC<{
  view: ViewType;
  currentView: ViewType;
  children: React.ReactNode;
}> = ({ view, currentView, children }) => {
  const { tokens } = useAppleTheme();

  return (
    <div
      style={{
        fontSize: tokens.typography.sizes.body,
        marginBottom: tokens.spacing.micro[1],
        color: view === currentView
          ? tokens.colors.label.primary
          : tokens.colors.label.secondary,
        transition: 'all 0.3s ease',
      }}
    >
      {children}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({
  view,
  setView,
  onSettingsClick,
  onSyncClick,
  apiKey,
  onSelectItem
}) => {
  const { tokens } = useAppleTheme();

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Movie | TVShow | Person)[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const autoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isSearchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchMode]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearchLoading(true);
      searchTimeoutRef.current = window.setTimeout(async () => {
        try {
          const results = await searchMulti(searchQuery, apiKey);
          setSearchResults(results.results.slice(0, 8));
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearchLoading(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearchLoading(false);
      setAutocompleteSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
      }
    };
  }, [searchQuery, apiKey]);

  // Debounced autocomplete suggestions (OMDb first, TMDb fallback)
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
    }
    autoTimeoutRef.current = window.setTimeout(async () => {
      try {
        const sugg = await getAutocompleteSuggestions(apiKey, searchQuery, 8);
        setAutocompleteSuggestions(sugg);
      } catch {
        setAutocompleteSuggestions([]);
      }
    }, 200);

    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    };
  }, [searchQuery, apiKey]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setView('screenSearch');
      setIsSearchMode(false);
      setShowSearchResults(false);
      // Trigger search in NetflixView
      window.dispatchEvent(new CustomEvent('setSearchView', {
        detail: { query: searchQuery.trim() }
      }));
    }
  }, [searchQuery, setView]);

  const handleResultClick = useCallback((item: Movie | TVShow | Person) => {
    if (item.media_type === 'person') return;

    const mediaItem: MediaItem = item.media_type === 'movie'
      ? normalizeMovie(item as Movie)
      : normalizeTVShow(item as TVShow);

    onSelectItem(mediaItem);
    setIsSearchMode(false);
    setShowSearchResults(false);
    setSearchQuery('');
  }, [onSelectItem]);

  const navItems: NavItem[] = [
    { viewName: 'screenSearch', icon: Home, label: 'Home' },
    { viewName: 'search', icon: Search, label: 'Explore' },
    { viewName: 'game', icon: Gamepad2, label: 'Games', isGamesIcon: true },
    { viewName: 'likes', icon: Heart, label: 'Likes' },
    { viewName: 'apps', icon: Bot, label: 'AI' },
  ];

  if (isSearchMode) {
    return (
      <NavContainer isSearchMode={true}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: tokens.spacing.standard[1] }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, shows, people..."
              style={{
                width: '100%',
                padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.standard[1]}px`,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: tokens.colors.label.primary,
                fontSize: tokens.typography.sizes.body,
                fontFamily: tokens.typography.families.text,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = tokens.colors.system.blue;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            />

            {/* Search Results & Autocomplete Dropdown */}
            <AnimatePresence>
              {showSearchResults && (searchResults.length > 0 || autocompleteSuggestions.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    marginTop: tokens.spacing.micro[1],
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                  }}
                >
                  {autocompleteSuggestions.length > 0 && (
                    <div style={{ padding: tokens.spacing.standard[1], borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div style={{ color: tokens.colors.label.secondary, marginBottom: tokens.spacing.micro[0] }}>Suggestions</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.micro[1] }}>
                        {autocompleteSuggestions.map((s) => (
                          <button
                            key={`header-auto-${s}`}
                            onClick={() => setSearchQuery(s)}
                            style={{
                              border: 'none',
                              borderRadius: '12px',
                              padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: tokens.colors.label.primary,
                              cursor: 'pointer'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.id}-${result.media_type}`}
                      onClick={() => handleResultClick(result)}
                      style={{
                        padding: tokens.spacing.standard[1],
                        borderBottom: index < searchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        cursor: result.media_type === 'person' ? 'default' : 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (result.media_type !== 'person') {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{
                        color: tokens.colors.label.primary,
                        fontSize: tokens.typography.sizes.body,
                        fontWeight: tokens.typography.weights.medium,
                      }}>
                        {(result as Movie).title || (result as TVShow | Person).name}
                      </div>
                      <div style={{
                        color: tokens.colors.label.secondary,
                        fontSize: tokens.typography.sizes.caption1,
                        marginTop: tokens.spacing.micro[0],
                      }}>
                        {result.media_type === 'movie' ? 'Movie' :
                          result.media_type === 'tv' ? 'TV Show' : 'Person'}
                        {(result as Movie).release_date && ` • ${new Date((result as Movie).release_date).getFullYear()}`}
                        {(result as TVShow).first_air_date && ` • ${new Date((result as TVShow).first_air_date).getFullYear()}`}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isSearchLoading && (
            <div style={{ padding: tokens.spacing.micro[1] }}>
              <Loader />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsSearchMode(false);
              setSearchQuery('');
              setShowSearchResults(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.colors.label.primary,
              cursor: 'pointer',
              padding: tokens.spacing.micro[1],
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </form>
      </NavContainer>
    );
  }

  return (
    <NavContainer isSearchMode={false}>
      {navItems.map((item) => (
        <NavButton
          key={item.viewName}
          active={view === item.viewName}
          isGamesIcon={item.isGamesIcon}
          onClick={() => {
            if (item.viewName === 'more') return;
            setView(item.viewName as ViewType);
          }}
          title={item.label}
        >
          <NavIcon view={item.viewName as ViewType} currentView={view}>
            <item.icon size={20} />
          </NavIcon>
          <span style={{
            fontSize: tokens.typography.sizes.caption2,
            marginTop: tokens.spacing.micro[0],
          }}>
            {item.label}
          </span>
        </NavButton>
      ))}

      <NavButton
        active={false}
        onClick={() => setIsSearchMode(true)}
        title="Search"
      >
        <NavIcon view="search" currentView={view}>
          <Search size={20} />
        </NavIcon>
        <span style={{
          fontSize: tokens.typography.sizes.caption2,
          marginTop: tokens.spacing.micro[0],
        }}>
          Search
        </span>
      </NavButton>

      <NavButton
        active={false}
        onClick={onSettingsClick}
        title="Settings"
      >
        <NavIcon view="settings" currentView={view}>
          <Settings size={20} />
        </NavIcon>
        <span style={{
          fontSize: tokens.typography.sizes.caption2,
          marginTop: tokens.spacing.micro[0],
        }}>
          Settings
        </span>
      </NavButton>
    </NavContainer>
  );
};

export default Header;
