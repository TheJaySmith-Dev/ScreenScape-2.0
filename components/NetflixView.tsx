import React, { useState, useEffect, useMemo } from 'react';
import { MediaItem, Movie, TVShow } from '../types';
import { ViewType } from '../App';
import { Game } from './GameView';
import HeroCarousel from './HeroCarousel';
import MediaRow from './MediaRow';
import { getPopularMovies, getPopularTVShows, getMoviesByProviders } from '../services/tmdbService';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import StreamingHubs from './StreamingHubs';

interface NetflixViewProps {
    apiKey: string;
    searchQuery: string;
    onInvalidApiKey: () => void;
    view: ViewType;
    onSelectItem: (item: MediaItem) => void;
    onSelectGame: (game: Game) => void;
}

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, onSelectItem, onInvalidApiKey }) => {
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [popularShows, setPopularShows] = useState<TVShow[]>([]);
    const [forYou, setForYou] = useState<Movie[]>([]);
    const { providerIds } = useStreamingPreferences();
    const [activeProviderHub, setActiveProviderHub] = useState<number | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [moviesRes, showsRes] = await Promise.all([
                    getPopularMovies(apiKey),
                    getPopularTVShows(apiKey)
                ]);
                setPopularMovies(moviesRes.results);
                setPopularShows(showsRes.results);
            } catch (error) {
                console.error(error);
                if (error instanceof Error && error.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            }
        };
        fetchData();
    }, [apiKey, onInvalidApiKey]);

    useEffect(() => {
        const fetchForYou = async () => {
            const providersToFetch = activeProviderHub ? [activeProviderHub] : Array.from(providerIds);
            if (providersToFetch.length > 0) {
                try {
                    const forYouRes = await getMoviesByProviders(apiKey, providersToFetch);
                    setForYou(forYouRes.results);
                } catch (error) {
                     console.error("Failed to fetch 'For You' recommendations:", error);
                }
            } else {
                setForYou([]); // Clear if no providers are selected
            }
        };
        fetchForYou();
    }, [apiKey, providerIds, activeProviderHub]);
    
    const rows = useMemo(() => [
        { title: "Popular Movies", items: popularMovies },
        { title: "Popular TV Shows", items: popularShows }
    ], [popularMovies, popularShows]);

    return (
        <div className="flex flex-col space-y-4 md:space-y-8">
            <HeroCarousel apiKey={apiKey} onSelectItem={onSelectItem} onInvalidApiKey={onInvalidApiKey} />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col space-y-8 -mt-24 md:-mt-32 relative z-10 pb-16">
                 {providerIds.size > 0 && (
                    <div>
                        <StreamingHubs 
                            activeHub={activeProviderHub}
                            setActiveHub={setActiveProviderHub}
                        />
                        <MediaRow title="For You" items={forYou} onSelectItem={onSelectItem} />
                    </div>
                )}
                 {rows.map((row, index) => (
                    <MediaRow key={index} title={row.title} items={row.items} onSelectItem={onSelectItem} />
                ))}
            </div>
        </div>
    );
};

export default NetflixView;