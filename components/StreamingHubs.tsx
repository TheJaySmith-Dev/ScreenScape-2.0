import React from 'react';
import { useStreamingPreferences, availableProviders } from '../hooks/useStreamingPreferences';

interface StreamingHubsProps {
    activeHub: number | null;
    setActiveHub: (id: number | null) => void;
    onHoverProvider?: (name: string | null) => void;
    onNavigateProvider?: (id: number, name: string) => void;
    title?: string;
}

const providerGlowMap: { [key: string]: string } = {
    'Netflix': 'brand-glow-netflix',
    'Disney+': 'brand-glow-disneyplus',
    'Prime Video': 'brand-glow-primevideo',
    'Max': 'brand-glow-max',
    'Apple TV+': 'brand-glow-appletvplus',
    'Hulu': 'brand-glow-hulu',
};

const StreamingHubs: React.FC<StreamingHubsProps> = ({ activeHub, setActiveHub, onHoverProvider, onNavigateProvider, title = 'My Hubs' }) => {
    const { providerIds } = useStreamingPreferences();
    const selectedProviders = availableProviders.filter(p => providerIds.has(p.id));

    if (selectedProviders.length === 0) {
        return null;
    }

    const handleHubClick = (id: number, name: string) => {
        // Preserve existing local filtering behavior
        setActiveHub(activeHub === id ? null : id);
        // Also allow navigation to dedicated provider page
        if (onNavigateProvider) onNavigateProvider(id, name);
    };

    const handleShowAll = () => {
        setActiveHub(null);
    };

    return (
        <div className="mb-6 animate-fade-in-up">
            <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold whitespace-nowrap">{title}</h3>
                <div className="w-full h-px bg-glass-edge"></div>
            </div>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
                <button
                    onClick={handleShowAll}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                        activeHub === null
                            ? 'bg-white text-black'
                            : 'bg-glass hover:bg-white/10'
                    }`}
                >
                    All
                </button>

                {selectedProviders.map(provider => {
                    const glowClass = providerGlowMap[provider.name] || '';
                    return (
                        <button
                            key={provider.id}
                            onClick={() => handleHubClick(provider.id, provider.name)}
                            title={`Filter by ${provider.name}`}
                            className={`w-20 h-20 sm:w-16 sm:h-16 flex items-center justify-center p-1 rounded-full streaming-circle transition-transform duration-200 ease-out transform hover:-translate-y-1 hover:scale-105 ${
                                activeHub === provider.id ? 'ring-2 ring-white bg-white/20' : 'bg-glass'
                            } ${glowClass}`}
                            onMouseEnter={() => onHoverProvider && onHoverProvider(provider.name)}
                            onMouseLeave={() => onHoverProvider && onHoverProvider(null)}
                        >
                           <img src={provider.imageUrl} alt={`${provider.name} logo`} className="w-full h-full object-cover rounded-full" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StreamingHubs;
