import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItem, Movie, MovieDetails, TVShowDetails, WatchProvider, WatchProviderCountry } from '../types';
import { getMovieDetails as getTMDbMovieDetails, getTVShowDetails as getTMDbTVShowDetails, getMovieCredits } from '../services/tmdbService';
import { getMovieRecommendations } from '../services/tmdbService';
import { getMovieVideos, getTVShowVideos, getMovieWatchProviders, getTVShowWatchProviders } from '../services/tmdbService';
import { getOMDbFromTMDBDetails, OMDbMovieDetails } from '../services/omdbService';
import { generateFactsAI, generateReviewsAI } from './openrouter.js';
import { generateStoryScapeSummary } from './storyscape.js';
import { generatePersonalizedRecommendations } from '../services/recommendationService';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useAuth } from '../contexts/AuthContext';
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


// --- Styled Components ---
const Backdrop = styled.div<{ backdropPath: string }>`
    position: fixed;
    inset: 0;
    background-image: url('${props => `${IMAGE_BASE_URL}original${props.backdropPath}`}');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(20px);
    opacity: 0.6;
    z-index: 0;
`;

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
`;

const DetailContainer = styled.div`
    position: relative;
    z-index: 2;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: white;
`;

const HeaderSection = styled.div`
    padding: 2rem 1rem 0;
    background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.4) 50%,
        transparent 100%
    );
`;

const TabsContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 2rem;
    padding: 0 1rem;
`;

const TabButton = styled.button<{ active: boolean }>`
    padding: 0.5rem 1.5rem;
    margin: 0 0.25rem;
    border-radius: 24px 24px 0 0;
    background: ${props => props.active ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)'};
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    font-family: 'Inter', sans-serif;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 640px) {
        padding: 0.375rem 1rem;
        font-size: 0.75rem;
    }
`;

const ContentPanel = styled(motion.div)`
    flex: 1;
    padding: 2rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px 20px 0 0;
    min-height: calc(100vh - 300px);
`;

const TrailerModalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
`;

const TrailerModalContent = styled.div`
    position: relative;
    width: 100%;
    max-width: 900px;
    background: black;
    border-radius: 12px;
    overflow: hidden;
`;

const TrailerVideoContainer = styled.div`
    aspect-ratio: 16/9;
    width: 100%;
`;

// Like/Dislike Component
const LikeDislikeButtons: React.FC<{
    mediaId: number;
    mediaType: string;
    currentPreference: 'like' | 'dislike' | null;
    onLike: () => void;
    onDislike: () => void;
    isLoading: boolean;
}> = ({ mediaId, mediaType, currentPreference, onLike, onDislike, isLoading }) => {
    const getLikeButtonClasses = () => {
        let classes = "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-200 ";
        if (currentPreference === 'like') {
            classes += "bg-green-600 text-white shadow-lg";
        } else {
            classes += "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20";
        }
        if (isLoading) classes += " opacity-50 cursor-not-allowed";
        return classes;
    };

    const getDislikeButtonClasses = () => {
        let classes = "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-200 ";
        if (currentPreference === 'dislike') {
            classes += "bg-red-600 text-white shadow-lg";
        } else {
            classes += "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20";
        }
        if (isLoading) classes += " opacity-50 cursor-not-allowed";
        return classes;
    };

    return (
        <div className="flex gap-3 mb-4">
            <button
                onClick={onLike}
                disabled={isLoading}
                className={getLikeButtonClasses()}
            >
                <Icons.HeartIcon className="w-5 h-5" isActive={currentPreference === 'like'} />
                {currentPreference === 'like' ? 'Liked' : 'Like'}
            </button>
            <button
                onClick={onDislike}
                disabled={isLoading}
                className={getDislikeButtonClasses()}
            >
                <Icons.ThumbsDownIcon className="w-5 h-5" isActive={currentPreference === 'dislike'} />
                {currentPreference === 'dislike' ? 'Disliked' : 'Dislike'}
            </button>
        </div>
    );
};

// --- Main Component ---
const MediaDetail: React.FC<MediaDetailProps> = ({ item, apiKey, onClose, onSelectItem, onInvalidApiKey }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'reviews'>('overview');
    const [showTrailerModal, setShowTrailerModal] = useState(false);
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

    const [aiReviews, setAiReviews] = useState<string | null>(null);
    const [isAiReviewsLoading, setIsAiReviewsLoading] = useState(false);
    const [aiReviewsError, setAiReviewsError] = useState<string | null>(null);
    const [preferenceLoading, setPreferenceLoading] = useState(false);

    const { country } = useGeolocation();
    const { providerIds } = useStreamingPreferences();
    const { getContentPreference, addContentPreference, removeContentPreference, userSettings } = useAuth();

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
                    const baseRecommendations = recs.results.map(r => ({...r, media_type: 'movie' as const}));

                    // Apply personalized recommendations if user has preferences
                    const userPreferences = userSettings?.content_preferences || [];
                    const personalizedRecs = userPreferences.length > 0
                        ? generatePersonalizedRecommendations(baseRecommendations, userPreferences)
                        : baseRecommendations;

                    if (isMounted) setRecommendations(personalizedRecs as MediaItem[]);

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

    const handlePlayTrailer = () => {
        if (mainTrailerKey) {
            setShowTrailerModal(true);
        }
    };

    const handleCloseTrailerModal = () => {
        setShowTrailerModal(false);
    };

    const handleGenerateReviewsAI = async () => {
        if (!details) return;
        setIsAiReviewsLoading(true);
        setAiReviewsError(null);
        setAiReviews(null);
        try {
            const genres = details.genres?.map(g => g.name).filter(Boolean) || [];
            const reviews = await generateReviewsAI(
                'title' in details ? details.title : details.name,
                details.overview,
                details.vote_average,
                genres
            );
            setAiReviews(reviews);
        } catch (err) {
            if (err instanceof Error) {
                setAiReviewsError(err.message);
            } else {
                setAiReviewsError("Reviews are still being generated. Try again in a moment.");
            }
        } finally {
            setIsAiReviewsLoading(false);
        }
    };

    const handleLike = async () => {
        setPreferenceLoading(true);
        try {
            const currentPreference = getContentPreference(item.id, item.media_type);
            if (currentPreference === 'like') {
                // Remove the like
                await removeContentPreference(item.id, item.media_type);
            } else {
                // Add like (this will replace dislike if it exists)
                await addContentPreference(item.id, item.media_type, 'like');
            }
        } catch (error) {
            console.error('Error updating preference:', error);
        } finally {
            setPreferenceLoading(false);
        }
    };

    const handleDislike = async () => {
        setPreferenceLoading(true);
        try {
            const currentPreference = getContentPreference(item.id, item.media_type);
            if (currentPreference === 'dislike') {
                // Remove the dislike
                await removeContentPreference(item.id, item.media_type);
            } else {
                // Add dislike (this will replace like if it exists)
                await addContentPreference(item.id, item.media_type, 'dislike');
            }
        } catch (error) {
            console.error('Error updating preference:', error);
        } finally {
            setPreferenceLoading(false);
        }
    };

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <button
                                onClick={handlePlayTrailer}
                                disabled={!mainTrailerKey}
                                className={`bg-white text-black font-bold px-6 py-3 rounded-full mb-6 ${!mainTrailerKey ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            >
                                {mainTrailerKey ? 'Play Trailer' : 'No Trailer Available'}
                            </button>
                        </div>

                        <p className="text-slate-200 leading-relaxed text-lg">
                            {details.overview}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {hasStreamingAvailability && (
                                <div>
                                    <h3 className="font-semibold text-white mb-3">Where to Watch</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availabilityDescriptors.slice(0, 3).map(descriptor => (
                                            <span
                                                key={descriptor.type}
                                                className="bg-white/10 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-sm"
                                            >
                                                <span className="font-semibold text-white mr-1">{descriptor.type}:</span>
                                                {descriptor.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-white mb-3">Details</h3>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-slate-400">Rating:</span> {details.vote_average.toFixed(1)}/10</p>
                                    <p><span className="text-slate-400">Year:</span> {year}</p>
                                    {runtimeInfo && <p><span className="text-slate-400">Duration:</span> {runtimeInfo}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'cast':
                return (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Top Billed Cast</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {details.credits?.cast?.slice(0, 12).map(member => member && (
                                <div key={member.id} className="text-center">
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
                    </div>
                );
            case 'reviews':
                return (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Reviews & Analysis</h3>
                        <div className="space-y-6">
                            {!storyScape && !isStoryScapeLoading && !storyScapeError && (
                                <button onClick={handleGenerateStoryScape} className="bg-accent-500 text-white font-bold px-6 py-3 rounded-full">
                                    Generate AI Summary
                                </button>
                            )}

                            {storyScape && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <h4 className="font-semibold text-accent-400 mb-2">AI Analysis</h4>
                                    <p className="text-slate-200 italic mb-3">"{storyScape.summary}"</p>
                                    <div className="flex flex-col sm:flex-row gap-4 text-sm">
                                        <div>
                                            <h5 className="font-semibold text-slate-400">Emotional Tone</h5>
                                            <p>{storyScape.tone}</p>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-slate-400">Cinematic Style</h5>
                                            <p>{storyScape.style}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!aiReviews && !isAiReviewsLoading && !aiReviewsError && (
                                <button onClick={handleGenerateReviewsAI} className="bg-blue-500 text-white font-bold px-6 py-3 rounded-full">
                                    Generate AI Reviews
                                </button>
                            )}

                            {isAiReviewsLoading && (
                                <div className="text-center py-4">
                                    <div className="spinner mx-auto mb-2"></div>
                                    <p className="text-slate-400">Generating AI reviews...</p>
                                </div>
                            )}

                            {aiReviewsError && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                                    <p className="text-red-400">Error generating reviews: {aiReviewsError}</p>
                                </div>
                            )}

                            {aiReviews && (
                                <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6">
                                    <h4 className="font-semibold text-blue-400 mb-4">AI-Generated Reviews</h4>
                                    <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                                        {aiReviews}
                                    </div>
                                </div>
                            )}

                            {(omdbData && item.media_type === 'movie') && (
                                <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4">
                                    <h4 className="font-semibold text-black mb-3" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Additional Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {omdbData.Rated && omdbData.Rated !== 'N/A' && (
                                            <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                                                <span className="font-medium">Rating:</span> {omdbData.Rated}
                                            </p>
                                        )}
                                        {omdbData.Awards && omdbData.Awards !== 'N/A' && (
                                            <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                                                <span className="font-medium">Awards:</span> {omdbData.Awards}
                                            </p>
                                        )}
                                        {omdbData.BoxOffice && omdbData.BoxOffice !== 'N/A' && (
                                            <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                                                <span className="font-medium">Box Office:</span> {omdbData.BoxOffice}
                                            </p>
                                        )}
                                        {omdbData.imdbRating && omdbData.imdbRating !== 'N/A' && (
                                            <p style={{color: 'rgba(0,0,0,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                                                <span className="font-medium">IMDb Score:</span> {omdbData.imdbRating}/10
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            <Backdrop backdropPath={details.backdrop_path!} />
            <Overlay />
            <DetailContainer>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
                    style={{zIndex: 10}}
                >
                    <Icons.XIcon className="w-6 h-6" />
                </button>

                <HeaderSection>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'}}>
                        {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-slate-200">
                        <span>{year}</span>
                        <span>•</span>
                        <span>{details.genres?.map(g => g?.name).filter(Boolean).join(', ')}</span>
                        {runtimeInfo && (
                            <>
                                <span>•</span>
                                <span>{runtimeInfo}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <Icons.StarIcon className="w-6 h-6 text-yellow-400" isActive />
                        <span className="text-xl font-bold">{details.vote_average.toFixed(1)}</span>
                        <span className="text-slate-400">/ 10</span>
                    </div>
                    <LikeDislikeButtons
                        mediaId={item.id}
                        mediaType={item.media_type}
                        currentPreference={getContentPreference(item.id, item.media_type)}
                        onLike={handleLike}
                        onDislike={handleDislike}
                        isLoading={preferenceLoading}
                    />
                </HeaderSection>

                <TabsContainer>
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                        Overview
                    </TabButton>
                    <TabButton active={activeTab === 'cast'} onClick={() => setActiveTab('cast')}>
                        Cast
                    </TabButton>
                    <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
                        Reviews
                    </TabButton>
                </TabsContainer>

                <AnimatePresence mode="wait">
                    <ContentPanel
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderTabContent()}
                    </ContentPanel>
                </AnimatePresence>
            </DetailContainer>

            {/* Trailer Modal */}
            {showTrailerModal && mainTrailerKey && (
                <TrailerModalOverlay onClick={handleCloseTrailerModal}>
                    <TrailerModalContent onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={handleCloseTrailerModal}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
                        >
                            <Icons.XIcon className="w-6 h-6" />
                        </button>
                        <TrailerVideoContainer>
                            <VideoPlayer
                                videoKey={mainTrailerKey}
                                isMuted={isMuted}
                                onEnd={handleCloseTrailerModal}
                            />
                        </TrailerVideoContainer>
                    </TrailerModalContent>
                </TrailerModalOverlay>
            )}
        </>
    );
};

export default MediaDetail;
