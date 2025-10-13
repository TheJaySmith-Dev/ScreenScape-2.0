
import React from 'react';
import { useTheme, ThemeKey } from '../hooks/useTheme';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useVoicePreferences, VoiceKey, LanguageKey } from '../hooks/useVoicePreferences';
import { useGeolocation } from '../hooks/useGeolocation';
import * as Icons from './Icons';

const ThemeSelector: React.FC = () => {
  const { theme, setCurrentTheme, availableThemes } = useTheme();

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-slate-200">Theme</h3>
      <div className="grid grid-cols-2 gap-4">
        {availableThemes.map(({ key, name }) => (
          <button
            key={key}
            onClick={() => setCurrentTheme(key as ThemeKey)}
            className={`p-4 rounded-lg text-left transition-all duration-300 ${theme === key ? 'ring-2 ring-accent-500 bg-accent-500/30' : 'bg-white/5 hover:bg-white/10'}`}
          >
            <span className="font-semibold">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const StreamingPreferences: React.FC = () => {
    const { availableProviders, toggleProvider, isProviderSelected } = useStreamingPreferences();
    
    return (
        <div>
            <h3 className="text-lg font-bold mb-1 text-slate-200">Streaming Preferences</h3>
            <p className="text-sm text-slate-400 mb-4">Select your favorites to personalize recommendations.</p>
            <div className="grid grid-cols-3 gap-4">
                {availableProviders.map(provider => {
                    const isSelected = isProviderSelected(provider.id);
                    return (
                        <button
                            key={provider.id}
                            onClick={() => toggleProvider(provider.id)}
                            className={`flex flex-col items-center justify-center p-2 aspect-square rounded-2xl transition-all duration-300 transform hover:-translate-y-1
                                ${isSelected ? 'bg-white/20 ring-2 ring-white' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                            <img src={provider.imageUrl} alt={`${provider.name} logo`} className="w-10 h-10 mb-2 rounded-md object-cover" />
                            <span className="text-xs font-semibold text-center">{provider.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const VoicePreferences: React.FC = () => {
    const { voice, setVoicePreference, language, setLanguagePreference, availableVoices, availableLanguages } = useVoicePreferences();

    return (
        <div>
            <h3 className="text-lg font-bold mb-3 text-slate-200">AI Voice Settings</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
                    <div className="flex gap-2">
                        {availableLanguages.map(({ key, name }) => (
                            <button
                                key={key}
                                onClick={() => setLanguagePreference(key as LanguageKey)}
                                className={`flex-1 p-2 rounded-lg text-sm transition-all duration-300 ${language === key ? 'ring-1 ring-accent-500 bg-accent-500/30' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Voice</label>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableVoices.map(({ key, name }) => (
                            <button
                                key={key}
                                onClick={() => setVoicePreference(key as VoiceKey)}
                                className={`p-3 rounded-lg text-sm text-center transition-all duration-300 ${voice === key ? 'ring-1 ring-accent-500 bg-accent-500/30' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RegionSettings: React.FC = () => {
    const { country, setCountryPreference, availableCountries } = useGeolocation();

    return (
        <div>
            <h3 className="text-lg font-bold mb-3 text-slate-200">Region</h3>
            <p className="text-sm text-slate-400 mb-4">Streaming provider availability will be based on your selected region.</p>
            <div className="relative">
                 <select
                    value={country.code}
                    onChange={(e) => setCountryPreference(e.target.value)}
                    className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-lg appearance-none focus:ring-2 focus:ring-accent-500 focus:outline-none"
                >
                    {availableCountries.map(c => (
                        <option key={c.code} value={c.code} className="bg-primary text-white">
                            {c.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                     <Icons.ChevronDownIcon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};


const Settings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md m-4 glass-panel p-6 rounded-3xl shadow-2xl animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <Icons.XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-8">
                    <RegionSettings />
                    <StreamingPreferences />
                    <VoicePreferences />
                    <ThemeSelector />
                </div>
            </div>
        </div>
    );
};

export default Settings;