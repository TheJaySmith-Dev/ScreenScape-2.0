import { useState, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'screenScapeSearchHistory';
const MAX_HISTORY_LENGTH = 10;

const getStoredHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse search history from localStorage", error);
    // In case of parsing error, clear the corrupted data
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }
  return [];
};

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>(getStoredHistory);

  const addSearchQuery = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setHistory(prev => {
      // Remove existing entry to move it to the top, and convert to lower case for case-insensitive check
      const lowerCaseQuery = trimmedQuery.toLowerCase();
      const filtered = prev.filter(item => item.toLowerCase() !== lowerCaseQuery);
      
      const newHistory = [trimmedQuery, ...filtered].slice(0, MAX_HISTORY_LENGTH);
      
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  return { history, addSearchQuery, clearHistory };
};
