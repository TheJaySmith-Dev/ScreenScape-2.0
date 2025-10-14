import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MediaItem, Movie, MovieDetails, TVShowDetails, WatchProvider, WatchProviderCountry } from '../types';
import { getMovieDetails, getTVShowDetails, getMovieRecommendations } from '../services/tmdbService';
import { generateStoryScapeSummary } from './storyscape.js';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import VideoPlayer from './VideoPlayer';
import Loader from './Loader';
import * as Icons from './Icons';
import {
    getAvailabilityBuckets,
    buildAvailabilityDescriptors,
    hasAvailability,
} from '../utils/streamingAvailability';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// --- Prop Types ---
interface MediaDetailProps {
    item: MediaItem;
    apiKey: string;
    onClose: () => void;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
}

interface WhereToWatchProps {
    providers: WatchProviderCountry | undefined;
    providerIds: Set<number>;
}

const WhereToWatch: React.FC<WhereToWatchProps> = ({ providers, providerIds }) => {
    const { stream, rent, buy, link } = useMemo<{
        stream: WatchProvider[];
        rent: WatchProvider[];
        buy: WatchProvider[];
        link: string | undefined;
    }>(() => {
        if (!providers) {
            return { stream: [], rent: [], buy: [], link: undefined };
        }

        const buckets = getAvailabilityBuckets(providers, providerIds);
        const normalizedLink = providers.link?.trim();

        return {
            stream: buckets.stream.filter(provider => provider?.logo_path),
            rent: buckets.rent.filter(provider => provider?.logo_path),
            buy: buckets.buy.filter(provider => provider?.logo_path),
            link: normalizedLink ? providers.link : undefined,
        };
    }, [providers, providerIds]);

    const hasStream = stream.length > 0;
    const hasRent = rent.length > 0;
    const hasBuy = buy.length > 0;

    if (!hasStream && !hasRent && !hasBuy) {
        return null;
    }

    const renderProviderLogo = (provider: WatchProvider) => {
        if (!provider.logo_path) {
            return null;
        }

        const logo = (
            <img
                src={`${IMAGE_BASE_URL}w92${provider.logo_path}`}
                alt={provider.provider_name}
                className="w-12 h-12 rounded-lg"
            />
        );

        if (!link) {
            return (
                <div
                    key={provider.provider_id}
                    className="transform hover:-translate-y-1 transition-transform"
                >
                    {logo}
                </div>
            );
        }

        return (
            <a
                key={provider.provider_id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="transform hover:-translate-y-1 transition-transform"
            >
                {logo}
            </a>
        );
    };

    return (
        <section className="my-8 sm:my-12">
            <h2 className="text-2xl font-bold mb-4">Where to Watch</h2>
            <div className="glass-panel p-4 sm:p-6 rounded-xl">
                {hasStream && (
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">STREAM</h3>
                        <div className="flex flex-wrap gap-3">
                            {stream.map(renderProviderLogo)}
                        </div>
                    </div>
                )}
                {hasRent && (
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">RENT</h3>
                        <div className="flex flex-wrap gap-3">
                            {rent.map(renderProviderLogo)}
                        </div>
                    </div>
                )}
                {hasBuy && (
                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">BUY</h3>
                        <div className="flex flex-wrap gap-3">
                            {buy.map(renderProviderLogo)}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};


// --- Main Component ---
const MediaDetail: React.FC<MediaDetailProps> = ({ item, apiKey, onClose, onSelectItem, onInvalidApiKey }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [storyScape, setStoryScape] = useState<{
        summary: string;
        tone: string;
        style: string;
        origin?: 'ai' | 'fallback';
        note?: string;
    } | null>(null);
    const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const [isStoryScapeLoading, setIsStoryScapeLoading] = useState(false);
    const [storyScapeError, setStoryScapeError] = useState<string | null>(null);

    const { country } = useGeolocation();
    const { providerIds } = useStreamingPreferences();

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const handleControlTrailerAudio = useCallback((event: Event) => {
        const customEvent = event as CustomEvent<{ action: 'mute' | 'unmute' }>;
        if (!customEvent.detail) return;
        setIsMuted(customEvent.detail.action === 'mute');
    }, []);

    useEffect(() => {
        window.addEventListener('controlTrailerAudio', handleControlTrailerAudio);
        return () => {
            window.removeEventListener('controlTrailerAudio', handleControlTrailerAudio);
        };
    }, [handleControlTrailerAudio]);

    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            setError(null);
            setStoryScape(null);
            setRecommendations([]);
            try {
                const fetchedDetails = item.media_type === 'movie'
                    ? await getMovieDetails(apiKey, item.id, country.code)
                    : await getTVShowDetails(apiKey, item.id, country.code);
                
                if (!isMounted) return;
                setDetails(fetchedDetails);

                if (item.media_type === 'movie') {
                    const recs = await getMovieRecommendations(apiKey, item.id);
                    if (isMounted) setRecommendations(recs.results.map(r => ({...r, media_type: 'movie'})));
                }

            } catch (err) {
                if (err instanceof Error) {
                    console.error("Failed to fetch media details:", err);
                    if (isMounted) {
                        if (err.message.includes("Invalid API Key")) {
                            onInvalidApiKey();
                        } else {
                            setError("Could not load details for this item.");
                        }
                    }
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchDetails();
        return () => { isMounted = false; };
    }, [item.id, item.media_type, apiKey, onInvalidApiKey, country.code]);
    
    const handleGenerateStoryScape = async () => {
        if (!details) return;
        setIsStoryScapeLoading(true);
        setStoryScapeError(null);
        setStoryScape(null);
        try {
            const summary = await generateStoryScapeSummary(
                'title' in details ? details.title : details.name,
                details.overview
            );
            setStoryScape(summary);
        } catch (err) {
            if (err instanceof Error) {
                setStoryScapeError(err.message);
            } else {
                setStoryScapeError("StoryScape is still processing this title. Try again in a moment.");
            }
        } finally {
            setIsStoryScapeLoading(false);
        }
    };
    
    const mainTrailerKey = useMemo(() => {
        if (!details?.videos?.results) return null;
        const officialTrailer = details.videos.results.find(v => v.type === 'Trailer' && v.official && v.site === 'YouTube');
        return officialTrailer?.key || details.videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer')?.key || null;
    }, [details]);

    const providersForCountry = useMemo(
        () => details?.['watch/providers']?.results?.[country.code],
        [details, country.code]
    );

    const availabilityBuckets = useMemo(
        () => getAvailabilityBuckets(providersForCountry, providerIds),
        [providersForCountry, providerIds]
    );

    const availabilityDescriptors = useMemo(
        () => buildAvailabilityDescriptors(availabilityBuckets, 4),
        [availabilityBuckets]
    );

    const hasStreamingAvailability = useMemo(
        () => hasAvailability(availabilityBuckets),
        [availabilityBuckets]
    );


    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-primary z-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="fixed inset-0 bg-primary z-50 flex flex-col items-center justify-center p-4">
                <p className="text-xl text-red-400 mb-4">{error || "Something went wrong."}</p>
                <button onClick={onClose} className="glass-button px-4 py-2 rounded-lg">Go Back</button>
            </div>
        );
    }
    
    const title = 'title' in details ? details.title : details.name;
    const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const runtimeInfo = 'runtime' in details && details.runtime ? `${details.runtime}m` : ('number_of_seasons' in details ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}` : '');

    return (
        <div className="fixed inset-0 bg-primary z-50 overflow-y-auto animate-fade-in scrollbar-thin scrollbar-thumb-zinc-700">
            <button onClick={onClose} className="fixed top-6 right-6 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors">
                <Icons.XIcon className="w-6 h-6" />
            </button>
            
            <div className="trailer-container">
                {mainTrailerKey ? (
                    <VideoPlayer videoKey={mainTrailerKey} isMuted={isMuted} onEnd={() => {}} loop={!prefersReducedMotion} />
                ) : (
                    details.backdrop_path && (
                        <img src={`${IMAGE_BASE_URL}original${details.backdrop_path}`} alt={`${title} backdrop`} className="w-full h-full object-cover"/>
                    )
                )}

                {mainTrailerKey && (
                    <button
                        onClick={() => setIsMuted(prev => !prev)}
                        className="mute-toggle"
                        aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                    >
                        {isMuted ? <Icons.VolumeOffIcon className="w-6 h-6" /> : <Icons.VolumeUpIcon className="w-6 h-6" />}
                    </button>
                )}
            </div>

            <div className="trailer-gradient" />

            <div className="title-glass-panel">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                    <img
                        src={details.poster_path ? `${IMAGE_BASE_URL}w500${details.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                        alt={title}
                        className="title-poster"
                    />
                    <div className="w-full text-center md:text-left space-y-3">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{title}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-2 text-slate-300">
                            <span>{year}</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block" />
                            <span>{details.genres?.map(g => g?.name).filter(Boolean).join(', ')}</span>
                            {runtimeInfo && <span className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block" />}
                            {runtimeInfo && <span>{runtimeInfo}</span>}
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <Icons.StarIcon className="w-5 h-5 text-yellow-400" isActive />
                            <span className="text-xl font-bold">{details.vote_average.toFixed(1)}</span>
                            <span className="text-sm text-slate-400">/ 10</span>
                        </div>
                        {hasStreamingAvailability && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs sm:text-sm text-slate-200">
                                {availabilityDescriptors.map(descriptor => (
                                    <span
                                        key={descriptor.type}
                                        className="bg-white/10 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm"
                                    >
                                        <span className="font-semibold text-white mr-1">{descriptor.type}:</span>
                                        {descriptor.text}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="mt-6 text-slate-200 leading-relaxed max-w-3xl mx-auto md:mx-0">
                    {details.overview}
                </p>

                <div className="text-center mt-8">
                    {!storyScape && !isStoryScapeLoading && !storyScapeError && (
                        <button onClick={handleGenerateStoryScape} className="storyscape-generate-button">
                            <Icons.SparklesIcon className="w-5 h-5" /> Generate StoryScape
                        </button>
                    )}
                    {isStoryScapeLoading && (
                        <div className="storyscape-loading">
                            <div className="shimmer" />
                        </div>
                    )}
                    {storyScapeError && <p className="storyscape-error">{storyScapeError}</p>}
                </div>

                {storyScape && (
                     <section className="my-8 sm:my-12 glass-panel p-4 sm:p-6 rounded-xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-400"><Icons.SparklesIcon className="w-6 h-6"/> StoryScape AI</h2>
                        <p className="text-slate-200 italic mb-4">"{storyScape.summary}"</p>
                        <div className="flex flex-col sm:flex-row gap-4 text-sm border-t border-glass-edge pt-4">
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-400 mb-1">EMOTIONAL TONE</h4>
                                <p>{storyScape.tone}</p>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-400 mb-1">CINEMATIC STYLE</h4>
                                <p>{storyScape.style}</p>
                            </div>
                        </div>
                        {storyScape.note && (
                            <p className="storyscape-notice mt-4">{storyScape.note}</p>
                        )}
                        {storyScape.origin === 'fallback' && !storyScape.note && (
                            <p className="text-xs text-slate-400 mt-4">StoryScape's live summary is unavailable, so this description was adapted from the synopsis.</p>
                        )}
                    </section>
                )}

                <WhereToWatch providers={providersForCountry} providerIds={providerIds} />

                {details.credits?.cast && details.credits.cast.length > 0 && (
                    <section className="my-8 sm:my-12">
                        <h2 className="text-2xl font-bold mb-4">Top Billed Cast</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-zinc-700">
                            {details.credits?.cast?.slice(0, 10).map(member => member && (
                                <div key={member.id} className="flex-shrink-0 w-32 text-center">
                                    <img
                                        src={member.profile_path ? `${IMAGE_BASE_URL}w185${member.profile_path}` : 'https://via.placeholder.com/185x278?text=N/A'}
                                        alt={member.name}
                                        className="w-full aspect-[2/3] object-cover rounded-lg bg-glass mb-2"
                                    />
                                    <p className="font-semibold text-sm">{member.name}</p>
                                    <p className="text-xs text-slate-400 line-clamp-2">{member.character}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {recommendations && recommendations.length > 0 && (
                    <section className="my-8 sm:my-12">
                        <h2 className="text-2xl font-bold mb-4">More Like This</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {recommendations.slice(0, 10).map(rec => (
                               <div key={rec.id} onClick={() => onSelectItem(rec)} className="group cursor-pointer">
                                   <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-glass transition-transform duration-300 group-hover:scale-105">
                                      <img src={rec.poster_path ? `${IMAGE_BASE_URL}w500${rec.poster_path}` : 'https://via.placeholder.com/500x750?text=N/A'} alt={'title' in rec ? rec.title : rec.name} className="w-full h-full object-cover"/>
                                   </div>
                               </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default MediaDetail;