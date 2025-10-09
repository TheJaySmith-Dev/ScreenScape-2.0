import React from 'react';
import { useStreamingPreferences, availableProviders } from '../hooks/useStreamingPreferences';

interface StreamingHubsProps {
    activeHub: number | null;
    setActiveHub: (id: number | null) => void;
}

const providerGlowMap: { [key: string]: string } = {
    'Netflix': 'brand-glow-netflix',
    'Disney+': 'brand-glow-disneyplus',
    'Prime Video': 'brand-glow-primevideo',
    'Max': 'brand-glow-max',
    'Apple TV+': 'brand-glow-appletvplus',
    'Hulu': 'brand-glow-hulu',
};

const StreamingHubs: React.FC<StreamingHubsProps> = ({ activeHub, setActiveHub }) => {
    const { providerIds } = useStreamingPreferences();
    const selectedProviders = availableProviders.filter(p => providerIds.has(p.id));

    if (selectedProviders.length === 0) {
        return null;
    }

    const handleHubClick = (id: number) => {
        setActiveHub(activeHub === id ? null : id);
    };

    const handleShowAll = () => {
        setActiveHub(null);
    };

    return (
        <div className="mb-6 animate-fade-in-up">
            <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold whitespace-nowrap">My Hubs</h3>
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
                            onClick={() => handleHubClick(provider.id)}
                            title={`Filter by ${provider.name}`}
                            className={`w-12 h-12 flex items-center justify-center p-1 rounded-xl transition-all duration-300 transform hover:-translate-y-1 ${
                                activeHub === provider.id ? 'ring-2 ring-white bg-white/20' : 'bg-glass'
                            } ${glowClass}`}
                        >
                           <img src={provider.imageUrl} alt={`${provider.name} logo`} className="w-full h-full object-cover rounded-md" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StreamingHubs;