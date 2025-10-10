
import { useState, useCallback } from 'react';

export const availableVoices = [
    { key: 'Zephyr', name: 'Zephyr (Default)' },
    { key: 'Puck', name: 'Puck' },
    { key: 'Charon', name: 'Charon' },
    { key: 'Kore', name: 'Kore' },
    { key: 'Fenrir', name: 'Fenrir' },
];

export const availableLanguages = [
    { key: 'English', name: 'English' },
    { key: 'Spanish', name: 'Español' },
];

export type VoiceKey = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
export type LanguageKey = 'English' | 'Spanish';

const VOICE_KEY = 'screenScapeVoice';
const LANGUAGE_KEY = 'screenScapeLanguage';

const getStoredPreference = <T extends string>(key: string, defaultValue: T): T => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) return stored as T;
    }
    return defaultValue;
};


export const useVoicePreferences = () => {
  const [voice, setVoice] = useState<VoiceKey>(() => getStoredPreference(VOICE_KEY, 'Zephyr'));
  const [language, setLanguage] = useState<LanguageKey>(() => getStoredPreference(LANGUAGE_KEY, 'English'));

  const setVoicePreference = useCallback((newVoice: VoiceKey) => {
    setVoice(newVoice);
    localStorage.setItem(VOICE_KEY, newVoice);
  }, []);

  const setLanguagePreference = useCallback((newLanguage: LanguageKey) => {
    setLanguage(newLanguage);
    localStorage.setItem(LANGUAGE_KEY, newLanguage);
  }, []);

  return { 
    voice, 
    language, 
    setVoicePreference, 
    setLanguagePreference,
    availableVoices,
    availableLanguages
  };
};
