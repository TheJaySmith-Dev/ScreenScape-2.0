import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MediaItem, Movie, MovieDetails, TVShowDetails, WatchProvider, WatchProviderCountry } from '../types';
import { getMovieDetails as getTMDbMovieDetails, getTVShowDetails as getTMDbTVShowDetails, getMovieCredits } from '../services/tmdbService';
import { getMovieRecommendations } from '../services/tmdbService';
import { getMovieVideos, getTVShowVideos, getMovieWatchProviders, getTVShowWatchProviders } from '../services/tmdbService';
import { getOMDbFromTMDBDetails, OMDbMovieDetails } from '../services/omdbService';
import { generateFactsAI } from './openrouter.js';
import { generateStoryScapeSummary } from './storyscape.js';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import VideoPlayer from './VideoPlayer';
import { isMobileDevice } from '../utils/deviceDetection';
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
        const [isMuted, setIsMuted] = useState(isMobileDevice());
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const [isStoryScapeLoading, setIsStoryScapeLoading] = useState(false);
    const [storyScapeError, setStoryScapeError] = useState<string | null>(null);

    const [factsAI, setFactsAI] = useState<string | null>(null);
    const [isFactsAILoading, setIsFactsAILoading] = useState(false);
    const [factsAIError, setFactsAIError] = useState<string | null>(null);

    const [omdbData, setOmdbData] = useState<OMDbMovieDetails | null>(null);
    const [isOmdbLoading, setIsOmdbLoading] = useState(false);

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
                // Fetch from TMDb
                let fetchedDetails = await (item.media_type === 'movie'
                    ? getTMDbMovieDetails(apiKey, item.id, country.code)
                    : getTMDbTVShowDetails(apiKey, item.id));

                // Fetch cast from TMDb
                if (item.media_type === 'movie') {
                    const credits = await getMovieCredits(apiKey, item.id);
                    fetchedDetails.credits = credits;
                }

                // Fetch watch providers from TMDb
                const providers = item.media_type === 'movie'
                    ? await getMovieWatchProviders(apiKey, item.id, country.code)
                    : await getTVShowWatchProviders(apiKey, item.id, country.code);

                // Fetch videos/trailers from TMDb
                try {
                    const videos = item.media_type === 'movie'
                        ? await getMovieVideos(apiKey, item.id)
                        : await getTVShowVideos(apiKey, item.id);
                    (fetchedDetails as any).videos = videos;
                    (fetchedDetails as any)['watch/providers'] = providers;
                } catch (videoError) {
                    console.warn('Trailer data not available, trailers will not be shown:', videoError);
                    (fetchedDetails as any).videos = { results: [] };
                    (fetchedDetails as any)['watch/providers'] = providers;
                }

                if (!isMounted) return;
                setDetails(fetchedDetails as any);

                if (item.media_type === 'movie') {
                    const recs = await getMovieRecommendations(apiKey, item.id);
                    if (isMounted) setRecommendations(recs.results.map(r => ({...r, media_type: 'movie'})));

                    // Fetch OMDb data for extended movie information
                    setIsOmdbLoading(true);
                    try {
                        const omdbInfo = await getOMDbFromTMDBDetails(fetchedDetails);
                        if (isMounted && omdbInfo) {
                            setOmdbData(omdbInfo);
                        }
                    } catch (omdbError) {
                        console.warn('OMDb data not available:', omdbError);
                    } finally {
                        if (isMounted) setIsOmdbLoading(false);
                    }
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

    const handleGenerateFactsAI = async () => {
        if (!details) return;
        setIsFactsAILoading(true);
        setFactsAIError(null);
        setFactsAI(null);
        try {
            const facts = await generateFactsAI(
                'title' in details ? details.title : details.name,
                details.overview
            );
            setFactsAI(facts);
        } catch (err) {
            if (err instanceof Error) {
                setFactsAIError(err.message);
            } else {
                setFactsAIError("FactsAI is still processing this title. Try again in a moment.");
            }
        } finally {
            setIsFactsAILoading(false);
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

    const shouldRenderTrailer = Boolean(mainTrailerKey) && !prefersReducedMotion;

    return (
        <div className="fixed inset-0 bg-primary z-50 overflow-y-auto animate-fade-in scrollbar-thin scrollbar-thumb-zinc-700">
            <button onClick={onClose} className="fixed top-6 right-6 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors">
                <Icons.XIcon className="w-6 h-6" />
            </button>

            <div className="trailer-container">
                {shouldRenderTrailer ? (
                    <VideoPlayer videoKey={mainTrailerKey} isMuted={isMuted} onEnd={() => {}} loop={!prefersReducedMotion} />
                ) : (
                    details.backdrop_path && (
                        <img src={`${IMAGE_BASE_URL}original${details.backdrop_path}`} alt={`${title} backdrop`} className="w-full h-full object-cover"/>
                    )
                )}

                {shouldRenderTrailer && (
                    <button
                        onClick={() => setIsMuted(prev => !prev)}
                        className="mute-toggle"
                        aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                    >
                        {isMuted ? <Icons.VolumeOffIcon className="w-6 h-6" /> : <Icons.VolumeUpIcon className="w-6 h-6" />}
                    </button>
                )}

                {shouldRenderTrailer && (
                    <div className="trailer-logo-overlay">
                        {details.images?.logos && details.images.logos.length > 0 && (
                            <div className="logo-background"></div>
                        )}
                        {details.images?.logos && details.images.logos.length > 0 && (
                            <img
                                src={`${IMAGE_BASE_URL}w500${details.images.logos.find(logo => logo.iso_639_1 === 'en' || !logo.iso_639_1)!.file_path}`}
                                alt={`${title} logo`}
                                className="trailer-logo"
                            />
                        )}
                    </div>
                )}
            </div>

            <div className="trailer-gradient" />

            <div className="title-glass-panel">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                    <div className="w-full text-center md:text-left space-y-3">
                        {shouldRenderTrailer ? (
                            <div className="video-title-overlay">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{title}</h1>
                            </div>
                        ) : (
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{title}</h1>
                        )}
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

                <div className="text-center mt-8">
                    {!factsAI && !isFactsAILoading && !factsAIError && (
                        <button onClick={handleGenerateFactsAI} className="factsai-generate-button">
                            <Icons.SparklesIcon className="w-5 h-5" /> Generate FactsAI
                        </button>
                    )}
                    {isFactsAILoading && (
                        <div className="factsai-loading">
                            <div className="shimmer" />
                        </div>
                    )}
                    {factsAIError && <p className="factsai-error">{factsAIError}</p>}
                </div>

                {factsAI && (
                     <section className="my-8 sm:my-12 glass-panel p-4 sm:p-6 rounded-xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-400"><Icons.SparklesIcon className="w-6 h-6"/> FactsAI</h2>
                        <div className="text-slate-900">
                            <ul className="space-y-2">
                                {factsAI.split('\n').filter(line => line.trim()).map((line, index) => {
                                    const fact = line.trim();
                                    const boldText = fact.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                    return (
                                        <li key={index} className="ml-4" dangerouslySetInnerHTML={{ __html: `• ${boldText}` }} />
                                    );
                                })}
                            </ul>
                        </div>
                    </section>
                )}

                {/* Display OMDb data when available */}
                {(omdbData && item.media_type === 'movie') && (
                    <section className="my-8 sm:my-12 glass-panel p-4 sm:p-6 rounded-xl animate-fade-in" style={{backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(11px)', WebkitBackdropFilter: 'blur(11px)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-black" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}} ><Icons.StarIcon className="w-6 h-6 text-slate-400"/> Additional Info</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {omdbData.Plot && omdbData.Plot !== details?.overview && (
                                <div>
                                    <h4 className="font-semibold mb-2" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Extended Plot</h4>
                                    <p className="leading-relaxed" style={{color: 'rgba(0,0,0,0.8)', fontSize: '0.875rem', fontWeight: '500', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>{omdbData.Plot}</p>
                                </div>
                            )}
                            {(omdbData.Rated || omdbData.Awards) && (
                                <div>
                                    <h4 className="font-semibold mb-2" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Ratings & Awards</h4>
                            <div className="space-y-1" style={{fontSize: '0.875rem'}}>
                                {omdbData.Rated && omdbData.Rated !== 'N/A' && (
                                    <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}><span className="font-medium" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Rating:</span> {omdbData.Rated}</p>
                                )}
                                {omdbData.Awards && omdbData.Awards !== 'N/A' && (
                                    <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}><span className="font-medium" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Awards:</span> {omdbData.Awards}</p>
                                )}
                            </div>
                                </div>
                            )}
                            {(omdbData.BoxOffice || omdbData.Production) && (
                                <div>
                                    <h4 className="font-semibold mb-2" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Box Office</h4>
                                    <div className="space-y-1" style={{fontSize: '0.875rem'}}>
                                        {omdbData.BoxOffice && omdbData.BoxOffice !== 'N/A' && (
                                            <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}><span className="font-medium" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Worldwide:</span> {omdbData.BoxOffice}</p>
                                        )}
                                        {omdbData.Production && omdbData.Production !== 'N/A' && (
                                            <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}><span className="font-medium" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Production:</span> {omdbData.Production}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {omdbData.imdbRating && omdbData.imdbRating !== 'N/A' && (
                                <div>
                                    <h4 className="font-semibold mb-2" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>IMDb Rating</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>⭐</span>
                                        <span className="text-xl font-bold" style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>{omdbData.imdbRating}</span>
                                        <span style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>/ 10</span>
                                        {omdbData.imdbVotes && omdbData.imdbVotes !== 'N/A' && (
                                            <span style={{color: 'rgba(0,0,0,0.8)', fontSize: '0.875rem', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>({omdbData.imdbVotes} votes)</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <WhereToWatch providers={providersForCountry} providerIds={providerIds} />

                {/* Attribution */}
                <div className="my-8 sm:my-12 text-center">
                    <div className="flex justify-center items-center gap-4 flex-wrap">
                        <div>
                            <p className="text-sm text-slate-400 mb-2">• Powered by The Movie Database (TMDB)</p>
                            <a
                                href="https://www.themoviedb.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1.svg"
                                    alt="TMDB Logo"
                                    className="h-8"
                                />
                            </a>
                        </div>
                        {omdbData && item.media_type === 'movie' && (
                            <div>
                                <p className="text-sm text-slate-400 mb-2">& The Open Movie Database (OMDb)</p>
                                <a
                                    href="https://www.omdbapi.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block hover:opacity-80 transition-opacity text-blue-400 text-xs"
                                >
                                    OMDb API
                                </a>
                            </div>
                        )}
                    </div>
                </div>

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
