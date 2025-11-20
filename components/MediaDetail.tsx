import React, { useState, useEffect, useMemo, useCallback, useRef, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItem, Movie, MovieDetails, TVShowDetails, WatchProvider, WatchProviderCountry } from '../types';
import { getMovieDetails as getTMDbMovieDetails, getTVShowDetails as getTMDbTVShowDetails, getMovieCredits, getTVShowCredits, getMovieImages, getTVShowImages } from '../services/tmdbService';
import { getMovieRecommendations } from '../services/tmdbService';
import { getMovieWatchProviders, getTVShowWatchProviders, getMovieVideos, getTVShowVideos, getTVSeasonDetails, filterImaxVideos } from '../services/tmdbService';
import { isCuratedImaxTitle, getCuratedTrailerKeyForItem } from '../services/imaxCuratedService';
import { getOMDbFromTMDBDetails, OMDbMovieDetails, extractRottenTomatoesRating, extractRottenTomatoesConsensus, hasOMDbKey } from '../services/omdbService';
import { fetchRtCriticReviews, RtCriticReview } from '../services/rottenTomatoesService';
import RottenTomatoesRating from '../components/RottenTomatoesRating';
import { generateFactsAI, generateReviewsAIWithSources } from './openrouter.js';
import { generateStoryScapeSummary } from './storyscape.js';
import { generatePersonalizedRecommendations } from '../services/recommendationService';
// TrailerManager is no longer used for main trailer in detail view
import { useGeolocation } from '../hooks/useGeolocation';
import { useStreamingPreferences } from '../hooks/useStreamingPreferences';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from './VideoPlayer';
import { isMobileDevice } from '../utils/deviceDetection';
import Loader from './Loader';
import { useAppleTheme } from './AppleThemeProvider';
import { useAppleAnimationEffects } from '../hooks/useAppleAnimationEffects';
import { Star, Heart, ThumbsDown, X, Play } from 'lucide-react';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import {
    getAvailabilityBuckets,
    buildAvailabilityDescriptors,
    hasAvailability,
} from '../utils/streamingAvailability';
import MediaTitleLogo from './MediaTitleLogo';
 
// FanArt removed: backdrops resolved via TMDb image APIs

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
// Official IMAX YouTube trailer IDs (curated; update as new IMAX trailers release)
const IMAX_TRAILER_IDS: string[] = [
    'dG91Qf2d0eQ',
    'zSWdZVtXT7E',
    'L-_JXL2k5yc',
];

// --- Custom Hook for Dynamic Background Adaptation ---
interface AdaptiveStyles {
    background: string;
    backdropFilter: string;
    WebkitBackdropFilter: string;
    borderColor: string;
    boxShadow: string;
}

const useDynamicBackground = (containerRef: RefObject<HTMLElement>, tokens: any) => {
    const [adaptiveStyles, setAdaptiveStyles] = useState<AdaptiveStyles>({
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    });
    const [isDetected, setIsDetected] = useState(false);

    // Helper function to extract RGB values from color string
    const extractRGB = (colorStr: string): [number, number, number] | null => {
        if (!colorStr) return null;
        
        // Handle rgba format
        const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbaMatch) {
            return [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3])];
        }
        
        // Handle hex format
        const hexMatch = colorStr.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (hexMatch) {
            return [
                parseInt(hexMatch[1], 16),
                parseInt(hexMatch[2], 16),
                parseInt(hexMatch[3], 16)
            ];
        }
        
        return null;
    };

    // Calculate brightness of a color
    const getBrightness = (r: number, g: number, b: number): number => {
        return (r * 299 + g * 587 + b * 114) / 1000;
    };

    // Generate adaptive colors based on detected background
    const generateAdaptiveColors = (bgColor: [number, number, number]): AdaptiveStyles => {
        const [r, g, b] = bgColor;
        const brightness = getBrightness(r, g, b);
        const isDark = brightness < 128;
        
        // Calculate complementary colors
        const baseOpacity = isDark ? 0.15 : 0.08;
        const borderOpacity = isDark ? 0.3 : 0.15;
        const shadowOpacity = isDark ? 0.4 : 0.2;
        
        // Adjust blur intensity based on brightness
        const blurIntensity = isDark ? 25 : 20;
        
        // Create adaptive background with slight color tinting
        const adaptiveR = Math.min(255, r + (isDark ? 20 : -10));
        const adaptiveG = Math.min(255, g + (isDark ? 20 : -10));
        const adaptiveB = Math.min(255, b + (isDark ? 20 : -10));
        
        return {
            background: `rgba(${adaptiveR}, ${adaptiveG}, ${adaptiveB}, ${baseOpacity})`,
            backdropFilter: `blur(${blurIntensity}px)`,
            WebkitBackdropFilter: `blur(${blurIntensity}px)`,
            borderColor: `rgba(${adaptiveR}, ${adaptiveG}, ${adaptiveB}, ${borderOpacity})`,
            boxShadow: `0 8px 32px rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, ${shadowOpacity}), inset 0 1px 0 rgba(255, 255, 255, ${isDark ? 0.2 : 0.1})`
        };
    };

    useEffect(() => {
        const detectBackgroundColor = () => {
            if (!containerRef.current) return;
            
            try {
                const element = containerRef.current;
                const computedStyle = window.getComputedStyle(element);
                
                // Try to get background color from the element or its parents
                let currentElement: HTMLElement | null = element;
                let detectedColor: [number, number, number] | null = null;
                
                while (currentElement && !detectedColor) {
                    const style = window.getComputedStyle(currentElement);
                    const bgColor = style.backgroundColor;
                    const bgImage = style.backgroundImage;
                    
                    // Check for solid background color
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                        detectedColor = extractRGB(bgColor);
                        if (detectedColor) break;
                    }
                    
                    // Check for gradient background
                    if (bgImage && bgImage.includes('linear-gradient')) {
                        // Extract first color from gradient
                        const gradientMatch = bgImage.match(/rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)/);
                        if (gradientMatch) {
                            detectedColor = extractRGB(gradientMatch[0]);
                            if (detectedColor) break;
                        }
                    }
                    
                    currentElement = currentElement.parentElement;
                }
                
                if (detectedColor) {
                    const newStyles = generateAdaptiveColors(detectedColor);
                    setAdaptiveStyles(newStyles);
                    setIsDetected(true);
                } else {
                    // Fallback to token-based styling
                    setAdaptiveStyles({
                        background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                        WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                        borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                        boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)'
                    });
                    setIsDetected(false);
                }
            } catch (error) {
                console.warn('Dynamic background detection failed:', error);
                // Use fallback styling
                setAdaptiveStyles({
                    background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                    WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                    borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                    boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)'
                });
                setIsDetected(false);
            }
        };

        // Initial detection
        detectBackgroundColor();
        
        // Re-detect on resize or theme changes
        const handleResize = () => detectBackgroundColor();
        window.addEventListener('resize', handleResize);
        
        // Use ResizeObserver for more precise detection
        let resizeObserver: ResizeObserver | null = null;
        if (containerRef.current && window.ResizeObserver) {
            resizeObserver = new ResizeObserver(detectBackgroundColor);
            resizeObserver.observe(containerRef.current);
        }
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [containerRef, tokens]);

    return { adaptiveStyles, isDetected };
};

// --- Prop Types ---
interface MediaDetailProps {
    item: MediaItem;
    apiKey: string;
    onClose: () => void;
    onSelectItem: (item: MediaItem) => void;
    onInvalidApiKey: () => void;
    // When true, prefer IMAX trailer variants if available
    preferImaxTrailer?: boolean;
}

interface WhereToWatchProps {
    providers: WatchProviderCountry | undefined;
    providerIds: Set<number>;
}

const WhereToWatch: React.FC<WhereToWatchProps> = ({ providers, providerIds }) => {
    const { tokens } = useAppleTheme();
    
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
                className="w-12 h-12 rounded-lg transition-transform duration-300 hover:scale-105"
                style={{
                    border: `1px solid ${tokens.colors.separator.opaque}`,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
            />
        );

        if (!link) {
            return (
                <div
                    key={provider.provider_id}
                    className="transition-transform duration-300 hover:-translate-y-1 hover:scale-105"
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
                className="transition-transform duration-300 hover:-translate-y-1 hover:scale-105"
            >
                {logo}
            </a>
        );
    };

    return (
        <section style={{ margin: `${tokens.spacing.macro[0]}px 0` }}>
            <h2 
                className="mb-4"
                style={{
                    fontFamily: tokens.typography.families.display,
                    fontSize: `${tokens.typography.sizes.title2}px`,
                    fontWeight: tokens.typography.weights.bold,
                    color: tokens.colors.label.primary
                }}
            >
                Where to Watch
            </h2>
            
            <div 
                className="rounded-xl backdrop-blur-xl border"
                style={{
                    padding: `${tokens.spacing.standard[1]}px`,
                    background: `linear-gradient(135deg, ${tokens.colors.background.secondary}E6, ${tokens.colors.background.primary}E6)`,
                    borderColor: tokens.colors.separator.opaque,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }}
            >
                {hasStream && (
                    <div style={{ marginBottom: `${tokens.spacing.standard[0]}px` }}>
                        <h3 
                            className="mb-2"
                            style={{
                                fontFamily: tokens.typography.families.text,
                                fontSize: `${tokens.typography.sizes.caption1}px`,
                                fontWeight: tokens.typography.weights.semibold,
                                color: tokens.colors.label.tertiary,
                                letterSpacing: '0.05em'
                            }}
                        >
                            STREAM
                        </h3>
                        <div className="flex flex-wrap" style={{ gap: `${tokens.spacing.micro[1]}px` }}>
                            {stream.map(renderProviderLogo)}
                        </div>
                    </div>
                )}
                {hasRent && (
                    <div style={{ marginBottom: `${tokens.spacing.standard[0]}px` }}>
                        <h3 
                            className="mb-2"
                            style={{
                                fontFamily: tokens.typography.families.text,
                                fontSize: `${tokens.typography.sizes.caption1}px`,
                                fontWeight: tokens.typography.weights.semibold,
                                color: tokens.colors.label.tertiary,
                                letterSpacing: '0.05em'
                            }}
                        >
                            RENT
                        </h3>
                        <div className="flex flex-wrap" style={{ gap: `${tokens.spacing.micro[1]}px` }}>
                            {rent.map(renderProviderLogo)}
                        </div>
                    </div>
                )}
                {hasBuy && (
                    <div>
                        <h3 
                            className="mb-2"
                            style={{
                                fontFamily: tokens.typography.families.text,
                                fontSize: `${tokens.typography.sizes.caption1}px`,
                                fontWeight: tokens.typography.weights.semibold,
                                color: tokens.colors.label.tertiary,
                                letterSpacing: '0.05em'
                            }}
                        >
                            BUY
                        </h3>
                        <div className="flex flex-wrap" style={{ gap: `${tokens.spacing.micro[1]}px` }}>
                            {buy.map(renderProviderLogo)}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};


// --- Apple Design System Components ---
const BackgroundHeader: React.FC<{ backdropUrl: string }> = ({ backdropUrl }) => (
    <div 
        className="absolute inset-0 rounded-t-3xl overflow-hidden"
        style={{
            backgroundImage: `url('${backdropUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(20px)',
            opacity: 0.3,
            zIndex: 0
        }}
    />
);

const PanelOverlay: React.FC = () => {
    const { tokens } = useAppleTheme();
    return (
        <div 
            className="absolute inset-0 rounded-t-3xl"
            style={{
                background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                zIndex: 1
            }}
        />
    );
};

const DetailContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tokens } = useAppleTheme();
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="relative flex flex-col rounded-t-3xl overflow-hidden"
            style={{
                minHeight: '100vh',
                maxWidth: '1200px',
                margin: '0 auto',
                background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                border: `1px solid ${tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)'}`,
                boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)',
                zIndex: 2,
                color: tokens.colors.label.primary
            }}
        >
            {children}
        </motion.div>
    );
};

const HeaderSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tokens } = useAppleTheme();
    return (
        <div 
            className="relative"
            style={{
                paddingTop: tokens.spacing.xlarge,
                paddingLeft: tokens.spacing.large,
                paddingRight: tokens.spacing.large,
                background: `linear-gradient(180deg, rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity * 2}) 0%, rgba(0, 0, 0, ${tokens.materials.glass.prominent.shadowIntensity}) 50%, transparent 100%)`,
                zIndex: 2
            }}
        >
            {children}
        </div>
    );
};

const TabsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tokens } = useAppleTheme();
    return (
        <div 
            className="flex justify-center relative"
            role="tablist"
            aria-label="Media information tabs"
            style={{
                marginTop: tokens.spacing.large,
                paddingLeft: tokens.spacing.large,
                paddingRight: tokens.spacing.large,
                zIndex: 2
            }}
        >
            {children}
        </div>
    );
};

const TabButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
}> = ({ active, onClick, children }) => {
    const { tokens } = useAppleTheme();
    const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();
    
    return (
        <motion.button
            onClick={onClick}
            onMouseEnter={applyHoverEffect}
            onMouseDown={applyPressEffect}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="backdrop-blur-xl border border-b-0 relative overflow-hidden"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            style={{
                padding: `${tokens.spacing.small}px ${tokens.spacing.large}px`,
                margin: `0 ${tokens.spacing.micro[0]}px`,
                borderRadius: `${tokens.borderRadius.large}px ${tokens.borderRadius.large}px 0 0`,
                background: active 
                    ? tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.15)'
                    : tokens?.materials?.pill?.secondary?.background || 'rgba(255, 255, 255, 0.08)',
                backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                color: active ? tokens.colors.text.primary : tokens.colors.text.secondary,
                fontSize: tokens.typography.sizes.body,
                fontWeight: active ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                fontFamily: tokens.typography.families.text,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                boxShadow: active 
                    ? tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : tokens?.shadows?.medium || '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: tokens.interactions.transitions.fast,
                cursor: 'pointer'
            }}
        >
            {/* Active state ripple effect */}
            {active && (
                <motion.div
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 0.2 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: `${tokens.borderRadius.large}px ${tokens.borderRadius.large}px 0 0`,
                        background: `radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)`,
                        pointerEvents: 'none'
                    }}
                />
            )}
            {children}
        </motion.button>
    );
};

const ContentPanel = motion.div;

const TrailerModalOverlay: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => {
    const { tokens } = useAppleTheme();
    return (
        <div 
            className="fixed inset-0 flex items-center justify-center"
            style={{
                background: `${tokens.colors.background.overlay}CC`,
                zIndex: 1000,
                padding: tokens.spacing.xlarge
            }}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

const TrailerModalContent: React.FC<{ children: React.ReactNode; onClick: (e: React.MouseEvent) => void }> = ({ children, onClick }) => {
    const { tokens } = useAppleTheme();
    return (
        <div 
            className="relative w-full max-w-4xl rounded-xl overflow-hidden"
            style={{
                background: tokens.colors.background.primary,
                boxShadow: tokens.shadows.large
            }}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

const TrailerVideoContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="aspect-video w-full">
        {children}
    </div>
);

// IMAX controls overlay styled with IMAX Blue and White
const ImaxGoldControls: React.FC<{ onExit: () => void; onToggleMute?: () => void; isMuted?: boolean; onToggleSpatial?: () => void; spatialEnabled?: boolean }> = ({ onExit, onToggleMute, isMuted, onToggleSpatial, spatialEnabled }) => {
    const [visible, setVisible] = useState<boolean>(false);
    const hideTimer = useRef<number | null>(null);

    useEffect(() => {
        const onMove = () => {
            setVisible(true);
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
            hideTimer.current = window.setTimeout(() => setVisible(false), 3000);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
        };
    }, []);

    return (
        <div
            style={{
                position: 'absolute', inset: 0,
                pointerEvents: 'none'
            }}
            aria-hidden
        >
            {/* Top-right badge */}
            <div
                style={{
                    position: 'absolute', top: '12px', right: '12px',
                    padding: '6px 10px', borderRadius: '9999px',
                    background: 'rgba(0,114,206,0.12)', border: '1px solid #0072CE',
                    color: '#0072CE', fontFamily: 'Nexa, -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: '12px',
                    opacity: visible ? 1 : 0, transition: 'opacity 240ms'
                }}
            >
                IMAX ENHANCED • 4K
            </div>

            {/* Bottom control bar */}
            <div
                style={{
                    position: 'absolute', left: '4%', right: '4%', bottom: '3%', height: '48px',
                    background: 'linear-gradient(180deg, rgba(0,114,206,0.00), rgba(0,114,206,0.25))',
                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '8px 12px',
                    opacity: visible ? 1 : 0, transition: 'opacity 240ms',
                    pointerEvents: visible ? 'auto' : 'none'
                }}
            >
                {onToggleMute && (
                    <button
                        onClick={onToggleMute}
                        style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '8px', padding: '6px 10px', fontFamily: 'Nexa, -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                    >
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                )}
                {onToggleSpatial && (
                    <button
                        onClick={onToggleSpatial}
                        style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '8px', padding: '6px 10px', fontFamily: 'Nexa, -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                    >
                        {spatialEnabled ? 'Spatial: On' : 'Spatial: Off'}
                    </button>
                )}
                <button
                    onClick={onExit}
                    style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '8px', padding: '6px 10px', fontFamily: 'Nexa, -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                >
                    Exit
                </button>
                <div style={{ flex: 1 }} />
                {/* Faux volume slider stub */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.30)', borderRadius: '9999px', position: 'relative' }}>
                        <div style={{ width: '70%', height: '100%', background: '#FFFFFF', borderRadius: '9999px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Like/Dislike Component
const LikeDislikeButtons: React.FC<{
    mediaId: number;
    mediaType: string;
    currentPreference: 'like' | 'dislike' | null;
    onLike: () => void;
    onDislike: () => void;
    isLoading: boolean;
}> = ({ mediaId, mediaType, currentPreference, onLike, onDislike, isLoading }) => {
    const { tokens } = useAppleTheme();
    const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();

    // Add null check for tokens
    if (!tokens) {
        return null;
    }

    return (
        <div 
            className="flex" 
            style={{ 
                gap: tokens.spacing.small, 
                marginBottom: tokens.spacing.medium 
            }}
            role="group"
            aria-label="Rate this content"
        >
            <motion.button
                onClick={onLike}
                disabled={isLoading}
                onMouseEnter={!isLoading ? applyHoverEffect : undefined}
                onMouseDown={!isLoading ? applyPressEffect : undefined}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className="flex items-center backdrop-blur-xl border"
                aria-label={currentPreference === 'like' ? 'Remove like' : 'Like this content'}
                aria-pressed={currentPreference === 'like'}
                style={{
                    padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}px`,
                    gap: tokens.spacing.small,
                    borderRadius: `${tokens.borderRadius.xxlarge}px`,
                    minHeight: '44px',
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.body,
                    fontWeight: tokens.typography.weights.semibold,
                    background: currentPreference === 'like' 
                        ? `linear-gradient(135deg, ${tokens.colors.system.green}E6 0%, ${tokens.colors.system.green}CC 100%)`
                        : tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                    WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                    borderColor: currentPreference === 'like' 
                        ? `${tokens.colors.system.green}80` 
                        : tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                    color: tokens.colors.text.primary,
                    boxShadow: currentPreference === 'like' 
                        ? `0 4px 20px rgba(${tokens.colors.system.green.replace('#', '')}, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                        : tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)',
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: tokens.interactions.transitions.fast,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Material Design Ripple Effect */}
                {currentPreference === 'like' && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: `${tokens.borderRadius.xxlarge}px`,
                            background: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)`,
                            pointerEvents: 'none'
                        }}
                    />
                )}
                <Heart 
                    size={20}
                    fill={currentPreference === 'like' ? 'currentColor' : 'none'}
                    aria-hidden="true"
                />
                {currentPreference === 'like' ? 'Liked' : 'Like'}
            </motion.button>
            
            <motion.button
                onClick={onDislike}
                disabled={isLoading}
                onMouseEnter={!isLoading ? applyHoverEffect : undefined}
                onMouseDown={!isLoading ? applyPressEffect : undefined}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className="flex items-center backdrop-blur-xl border"
                aria-label={currentPreference === 'dislike' ? 'Remove dislike' : 'Dislike this content'}
                aria-pressed={currentPreference === 'dislike'}
                style={{
                    padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}px`,
                    gap: tokens.spacing.small,
                    borderRadius: `${tokens.borderRadius.xxlarge}px`,
                    minHeight: '44px',
                    fontFamily: tokens.typography.families.text,
                    fontSize: tokens.typography.sizes.body,
                    fontWeight: tokens.typography.weights.semibold,
                    background: currentPreference === 'dislike' 
                        ? `linear-gradient(135deg, ${tokens.colors.system.red}E6 0%, ${tokens.colors.system.red}CC 100%)`
                        : tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                    WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                    borderColor: currentPreference === 'dislike' 
                        ? `${tokens.colors.system.red}80` 
                        : tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                    color: tokens.colors.text.primary,
                    boxShadow: currentPreference === 'dislike' 
                        ? `0 4px 20px rgba(${tokens.colors.system.red.replace('#', '')}, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                        : tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)',
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: tokens.interactions.transitions.fast,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Material Design Ripple Effect */}
                {currentPreference === 'dislike' && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: `${tokens.borderRadius.xxlarge}px`,
                            background: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)`,
                            pointerEvents: 'none'
                        }}
                    />
                )}
                <ThumbsDown 
                    size={20}
                    fill={currentPreference === 'dislike' ? 'currentColor' : 'none'}
                    aria-hidden="true"
                />
                {currentPreference === 'dislike' ? 'Disliked' : 'Dislike'}
            </motion.button>
        </div>
    );
};

// --- Main Component ---
const MediaDetail: React.FC<MediaDetailProps> = ({ item, apiKey, onClose, onSelectItem, onInvalidApiKey, preferImaxTrailer }) => {
    const navigate = useNavigate();
    // IMAX cinematic sequence state
    const [imaxPhase, setImaxPhase] = useState<'idle' | 'curtain' | 'countdown' | 'title' | 'trailer' | 'post_trailer' | 'theater'>('idle');
    const [showImaxOverlay, setShowImaxOverlay] = useState<boolean>(false);
    const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
    const [showGoldCTA, setShowGoldCTA] = useState<boolean>(false);
    const [highContrast, setHighContrast] = useState<boolean>(false);
    const longPressTimer = useRef<number | null>(null);
    // Consider IMAX mode active for explicit IMAX route or curated titles
    const isImaxMode = useMemo(() => preferImaxTrailer, [preferImaxTrailer]);

    // Bass thrum: Web Audio oscillator with element fallback for reliable playback
    const playBass = useCallback(() => {
        try {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AC) {
                const ctx = new AC();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 40; // 40 Hz
                gain.gain.setValueAtTime(0.0001, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.06);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.75);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
                setTimeout(() => { try { ctx.close(); } catch {} }, 1000);
                return;
            }
            const a = document.getElementById('bassMP3') as HTMLAudioElement | null;
            if (a) {
                a.currentTime = 0;
                a.play().catch(() => {});
            }
        } catch {}
    }, []);

    // Attempt to force landscape on mobile
    useEffect(() => {
        if (preferImaxTrailer) {
            try {
                if ((window.screen as any)?.orientation?.lock) {
                    (window.screen as any).orientation.lock('landscape').catch(() => {});
                }
            } catch {}
        }
    }, [preferImaxTrailer]);

    // Disable right-click to preserve immersion
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (isImaxMode) e.preventDefault();
    }, [isImaxMode]);

    // Intercept close/back with curtain animation
    const handleCloseWithCurtain = useCallback(() => {
        if (!isImaxMode) return onClose();
        setShowImaxOverlay(true);
        setImaxPhase('curtain');
        setTimeout(() => {
            onClose();
        }, 700);
    }, [isImaxMode, onClose]);

    // Long-press accessibility: toggle high-contrast and announce
    const handlePointerDown = useCallback(() => {
        if (!isImaxMode) return;
        // Prime bass on user gesture to satisfy autoplay policies
        playBass();
        if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
        longPressTimer.current = window.setTimeout(() => {
            setHighContrast((prev) => !prev);
            try {
                const msg = new SpeechSynthesisUtterance('Now entering IMAX theater');
                window.speechSynthesis?.speak(msg);
            } catch {}
        }, 650);
    }, [isImaxMode, playBass]);
    const handlePointerUp = useCallback(() => {
        if (longPressTimer.current) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const [imaxAudioActivated, setImaxAudioActivated] = useState<boolean>(false);
    const audioCtxRef = useRef<any>(null);
    const rumbleGainRef = useRef<any>(null);
    const rumbleOscRef = useRef<any>(null);
    const ytPlayerRef = useRef<any>(null);
    // Earth Shatter master bus (compression + saturation)
    const masterBusGainRef = useRef<any>(null);
    const compressorRef = useRef<any>(null);
    const saturatorRef = useRef<any>(null);
    const ensureEarthShatterBus = useCallback(() => {
        try {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AC) return;
            const ctx = audioCtxRef.current ?? new AC({ latencyHint: 'playback' } as any);
            audioCtxRef.current = ctx;
            if (!masterBusGainRef.current) {
                const busGain = ctx.createGain();
                // Amplify overall bus for earth-shattering loudness
                busGain.gain.setValueAtTime(1.35, ctx.currentTime);
                masterBusGainRef.current = busGain;
            }
            if (!compressorRef.current) {
                const comp = ctx.createDynamicsCompressor();
                // Stronger compression for perceived loudness without harsh clipping
                comp.threshold.setValueAtTime(-28, ctx.currentTime);
                comp.knee.setValueAtTime(15, ctx.currentTime);
                comp.ratio.setValueAtTime(4.5, ctx.currentTime);
                comp.attack.setValueAtTime(0.002, ctx.currentTime);
                comp.release.setValueAtTime(0.30, ctx.currentTime);
                compressorRef.current = comp;
                masterBusGainRef.current.connect(comp);
            }
            if (!saturatorRef.current) {
                const shape = new Float32Array(1024);
                for (let i = 0; i < shape.length; i++) {
                    const x = (i / (shape.length - 1)) * 2 - 1;
                    shape[i] = Math.tanh(3.0 * x); // stronger saturation for density
                }
                const waveshaper = ctx.createWaveShaper();
                waveshaper.curve = shape;
                waveshaper.oversample = '4x';
                saturatorRef.current = waveshaper;
                compressorRef.current.connect(waveshaper);
                waveshaper.connect(ctx.destination);
            }
        } catch {}
    }, []);
    const activateImaxAudio = useCallback(async () => {
        try {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AC) return;
            const ctx = new AC({ latencyHint: 'playback' } as any);
            audioCtxRef.current = ctx;
            playBass();
            setImaxAudioActivated(true);
        } catch {}
    }, [playBass]);

    const startImaxRumble = useCallback(() => {
        try {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AC) return;
            // Create or reuse context
            const ctx = audioCtxRef.current ?? new AC({ latencyHint: 'playback' } as any);
            audioCtxRef.current = ctx;
            try { ctx.resume?.(); } catch {}
            ensureEarthShatterBus();
            // Avoid duplicate
            if (rumbleOscRef.current) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 60; // more audible on typical speakers
            gain.gain.setValueAtTime(0.12, ctx.currentTime); // slightly stronger
            osc.connect(gain);
            // route through Earth Shatter bus
            if (masterBusGainRef.current) {
                gain.connect(masterBusGainRef.current);
            } else {
                gain.connect(ctx.destination);
            }
            osc.start();
            rumbleOscRef.current = osc;
            rumbleGainRef.current = gain;
        } catch {}
    }, [ensureEarthShatterBus]);

    const stopImaxRumble = useCallback(() => {
        try {
            if (rumbleOscRef.current) {
                try { rumbleOscRef.current.stop(); } catch {}
                try { rumbleOscRef.current.disconnect(); } catch {}
                rumbleOscRef.current = null;
            }
            if (rumbleGainRef.current) {
                try { rumbleGainRef.current.disconnect(); } catch {}
                rumbleGainRef.current = null;
            }
        } catch {}
    }, []);

    

    

    // Orchestrate IMAX sequence on mount in IMAX mode
    useEffect(() => {
        if (!isImaxMode) return;
        setShowImaxOverlay(true);
        setImaxPhase('curtain');
        // Curtains open -> countdown -> title stage
        const t1 = setTimeout(() => {
            setImaxPhase('countdown');
            let n = 3;
            setCountdownNumber(n);
            const interval = setInterval(() => {
                n -= 1;
                if (n <= 0) {
                    clearInterval(interval);
                    setCountdownNumber(null);
                    setImaxPhase('title');
                    setShowGoldCTA(true);
                } else {
                    setCountdownNumber(n);
                }
            }, 420);
        }, 1000);
        return () => {
            clearTimeout(t1);
        };
    }, [isImaxMode]);

    

    useEffect(() => {
        if (imaxPhase === 'countdown') {
            playBass();
        }
    }, [imaxPhase, playBass]);
    const { tokens } = useAppleTheme();
    const { applyHoverEffect, applyPressEffect } = useAppleAnimationEffects();
    
    // Add null check for tokens
    if (!tokens) {
        return null;
    }
    
    const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'reviews' | 'episodes'>('overview');
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

    // Episodes / Seasons state (TV only)
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<any | null>(null);
    const [isSeasonLoading, setIsSeasonLoading] = useState(false);
    const [seasonError, setSeasonError] = useState<string | null>(null);

    // AI reviews grounded by critic sources
    const [reviewsAI, setReviewsAI] = useState<string | null>(null);
    const [isReviewsAILoading, setIsReviewsAILoading] = useState(false);
    const [reviewsAIError, setReviewsAIError] = useState<string | null>(null);

    const [omdbData, setOmdbData] = useState<OMDbMovieDetails | null>(null);
    const [isOmdbLoading, setIsOmdbLoading] = useState(false);
    const [omdbError, setOmdbError] = useState<string | null>(null);

    // Reviews: Replace AI with real RT/IMDb review views backed by OMDb
    const [showRTReviews, setShowRTReviews] = useState<boolean>(false);
    const [rtView, setRtView] = useState<'critics' | 'audience'>('critics');
    const [showIMDBReviews, setShowIMDBReviews] = useState<boolean>(false);
    // Rotten Tomatoes direct reviews state
    const [rtReviews, setRtReviews] = useState<RtCriticReview[] | null>(null);
    const [rtSourceUrl, setRtSourceUrl] = useState<string | null>(null);
    const [isRtLoading, setIsRtLoading] = useState(false);
    const [rtError, setRtError] = useState<string | null>(null);
    const [streamingAI, setStreamingAI] = useState<string | null>(null);
    const [isStreamingAILoading, setIsStreamingAILoading] = useState(false);
    const [streamingAIError, setStreamingAIError] = useState<string | null>(null);
    const [backdropUrl, setBackdropUrl] = useState<string | null>(null);

    // Refs for dynamic background detection
    const contentPanelRef = useRef<HTMLDivElement>(null);
    const trailerContainerRef = useRef<HTMLDivElement>(null);
    const descriptionPanelRef = useRef<HTMLDivElement>(null);

    // Dynamic background adaptation hooks
    const { adaptiveStyles: trailerAdaptiveStyles } = useDynamicBackground(contentPanelRef, tokens);
    const { adaptiveStyles: descriptionAdaptiveStyles } = useDynamicBackground(contentPanelRef, tokens);
    const [preferenceLoading, setPreferenceLoading] = useState(false);

    // Spatial audio controls (placed after isMuted to avoid TDZ)
    const [spatialEnabled, setSpatialEnabled] = useState<boolean>(false);
    const spatialGainRef = useRef<any>(null);
    const spatialAnimReqRef = useRef<number | null>(null);
    const spatialSourcesRef = useRef<{ osc: OscillatorNode; panner: PannerNode }[]>([]);

    const startSpatialAmbience = useCallback(() => {
        try {
            if (!spatialEnabled) return;
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AC) return;
            const ctx = audioCtxRef.current ?? new AC({ latencyHint: 'playback' } as any);
            audioCtxRef.current = ctx;
            try { ctx.resume?.(); } catch {}

            if (!spatialGainRef.current) {
                ensureEarthShatterBus();
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(isMuted ? 0.0 : 0.12, ctx.currentTime);
                // Route exclusively through Earth Shatter bus when available
                if (masterBusGainRef.current) {
                    gain.connect(masterBusGainRef.current);
                } else {
                    gain.connect(ctx.destination);
                }
                spatialGainRef.current = gain;
            }

            if (spatialSourcesRef.current.length > 0) return; // already running

            const makeSource = (freq: number, x: number) => {
                const osc = ctx.createOscillator();
                const panner = ctx.createPanner();
                panner.panningModel = 'HRTF';
                panner.distanceModel = 'inverse';
                try {
                    (panner.positionX as any).value = x;
                    (panner.positionY as any).value = 0;
                    (panner.positionZ as any).value = 0.6;
                } catch {
                    panner.setPosition(x, 0, 0.6);
                }
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(panner);
                panner.connect(spatialGainRef.current);
                osc.start();
                return { osc, panner };
            };

            spatialSourcesRef.current = [
                makeSource(220, -0.9),
                makeSource(330, 0.9),
            ];

            const animate = () => {
                const t = ctx.currentTime;
                const s1 = spatialSourcesRef.current[0]?.panner;
                const s2 = spatialSourcesRef.current[1]?.panner;
                if (s1) {
                    try {
                        (s1.positionX as any).value = -0.9 + 0.15 * Math.sin(t * 0.6);
                        (s1.positionZ as any).value = 0.6 + 0.1 * Math.cos(t * 0.35);
                    } catch {
                        s1.setPosition(-0.9 + 0.15 * Math.sin(t * 0.6), 0, 0.6 + 0.1 * Math.cos(t * 0.35));
                    }
                }
                if (s2) {
                    try {
                        (s2.positionX as any).value = 0.9 + 0.15 * Math.sin(t * 0.5 + 1.4);
                        (s2.positionZ as any).value = 0.6 + 0.1 * Math.cos(t * 0.3 + 0.7);
                    } catch {
                        s2.setPosition(0.9 + 0.15 * Math.sin(t * 0.5 + 1.4), 0, 0.6 + 0.1 * Math.cos(t * 0.3 + 0.7));
                    }
                }
                spatialAnimReqRef.current = window.requestAnimationFrame(animate);
            };
            spatialAnimReqRef.current = window.requestAnimationFrame(animate);
        } catch {}
    }, [spatialEnabled, isMuted]);

    const stopSpatialAmbience = useCallback(() => {
        try {
            if (spatialAnimReqRef.current) {
                window.cancelAnimationFrame(spatialAnimReqRef.current);
                spatialAnimReqRef.current = null;
            }
            spatialSourcesRef.current.forEach(({ osc, panner }) => {
                try { osc.stop(); } catch {}
                try { osc.disconnect(); } catch {}
                try { panner.disconnect(); } catch {}
            });
            spatialSourcesRef.current = [];
            if (spatialGainRef.current) {
                try { spatialGainRef.current.disconnect(); } catch {}
                spatialGainRef.current = null;
            }
        } catch {}
    }, []);

    // Do not start spatial ambience; ensure any running layers are stopped
    useEffect(() => {
        stopImaxRumble();
        stopSpatialAmbience();
    }, [imaxPhase, stopImaxRumble, stopSpatialAmbience]);

    // Shock pulses and quake modulation for Earth Shattering effect
    const quakeAnimReqRef = useRef<number | null>(null);
    const startQuakeLfo = useCallback(() => {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx) return;
            const depth = isMuted ? 0.0 : 0.06;
            const animate = () => {
                const t = ctx.currentTime;
                const mod = Math.sin(t * 3.0) * depth; // ~3 Hz quake wobble
                if (spatialGainRef.current) {
                    try { spatialGainRef.current.gain.setValueAtTime((isMuted ? 0.0 : 0.06) + mod * 0.5, t); } catch {}
                }
                quakeAnimReqRef.current = window.requestAnimationFrame(animate);
            };
            if (!quakeAnimReqRef.current) {
                quakeAnimReqRef.current = window.requestAnimationFrame(animate);
            }
        } catch {}
    }, [isMuted]);

    const stopQuakeLfo = useCallback(() => {
        if (quakeAnimReqRef.current) {
            window.cancelAnimationFrame(quakeAnimReqRef.current);
            quakeAnimReqRef.current = null;
        }
    }, []);

    const triggerShockPulse = useCallback((freq: number, gainValue: number, durationSec: number) => {
        try {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AC || isMuted) return;
            const ctx = audioCtxRef.current ?? new AC({ latencyHint: 'playback' } as any);
            audioCtxRef.current = ctx;
            ensureEarthShatterBus();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            g.gain.setValueAtTime(0.0, ctx.currentTime);
            g.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 0.04);
            g.gain.linearRampToValueAtTime(0.0, ctx.currentTime + durationSec);
            osc.connect(g);
            if (masterBusGainRef.current) {
                g.connect(masterBusGainRef.current);
            } else {
                g.connect(ctx.destination);
            }
            osc.start();
            setTimeout(() => {
                try { osc.stop(); } catch {}
                try { osc.disconnect(); } catch {}
                try { g.disconnect(); } catch {}
            }, durationSec * 1000 + 100);
        } catch {}
    }, [ensureEarthShatterBus, isMuted]);

    // Rumble bursts: deeper bass profile with sub and lowshelf filter
    const triggerRumbleBurst = useCallback((freq: number = 48, peakGain: number = 0.22, attackSec: number = 0.08, releaseSec: number = 0.9) => {
        try {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AC || isMuted) return;
            const ctx = audioCtxRef.current ?? new AC({ latencyHint: 'playback' } as any);
            audioCtxRef.current = ctx;
            ensureEarthShatterBus();

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            const sub = ctx.createOscillator();
            sub.type = 'sine';
            sub.frequency.setValueAtTime(freq / 2, ctx.currentTime);

            const g = ctx.createGain();
            const subG = ctx.createGain();
            const sumG = ctx.createGain();

            // Envelope
            g.gain.setValueAtTime(0.0, ctx.currentTime);
            g.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + attackSec);
            g.gain.linearRampToValueAtTime(0.0, ctx.currentTime + releaseSec);

            subG.gain.setValueAtTime(0.0, ctx.currentTime);
            subG.gain.linearRampToValueAtTime(peakGain * 0.25, ctx.currentTime + attackSec);
            subG.gain.linearRampToValueAtTime(0.0, ctx.currentTime + releaseSec);

            const shelf = ctx.createBiquadFilter();
            shelf.type = 'lowshelf';
            shelf.frequency.setValueAtTime(80, ctx.currentTime);
            shelf.gain.setValueAtTime(6, ctx.currentTime);

            osc.connect(g);
            sub.connect(subG);
            g.connect(sumG);
            subG.connect(sumG);
            sumG.connect(shelf);

            if (masterBusGainRef.current) {
                shelf.connect(masterBusGainRef.current);
            } else {
                shelf.connect(ctx.destination);
            }

            osc.start();
            sub.start();

            const stopMs = (releaseSec * 1000) + 200;
            setTimeout(() => {
                try { osc.stop(); } catch {}
                try { sub.stop(); } catch {}
                try { osc.disconnect(); } catch {}
                try { sub.disconnect(); } catch {}
                try { g.disconnect(); } catch {}
                try { subG.disconnect(); } catch {}
                try { sumG.disconnect(); } catch {}
                try { shelf.disconnect(); } catch {}
            }, stopMs);
        } catch {}
    }, [ensureEarthShatterBus, isMuted]);

    // Impact-only: optional curated cue-based pulses using player time polling
    const rumbleCuePollRef = useRef<number | null>(null);
    const imaxCueTimesRef = useRef<number[]>([]);
    const seenCueIndexRef = useRef<number>(-1);
    const loadImaxCuesForTrailer = useCallback(async (ytKey: string) => {
        try {
            // Attempt to fetch per-trailer cue metadata if available (optional)
            const resp = await fetch(`assets/imax_collection/metadata/${ytKey}.json`);
            if (!resp.ok) { imaxCueTimesRef.current = []; return; }
            const data = await resp.json();
            const cues: number[] = Array.isArray(data?.impactCues)
                ? data.impactCues.filter((n: any) => typeof n === 'number').sort((a: number, b: number) => a - b)
                : [];
            imaxCueTimesRef.current = cues;
        } catch {
            imaxCueTimesRef.current = [];
        }
    }, []);

    const startCuePolling = useCallback(() => {
        try {
            if (rumbleCuePollRef.current) return;
            const poll = () => {
                try {
                    const player: any = ytPlayerRef.current;
                    if (!player || typeof player.getCurrentTime !== 'function') {
                        rumbleCuePollRef.current = window.requestAnimationFrame(poll);
                        return;
                    }
                    const t = player.getCurrentTime();
                    const cues = imaxCueTimesRef.current;
                    if (!isMuted && cues.length > 0) {
                        // fire when we pass a new cue within a small window
                        const nextIdx = seenCueIndexRef.current + 1;
                        const nextTime = cues[nextIdx];
                        if (typeof nextTime === 'number' && t >= nextTime && t <= nextTime + 0.25) {
                            triggerRumbleBurst(50, 0.24, 0.06, 1.0);
                            seenCueIndexRef.current = nextIdx;
                        }
                    }
                } catch {}
                rumbleCuePollRef.current = window.requestAnimationFrame(poll);
            };
            rumbleCuePollRef.current = window.requestAnimationFrame(poll);
        } catch {}
    }, [isMuted, triggerRumbleBurst]);

    const stopCuePolling = useCallback(() => {
        if (rumbleCuePollRef.current) {
            window.cancelAnimationFrame(rumbleCuePollRef.current);
            rumbleCuePollRef.current = null;
        }
        seenCueIndexRef.current = -1;
        imaxCueTimesRef.current = [];
    }, []);

    // Disable phase-driven rumble/pulses; rely solely on bus amplification
    useEffect(() => {
        if (imaxPhase !== 'trailer') {
            stopQuakeLfo();
            stopCuePolling();
        }
    }, [imaxPhase, stopQuakeLfo, stopCuePolling]);

    // Respect mute for rumble + spatial gains
    useEffect(() => {
        try {
            if (rumbleGainRef.current) {
                const ctx = audioCtxRef.current;
                const now = ctx?.currentTime ?? 0;
                const target = isMuted ? 0.0 : 0.08;
                const gain = rumbleGainRef.current.gain;
                try { gain.cancelScheduledValues?.(now); } catch {}
                try { gain.setValueAtTime(target, now); } catch {}
            }
            if (spatialGainRef.current) {
                const ctx = audioCtxRef.current;
                const now = ctx?.currentTime ?? 0;
                const target = isMuted ? 0.0 : 0.06;
                const gain = spatialGainRef.current.gain;
                try { gain.cancelScheduledValues?.(now); } catch {}
                try { gain.setValueAtTime(target, now); } catch {}
            }
        } catch {}
    }, [isMuted]);

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

    const handleWhereToStreamAI = useCallback(async () => {
        if (!details) return;
        setIsStreamingAILoading(true);
        setStreamingAIError(null);
        setStreamingAI(null);
        try {
            const title = 'title' in details ? details.title : details.name;
            let preferredCountry: string | null = null;
            try { preferredCountry = localStorage.getItem('choicegpt:lastCountry'); } catch {}
            const q = `Where can I stream "${title}" in ${preferredCountry || country?.name || country?.code || 'my country'}? Prefer local services and provide links if available.`;
            let text = '';
            try {
                const resp = await fetch(`/api/choicegpt/search?q=${encodeURIComponent(q)}&model=gemini-search`);
                if (resp.ok) {
                    text = await resp.text();
                }
            } catch {}
            if (!text) {
                const direct = await fetch(`https://text.pollinations.ai/${encodeURIComponent(q)}?model=gemini-search`);
                text = await direct.text();
            }
            setStreamingAI(text);
        } catch (e: any) {
            setStreamingAIError('Service connectivity issue while searching.');
        } finally {
            setIsStreamingAILoading(false);
        }
    }, [details, country]);



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
                const credits = item.media_type === 'movie'
                    ? await getMovieCredits(apiKey, item.id)
                    : await getTVShowCredits(apiKey, item.id);
                fetchedDetails.credits = credits;

                // Fetch watch providers from TMDb
                const providers = item.media_type === 'movie'
                    ? await getMovieWatchProviders(apiKey, item.id, country.code)
                    : await getTVShowWatchProviders(apiKey, item.id, country.code);

                // Set watch providers
                (fetchedDetails as any)['watch/providers'] = providers;

                // Fetch videos/trailers from TMDb
                const videos = item.media_type === 'movie'
                    ? await getMovieVideos(apiKey, item.id)
                    : await getTVShowVideos(apiKey, item.id);
                (fetchedDetails as any).videos = videos;

                // Default season selection for TV shows
                if (item.media_type === 'tv' && Array.isArray((fetchedDetails as any).seasons)) {
                    const seasonsArr = (fetchedDetails as any).seasons as Array<any>;
                    const latest = seasonsArr
                        .filter(s => typeof s?.season_number === 'number')
                        .sort((a, b) => a.season_number - b.season_number)
                        .slice(-1)[0];
                    setSelectedSeasonNumber(latest?.season_number ?? seasonsArr[0]?.season_number ?? 1);
                } else {
                    setSelectedSeasonNumber(null);
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
                    setOmdbError(null);
                    try {
                        const omdbInfo = await getOMDbFromTMDBDetails(fetchedDetails);
                        if (isMounted && omdbInfo) {
                            setOmdbData(omdbInfo);
                        }
                    } catch (omdbError) {
                        console.warn('OMDb data not available:', omdbError);
                        if (isMounted) {
                            const msg = omdbError instanceof Error ? omdbError.message : 'Unable to load OMDb data';
                            setOmdbError(msg);
                        }
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

    // Resolve backdrop using TMDb images and set fallback immediately
    useEffect(() => {
        let cancelled = false;
        const resolveBackdrop = async () => {
            if (!details) return;
            // Set TMDb fallback immediately
            const tmdbFallback = details.backdrop_path ? `${IMAGE_BASE_URL}original${details.backdrop_path}` : '';
            if (!cancelled) setBackdropUrl(tmdbFallback);

            try {
                if (item.media_type === 'movie') {
                    const images = await getMovieImages(apiKey, item.id);
                    const backdrops = Array.isArray(images?.backdrops) ? images.backdrops : [];
                    if (backdrops.length > 0) {
                        const pick = backdrops
                            .slice()
                            .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0))[0];
                        if (pick?.file_path && !cancelled) {
                            setBackdropUrl(`${IMAGE_BASE_URL}original${pick.file_path}`);
                        }
                    }
                } else {
                    const images = await getTVShowImages(apiKey, item.id);
                    const backdrops = Array.isArray(images?.backdrops) ? images.backdrops : [];
                    if (backdrops.length > 0) {
                        const pick = backdrops
                            .slice()
                            .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0))[0];
                    
                        if (pick?.file_path && !cancelled) {
                            setBackdropUrl(`${IMAGE_BASE_URL}original${pick.file_path}`);
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to resolve backdrop; using TMDb fallback:', err);
            }
        };
        resolveBackdrop();
        return () => { cancelled = true; };
    }, [details, item.media_type, item.id, apiKey]);

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

    const handleGenerateAIReviews = async () => {
        if (!details) return;
        setIsReviewsAILoading(true);
        setReviewsAIError(null);
        setReviewsAI(null);
        try {
            const title = 'title' in details ? details.title : details.name;
            const overview = details.overview || '';
            const rating = details.vote_average || 0;
            const genres = (details.genres || []).map(g => g?.name).filter(Boolean) as string[];

            let sources: string[] = [];
            try {
                if (item.media_type === 'movie') {
                    let reviews = rtReviews;
                    if (!reviews || reviews.length === 0) {
                        const releaseDate = 'release_date' in details ? details.release_date : undefined;
                        const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
                        const tomatoURL = (omdbData as any)?.tomatoURL as string | undefined;
                        const fetched = await fetchRtCriticReviews({ title, year, tomatoURL });
                        reviews = fetched.reviews;
                        if (!rtReviews && fetched.reviews) setRtReviews(fetched.reviews);
                        if (!rtSourceUrl && fetched.sourceUrl) setRtSourceUrl(fetched.sourceUrl);
                    }
                    sources = (reviews || [])
                        .map(r => {
                            const who = r.critic?.name ? `${r.critic.name}` : 'Critic';
                            const pub = r.source ? ` @ ${r.source}` : '';
                            const quote = r.quote ? `: "${r.quote}"` : '';
                            return `${who}${pub}${quote}`.trim();
                        })
                        .filter(s => s.length > 0)
                        .slice(0, 8);
                }
            } catch {
                // ignore source fetch errors; we'll fall back below
            }

            if (sources.length === 0) {
                const consensus = omdbData ? extractRottenTomatoesConsensus(omdbData) : null;
                if (consensus) sources.push(`Critics Consensus: ${consensus}`);
                if (omdbData?.imdbRating && omdbData.imdbRating !== 'N/A') {
                    sources.push(`IMDb Rating: ${omdbData.imdbRating}/10`);
                }
            }

            const aiReviews = await generateReviewsAIWithSources(title, overview, rating, genres, sources);
            setReviewsAI(typeof aiReviews === 'string' ? aiReviews : String(aiReviews));
        } catch (err: any) {
            setReviewsAIError(err?.message || 'Failed to generate AI reviews');
        } finally {
            setIsReviewsAILoading(false);
        }
    };

    const [mainTrailerKey, setMainTrailerKey] = useState<string | null>(null);
    useEffect(() => {
        // Prefer curated trailer key for curated IMAX titles
        const curatedKey = getCuratedTrailerKeyForItem(item);
        if (curatedKey) {
            setMainTrailerKey(curatedKey);
            return;
        }

        // Derive the main YouTube trailer key from TMDb videos in details
        if (!details || !(details as any).videos || !Array.isArray((details as any).videos.results)) {
            setMainTrailerKey(null);
            return;
        }
        const videos = (details as any).videos.results as Array<any>;
        const pick = (predicate: (v: any) => boolean) => videos.find(predicate);
        // If IMAX mode is enabled, attempt to select an IMAX-specific trailer first
        let primary: any = null;
        const imaxCandidates = filterImaxVideos(videos as any);
        if (Array.isArray(imaxCandidates) && imaxCandidates.length > 0 && preferImaxTrailer) {
            primary = imaxCandidates[0];
        }
        // Fallback to standard selection if no IMAX match or not in IMAX mode
        if (!primary) {
            primary =
                pick(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
                pick(v => v.site === 'YouTube' && v.type === 'Trailer') ||
                pick(v => v.site === 'YouTube' && v.type === 'Teaser') ||
                pick(v => v.site === 'YouTube');
        }
        setMainTrailerKey(primary?.key ?? null);
    }, [item, details, preferImaxTrailer]);

    // Load season details when a season is selected (TV only)
    useEffect(() => {
        let cancelled = false;
        const loadSeason = async () => {
            if (item.media_type !== 'tv' || !selectedSeasonNumber) {
                setSeasonDetails(null);
                setSeasonError(null);
                return;
            }
            setIsSeasonLoading(true);
            setSeasonError(null);
            try {
                const sd = await getTVSeasonDetails(apiKey, item.id, selectedSeasonNumber);
                if (!cancelled) setSeasonDetails(sd);
            } catch (err: any) {
                if (!cancelled) setSeasonError(err?.message || 'Failed to load season details');
            } finally {
                if (!cancelled) setIsSeasonLoading(false);
            }
        };
        loadSeason();
        return () => { cancelled = true; };
    }, [apiKey, item.id, item.media_type, selectedSeasonNumber]);

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

    // RT/IMDb review toggles
    
    // Initialize YouTube IFrame API player when entering trailer phase and detect end
    useEffect(() => {
        if (!(imaxPhase === 'trailer' && mainTrailerKey)) return;

        const createPlayer = () => {
            try {
                const YT = (window as any).YT;
                if (!YT || !YT.Player) return;
                if (ytPlayerRef.current) return;
                ytPlayerRef.current = new YT.Player('imaxTrailerPlayer', {
                    videoId: mainTrailerKey,
                    playerVars: {
                        autoplay: 1,
                        mute: isMuted ? 1 : 0,
                        controls: 0,
                        modestbranding: 1,
                        rel: 0,
                        origin: window.location.origin
                    },
                    events: {
                        onStateChange: (event: any) => {
                            try {
                                const ENDED = (window as any).YT?.PlayerState?.ENDED ?? 0;
                                if (event?.data === ENDED) {
                                    // Exit to IMAX page when trailer finishes
                                    handleCloseWithCurtain();
                                    try { navigate('/IMAX'); } catch {}
                                }
                            } catch {}
                        }
                    }
                });
            } catch {}
        };

        if (!(window as any).YT || !(window as any).YT.Player) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.async = true;
            document.body.appendChild(tag);
            const prev = (window as any).onYouTubeIframeAPIReady;
            (window as any).onYouTubeIframeAPIReady = () => {
                try { createPlayer(); } catch {}
                if (typeof prev === 'function') {
                    try { prev(); } catch {}
                }
            };
        } else {
            createPlayer();
        }

        return () => {
            try {
                if (ytPlayerRef.current) {
                    ytPlayerRef.current.destroy();
                    ytPlayerRef.current = null;
                }
            } catch {}
        };
    }, [imaxPhase, mainTrailerKey, isMuted, navigate, handleCloseWithCurtain]);

    // Trailer-only effect: no synthetic rumble or pulses; ensure bus exists
    useEffect(() => {
        if (imaxPhase === 'trailer') {
            ensureEarthShatterBus();
        }
        return () => {
            if (imaxPhase === 'trailer') {
                stopQuakeLfo();
                stopCuePolling();
            }
        };
    }, [imaxPhase, ensureEarthShatterBus, stopQuakeLfo, stopCuePolling]);

    
    const handleViewRTReviews = () => {
        setShowRTReviews(true);
        setShowIMDBReviews(false);
        // Prefetch RT critics reviews when toggling on
        if (!isRtLoading && !rtReviews && item.media_type === 'movie') {
            loadRtCriticReviews();
        }
    };
    const handleViewIMDBReviews = () => {
        setShowIMDBReviews(true);
        setShowRTReviews(false);
    };

    // Load Rotten Tomatoes critic reviews for the current movie
    const loadRtCriticReviews = async () => {
        if (!details || item.media_type !== 'movie') return;
        try {
            setIsRtLoading(true);
            setRtError(null);
            setRtReviews(null);
            const title = 'title' in details ? details.title : details.name;
            const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
            const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
            const tomatoURL = (omdbData as any)?.tomatoURL as string | undefined;
            const { reviews, sourceUrl } = await fetchRtCriticReviews({ title, year, tomatoURL });
            setRtReviews(reviews);
            setRtSourceUrl(sourceUrl || null);
        } catch (err: any) {
            const msg = err?.message || 'Failed to load Rotten Tomatoes reviews';
            setRtError(msg);
        } finally {
            setIsRtLoading(false);
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
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{
                    background: tokens.colors.background.primary
                }}
            >
                <Loader />
            </div>
        );
    }

    // Determine whether the selected trailer key is part of official IMAX list
    // Note: compute as a plain boolean (not a hook) to avoid changing hook order across renders
    const isImaxOfficialTrailer = IMAX_TRAILER_IDS.includes(mainTrailerKey ?? '');

    if (error || !details) {
        return (
            <div 
                className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                style={{
                    background: tokens.colors.background.primary,
                    padding: tokens.spacing.large
                }}
            >
                <p 
                    className="mb-4"
                    style={{
                        fontSize: tokens.typography.sizes.title3,
                        color: tokens.colors.system.red,
                        fontFamily: tokens.typography.families.text
                    }}
                >
                    {error || "Something went wrong."}
                </p>
                <button 
                    onClick={onClose} 
                    onMouseEnter={applyHoverEffect}
                    onMouseDown={applyPressEffect}
                    className="rounded-lg backdrop-blur-xl border transition-all duration-300"
                    style={{
                        padding: `${tokens.spacing.small} ${tokens.spacing.medium}`,
                        background: `linear-gradient(135deg, ${tokens.colors.background.secondary}E6, ${tokens.colors.background.primary}E6)`,
                        borderColor: tokens.colors.border.primary,
                        color: tokens.colors.text.primary,
                        fontFamily: tokens.typography.families.text,
                        fontSize: tokens.typography.sizes.body,
                        fontWeight: tokens.typography.weights.medium
                    }}
                >
                    Go Back
                </button>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.large }}>
                        <div 
                            ref={trailerContainerRef}
                            className="text-center backdrop-blur-xl border"
                            style={{
                                background: trailerAdaptiveStyles.background,
                                backdropFilter: trailerAdaptiveStyles.backdropFilter,
                                WebkitBackdropFilter: trailerAdaptiveStyles.WebkitBackdropFilter,
                                borderColor: trailerAdaptiveStyles.borderColor,
                                boxShadow: trailerAdaptiveStyles.boxShadow,
                                borderRadius: `${tokens.borderRadius.xlarge}px`,
                                padding: tokens.spacing.medium,
                                marginBottom: tokens.spacing.large,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                transition: tokens.interactions.transitions.fast
                            }}
                        >
                            <motion.button
                                onClick={handlePlayTrailer}
                                disabled={!mainTrailerKey}
                                onMouseEnter={!mainTrailerKey ? undefined : applyHoverEffect}
                                onMouseDown={!mainTrailerKey ? undefined : applyPressEffect}
                                whileHover={!mainTrailerKey ? {} : { scale: 1.02 }}
                                whileTap={!mainTrailerKey ? {} : { scale: 0.98 }}
                                className="flex items-center justify-center backdrop-blur-xl border"
                                aria-label={mainTrailerKey ? 'Play trailer' : 'No trailer available'}
                                style={{
                                    padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}px`,
                                    gap: tokens.spacing.small,
                                    borderRadius: `${tokens.borderRadius.xxlarge}px`,
                                    minHeight: '44px',
                                    fontFamily: tokens.typography.families.text,
                                    fontSize: tokens.typography.sizes.body,
                                    fontWeight: tokens.typography.weights.semibold,
                                    background: mainTrailerKey 
                                        ? tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)'
                                        : tokens?.materials?.pill?.secondary?.background || 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                                    WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                                    borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                                    color: tokens.colors.text.primary,
                                    boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)',
                                    opacity: !mainTrailerKey ? 0.5 : 1,
                                    cursor: !mainTrailerKey ? 'not-allowed' : 'pointer',
                                    transition: tokens.interactions.transitions.fast,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Play 
                                    size={20}
                                    fill="currentColor"
                                    aria-hidden="true"
                                />
                                {mainTrailerKey ? 'Play Trailer' : 'No Trailer Available'}
                            </motion.button>
                        </div>

                        <motion.div 
                            ref={descriptionPanelRef}
                            className="backdrop-blur-xl border"
                            onMouseEnter={applyHoverEffect}
                            onMouseDown={applyPressEffect}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            style={{
                                background: descriptionAdaptiveStyles.background,
                                backdropFilter: descriptionAdaptiveStyles.backdropFilter,
                                WebkitBackdropFilter: descriptionAdaptiveStyles.WebkitBackdropFilter,
                                borderColor: descriptionAdaptiveStyles.borderColor,
                                boxShadow: descriptionAdaptiveStyles.boxShadow,
                                borderRadius: `${tokens.borderRadius.xxlarge}px`,
                                padding: tokens.spacing.large,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: tokens.spacing.large,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                transition: tokens.interactions.transitions.fast,
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default'
                            }}
                        >
                            <p 
                                style={{
                                    color: 'white',
                                    lineHeight: '1.6',
                                    fontSize: tokens.typography.sizes.body,
                                    fontFamily: tokens.typography.families.text
                                }}
                            >
                                {details.overview}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: tokens.spacing.medium }}>
                                {hasStreamingAvailability && (
                                    <div>
                                        <h3 
                                            style={{
                                                fontWeight: tokens.typography.weights.semibold,
                                                color: 'white',
                                                marginBottom: tokens.spacing.small,
                                                fontFamily: tokens.typography.families.text,
                                                fontSize: tokens.typography.sizes.title3
                                            }}
                                        >
                                            Where to Watch
                                        </h3>
                                        
                                        
                                    </div>
                                )}

                                <div>
                                    <h3 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: 'white',
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.title3
                                        }}
                                    >
                                        Details
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.small }}>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Rating:</span> {details.vote_average.toFixed(1)}/10
                                        </p>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Year:</span> {year}
                                        </p>
                                        {runtimeInfo && (
                                            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>
                                                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Duration:</span> {runtimeInfo}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            
                        </motion.div>
                    </div>
                );
            case 'cast':
                return (
                    <div>
                        <h3 
                            style={{
                                fontSize: tokens.typography.sizes.title3,
                                fontWeight: tokens.typography.weights.bold,
                                marginBottom: tokens.spacing.medium,
                                color: tokens.colors.text.primary,
                                fontFamily: tokens.typography.families.text
                            }}
                        >
                            Top Billed Cast
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" style={{ gap: tokens.spacing.medium }}>
                            {details.credits?.cast?.slice(0, 15).map(member => member && (
                                <div 
                                    key={member.id} 
                                    className="text-center"
                                    style={{
                                        background: tokens?.materials?.pill?.primary?.background || `rgba(255, 255, 255, 0.1)`,
                                        backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                                        WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                                        borderColor: tokens?.colors?.border?.primary || 'rgba(255, 255, 255, 0.2)',
                                        boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.12)',
                                        borderRadius: '16px',
                                        border: '1px solid',
                                        padding: tokens.spacing.medium,
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            marginBottom: tokens.spacing.small,
                                            borderRadius: '12px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <img
                                            src={member.profile_path ? `${IMAGE_BASE_URL}w185${member.profile_path}` : 'https://via.placeholder.com/185x278/333/fff?text=N/A'}
                                            alt={member.name}
                                            className="w-full aspect-[2/3] object-cover"
                                            style={{
                                                background: `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                                filter: member.profile_path ? 'none' : 'brightness(0.7)'
                                            }}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://via.placeholder.com/185x278/333/fff?text=N/A';
                                            }}
                                        />
                                    </div>
                                    <p 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            fontSize: tokens.typography.sizes.caption1,
                                            color: tokens.colors.text.primary,
                                            fontFamily: tokens.typography.families.text,
                                            marginBottom: tokens.spacing.small / 2,
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {member.name}
                                    </p>
                                    <p 
                                        style={{
                                            fontSize: tokens.typography.sizes.caption2,
                                            color: tokens.colors.text.tertiary,
                                            fontFamily: tokens.typography.families.text,
                                            lineHeight: 1.3,
                                            opacity: 0.8
                                        }}
                                    >
                                        {member.character}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'episodes':
                return (
                    <div>
                        <h3 
                            style={{
                                fontSize: tokens.typography.sizes.title3,
                                fontWeight: tokens.typography.weights.bold,
                                marginBottom: tokens.spacing.medium,
                                color: tokens.colors.text.primary,
                                fontFamily: tokens.typography.families.text
                            }}
                        >
                            Seasons & Episodes
                        </h3>
                        {item.media_type !== 'tv' ? (
                            <div className="rounded-xl border p-3" style={{
                                borderColor: tokens.colors.border.primary,
                                background: `${tokens.colors.background.secondary}80`,
                                color: tokens.colors.text.secondary
                            }}>
                                Episodes are available for TV shows only.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.large }}>
                                <div className="rounded-xl backdrop-blur-xl border" style={{
                                    background: `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                    borderColor: tokens.colors.border.primary,
                                    padding: tokens.spacing.medium
                                }}>
                                    <div className="flex items-center" style={{ gap: tokens.spacing.small }}>
                                        <label htmlFor="season-select" style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: tokens.colors.text.primary,
                                            fontFamily: tokens.typography.families.text
                                        }}>
                                            Select Season
                                        </label>
                                        <select
                                            id="season-select"
                                            value={selectedSeasonNumber ?? ''}
                                            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                                            className="rounded-xl backdrop-blur-xl border"
                                            style={{
                                                padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}`,
                                                background: `${tokens.colors.background.secondary}60`,
                                                borderColor: tokens.colors.border.primary,
                                                color: tokens.colors.text.primary,
                                                fontFamily: tokens.typography.families.text,
                                                fontSize: tokens.typography.sizes.body
                                            }}
                                        >
                                            <option value="" disabled>Select a season</option>
                                            {((details as TVShowDetails)?.seasons ?? []).map((s) => (
                                                <option key={s.season_number} value={s.season_number}>
                                                    Season {s.season_number} {s.name && s.name !== `Season ${s.season_number}` ? `— ${s.name}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="rounded-xl backdrop-blur-xl border" style={{
                                    background: `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                    borderColor: tokens.colors.border.primary,
                                    padding: tokens.spacing.medium
                                }}>
                                    <h4 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: tokens.colors.system.blue,
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        Where to Watch this Season
                                    </h4>
                                    <WhereToWatch providers={providersForCountry} providerIds={providerIds} />
                                </div>

                                <div className="rounded-xl backdrop-blur-xl border" style={{
                                    background: `${tokens.colors.background.secondary}CC`,
                                    borderColor: tokens.colors.border.primary,
                                    padding: tokens.spacing.medium
                                }}>
                                    <h4 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: tokens.colors.text.primary,
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        {selectedSeasonNumber ? `Episodes in Season ${selectedSeasonNumber}` : 'Episodes'}
                                    </h4>
                                    {isSeasonLoading && (
                                        <div className="mt-2">
                                            <Loader />
                                        </div>
                                    )}
                                    {seasonError && (
                                        <div className="rounded-xl border p-3" style={{
                                            borderColor: tokens.colors.border.primary,
                                            background: `${tokens.colors.background.secondary}80`,
                                            color: tokens.colors.text.secondary
                                        }}>
                                            {seasonError}
                                        </div>
                                    )}
                                    {!isSeasonLoading && !seasonError && (!seasonDetails || !seasonDetails.episodes || seasonDetails.episodes.length === 0) && (
                                        <div className="rounded-xl border p-3" style={{
                                            borderColor: tokens.colors.border.primary,
                                            background: `${tokens.colors.background.secondary}80`,
                                            color: tokens.colors.text.secondary
                                        }}>
                                            {selectedSeasonNumber ? 'No episode information available for this season.' : 'Select a season to view episodes.'}
                                        </div>
                                    )}
                                    {!isSeasonLoading && !seasonError && seasonDetails?.episodes && seasonDetails.episodes.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: tokens.spacing.medium }}>
                                            {seasonDetails.episodes.map((ep) => (
                                                <div key={ep.id} className="rounded-xl backdrop-blur-xl border" style={{
                                                    background: `${tokens.colors.background.secondary}80`,
                                                    borderColor: tokens.colors.border.primary,
                                                    padding: tokens.spacing.small
                                                }}>
                                                    <div className="flex items-start" style={{ gap: tokens.spacing.small }}>
                                                        {ep.still_path ? (
                                                            <img
                                                                src={`${IMAGE_BASE_URL}w300${ep.still_path}`}
                                                                alt={ep.name}
                                                                className="w-24 h-24 object-cover rounded-lg"
                                                                style={{ border: `1px solid ${tokens.colors.separator.opaque}` }}
                                                            />
                                                        ) : null}
                                                        <div className="flex-1">
                                                            <h5 style={{
                                                                fontWeight: tokens.typography.weights.semibold,
                                                                color: tokens.colors.text.primary,
                                                                fontFamily: tokens.typography.families.text,
                                                                fontSize: tokens.typography.sizes.body
                                                            }}>
                                                                S{selectedSeasonNumber}E{ep.episode_number}: {ep.name}
                                                            </h5>
                                                            <div style={{ color: tokens.colors.text.tertiary, fontSize: tokens.typography.sizes.caption2 }}>
                                                                {ep.air_date ? new Date(ep.air_date).toLocaleDateString() : 'Unknown air date'}
                                                                {typeof ep.runtime === 'number' && ep.runtime > 0 ? ` • ${ep.runtime}m` : ''}
                                                            </div>
                                                            {ep.overview && (
                                                                <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text, marginTop: tokens.spacing.micro[2] }}>
                                                                    {ep.overview}
                                                                </p>
                                                            )}
                                                            {hasStreamingAvailability && (
                                                                <div className="flex flex-wrap" style={{ gap: tokens.spacing.micro[1], marginTop: tokens.spacing.small }}>
                                                                    {availabilityDescriptors.slice(0, 3).map(descriptor => (
                                                                        <span
                                                                            key={descriptor.type}
                                                                            className="rounded-full backdrop-blur-xl border"
                                                                            style={{
                                                                                background: `${tokens.colors.background.secondary}80`,
                                                                                borderColor: tokens.colors.border.primary,
                                                                                padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.small}`,
                                                                                fontSize: tokens.typography.sizes.caption2,
                                                                                fontFamily: tokens.typography.families.text
                                                                            }}
                                                                        >
                                                                            <span 
                                                                                style={{
                                                                                    fontWeight: tokens.typography.weights.semibold,
                                                                                    color: tokens.colors.text.primary,
                                                                                    marginRight: tokens.spacing.micro[1]
                                                                                }}
                                                                            >
                                                                                {descriptor.type}:
                                                                            </span>
                                                                            <span style={{ color: tokens.colors.text.secondary }}>
                                                                                {descriptor.text}
                                                                            </span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'reviews':
                return (
                    <div>
                        <h3 
                            style={{
                                fontSize: tokens.typography.sizes.title3,
                                fontWeight: tokens.typography.weights.bold,
                                marginBottom: tokens.spacing.medium,
                                color: tokens.colors.text.primary,
                                fontFamily: tokens.typography.families.text
                            }}
                        >
                            Reviews & Analysis
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.large }}>
            {!storyScape && !isStoryScapeLoading && !storyScapeError && (
                <button 
                    onClick={handleGenerateStoryScape} 
                    onMouseEnter={applyHoverEffect}
                    onMouseDown={applyPressEffect}
                    className="rounded-xl backdrop-blur-xl border transition-all duration-300"
                    style={{
                        padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                        background: `linear-gradient(135deg, ${tokens.colors.system.purple}, ${tokens.colors.system.purple}E6)`,
                        borderColor: tokens.colors.border.primary,
                        color: tokens.colors.text.primary,
                        fontFamily: tokens.typography.families.text,
                        fontWeight: tokens.typography.weights.bold,
                        fontSize: tokens.typography.sizes.body
                    }}
                >
                    Generate AI Summary
                </button>
            )}

                            {!reviewsAI && !isReviewsAILoading && !reviewsAIError && (
                                <button
                                    onClick={handleGenerateAIReviews}
                                    onMouseEnter={applyHoverEffect}
                                    onMouseDown={applyPressEffect}
                                    className="rounded-xl backdrop-blur-xl border transition-all duration-300"
                                    style={{
                                        padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                                        background: `linear-gradient(135deg, ${tokens.colors.system.blue}, ${tokens.colors.system.blue}E6)`,
                                        borderColor: tokens.colors.border.primary,
                                        color: tokens.colors.text.primary,
                                        fontFamily: tokens.typography.families.text,
                                        fontWeight: tokens.typography.weights.bold,
                                        fontSize: tokens.typography.sizes.body
                                    }}
                                >
                                    Generate AI Reviews
                                </button>
                            )}

                            {storyScape && (
                                <div 
                                    className="rounded-xl backdrop-blur-xl border"
                                    style={{
                                        background: `linear-gradient(135deg, ${tokens.colors.background.secondary}80, ${tokens.colors.background.primary}80)`,
                                        borderColor: tokens.colors.border.primary,
                                        padding: tokens.spacing.medium
                                    }}
                                >
                                    <h4 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: tokens.colors.system.purple,
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        AI Analysis
                                    </h4>
                                    <p 
                                        style={{
                                            color: tokens.colors.text.primary,
                                            fontStyle: 'italic',
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        "{storyScape.summary}"
                                    </p>
                                    <div className="flex flex-col sm:flex-row" style={{ gap: tokens.spacing.medium, fontSize: tokens.typography.sizes.caption1 }}>
                                        <div>
                                            <h5 
                                                style={{
                                                    fontWeight: tokens.typography.weights.semibold,
                                                    color: tokens.colors.text.tertiary,
                                                    fontFamily: tokens.typography.families.text
                                                }}
                                            >
                                                Emotional Tone
                                            </h5>
                                            <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text }}>
                                                {storyScape.tone}
                                            </p>
                                        </div>
                                        <div>
                                            <h5 
                                                style={{
                                                    fontWeight: tokens.typography.weights.semibold,
                                                    color: tokens.colors.text.tertiary,
                                                    fontFamily: tokens.typography.families.text
                                                }}
                                            >
                                                Cinematic Style
                                            </h5>
                                            <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text }}>
                                                {storyScape.style}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isReviewsAILoading && (
                                <div className="mt-2">
                                    <Loader />
                                </div>
                            )}
                            {reviewsAIError && (
                                <div className="rounded-xl border p-3" style={{
                                    borderColor: tokens.colors.border.primary,
                                    background: `${tokens.colors.background.secondary}80`,
                                    color: tokens.colors.text.secondary
                                }}>
                                    {reviewsAIError}
                                </div>
                            )}
                            {reviewsAI && (
                                <div 
                                    className="rounded-xl backdrop-blur-xl border"
                                    style={{
                                        background: `${tokens.colors.background.secondary}CC`,
                                        borderColor: tokens.colors.border.primary,
                                        padding: tokens.spacing.medium
                                    }}
                                >
                                    <h4 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: tokens.colors.system.blue,
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        AI Reviews
                                    </h4>
                                    {reviewsAI.split('\n\n').map((para, idx) => (
                                        <p key={idx} style={{ color: tokens.colors.text.primary, fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.body, marginBottom: tokens.spacing.small }}>
                                            {para}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {item.media_type === 'movie' && (
                                <div className="flex flex-wrap items-center" style={{ gap: tokens.spacing.small }}>
                                    <button
                                        onClick={handleViewRTReviews}
                                        onMouseEnter={applyHoverEffect}
                                        onMouseDown={applyPressEffect}
                                        className="rounded-xl backdrop-blur-xl border transition-all duration-300"
                                        style={{
                                            padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                                            background: `linear-gradient(135deg, ${tokens.colors.system.red}, ${tokens.colors.system.red}E6)`,
                                            borderColor: tokens.colors.border.primary,
                                            color: tokens.colors.text.primary,
                                            fontFamily: tokens.typography.families.text,
                                            fontWeight: tokens.typography.weights.bold,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        View RT Reviews
                                    </button>
                                    <button
                                        onClick={handleViewIMDBReviews}
                                        onMouseEnter={applyHoverEffect}
                                        onMouseDown={applyPressEffect}
                                        className="rounded-xl backdrop-blur-xl border transition-all duration-300"
                                        style={{
                                            padding: `${tokens.spacing.small} ${tokens.spacing.large}`,
                                            background: `linear-gradient(135deg, ${tokens.colors.system.blue}, ${tokens.colors.system.blue}E6)`,
                                            borderColor: tokens.colors.border.primary,
                                            color: tokens.colors.text.primary,
                                            fontFamily: tokens.typography.families.text,
                                            fontWeight: tokens.typography.weights.bold,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        View IMDb Reviews
                                    </button>
                                    {isOmdbLoading && (
                                        <div className="ml-2">
                                            <Loader />
                                        </div>
                                    )}
                                    {!isOmdbLoading && !omdbData && (
                                        <div className="mt-2 w-full">
                                            {!hasOMDbKey() ? (
                                                <div className="rounded-xl border p-3" style={{
                                                    borderColor: tokens.colors.border.primary,
                                                    background: `${tokens.colors.background.secondary}80`,
                                                    color: tokens.colors.text.secondary
                                                }}>
                                                    OMDb key not set. Add `omdb_api_key` in localStorage or `VITE_OMDB_API_KEY` in your env to enable reviews.
                                                </div>
                                            ) : omdbError ? (
                                                <div className="rounded-xl border p-3" style={{
                                                    borderColor: tokens.colors.border.primary,
                                                    background: `${tokens.colors.background.secondary}80`,
                                                    color: tokens.colors.text.secondary
                                                }}>
                                                    Couldn’t load OMDb reviews ({omdbError}). This may be due to network restrictions in the preview environment.
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border p-3" style={{
                                                    borderColor: tokens.colors.border.primary,
                                                    background: `${tokens.colors.background.secondary}80`,
                                                    color: tokens.colors.text.secondary
                                                }}>
                                                    No OMDb review data found for this title.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {(omdbData && item.media_type === 'movie' && showRTReviews) && (
                                <div 
                                    className="rounded-xl backdrop-blur-xl border"
                                    style={{
                                        background: `${tokens.colors.background.secondary}CC`,
                                        borderColor: tokens.colors.border.primary,
                                        padding: tokens.spacing.medium
                                    }}
                                >
                                    <div className="flex items-center" style={{ gap: tokens.spacing.small, marginBottom: tokens.spacing.small }}>
                                        <button
                                            onClick={() => setRtView('critics')}
                                            className="rounded-xl backdrop-blur-xl border transition-all duration-300"
                                            style={{
                                                padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}`,
                                                background: rtView === 'critics' ? `${tokens.colors.system.red}E6` : `${tokens.colors.background.primary}80`,
                                                borderColor: tokens.colors.border.primary,
                                                color: tokens.colors.text.primary,
                                                fontFamily: tokens.typography.families.text,
                                                fontWeight: tokens.typography.weights.semibold,
                                                fontSize: tokens.typography.sizes.caption1
                                            }}
                                        >
                                            Critics
                                        </button>
                                        <button
                                            onClick={() => setRtView('audience')}
                                            className="rounded-xl backdrop-blur-xl border transition-all duration-300"
                                            style={{
                                                padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}`,
                                                background: rtView === 'audience' ? `${tokens.colors.system.green}E6` : `${tokens.colors.background.primary}80`,
                                                borderColor: tokens.colors.border.primary,
                                                color: tokens.colors.text.primary,
                                                fontFamily: tokens.typography.families.text,
                                                fontWeight: tokens.typography.weights.semibold,
                                                fontSize: tokens.typography.sizes.caption1
                                            }}
                                        >
                                            Audience
                                        </button>
                                    </div>

                                    {rtView === 'critics' && (() => {
                                        const rtRating = extractRottenTomatoesRating(omdbData);
                                        const consensus = extractRottenTomatoesConsensus(omdbData);
                                        const tomatoUrl = (omdbData as any).tomatoURL || `https://www.rottentomatoes.com/search?search=${encodeURIComponent('title' in details ? details.title : details.name)}`;
                                        return (
                                            <div>
                                                {rtRating && (
                                                    <RottenTomatoesRating rating={rtRating} size="lg" showLabel={true} />
                                                )}
                                                {consensus && (
                                                    <p style={{
                                                        marginTop: tokens.spacing.small,
                                                        color: tokens.colors.text.secondary,
                                                        fontFamily: tokens.typography.families.text
                                                    }}>
                                                        <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Critics Consensus:</span> {consensus}
                                                    </p>
                                                )}
                                                {/* Direct Rotten Tomatoes critic reviews */}
                                                {isRtLoading && (
                                                    <div className="mt-3">
                                                        <Loader />
                                                    </div>
                                                )}
                                                {rtError && (
                                                    <div className="rounded-xl border p-3 mt-3" style={{
                                                        borderColor: tokens.colors.border.primary,
                                                        background: `${tokens.colors.background.secondary}80`,
                                                        color: tokens.colors.text.secondary
                                                    }}>
                                                        Couldn’t load Rotten Tomatoes reviews ({rtError}).
                                                    </div>
                                                )}
                                                {rtReviews && rtReviews.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: tokens.spacing.small, marginTop: tokens.spacing.small }}>
                                                        {rtReviews.slice(0, 8).map((review, index) => (
                                                            <div
                                                                key={(review as any).id ?? (review as any).reviewId ?? `${review.url || ''}-${index}`}
                                                                className="rounded-xl backdrop-blur-xl border"
                                                                style={{
                                                                    background: `${tokens.colors.background.secondary}80`,
                                                                    borderColor: tokens.colors.border.primary,
                                                                    padding: tokens.spacing.small
                                                                }}
                                                            >
                                                                <div className="flex items-center" style={{ gap: tokens.spacing.micro[1], marginBottom: tokens.spacing.micro[2] }}>
                                                                    <span style={{ fontWeight: tokens.typography.weights.semibold, color: tokens.colors.text.primary }}>
                                                                        {review.critic?.name || 'Critic'}
                                                                    </span>
                                                                    {review.source && (
                                                                        <span style={{ color: tokens.colors.text.tertiary }}>
                                                                            @ {review.source}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {review.score !== undefined && review.score !== null && (
                                                                    <p style={{ color: tokens.colors.text.secondary, fontSize: tokens.typography.sizes.caption1 }}>
                                                                        <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Score:</span> {review.score}
                                                                    </p>
                                                                )}
                                                                {review.quote && (
                                                                    <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text }}>
                                                                        “{review.quote}”
                                                                    </p>
                                                                )}
                                                                {review.date && (
                                                                    <p style={{ color: tokens.colors.text.tertiary, fontSize: tokens.typography.sizes.caption2, marginTop: tokens.spacing.micro[1] }}>
                                                                        {new Date(review.date).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                                {review.url && (
                                                                    <a
                                                                        href={review.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-block rounded-xl backdrop-blur-xl border mt-2"
                                                                        style={{
                                                                            padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}`,
                                                                            background: `${tokens.colors.background.secondary}60`,
                                                                            borderColor: tokens.colors.border.primary,
                                                                            color: tokens.colors.text.primary,
                                                                            fontFamily: tokens.typography.families.text,
                                                                            fontSize: tokens.typography.sizes.caption1
                                                                        }}
                                                                    >
                                                                        View Source
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: tokens.spacing.small, marginTop: tokens.spacing.small, fontSize: tokens.typography.sizes.caption1 }}>
                                                    {omdbData.tomatoReviews && omdbData.tomatoReviews !== 'N/A' && (
                                                        <p style={{ color: tokens.colors.text.secondary }}>
                                                            <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Reviews:</span> {omdbData.tomatoReviews}
                                                        </p>
                                                    )}
                                                    {omdbData.tomatoFresh && omdbData.tomatoFresh !== 'N/A' && (
                                                        <p style={{ color: tokens.colors.text.secondary }}>
                                                            <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Fresh:</span> {omdbData.tomatoFresh}
                                                        </p>
                                                    )}
                                                    {omdbData.tomatoRotten && omdbData.tomatoRotten !== 'N/A' && (
                                                        <p style={{ color: tokens.colors.text.secondary }}>
                                                            <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Rotten:</span> {omdbData.tomatoRotten}
                                                        </p>
                                                    )}
                                                </div>
                                                <a
                                                    href={rtSourceUrl || tomatoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block rounded-xl backdrop-blur-xl border mt-3"
                                                    style={{
                                                        padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}`,
                                                        background: `${tokens.colors.background.secondary}80`,
                                                        borderColor: tokens.colors.border.primary,
                                                        color: tokens.colors.text.primary,
                                                        fontFamily: tokens.typography.families.text,
                                                        fontSize: tokens.typography.sizes.caption1
                                                    }}
                                                >
                                                    Open Rotten Tomatoes
                                                </a>
                                            </div>
                                        );
                                    })()}

                                    {rtView === 'audience' && (
                                        <div>
                                            <div className="flex items-center" style={{ gap: tokens.spacing.small }}>
                                                {omdbData.tomatoUserMeter && omdbData.tomatoUserMeter !== 'N/A' && (
                                                    <span style={{
                                                        color: tokens.colors.system.green,
                                                        fontWeight: tokens.typography.weights.semibold,
                                                        fontFamily: tokens.typography.families.text
                                                    }}>
                                                        Audience Score: {omdbData.tomatoUserMeter}%
                                                    </span>
                                                )}
                                                {omdbData.tomatoUserRating && omdbData.tomatoUserRating !== 'N/A' && (
                                                    <span style={{ color: tokens.colors.text.secondary }}>
                                                        Avg Rating: {omdbData.tomatoUserRating}
                                                    </span>
                                                )}
                                            </div>
                                            {omdbData.tomatoUserReviews && omdbData.tomatoUserReviews !== 'N/A' && (
                                                <p style={{ color: tokens.colors.text.secondary, marginTop: tokens.spacing.micro[2], fontFamily: tokens.typography.families.text }}>
                                                    <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Audience Reviews:</span> {omdbData.tomatoUserReviews}
                                                </p>
                                            )}
                                            <a
                                                href={rtSourceUrl || (omdbData as any).tomatoURL || `https://www.rottentomatoes.com/search?search=${encodeURIComponent('title' in details ? details.title : details.name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block rounded-xl backdrop-blur-xl border mt-3"
                                                style={{
                                                    padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}`,
                                                    background: `${tokens.colors.background.secondary}80`,
                                                    borderColor: tokens.colors.border.primary,
                                                    color: tokens.colors.text.primary,
                                                    fontFamily: tokens.typography.families.text,
                                                    fontSize: tokens.typography.sizes.caption1
                                                }}
                                            >
                                                Open Rotten Tomatoes
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(omdbData && item.media_type === 'movie' && showIMDBReviews) && (
                                <div 
                                    className="rounded-xl backdrop-blur-xl border"
                                    style={{
                                        background: `${tokens.colors.background.secondary}CC`,
                                        borderColor: tokens.colors.border.primary,
                                        padding: tokens.spacing.medium
                                    }}
                                >
                                    <h4 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: tokens.colors.text.primary,
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        IMDb Reviews
                                    </h4>
                                    <div style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text, fontSize: tokens.typography.sizes.caption1 }}>
                                        {omdbData.imdbRating && omdbData.imdbRating !== 'N/A' && (
                                            <p>
                                                <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>IMDb Rating:</span> {omdbData.imdbRating}/10
                                            </p>
                                        )}
                                        {omdbData.imdbVotes && omdbData.imdbVotes !== 'N/A' && (
                                            <p>
                                                <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Votes:</span> {omdbData.imdbVotes}
                                            </p>
                                        )}
                                    </div>
                                    <a
                                        href={`https://www.imdb.com/title/${omdbData.imdbID}/reviews`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block rounded-xl backdrop-blur-xl border mt-3"
                                        style={{
                                            padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.medium}`,
                                            background: `${tokens.colors.background.secondary}80`,
                                            borderColor: tokens.colors.border.primary,
                                            color: tokens.colors.text.primary,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.caption1
                                        }}
                                    >
                                        Open IMDb Reviews
                                    </a>
                                </div>
                            )}

                            {(omdbData && item.media_type === 'movie') && (
                                <div 
                                    className="rounded-xl backdrop-blur-xl border"
                                    style={{
                                        background: `${tokens.colors.background.secondary}CC`,
                                        borderColor: tokens.colors.border.primary,
                                        padding: tokens.spacing.medium
                                    }}
                                >
                                    <h4 
                                        style={{
                                            fontWeight: tokens.typography.weights.semibold,
                                            color: tokens.colors.text.primary,
                                            marginBottom: tokens.spacing.small,
                                            fontFamily: tokens.typography.families.text,
                                            fontSize: tokens.typography.sizes.body
                                        }}
                                    >
                                        Additional Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: tokens.spacing.medium, fontSize: tokens.typography.sizes.caption1 }}>
                                        {omdbData.Rated && omdbData.Rated !== 'N/A' && (
                                            <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text }}>
                                                <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Rating:</span> {omdbData.Rated}
                                            </p>
                                        )}
                                        {omdbData.Awards && omdbData.Awards !== 'N/A' && (
                                            <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text }}>
                                                <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Awards:</span> {omdbData.Awards}
                                            </p>
                                        )}
                                        {omdbData.BoxOffice && omdbData.BoxOffice !== 'N/A' && (
                                            <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text }}>
                                                <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Box Office:</span> {omdbData.BoxOffice}
                                            </p>
                                        )}
                                        {omdbData.imdbRating && omdbData.imdbRating !== 'N/A' && (
                                            <p style={{ color: tokens.colors.text.secondary, fontFamily: tokens.typography.families.text }}>
                                                <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>IMDb Score:</span> {omdbData.imdbRating}/10
                                            </p>
                                        )}
                                        {(() => {
                                            const rtRating = extractRottenTomatoesRating(omdbData);
                                            return rtRating && (
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <RottenTomatoesRating 
                                                        rating={rtRating} 
                                                        size="md" 
                                                        showLabel={true}
                                                    />
                                                    {(() => {
                                                        const consensus = extractRottenTomatoesConsensus(omdbData);
                                                        return consensus ? (
                                                            <p style={{
                                                                marginTop: tokens.spacing.small,
                                                                color: tokens.colors.text.secondary,
                                                                fontFamily: tokens.typography.families.text
                                                            }}>
                                                                <span style={{ fontWeight: tokens.typography.weights.medium, color: tokens.colors.text.tertiary }}>Critics Consensus:</span> {consensus}
                                                            </p>
                                                        ) : null;
                                                    })()}
                                                </div>
                                            );
                                        })()}
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
            <DetailContainer>
                <BackgroundHeader backdropUrl={backdropUrl || (details?.backdrop_path ? `${IMAGE_BASE_URL}original${details.backdrop_path}` : '')} />
                <PanelOverlay />
                
                <button
                    onClick={handleCloseWithCurtain}
                    onMouseEnter={applyHoverEffect}
                    onMouseDown={applyPressEffect}
                    className="absolute top-6 right-6 z-10 backdrop-blur-xl border"
                    aria-label="Close media details"
                    style={{
                        zIndex: 10,
                        padding: '12px',
                        borderRadius: '50%',
                        minWidth: '44px',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                        WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                        borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                        boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)',
                        color: tokens.colors.text.primary,
                        cursor: 'pointer',
                        transition: tokens.interactions.transitions.fast
                    }}
                >
                    <X size={20} />
                </button>

                <HeaderSection onContextMenu={handleContextMenu} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
                    <div className="mb-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.small }}>
                            {(() => {
                                const showImaxLogo = preferImaxTrailer || isCuratedImaxTitle(item);
                                return (
                                    <MediaTitleLogo
                                        media={item}
                                        apiKey={apiKey}
                                        size={showImaxLogo ? 'medium' : 'large'}
                                        maxHeightPx={showImaxLogo ? 28 : undefined}
                                        className="leading-tight"
                                        style={{
                                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                                        }}
                                        fallbackToText={true}
                                    />
                                );
                            })()}
                            {(preferImaxTrailer || isCuratedImaxTitle(item)) && (
                                <>
                                    <span style={{ opacity: 0.7 }}>|</span>
                                    <img
                                        src={'https://i.ibb.co/G47CHyhg/toppng-com-imax-michael-jackson-thriller-imax-445x87.png'}
                                        alt="IMAX"
                                        style={{ height: '28px', width: 'auto' }}
                                        loading="lazy"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div 
                        className="flex flex-wrap items-center mb-4"
                        style={{
                            gap: tokens.spacing.small,
                            color: tokens.colors.text.secondary,
                            fontFamily: tokens.typography.families.text,
                            fontSize: tokens.typography.sizes.body
                        }}
                    >
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
                    
                    <div 
                        className="flex items-center mb-4"
                        style={{
                            gap: tokens.spacing.small,
                            fontFamily: tokens.typography.families.text
                        }}
                    >
                        <Star 
                            className="w-6 h-6" 
                            style={{ color: tokens.colors.system.yellow }}
                            fill="currentColor"
                        />
                        <span 
                            style={{
                                fontSize: tokens.typography.sizes.title3,
                                fontWeight: tokens.typography.weights.bold,
                                color: tokens.colors.text.primary
                            }}
                        >
                            {details.vote_average.toFixed(1)}
                        </span>
                        <span style={{ color: tokens.colors.text.tertiary }}>/ 10</span>
                    </div>
                    
                    {/* Rotten Tomatoes Rating in Header */}
                    {omdbData && (() => {
                        const rtRating = extractRottenTomatoesRating(omdbData);
                        return rtRating && (
                            <div className="mb-4">
                                <RottenTomatoesRating 
                                    rating={rtRating} 
                                    size="lg" 
                                    showLabel={true}
                                />
                            </div>
                        );
                    })()}
                    
                    <LikeDislikeButtons
                        mediaId={item.id}
                        mediaType={item.media_type}
                        currentPreference={getContentPreference(item.id, item.media_type)}
                        onLike={handleLike}
                        onDislike={handleDislike}
                        isLoading={preferenceLoading}
                    />
                </HeaderSection>

                {showImaxOverlay && isImaxMode && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {/* Bass thrum element (40 Hz, 0.75s) */}
                        <audio
                            id="bassMP3"
                            src="data:audio/mp3;base64,/+MYxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAA/+MYxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAA/+MYxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAAP/4QxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAA/+MYxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAAP/4QxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAA/+MYxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAAP/4QxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAA/+MYxAAAAANIAAAAAExNTU1BAQAAADkAAAAAAAAA"
                            preload="auto"
                        />

                        {/* Curtains */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                            <div
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(180deg, #6b0f1a 0%, #b91372 100%)',
                                    boxShadow: 'inset -12px 0 24px rgba(0,0,0,0.45)',
                                    transform: imaxPhase === 'curtain' ? 'translateX(0)' : 'translateX(-100%)',
                                    transition: 'transform 700ms cubic-bezier(.36,.07,.19,.97)'
                                }}
                            />
                            <div
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(180deg, #6b0f1a 0%, #b91372 100%)',
                                    boxShadow: 'inset 12px 0 24px rgba(0,0,0,0.45)',
                                    transform: imaxPhase === 'curtain' ? 'translateX(0)' : 'translateX(100%)',
                                    transition: 'transform 700ms cubic-bezier(.36,.07,.19,.97)'
                                }}
                            />
                        </div>

                        {/* Countdown leader */}
                        {imaxPhase === 'countdown' && (
                            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                                <div style={{ color: '#FFD56B', fontFamily: 'Montserrat, system-ui', fontWeight: 800, fontSize: '12vw', letterSpacing: '-0.02em', textShadow: '0 8px 40px rgba(0,0,0,0.7)' }}>
                                    {countdownNumber}
                                </div>
                            </div>
                        )}

                        {/* Title stage */}
                        {imaxPhase === 'title' && (
                            <div style={{ position: 'absolute', inset: 0 }}>
                                {/* Star-dusted void */}
                                <div
                                    style={{
                                        position: 'absolute', inset: 0,
                                        background: '#0072CE'
                                    }}
                                />
                                {/* Floating poster with CTA to the right */}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '80px' }}>
                                    <div style={{ textAlign: 'center', transform: 'translateX(-40px)' }}>
                                        {('poster_path' in item && (item as any).poster_path) ? (
                                            <img
                                                src={`${IMAGE_BASE_URL}w342${(item as any).poster_path}`}
                                                alt={'title' in item ? (item as any).title : (item as any).name}
                                                style={{
                                                    width: '280px', height: 'auto', borderRadius: '12px',
                                                    boxShadow: '0 0 40px rgba(255,255,255,0.55)'
                                                }}
                                            />
                                        ) : null}
                                        <div style={{
                                            marginTop: '24px',
                                            fontFamily: 'Montserrat, system-ui', fontWeight: 800,
                                            fontSize: 'clamp(28px, 6vw, 90px)',
                                            background: 'linear-gradient(180deg, #FFE7A1 0%, #FFD56B 50%, #B8860B 100%)',
                                            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                                            textShadow: '0 6px 24px rgba(0,0,0,0.6)'
                                        }}>
                                            {'title' in item ? (item as any).title : (item as any).name}
                                        </div>
                                    </div>
                                    {mainTrailerKey && (
                                        <button
                                            onClick={() => { 
                                                // Make play button also the unmute/activate-audio button
                                                try { activateImaxAudio(); } catch {}
                                                try { setIsMuted(false); } catch {}
                                                playBass(); 
                                                setImaxPhase('trailer'); 
                                            }}
                                            style={{
                                                width: '300px', height: '300px', borderRadius: '50%',
                                                border: '3px solid #FFFFFF', color: '#FFFFFF', background: 'transparent',
                                                fontFamily: 'Nexa, Montserrat, system-ui', fontWeight: 700, fontSize: '16px',
                                                textAlign: 'center',
                                                boxShadow: '0 0 32px rgba(255,255,255,0.35)',
                                                animation: 'imaxPulse 2.2s ease-in-out infinite',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            WATCH TRAILER IN IMAX
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Trailer overlay */}
                        {imaxPhase === 'trailer' && mainTrailerKey && (
                            <div style={{ position: 'absolute', inset: 0 }}>
                                {/* quick blackout */}
                                <div style={{ position: 'absolute', inset: 0, background: '#000', animation: 'fadeOut 500ms ease forwards' }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '92%', maxWidth: '1400px', aspectRatio: '1.9', background: '#000', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden' }}>
                                        {isImaxOfficialTrailer && !imaxAudioActivated && (
                                            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 10 }}>
                                                <button
                                                    onClick={activateImaxAudio}
                                                    style={{ pointerEvents: 'auto',
                                                        padding: '14px 24px', borderRadius: '9999px',
                                                        border: '1px solid #FFFFFF', color: '#FFFFFF',
                                                        background: 'rgba(255,255,255,0.08)', cursor: 'pointer',
                                                        fontFamily: 'Nexa, Montserrat, system-ui', fontWeight: 700, fontSize: '14px',
                                                        boxShadow: '0 0 24px rgba(255,255,255,0.25)'
                                                    }}
                                                >
                                                    Activate IMAX Audio
                                                </button>
                                            </div>
                                        )}
                                        <div id="imaxTrailerPlayer" style={{ width: '100%', height: '100%' }} />
                   <ImaxGoldControls
                       onExit={handleCloseWithCurtain}
                       onToggleMute={() => setIsMuted((m) => !m)}
                       isMuted={isMuted}
                       onToggleSpatial={() => setSpatialEnabled((s) => !s)}
                       spatialEnabled={spatialEnabled}
                   />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Keyframes for pulse and fade */}
                        <style>
                            {`
                            @keyframes imaxPulse { 0% { transform: scale(1); box-shadow: 0 0 12px rgba(255,255,255,0.25);} 50% { transform: scale(1.06); box-shadow: 0 0 40px rgba(255,255,255,0.45);} 100% { transform: scale(1); box-shadow: 0 0 12px rgba(255,255,255,0.25);} }
                            @keyframes fadeOut { 0% { opacity: 1 } 100% { opacity: 0 } }
                            `}
                        </style>
                    </div>
                )}

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
                    {item.media_type === 'tv' && (
                        <TabButton active={activeTab === 'episodes'} onClick={() => setActiveTab('episodes')}>
                            Episodes
                        </TabButton>
                    )}
                </TabsContainer>

                <AnimatePresence mode="wait">
                    <ContentPanel
                        ref={contentPanelRef}
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 rounded-t-3xl backdrop-blur-xl border-t relative"
                        style={{
                            padding: `${tokens.spacing.xlarge} ${tokens.spacing.large}`,
                            background: tokens?.materials?.pill?.primary?.background || 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                            WebkitBackdropFilter: tokens?.materials?.pill?.primary?.backdropFilter || 'blur(20px)',
                            borderColor: tokens?.materials?.pill?.primary?.border || 'rgba(255, 255, 255, 0.2)',
                            boxShadow: tokens?.shadows?.large || '0 8px 32px rgba(0, 0, 0, 0.3)',
                            minHeight: 'calc(100vh - 400px)',
                            zIndex: 2
                        }}
                    >
                        {renderTabContent()}
                    </ContentPanel>
                </AnimatePresence>
            </DetailContainer>

            {/* Trailer Modal */}
            {showTrailerModal && mainTrailerKey && (
                <TrailerModalOverlay onClick={handleCloseTrailerModal}>
                    <TrailerModalContent onClick={(e) => e.stopPropagation()}>
                        <LiquidGlassWrapper
                            componentType="button"
                            intensity="prominent"
                            effect="regular"
                            shape="circle"
                            refractionQuality="high"
                            artifactReduction="mild"
                            onClick={handleCloseTrailerModal}
                            className="absolute top-4 right-4 z-50"
                            style={{
                                width: 44,
                                height: 44,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.22)',
                                boxShadow: '0 10px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.2)',
                                color: tokens.colors.text.primary,
                                cursor: 'pointer'
                            }}
                            aria-label="Close trailer"
                        >
                            <X size={20} />
                        </LiquidGlassWrapper>
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
