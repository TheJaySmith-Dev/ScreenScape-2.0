import React, { useState, useEffect, useCallback } from 'react';
import { MediaItem, MovieDetails, TVShowDetails, Video, CastMember, WatchProvider, Movie } from '../types';
import { getMovieDetails, getTVShowDetails, getMovieRecommendations } from '../services/tmdbService';
import { XIcon, StarIcon, ClockIcon, VolumeOffIcon, VolumeUpIcon } from './Icons';
import { useGeolocation } from '../hooks/useGeolocation';
import MediaRow from './MediaRow';
import Loader from './Loader';
import VideoPlayer from './VideoPlayer';
import { useSpotify } from '../contexts/SpotifyContext';
import SpotifySoundtrack from './SpotifySoundtrack';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface MediaDetailProps {
    item: MediaItem;
    apiKey: string;
    onClose: () => void;
    onSelectItem: (item: MediaItem) => void;
}

const ProviderList: React.FC<{title: string, providers?: WatchProvider[]}> = ({title, providers}) => {
    if (!providers || providers.length === 0) return null;
    return (
        <div>
            <h4 className="text-slate-400 font-semibold text-sm">{title}</h4>
            <div className="flex flex-wrap gap-2 mt-1">
                {providers.map(p => (
                    <img key={p.provider_id} src={`${IMAGE_BASE_URL}w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-md" title={p.provider_name}/>
                ))}
            </div>
        </div>
    );
};


const MediaDetail: React.FC<MediaDetailProps> = ({ item, apiKey, onClose, onSelectItem }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(() => sessionStorage.getItem('trailerMuted') !== 'false');
    const [recommendations, setRecommendations] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { country } = useGeolocation();
    const { isAuthenticated } = useSpotify();

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    const handleVideoEnd = useCallback(() => {
        // This can be used to replay the video or perform another action when the trailer finishes.
        // The key is that this function is stable and doesn't cause the VideoPlayer to re-render.
    }, []);
    
    const toggleMute = useCallback(() => {
        setIsMuted(prevMuted => {
            const newMutedState = !prevMuted;
            sessionStorage.setItem('trailerMuted', String(newMutedState));
            return newMutedState;
        });
    }, []);

    useEffect(() => {
        window.addEventListener('keyup', handleKeyUp);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keyup', handleKeyUp);
            document.body.style.overflow = 'auto';
        };
    }, [handleKeyUp]);

    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            setIsLoading(true);
            setTrailerKey(null); // Reset trailer key on item change
            try {
                const fetchedDetails = item.media_type === 'movie'
                    ? await getMovieDetails(apiKey, item.id, country.code)
                    : await getTVShowDetails(apiKey, item.id, country.code);
                
                const officialTrailer = fetchedDetails.videos?.results.find((v: Video) => v.type === 'Trailer' && v.official && v.site === 'YouTube');
                const anyTrailer = fetchedDetails.videos?.results.find((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');
                const newTrailerKey = officialTrailer?.key || anyTrailer?.key || null;

                let recs: Movie[] = [];
                if (item.media_type === 'movie') {
                    const recsResponse = await getMovieRecommendations(apiKey, item.id);
                    recs = recsResponse.results;
                }
                
                if (isMounted) {
                    setDetails(fetchedDetails);
                    setTrailerKey(newTrailerKey);
                    setRecommendations(recs);
                }

            } catch (error) {
                console.error("Failed to fetch media details:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchDetails();
        document.querySelector('.media-detail-scroller')?.scrollTo(0,0);
        
        return () => {
            isMounted = false;
        };
    }, [item, apiKey, country.code]);
    
    const title = details ? ('title' in details ? details.title : details.name) : ('title' in item ? item.title : item.name);
    const releaseYear = details ? new Date('release_date' in details && details.release_date ? details.release_date : ('first_air_date' in details ? details.first_air_date : '')).getFullYear() : '';
    
    const regionalProviders = details && 'watch/providers' in details ? details['watch/providers']?.results?.[country.code] : null;

    return (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-2xl z-50 overflow-y-auto animate-fade-in media-detail-scroller">
            <button onClick={onClose} className="fixed top-6 right-6 z-[60] text-white/70 hover:text-white transition-colors bg-black/30 rounded-full p-2">
                <XIcon className="w-6 h-6" />
            </button>

            {isLoading ? (
                <div className="flex justify-center items-center h-screen"><Loader /></div>
            ) : details && (
                <div>
                    <div className="relative h-[50vh] md:h-[60vh] bg-primary">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent z-10" />
                        
                        {trailerKey ? (
                            <div className="absolute inset-0 scale-125 opacity-80">
                                <VideoPlayer videoKey={trailerKey} isMuted={isMuted} onEnd={handleVideoEnd} />
                            </div>
                        ) : details.backdrop_path && (
                             <img 
                                src={`${IMAGE_BASE_URL}original${details.backdrop_path}`} 
                                alt={`${title} backdrop`}
                                className="w-full h-full object-cover opacity-80"
                            />
                        )}

                        <div className="absolute bottom-0 left-0 w-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-end justify-between pb-8 z-20">
                             <div className="flex items-end">
                                <div className="w-36 md:w-48 h-54 md:h-72 flex-shrink-0 mr-4 md:mr-8 rounded-xl overflow-hidden shadow-2xl hidden sm:block bg-glass">
                                    {details.poster_path && <img src={`${IMAGE_BASE_URL}w500${details.poster_path}`} alt={`${title} poster`} className="w-full h-full object-cover"/>}
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-bold">{title}</h1>
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-300">
                                        <span>{releaseYear || 'N/A'}</span>
                                        <div className="flex items-center gap-1.5">
                                            <StarIcon className="w-5 h-5 text-yellow-400" isActive />
                                            <span className="font-semibold">{details.vote_average.toFixed(1)}</span>
                                        </div>
                                        { 'runtime' in details && details.runtime ? (
                                            <div className="flex items-center gap-1.5">
                                                <ClockIcon className="w-5 h-5" />
                                                <span>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
                                            </div>
                                        ) : 'episode_run_time' in details && details.episode_run_time?.[0] ? (
                                            <div className="flex items-center gap-1.5">
                                                <ClockIcon className="w-5 h-5" />
                                                <span>{details.episode_run_time[0]}m / ep</span>
                                            </div>
                                        ) : null }
                                    </div>
                                </div>
                            </div>
                            {trailerKey && (
                                <button
                                    onClick={toggleMute}
                                    className="glass-button rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
                                >
                                    {isMuted ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                        <div className="lg:col-span-2">
                             <h2 className="text-2xl font-bold mb-3">Overview</h2>
                            <p className="text-slate-300 leading-relaxed">{details.overview}</p>

                            <h2 className="text-2xl font-bold mt-8 mb-4">Top Billed Cast</h2>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                {details.credits.cast.slice(0, 10).map((member: CastMember) => (
                                    <div key={member.id} className="text-center w-28 flex-shrink-0">
                                        <div className="w-24 h-32 mx-auto rounded-lg overflow-hidden bg-glass">
                                            {member.profile_path ? <img src={`${IMAGE_BASE_URL}w185${member.profile_path}`} alt={member.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><XIcon className="w-8 h-8"/></div>}
                                        </div>
                                        <p className="text-sm font-semibold mt-2 leading-tight">{member.name}</p>
                                        <p className="text-xs text-slate-400">{member.character}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {(regionalProviders?.flatrate || regionalProviders?.buy || regionalProviders?.rent) ? (
                                <div>
                                    <h3 className="text-xl font-bold mb-3">Where to Watch ({country.code})</h3>
                                    <div className="space-y-3">
                                        <ProviderList title="Stream" providers={regionalProviders?.flatrate} />
                                        <ProviderList title="Buy" providers={regionalProviders?.buy} />
                                        <ProviderList title="Rent" providers={regionalProviders?.rent} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold mb-3">Where to Watch</h3>
                                    <p className="text-slate-400 text-sm">Not available for streaming in your selected region.</p>
                                </div>
                            )}
                            {isAuthenticated && <SpotifySoundtrack mediaTitle={title} />}
                             {details.genres.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold mb-3">Genres</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {details.genres.map(genre => <span key={genre.id} className="bg-glass px-3 py-1 rounded-full text-sm">{genre.name}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {recommendations.length > 0 && (
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-glass-edge">
                            <MediaRow title="More Like This" items={recommendations} onSelectItem={onSelectItem} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaDetail;
