import React, { useState, useEffect } from 'react';
import { useTheme, ThemeKey } from '../hooks/useTheme';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useVoicePreferences, VoiceKey, LanguageKey } from '../hooks/useVoicePreferences';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../contexts/AuthContext';
import * as Icons from './Icons';

type SettingsPage = 'main' | 'region' | 'streaming' | 'voice' | 'theme';

// --- Sub-Components for each setting page ---

const ThemeSelector: React.FC = () => {
  const { theme, setCurrentTheme, availableThemes } = useTheme();
  const { updateUserSettings } = useAuth();

  const handleThemeChange = async (themeKey: ThemeKey) => {
    setCurrentTheme(themeKey);
    try {
      await updateUserSettings({
        theme_preferences: { theme: themeKey }
      });
    } catch (error) {
      console.error('Failed to sync theme preference:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {availableThemes.map(({ key, name }) => (
        <button
          key={key}
          onClick={() => handleThemeChange(key as ThemeKey)}
          className={`p-4 rounded-lg text-left transition-all duration-300 ${theme === key ? 'ring-2 ring-accent-500 bg-accent-500/30' : 'bg-white/5 hover:bg-white/10'}`}
        >
          <span className="font-semibold">{name}</span>
        </button>
      ))}
    </div>
  );
};

const StreamingPreferences: React.FC = () => {
    const { availableProviders, toggleProvider, isProviderSelected } = useStreamingPreferences();
    return (
        <div>
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
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Voice</label>
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
    );
};

const RegionSettings: React.FC = () => {
    const { country, setCountryPreference, availableCountries } = useGeolocation();
    return (
        <div>
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

const SettingsNavItem: React.FC<{icon: React.ReactNode, title: string, subtitle: string, onClick: () => void}> = ({ icon, title, subtitle, onClick }) => (
    <button onClick={onClick} className="settings-nav-item">
        {icon}
        <div className="text-left">
            <p className="font-semibold text-slate-100">{title}</p>
            <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <Icons.ChevronRightIcon className="w-5 h-5 text-slate-500 ml-auto flex-shrink-0" />
    </button>
);

const MainSettingsPage: React.FC<{ onNavigate: (page: SettingsPage) => void }> = ({ onNavigate }) => (
    <div className="space-y-4">
        <SettingsNavItem 
            icon={<div className="settings-nav-icon-wrapper bg-sky-500/20"><Icons.GlobeIcon className="w-6 h-6 text-sky-400"/></div>}
            title="Region"
            subtitle="Set your country for content"
            onClick={() => onNavigate('region')}
        />
        <SettingsNavItem 
            icon={<div className="settings-nav-icon-wrapper bg-green-500/20"><Icons.TVIcon className="w-6 h-6 text-green-400"/></div>}
            title="Streaming"
            subtitle="Personalize your services"
            onClick={() => onNavigate('streaming')}
        />
        <SettingsNavItem 
            icon={<div className="settings-nav-icon-wrapper bg-violet-500/20"><Icons.MicrophoneIcon className="w-6 h-6 text-violet-400"/></div>}
            title="AI Voice"
            subtitle="Customize language and voice"
            onClick={() => onNavigate('voice')}
        />
        <SettingsNavItem 
            icon={<div className="settings-nav-icon-wrapper bg-amber-500/20"><Icons.PaletteIcon className="w-6 h-6 text-amber-400"/></div>}
            title="Theme"
            subtitle="Change the app's appearance"
            onClick={() => onNavigate('theme')}
        />
    </div>
);


const Settings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [page, setPage] = useState<SettingsPage>('main');
    const { syncLoading, syncData } = useAuth();

    const pageTitles: Record<SettingsPage, string> = {
        main: 'Settings',
        region: 'Region',
        streaming: 'Streaming',
        voice: 'AI Voice',
        theme: 'Theme',
    };

    const renderContent = () => {
        switch(page) {
            case 'region': return <RegionSettings />;
            case 'streaming': return <StreamingPreferences />;
            case 'voice': return <VoicePreferences />;
            case 'theme': return <ThemeSelector />;
            default: return <MainSettingsPage onNavigate={setPage} />;
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md m-4 glass-panel p-6 rounded-3xl shadow-2xl animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Dynamic Header */}
                <div className="flex justify-between items-center mb-6 relative h-8">
                    {page !== 'main' && (
                        <button onClick={() => setPage('main')} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-300 hover:text-white transition-colors">
                            <Icons.ChevronLeftIcon className="w-6 h-6" />
                            <span className="font-semibold">Back</span>
                        </button>
                    )}
                    <h2 className="text-2xl font-bold absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                        {pageTitles[page]}
                    </h2>
                    {page === 'main' && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {syncLoading && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <div className="w-3 h-3 border border-slate-500 rounded-full animate-spin border-t-transparent"></div>
                                    <span>Syncing</span>
                                </div>
                            )}
                            <button onClick={onClose} className="text-slate-400 hover:text-white">
                                <Icons.XIcon className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="settings-page-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
