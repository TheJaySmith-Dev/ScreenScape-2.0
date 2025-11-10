import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { MediaItem } from '../types';
import { searchMulti, searchMovies, searchTVShows, searchKeywords, normalizeMovie, normalizeTVShow } from '../services/tmdbService';
import { computeMatchScore } from '../utils/searchRanking';
import { useAppleTheme } from './AppleThemeProvider';
import MediaRow from './MediaRow';
import Loader from './Loader';
import { getAutocompleteSuggestions } from '../services/autocompleteService';

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const autoTimeoutRef = useRef<NodeJS.Timeout>();

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
      setSuggestions([]);
      setReportStatus(null);
      
      const searchData = await searchMulti(apiKey, searchQuery);
      let combined: MediaItem[] = [];
      if (searchData.results) {
        combined = searchData.results
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item: any) => (item.media_type === 'movie' ? normalizeMovie(item) : normalizeTVShow(item)));
      }

      if (combined.length === 0) {
        const [mr, tr] = await Promise.all([
          searchMovies(apiKey, searchQuery),
          searchTVShows(apiKey, searchQuery),
        ]);
        combined = ([...(mr.results || []), ...(tr.results || [])] as MediaItem[]);
      }

      // Rank results by query relevance
      const ranked = combined
        .map((item) => ({
          item,
          score: computeMatchScore((item as any).title || (item as any).name || '', searchQuery),
        }))
        .sort((a, b) => b.score - a.score);

      const positive = ranked.filter((r) => r.score > 0).map((r) => r.item);
      const finalResults = (positive.length > 0 ? positive : combined).slice(0, 20);
      setResults(finalResults);

      if (finalResults.length === 0) {
        try {
          const kw = await searchKeywords(apiKey, searchQuery);
          const names = (kw.results || []).map((k: any) => k.name);
          const curated = ['Iron Man (2008)', 'Iron Man 2', 'Iron Man 3', 'Tony Stark', 'Avengers'];
          const sugg = Array.from(new Set([...(names || []).slice(0, 6), ...curated])).slice(0, 8);
          setSuggestions(sugg);
        } catch {}
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

    // Debounced autocomplete suggestions (OMDb first, TMDb fallback)
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
    }
    autoTimeoutRef.current = setTimeout(async () => {
      try {
        const sugg = await getAutocompleteSuggestions(apiKey, value, 8);
        setAutoSuggestions(sugg);
      } catch {
        setAutoSuggestions([]);
      }
    }, 200);

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
  }, 300);
  };

  const handleSuggestionClick = (s: string) => {
    setQuery(s);
    performSearch(s);
  };

  const reportMissing = async () => {
    try {
      setReportStatus('Sending…');
      const resp = await fetch('/api/reportMissingContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source: 'SearchModal' }),
      });
      setReportStatus(resp.ok ? 'Thanks! We’ll look into it.' : 'Could not send report.');
    } catch {
      setReportStatus('Could not send report.');
    }
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

              {autoSuggestions.length > 0 && (
                <div style={{ marginBottom: `${tokens.spacing.standard[1]}px` }}>
                  <div style={{ color: tokens.colors.text.tertiary, marginBottom: `${tokens.spacing.micro[1]}px` }}>
                    Suggestions
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${tokens.spacing.micro[1]}px` }}>
                    {autoSuggestions.map((s) => (
                      <button
                        key={`auto-${s}`}
                        className="apple-glass-thin"
                        onClick={() => handleSuggestionClick(s)}
                        style={{
                          border: 'none',
                          borderRadius: `${tokens.borderRadius.medium}px`,
                          padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                          cursor: 'pointer',
                          color: tokens.colors.label.primary
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    <div style={{ marginBottom: tokens.spacing.standard[1] }}>
                      No results found for "{query}".
                    </div>
                    {suggestions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing.micro[1], justifyContent: 'center', marginBottom: tokens.spacing.standard[0] }}>
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className="apple-glass-regular"
                            style={{
                              borderRadius: '16px',
                              border: '1px solid rgba(255,255,255,0.2)',
                              padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                              color: tokens.colors.label.primary,
                              cursor: 'pointer',
                              background: 'rgba(255,255,255,0.08)'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <div>
                      <button
                        onClick={reportMissing}
                        className="apple-glass-regular"
                        style={{
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          padding: `${tokens.spacing.micro[1]}px ${tokens.spacing.standard[0]}px`,
                          color: tokens.colors.label.primary,
                          cursor: 'pointer',
                          background: 'rgba(255,255,255,0.08)'
                        }}
                      >
                        Report missing content
                      </button>
                      {reportStatus && (
                        <div style={{ marginTop: tokens.spacing.micro[1], color: tokens.colors.text.tertiary }}>
                          {reportStatus}
                        </div>
                      )}
                    </div>
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
