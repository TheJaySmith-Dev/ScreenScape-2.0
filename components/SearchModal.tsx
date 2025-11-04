import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { MediaItem } from '../types';
import { searchMulti, normalizeMovie, normalizeTVShow } from '../services/tmdbService';
import { useAppleTheme } from './AppleThemeProvider';
import MediaRow from './MediaRow';
import Loader from './Loader';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSelectItem: (item: MediaItem) => void;
  onInvalidApiKey: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSelectItem,
  onInvalidApiKey
}) => {
  const { tokens } = useAppleTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !apiKey) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      
      const searchData = await searchMulti(apiKey, searchQuery);
      
      if (searchData.results) {
        const normalizedResults = searchData.results
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item: any) => {
            if (item.media_type === 'movie') {
              return normalizeMovie(item);
            } else {
              return normalizeTVShow(item);
            }
          })
          .slice(0, 20);
        
        setResults(normalizedResults);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      if (error.message?.includes('401') || error.message?.includes('Invalid API key')) {
        onInvalidApiKey();
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [apiKey, onInvalidApiKey]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle item selection
  const handleSelectItem = (item: MediaItem) => {
    onSelectItem(item);
    onClose();
  };

  // Handle modal close
  const handleClose = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setLoading(false);
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="fixed z-50"
            style={{
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(95vw, 600px)',
              maxHeight: '70vh',
              margin: '0 auto'
            }}
          >
            <div
              style={{
                borderRadius: `${tokens.borderRadius.xxlarge}px`,
                background: `rgba(255, 255, 255, ${tokens.materials.glass.prominent.opacity})`,
                backdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
                WebkitBackdropFilter: `blur(${tokens.materials.glass.prominent.blur}px)`,
                border: `1px solid rgba(255, 255, 255, ${tokens.materials.glass.prominent.borderOpacity})`,
                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity})`,
                padding: `${tokens.spacing.standard[2]}px`,
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${tokens.spacing.standard[1]}px`,
                  marginBottom: `${tokens.spacing.standard[1]}px`
                }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search 
                    size={20}
                    style={{
                      position: 'absolute',
                      left: `${tokens.spacing.standard[1]}px`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: tokens.colors.text.tertiary,
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Search movies, TV shows, people..."
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: `${tokens.borderRadius.large}px`,
                      border: `1px solid rgba(255, 255, 255, 0.2)`,
                      background: `rgba(255, 255, 255, 0.1)`,
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      padding: `0 ${tokens.spacing.standard[1]}px 0 ${tokens.spacing.standard[3]}px`,
                      fontSize: `${tokens.typography.sizes.body}px`,
                      fontFamily: tokens.typography.families.text,
                      color: 'white',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
                
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    background: `rgba(255, 255, 255, 0.1)`,
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Content */}
              <div
                style={{
                  maxHeight: '50vh',
                  overflowY: 'auto',
                  borderRadius: `${tokens.borderRadius.large}px`,
                  background: `rgba(0, 0, 0, 0.1)`,
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)'
                }}
              >
                {loading && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: `${tokens.spacing.standard[3]}px`,
                      color: 'white'
                    }}
                  >
                    <Loader />
                  </div>
                )}

                {!loading && hasSearched && results.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: `${tokens.spacing.standard[3]}px`,
                      color: tokens.colors.text.secondary,
                      fontSize: `${tokens.typography.sizes.body}px`,
                      fontFamily: tokens.typography.families.text
                    }}
                  >
                    No results found for "{query}"
                  </div>
                )}

                {!loading && !hasSearched && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: `${tokens.spacing.standard[3]}px`,
                      color: tokens.colors.text.tertiary,
                      fontSize: `${tokens.typography.sizes.body}px`,
                      fontFamily: tokens.typography.families.text
                    }}
                  >
                    Start typing to search for movies and TV shows...
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <div style={{ padding: `${tokens.spacing.standard[1]}px` }}>
                    <MediaRow
                      title=""
                      items={results}
                      onSelectItem={handleSelectItem}
                      showTitle={false}
                      apiKey={apiKey}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;