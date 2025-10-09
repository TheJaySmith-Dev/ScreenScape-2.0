import React from 'react';
import { useTheme, ThemeKey } from '../hooks/useTheme';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
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
                    <StreamingPreferences />
                    <ThemeSelector />
                </div>
            </div>
        </div>
    );
};

export default Settings;