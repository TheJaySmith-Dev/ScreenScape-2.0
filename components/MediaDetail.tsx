import React, { useState, useEffect } from 'react';
import { MediaItem, MovieDetails, TVShowDetails, Video, CastMember, WatchProvider, Genre, TVShow } from '../types';
import { getMovieDetails, getTVShowDetails } from '../services/tmdbService';
import { useCountdown } from '../hooks/useCountdown';
import { availableProviders } from '../hooks/useStreamingPreferences';
import VideoPlayer from './VideoPlayer';
import Loader from './Loader';
import { XIcon, ClockIcon, StarIcon, VolumeOffIcon, VolumeUpIcon } from './Icons';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface MediaDetailProps {
    apiKey: string;
    item: MediaItem;
    onClose: () => void;
    onInvalidApiKey: () => void;
}

// Map provider names to glow CSS classes for styling
const providerGlowMap: { [key: string]: string } = {
    'Netflix': 'brand-glow-netflix',
    'Disney+': 'brand-glow-disneyplus',
    'Amazon Prime Video': 'brand-glow-primevideo',
    'Prime Video': 'brand-glow-primevideo',
    'Max': 'brand-glow-max',
    'Apple TV+': 'brand-glow-appletvplus',
    'Hulu': 'brand-glow-hulu',
};

// Map provider IDs to our custom, high-quality logo URLs
const providerLogoMap = new Map<number, string>(
  availableProviders.map(p => [p.id, p.imageUrl])
);

const MediaDetail: React.FC<MediaDetailProps> = ({ apiKey, item, onClose, onInvalidApiKey }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setDetails(null);
            try {
                const fetchedDetails = item.media_type === 'movie'
                    ? await getMovieDetails(apiKey, item.id)
                    : await getTVShowDetails(apiKey, item.id);
                setDetails(fetchedDetails);

                const officialTrailer = fetchedDetails.videos?.results.find(v => v.type === 'Trailer' && v.official);
                const anyTrailer = fetchedDetails.videos?.results.find(v => v.type === 'Trailer');
                setTrailerKey(officialTrailer?.key || anyTrailer?.key || null);
            } catch (error) {
                console.error("Failed to fetch details:", error);
                if (error instanceof Error && error.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            }
        };

        fetchDetails();
    }, [apiKey, item, onInvalidApiKey]);

    // Add event listener for voice commands
    useEffect(() => {
        const handleTrailerControl = (event: Event) => {
            const detail = (event as CustomEvent<{ action: 'mute' | 'unmute' }>).detail;
            if (detail.action === 'mute') {
                setIsMuted(true);
            } else if (detail.action === 'unmute') {
                setIsMuted(false);
            }
        };

        window.addEventListener('controlTrailerAudio', handleTrailerControl);
        return () => {
            window.removeEventListener('controlTrailerAudio', handleTrailerControl);
        };
    }, []);

    // Safely access title and release_date from MediaItem union type, providing fallbacks.
    const title = details ? ('title' in details ? details.title : details.name) : (item.media_type === 'movie' ? item.title : item.name);
    const releaseDate = details ? ('release_date' in details ? details.release_date : details.first_air_date) : (item.media_type === 'movie' ? item.release_date : item.first_air_date);
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const runtime = details ? ('runtime' in details ? details.runtime : (details.episode_run_time?.[0] || null)) : null;

    // --- Streaming Availability Logic ---
    const userCountry = 'US'; 

    let providers: WatchProvider[] = [];
    let providerLink: string | undefined = undefined;

    if (details) {
        const countryData = details['watch/providers']?.results?.[userCountry];
        providerLink = countryData?.link;
        providers = countryData?.flatrate || [];
    }
    
    const isUpcoming = releaseDate ? new Date(releaseDate) > new Date() : false;
    const { days, hours, minutes, seconds } = useCountdown(releaseDate);
    
    return (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-3xl z-50 overflow-y-auto animate-fade-in scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent">
            <button onClick={onClose} className="fixed top-6 right-6 z-[60] text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors">
                <XIcon className="w-6 h-6" />
            </button>

            {!details ? (
                <div className="flex items-center justify-center h-screen"><Loader /></div>
            ) : (
                <div className="w-full">
                    {/* Hero Section */}
                    <div className="relative h-[60vh] w-full text-white">
                        {trailerKey ? (
                            <>
                                <div className="absolute inset-0">
                                    <VideoPlayer videoKey={trailerKey} isMuted={isMuted} loop />
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
                                </div>
                                <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-4 right-4 z-20 glass-button rounded-full w-12 h-12 flex items-center justify-center">
                                    {isMuted ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6 animate-pulse" />}
                                </button>
                            </>
                        ) : (
                            details.backdrop_path && (
                                <div className="absolute inset-0">
                                    <img src={`${IMAGE_BASE_URL}original${details.backdrop_path}`} alt={title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
                                </div>
                            )
                        )}
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 z-10 w-full md:w-2/3">
                            <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">{title}</h1>
                            <div className="flex items-center gap-4 mt-4 text-slate-300 text-lg">
                                <span>{year}</span>
                                {runtime && <><span>&bull;</span><span>{runtime} min</span></>}
                                <div className="flex items-center gap-1">
                                    <StarIcon className="w-5 h-5 text-yellow-400" isActive />
                                    <span>{details.vote_average.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="container mx-auto p-8 md:p-12 -mt-16 relative z-20 space-y-12">
                         {isUpcoming ? (
                            <div className="glass-panel p-8 rounded-2xl text-center">
                                <h2 className="text-3xl font-bold text-accent-500 mb-4">Coming Soon</h2>
                                <div className="flex justify-center gap-4 md:gap-8 text-white">
                                    <div className="text-center"><div className="text-4xl font-bold">{String(days).padStart(2, '0')}</div><div className="text-sm text-slate-400">Days</div></div>
                                    <div className="text-center"><div className="text-4xl font-bold">{String(hours).padStart(2, '0')}</div><div className="text-sm text-slate-400">Hours</div></div>
                                    <div className="text-center"><div className="text-4xl font-bold">{String(minutes).padStart(2, '0')}</div><div className="text-sm text-slate-400">Minutes</div></div>
                                    <div className="text-center"><div className="text-4xl font-bold">{String(seconds).padStart(2, '0')}</div><div className="text-sm text-slate-400">Seconds</div></div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2">
                                    <p className="text-slate-300 leading-relaxed text-lg">{details.overview}</p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {details.genres.map((genre: Genre) => <span key={genre.id} className="glass-button text-sm px-4 py-1.5 rounded-full">{genre.name}</span>)}
                                    </div>
                                </div>
                                {providers.length > 0 && (
                                    <div className="lg:col-span-1">
                                        <h3 className="text-xl font-bold mb-4">Available on</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {providers.slice(0, 5).map((p: WatchProvider) => {
                                                const glowClass = providerGlowMap[p.provider_name] || '';
                                                const logoUrl = providerLogoMap.get(p.provider_id) || `${IMAGE_BASE_URL}w92${p.logo_path}`;
                                                return (
                                                    <a href={providerLink} target="_blank" rel="noopener noreferrer" key={p.provider_id} title={`Watch on ${p.provider_name}`}>
                                                        <img 
                                                            src={logoUrl} 
                                                            alt={p.provider_name} 
                                                            className={`w-16 h-16 rounded-2xl object-cover bg-black/20 p-1 transform hover:scale-110 transition-all duration-300 ${glowClass}`} 
                                                        />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Cast Section */}
                        {details.credits.cast && details.credits.cast.length > 0 && (
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Main Cast</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {details.credits.cast.slice(0, 12).map((member: CastMember) => (
                                        <div key={member.id} className="text-center">
                                            <img src={member.profile_path ? `${IMAGE_BASE_URL}w185${member.profile_path}` : 'https://via.placeholder.com/185x278?text=N/A'} alt={member.name} className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg mb-2" />
                                            <p className="font-bold">{member.name}</p>
                                            <p className="text-sm text-slate-400">{member.character}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaDetail;