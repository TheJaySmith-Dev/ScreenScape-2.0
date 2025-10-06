

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ViewType } from '../App';
// FIX: Import 'PaginatedResponse' type to resolve a TypeScript error.
import type { MediaItem, Movie, TVShow, Video, MovieDetails, TVShowDetails, CreditsResponse, ImageResponse, LogoImage, Episode, CastMember, CrewMember, WatchProviderResponse, WatchProviderCountry, ActiveFilter, PaginatedResponse } from '../types';
import {
  getTrendingAll,
  searchMulti,
  getPopularMovies,
  getPopularTVShows,
  getUpcomingMovies,
  getOnTheAirTVShows,
  normalizeMovie,
  normalizeTVShow,
  getMovieVideos,
  getTVShowVideos,
  getMovieDetails,
  getTVShowDetails,
  getMovieCredits,
  getTVShowCredits,
  getSimilarMovies,
  getTVShowSeasonDetails,
  getMovieImages,
  getTVShowImages,
  getMoviesByProvider,
  getTVShowsByProvider,
  getMovieWatchProviders,
  getTVShowWatchProviders,
  getMoviesByCompany,
  discoverTVShows,
  getNewMoviesByProvider,
  getNewTVShowsByProvider,
  getTopRatedMoviesByCompany,
  getTopRatedTVShowsByNetwork,
} from '../services/tmdbService';
import { usePreferences } from '../hooks/usePreferences';
import Loader from './Loader';
import { PlayIcon, StarIcon, StarIconSolid, XIcon, MuteIcon, UnmuteIcon, InfoIcon } from './Icons';
import VideoPlayer from './VideoPlayer';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


// Helper function
const formatRuntime = (runtime: number) => {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

const serviceNameMap: { [key: number]: string } = {
  8: 'Netflix', 337: 'Disney+', 1899: 'Max', 9: 'Prime Video', 119: 'Prime Video',
  15: 'Hulu', 2: 'Apple TV+', 531: 'Paramount+', 387: 'Peacock'
};

const DisneyPlusLogoOverlay: React.FC<{className?: string}> = ({ className = '' }) => (
    <img
        src="https://i.ibb.co/WWNxt1Gy/IMG-3932.png"
        alt="Available on Disney+"
        className={`absolute bottom-2 right-2 w-10 md:w-12 h-auto z-30 opacity-90 rounded-sm pointer-events-none ${className}`}
    />
);

interface MediaItemCardProps {
    item: MediaItem;
    onSelect: (item: MediaItem) => void;
}

const MediaItemCard: React.FC<MediaItemCardProps> = React.memo(({ item, onSelect }) => {
    const imageUrl = item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : `https://via.placeholder.com/500x750?text=No+Image`;
    const isDisneyPlus = item.watchProviders?.flatrate?.some(p => p.provider_id === 337);

    return (
        <div 
            className="group relative w-full aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:z-20 shadow-lg hover:shadow-cyan-500/20"
            onClick={() => onSelect(item)}
        >
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
            {isDisneyPlus && <DisneyPlusLogoOverlay />}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 z-10"></div>
            <div className="absolute inset-0 p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <h3 className="text-white text-base font-bold drop-shadow-lg">{item.title}</h3>
                <div className="text-xs text-zinc-300 mt-1 flex items-center">
                    <span>{item.release_date?.substring(0, 4)}</span>
                </div>
            </div>
        </div>
    );
});


interface MediaRowProps {
    title: string;
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
}

const MediaRow: React.FC<MediaRowProps> = ({ title, items, onSelect }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-8 md:mb-12 last:mb-0">
            <h2 className="text-xl md:text-3xl font-bold mb-4 px-4 md:px-12">{title}</h2>
            <div className="relative">
                <div className="pl-4 md:pl-12 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <div className="flex space-x-4">
                        {items.filter(item => item.poster_path).map(item => (
                            <div key={`${item.media_type}-${item.id}`} className="flex-shrink-0 w-36 md:w-48">
                                <MediaItemCard item={item} onSelect={onSelect} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
};


interface HeroProps {
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
    apiKey: string;
}

const Hero: React.FC<HeroProps> = ({ items, onSelect, apiKey }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [trailer, setTrailer] = useState<Video | null>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    // FIX: `useRef` must be called with an initial value.
    const animationFrameRef = useRef<number | undefined>(undefined);
    
    const item = items[currentIndex];

    const advanceSlide = useCallback(() => {
        if (items.length > 1) {
            setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
        }
    }, [items.length]);

    useEffect(() => {
        if (items.length <= 1) return;
        let timerId: ReturnType<typeof setTimeout> | null = null;
        if (!trailer) {
            timerId = setTimeout(advanceSlide, 8000);
        }
        return () => {
            if (timerId) {
                clearTimeout(timerId);
            }
        };
    }, [currentIndex, trailer, advanceSlide, items.length]);


    useEffect(() => {
        const fetchHeroExtras = async () => {
            if (!item) return;
            setTrailer(null);
            
            const videoFn = item.media_type === 'movie' ? getMovieVideos : getTVShowVideos;
            
            try {
                const videos = await videoFn(apiKey, item.id)
                const bestVideo = videos.find(v => v.type === 'Clip') || videos.find(v => v.type === 'Teaser');
                setTrailer(bestVideo || null);
            } catch (e) {
                if (!(e instanceof Error && e.message.includes('(Status: 404)'))) {
                    console.warn(`Could not fetch videos for hero item ${item.id}`, e);
                }
                setTrailer(null);
            }
        };
        fetchHeroExtras();
    }, [item, apiKey]);

    useEffect(() => {
        const progress = progressBarRef.current;
        if (!progress) return;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (trailer) {
            progress.style.transition = 'none';
            progress.style.width = '100%';
        } else {
            const duration = 8000; // 8 seconds
            progress.style.transition = '';
            progress.style.width = '0%';
            let start: number | null = null;

            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const elapsed = timestamp - start;
                const percent = Math.min((elapsed / duration) * 100, 100);
                if (progress) {
                    progress.style.width = percent + '%';
                }

                if (percent < 100) {
                    animationFrameRef.current = requestAnimationFrame(step);
                }
            };
            animationFrameRef.current = requestAnimationFrame(step);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [currentIndex, trailer]);


    if (!item) {
        return <div className="h-[85vh] md:h-[56.25vw] md:max-h-[80vh] w-full bg-zinc-900 animate-pulse"></div>;
    }
    
    const backdropPath = item.backdrop_path ? `${IMAGE_BASE_URL}original${item.backdrop_path}` : '';
    const flatrateProvider = item.watchProviders?.flatrate?.[0];
    const isDisneyPlus = item.watchProviders?.flatrate?.some(p => p.provider_id === 337);

    return (
        <div className="relative w-full text-white overflow-hidden h-[85vh] md:h-auto md:aspect-[16/9] md:max-h-[80vh]">
            {/* Background */}
            <div className="absolute inset-0 z-0 animate-scale-up-center">
                <div className="w-full h-full relative">
                    {trailer?.key ? (
                       <VideoPlayer videoKey={trailer.key} isMuted={true} onEnd={() => advanceSlide()} loop={false} />
                    ) : (
                       backdropPath && <img src={backdropPath} alt={item.title} className="w-full h-full object-cover" />
                    )}
                    {isDisneyPlus && <DisneyPlusLogoOverlay className="!bottom-4 !right-4 md:!bottom-6 md:!right-6 !w-12 md:!w-16" />}
                </div>
            </div>

            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent"></div>
            
            {/* Content */}
            <div className="absolute bottom-[10%] left-4 right-4 md:left-12 md:right-auto z-20 md:max-w-lg animate-text-focus-in text-center md:text-left">
                <h1 className="text-3xl md:text-6xl font-extrabold drop-shadow-lg mb-2 md:mb-4">{item.title}</h1>
                <p className="text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-4 md:mb-6 drop-shadow-md text-zinc-300">{item.overview}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-3 sm:space-y-0 sm:space-x-3">
                    {flatrateProvider ? (
                        <a href={item.watchProviders?.link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center bg-white text-black px-6 py-3 rounded-md font-bold hover:bg-opacity-80 transition text-lg">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play on {serviceNameMap[flatrateProvider.provider_id] || flatrateProvider.provider_name}
                        </a>
                    ) : (
                        <button onClick={() => onSelect(item)} className="w-full sm:w-auto flex items-center justify-center bg-white text-black px-6 py-3 rounded-md font-bold hover:bg-opacity-80 transition text-lg">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play
                        </button>
                    )}
                    <button 
                        onClick={() => onSelect(item)}
                        className="w-full sm:w-auto flex items-center justify-center bg-white/20 text-white px-6 py-3 rounded-md font-semibold hover:bg-white/30 transition backdrop-blur-sm"
                    >
                        <InfoIcon className="w-6 h-6 mr-2" />
                        More Info
                    </button>
                </div>
            </div>
            {/* Progress Bar */}
            <div className="disney-progress-bar">
                <div className="disney-bar-bg">
                    <div className="disney-bar-fill" ref={progressBarRef}></div>
                </div>
            </div>
        </div>
    );
};


interface ResultsGridProps {
    title?: string;
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
    isLoading: boolean;
    loadMore?: () => void;
    hasMore?: boolean;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ title, items, onSelect, isLoading, loadMore, hasMore }) => {
    // FIX: useRef must be called with an initial value.
    const observer = useRef<IntersectionObserver | undefined>(undefined);
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && loadMore) {
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, loadMore]);
    
    return (
        <div className="px-4 md:px-12 pb-12 min-h-screen">
            {title && <h1 className="text-3xl md:text-5xl font-bold mb-8">{title}</h1>}
            {items.length === 0 && !isLoading && <p className="text-center text-zinc-400 mt-8">No results found.</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                 {items.map((item, index) => {
                    const isLastElement = items.length === index + 1;
                    return (
                        <div ref={isLastElement ? lastElementRef : null} key={`${item.media_type}-${item.id}`}>
                            <MediaItemCard 
                                item={item} 
                                onSelect={onSelect} 
                            />
                        </div>
                    );
                })}
            </div>
            {isLoading && <Loader />}
            {hasMore === false && items.length > 0 && <p className="text-center text-zinc-500 mt-8">You've reached the end!</p>}
        </div>
    );
};


interface ModalProps {
    item: MediaItem;
    onClose: () => void;
    apiKey: string;
    onInvalidApiKey: () => void;
    onSelect: (item: MediaItem) => void;
}

const Modal: React.FC<ModalProps> = ({ item, onClose, apiKey, onInvalidApiKey, onSelect }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [trailer, setTrailer] = useState<Video | null>(null);
    const [logo, setLogo] = useState<LogoImage | null>(null);
    const [credits, setCredits] = useState<CreditsResponse | null>(null);
    const [similar, setSimilar] = useState<MediaItem[]>([]);
    const [watchProviders, setWatchProviders] = useState<WatchProviderCountry | null>(item.watchProviders || null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTrailerMuted, setIsTrailerMuted] = useState(true);

    const { watchlistIds, toggleWatchlist, dislikeItem } = usePreferences();
    const isWatchlisted = watchlistIds.has(item.id);

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                // Fetch essential data
                const fetchFn = item.media_type === 'movie' ? getMovieDetails : getTVShowDetails;
                const creditsFn = item.media_type === 'movie' ? getMovieCredits : getTVShowCredits;
                const [detailsData, creditsData] = await Promise.all([
                    fetchFn(apiKey, item.id),
                    creditsFn(apiKey, item.id),
                ]);
                setDetails(detailsData);
                setCredits(creditsData);
    
                // Fetch optional data
                const createOptionalPromise = <T,>(promise: Promise<T>, name: string): Promise<T | null> => {
                    return promise.catch(e => {
                        if (!(e instanceof Error && e.message.includes('(Status: 404)'))) {
                            console.warn(`Could not fetch ${name} for ${item.id}`, e);
                        }
                        return null;
                    });
                };

                const videoFn = item.media_type === 'movie' ? getMovieVideos : getTVShowVideos;
                const imageFn = item.media_type === 'movie' ? getMovieImages : getTVShowImages;
                const similarFn = item.media_type === 'movie' ? getSimilarMovies : null;
                
                const optionalDataPromises = [
                    createOptionalPromise(videoFn(apiKey, item.id), 'videos'),
                    createOptionalPromise(imageFn(apiKey, item.id), 'images'),
                    similarFn ? createOptionalPromise(similarFn(apiKey, item.id), 'similar items') : Promise.resolve(null),
                ];

                // Only fetch providers if they weren't passed in with the item
                if (!item.watchProviders) {
                    const providerFn = item.media_type === 'movie' ? getMovieWatchProviders : getTVShowWatchProviders;
                    optionalDataPromises.push(createOptionalPromise(providerFn(apiKey, item.id), 'providers'));
                } else {
                    optionalDataPromises.push(Promise.resolve(null)); // Placeholder
                }
    
                const [videoData, imageData, similarResponse, providerData] = await Promise.all(optionalDataPromises);
    
                if (videoData) {
                    const bestTrailer = videoData.find(v => v.type === 'Trailer') || videoData.find(v => v.type === 'Teaser') || videoData.find(v => v.type === 'Clip') || videoData[0] || null;
                    setTrailer(bestTrailer);
                }
    
                if (imageData) {
                    setLogo(imageData.logos.find(l => l.iso_639_1 === 'en') || imageData.logos[0] || null);
                }
    
                if (similarResponse && 'results' in similarResponse) {
                    setSimilar(similarResponse.results.map(normalizeMovie));
                }
                
                if (providerData) {
                     setWatchProviders(providerData.results.GB || null);
                } else {
                    setWatchProviders(item.watchProviders || null);
                }
                
            } catch (error) {
                console.error("Error fetching modal details:", error);
                if (error instanceof Error && error.message.includes("Invalid API Key")) {
                    onInvalidApiKey();
                }
            } finally {
                setIsLoading(false);
            }
        };
    
        fetchDetails();
    }, [item, apiKey, onInvalidApiKey]);


    const handleToggleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleWatchlist(item.id);
    }
    
    const handleDislike = (e: React.MouseEvent) => {
        e.stopPropagation();
        dislikeItem(item.id);
        onClose(); // Close modal on dislike
    }

    const backdropPath = details?.backdrop_path ? `${IMAGE_BASE_URL}original${details.backdrop_path}` : '';
    const tvDetails = details as TVShowDetails;
    const movieDetails = details as MovieDetails;
    const director = credits?.crew?.find((member: CrewMember) => member.job === 'Director');

    const currentItem = details || item;
    const title = details ? ('title' in details ? details.title : (details as TVShowDetails).name) : item.title;
    const releaseDate = details ? ('release_date' in details ? details.release_date : (details as TVShowDetails).first_air_date) : item.release_date;
    const isDisneyPlus = watchProviders?.flatrate?.some(p => p.provider_id === 337);


    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={onClose}>
            <div 
                className="bg-primary w-full max-w-4xl max-h-[90vh] rounded-lg overflow-y-auto shadow-2xl animate-scale-up-center scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                onClick={e => e.stopPropagation()}
            >
                {isLoading ? (
                    <div className="h-[80vh] flex items-center justify-center">
                        <Loader />
                    </div>
                ) : (
                    <>
                        <div className="relative aspect-video">
                            {trailer?.key ? (
                                <VideoPlayer videoKey={trailer.key} isMuted={isTrailerMuted} loop={true} />
                            ) : (
                                backdropPath && <img src={backdropPath} alt={title} className="w-full h-full object-cover" />
                            )}
                            {isDisneyPlus && <DisneyPlusLogoOverlay className="!bottom-4 !right-16 !w-14" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
                            <button onClick={onClose} className="absolute top-4 right-4 h-10 w-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition z-20">
                                <XIcon className="w-6 h-6" />
                            </button>
                            {trailer?.key && (
                                <button onClick={() => setIsTrailerMuted(prev => !prev)} className="absolute bottom-4 right-4 h-10 w-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-20">
                                    {isTrailerMuted ? <MuteIcon className="w-6 h-6" /> : <UnmuteIcon className="w-6 h-6" />}
                                </button>
                            )}
                             <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-10">
                                {logo?.file_path ? (
                                    <img src={`${IMAGE_BASE_URL}w500${logo.file_path}`} alt={`${title} logo`} className="max-h-12 md:max-h-20 max-w-[50%] drop-shadow-2xl" />
                                ) : (
                                    <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{title}</h1>
                                )}
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-x-12">
                                {/* Left Column */}
                                <div>
                                    <div className="flex items-center space-x-4 mb-4 text-zinc-400 text-sm">
                                        {currentItem?.vote_average > 0 && <span className="text-green-400 font-semibold">{(currentItem.vote_average * 10).toFixed(0)}% Match</span>}
                                        <span>{releaseDate?.substring(0, 4)}</span>
                                        {currentItem.media_type === 'movie' && movieDetails?.runtime && <span>{formatRuntime(movieDetails.runtime)}</span>}
                                        {currentItem.media_type === 'tv' && tvDetails?.number_of_seasons && <span>{tvDetails.number_of_seasons} Season{tvDetails.number_of_seasons > 1 ? 's' : ''}</span>}
                                    </div>
                                    <p className="text-base leading-relaxed mb-6">{currentItem?.overview}</p>

                                    <div className="flex items-center space-x-4 mb-8">
                                        <button onClick={handleToggleWatchlist} className={`p-3 rounded-full border-2 ${isWatchlisted ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-zinc-600 text-zinc-400 hover:border-white hover:text-white'}`}>
                                            {isWatchlisted ? <StarIconSolid className="w-6 h-6"/> : <StarIcon className="w-6 h-6" />}
                                        </button>
                                        <button onClick={handleDislike} className={`p-3 rounded-full border-2 border-zinc-600 text-zinc-400 hover:border-white hover:text-white`}>
                                            <XIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                                {/* Right Column */}
                                <div className="text-sm">
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="font-semibold text-zinc-400 mb-1 sr-only">Cast</dt>
                                            <dd className="text-zinc-200">
                                               <span className="text-zinc-400">Cast: </span> {credits?.cast?.slice(0, 3).map(c => c.name).join(', ')}{credits && credits.cast.length > 3 ? ', ...' : ''}
                                            </dd>
                                        </div>
                                        {director && (
                                            <div>
                                                <dt className="font-semibold text-zinc-400 mb-1 sr-only">Director</dt>
                                                <dd className="text-zinc-200"><span className="text-zinc-400">Director: </span>{director.name}</dd>
                                            </div>
                                        )}
                                        {details?.genres && details.genres.length > 0 && (
                                            <div>
                                                <dt className="font-semibold text-zinc-400 mb-1 sr-only">Genres</dt>
                                                <dd className="text-zinc-200"><span className="text-zinc-400">Genres: </span>{details.genres.map(g => g.name).join(', ')}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                             {watchProviders?.flatrate && watchProviders.flatrate.length > 0 && (
                                <div className="mt-8 border-t border-zinc-800 pt-8">
                                    <h3 className="text-2xl font-bold mb-4">Watch Now</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {watchProviders.flatrate.map(provider => (
                                            <a key={provider.provider_id} href={watchProviders.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg transition-colors">
                                                <img src={`${IMAGE_BASE_URL}w92${provider.logo_path}`} alt={provider.provider_name} className="w-10 h-10 rounded-md" />
                                                <span className="font-semibold">{provider.provider_name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {similar.length > 0 && (
                                <div className="mt-8 border-t border-zinc-800 pt-8">
                                    <h3 className="text-2xl font-bold mb-4">More Like This</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {similar.slice(0, 8).map(sItem => (
                                            <MediaItemCard 
                                                key={`${sItem.media_type}-${sItem.id}`} 
                                                item={sItem} 
                                                onSelect={(selected) => {
                                                    onClose();
                                                    // Use a timeout to allow the current modal to close before opening the new one
                                                    setTimeout(() => onSelect(selected), 200);
                                                }} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
};


interface NetflixViewProps {
  apiKey: string;
  searchQuery: string;
  onInvalidApiKey: () => void;
  view: ViewType;
  activeFilter: ActiveFilter | null;
}

interface RowData {
  title: string;
  items: MediaItem[];
}

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery, onInvalidApiKey, view, activeFilter }) => {
    const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
    const [rows, setRows] = useState<RowData[]>([]);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [watchlistItems, setWatchlistItems] = useState<MediaItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null);

    const { watchlistIds, dislikedIds } = usePreferences();
    
    // Global listener for AI Assistant navigation
    useEffect(() => {
        const handleSelectEvent = (event: Event) => {
            const customEvent = event as CustomEvent<MediaItem>;
            setSelectedMediaItem(customEvent.detail);
        };
        window.addEventListener('selectMediaItem', handleSelectEvent);
        return () => window.removeEventListener('selectMediaItem', handleSelectEvent);
    }, []);

    const augmentMediaItemsWithProviders = useCallback(async (items: MediaItem[]): Promise<MediaItem[]> => {
        if (!items || items.length === 0) return [];
    
        const itemsToAugment = items.filter(item => item.poster_path);
        if (itemsToAugment.length === 0) return items;
    
        const providersPromises = itemsToAugment.map(item => {
            const providerFn = item.media_type === 'movie' ? getMovieWatchProviders : getTVShowWatchProviders;
            return providerFn(apiKey, item.id).catch(e => {
                if (!(e instanceof Error && e.message.includes('(Status: 404)'))) {
                    console.warn(`Could not fetch providers for ${item.id}`, e);
                }
                return null;
            });
        });
    
        const providersResults = await Promise.all(providersPromises);
    
        const providersById = new Map<number, WatchProviderCountry | null>();
        providersResults.forEach((result, index) => {
            if (result) {
                const itemId = itemsToAugment[index].id;
                providersById.set(itemId, result.results.GB || null);
            }
        });
    
        return items.map(item => {
            if (providersById.has(item.id)) {
                return { ...item, watchProviders: providersById.get(item.id) };
            }
            return item;
        });
    }, [apiKey]);
    
    const filterAndNormalize = useCallback((res: PaginatedResponse<Movie | TVShow>): MediaItem[] => {
        if (!res?.results) return [];
        return res.results
            .filter(item => !dislikedIds.has(item.id) && (item.media_type === 'movie' || item.media_type === 'tv'))
            .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
    }, [dislikedIds]);

    const normalizeMovies = useCallback((res: PaginatedResponse<Movie>): MediaItem[] => {
        if (!res?.results) return [];
        return res.results
            .filter(item => !dislikedIds.has(item.id))
            .map(normalizeMovie);
    }, [dislikedIds]);
    
    const normalizeTVShows = useCallback((res: PaginatedResponse<TVShow>): MediaItem[] => {
        if (!res?.results) return [];
        return res.results
            .filter(item => !dislikedIds.has(item.id))
            .map(normalizeTVShow);
    }, [dislikedIds]);


    const fetchForYouData = useCallback(async () => {
        setIsLoading(true);
        try {
            const processRow = async (fetchFn: () => Promise<any>, normalizeFn: (data: any) => MediaItem[]) => {
                const data = await fetchFn();
                const normalized = normalizeFn(data);
                return augmentMediaItemsWithProviders(normalized);
            };

            const rowPromises = [
                processRow(() => getTrendingAll(apiKey), filterAndNormalize),
                processRow(() => getPopularMovies(apiKey), normalizeMovies),
                processRow(() => getPopularTVShows(apiKey), normalizeTVShows),
                processRow(() => getUpcomingMovies(apiKey), normalizeMovies),
                processRow(() => getOnTheAirTVShows(apiKey), normalizeTVShows)
            ];

            const results = await Promise.allSettled(rowPromises);
            
            const [trendingItems, popularMoviesItems, popularTvItems, upcomingMoviesItems, onTheAirTvItems] = results.map(res => 
                res.status === 'fulfilled' ? res.value : []
            );

            const trendingForHero = (trendingItems || []).filter(i => i.backdrop_path).slice(0, 5);
            const newReleases = [...(upcomingMoviesItems || []), ...(onTheAirTvItems || [])];
            const newReleasesForHero = shuffleArray(newReleases.filter(i => i.backdrop_path)).slice(0, 5);
            
            const combinedHeroItems = [...trendingForHero, ...newReleasesForHero];
            setHeroItems(shuffleArray(combinedHeroItems));

            const newRows = [
                { title: "Trending This Week", items: trendingItems },
                { title: "Popular Movies", items: popularMoviesItems },
                { title: "Popular TV Shows", items: popularTvItems },
                { title: "Upcoming in Theaters", items: upcomingMoviesItems },
                { title: "Currently On The Air", items: onTheAirTvItems },
            ].filter(row => row.items.length > 0);
            
            setRows(newRows);

        } catch (error) {
            console.error("Error fetching data:", error);
            if (error instanceof Error && error.message.includes("Invalid API Key")) {
                onInvalidApiKey();
            }
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, onInvalidApiKey, filterAndNormalize, normalizeMovies, normalizeTVShows, augmentMediaItemsWithProviders]);
    
    const fetchFilteredHomePageData = useCallback(async (filter: ActiveFilter) => {
        setIsLoading(true);
        setRows([]);
        setHeroItems([]);
        try {
            const processRow = async (fetchFn: () => Promise<any>, normalizeFn: (data: any) => MediaItem[]) => {
                const data = await fetchFn();
                const normalized = normalizeFn(data);
                return augmentMediaItemsWithProviders(normalized);
            };
            
            let rowConfigs: { title: string; promise: Promise<MediaItem[]> }[] = [];

            if (filter.type === 'service') {
                rowConfigs = [
                    { title: `Popular Movies on ${filter.name}`, promise: processRow(() => getMoviesByProvider(apiKey, filter.id), normalizeMovies) },
                    { title: `Popular TV Shows on ${filter.name}`, promise: processRow(() => getTVShowsByProvider(apiKey, filter.id), normalizeTVShows) },
                    { title: `New Movies on ${filter.name}`, promise: processRow(() => getNewMoviesByProvider(apiKey, filter.id), normalizeMovies) },
                    { title: `New TV Shows on ${filter.name}`, promise: processRow(() => getNewTVShowsByProvider(apiKey, filter.id), normalizeTVShows) },
                ];
            } else if (filter.type === 'studio') {
                rowConfigs = [
                    { title: `Popular Movies from ${filter.name}`, promise: processRow(() => getMoviesByCompany(apiKey, filter.id), normalizeMovies) },
                    { title: `Top Rated from ${filter.name}`, promise: processRow(() => getTopRatedMoviesByCompany(apiKey, filter.id), normalizeMovies) },
                ];
            } else { // network
                 rowConfigs = [
                    { title: `Popular on ${filter.name}`, promise: processRow(() => discoverTVShows(apiKey, { with_networks: filter.id, sort_by: 'popularity.desc' }), normalizeTVShows) },
                    { title: `Top Rated on ${filter.name}`, promise: processRow(() => getTopRatedTVShowsByNetwork(apiKey, filter.id), normalizeTVShows) },
                ];
            }

            const results = await Promise.allSettled(rowConfigs.map(c => c.promise));

            const newRows = results.map((res, index) => ({
                title: rowConfigs[index].title,
                items: res.status === 'fulfilled' ? res.value : []
            })).filter(row => row.items.length > 0);

            const heroCandidates = newRows[0]?.items || [];
            setHeroItems(shuffleArray(heroCandidates.filter(i => i.backdrop_path)).slice(0, 10));
            setRows(newRows);

        } catch (error) {
             console.error(`Error fetching filtered data for ${filter.name}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, normalizeMovies, normalizeTVShows, augmentMediaItemsWithProviders]);


    const performSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const data = await searchMulti(apiKey, searchQuery, page);
            const normalized = data.results
                .filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && !dislikedIds.has(item.id))
                .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
            
            const augmented = await augmentMediaItemsWithProviders(normalized);
            
            setSearchResults(prev => page === 1 ? augmented : [...prev, ...augmented]);
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error("Error searching:", error);
            if (error instanceof Error && error.message.includes("Invalid API Key")) {
                onInvalidApiKey();
            }
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, apiKey, onInvalidApiKey, page, dislikedIds, augmentMediaItemsWithProviders]);
    
    const fetchWatchlistItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const watchlistArr = Array.from(watchlistIds);
            const itemPromises = watchlistArr.map(async (id: number) => {
                // To know the type, we might need a stored map or try fetching both
                try {
                    const movie = await getMovieDetails(apiKey, id);
                    return normalizeMovie(movie);
                } catch (e) {
                    try {
                        const tv = await getTVShowDetails(apiKey, id);
                        return normalizeTVShow(tv);
                    } catch (finalError) {
                        console.error(`Could not fetch details for watchlist item ${id}`, finalError);
                        return null;
                    }
                }
            });
            const items = (await Promise.all(itemPromises)).filter((item): item is MediaItem => item !== null);
            
            const augmented = await augmentMediaItemsWithProviders(items);
            
            setWatchlistItems(augmented);
        } catch (error) {
            console.error("Error fetching watchlist:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, watchlistIds, augmentMediaItemsWithProviders]);


    // Effect to reset page and results when query, view or filter changes
    useEffect(() => {
        setPage(1);
        setSearchResults([]);
        setWatchlistItems([]);
    }, [searchQuery, view, activeFilter]);


    // Effect to fetch data based on current state
    useEffect(() => {
        if (view === 'watchlist') {
            if (watchlistIds.size > 0) fetchWatchlistItems();
            else setIsLoading(false);
        } else if (searchQuery) {
            performSearch();
        } else if (activeFilter) {
            fetchFilteredHomePageData(activeFilter);
        } else {
            fetchForYouData();
        }
    }, [searchQuery, page, view, activeFilter, watchlistIds, fetchForYouData, performSearch, fetchWatchlistItems, fetchFilteredHomePageData]);
    
    const loadMore = () => {
        if (page < totalPages) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const hasMore = page < totalPages;

    const renderContent = () => {
        if (view === 'watchlist') {
            return <ResultsGrid 
                title="My Watchlist" 
                items={watchlistItems} 
                onSelect={setSelectedMediaItem} 
                isLoading={isLoading && watchlistItems.length === 0} 
            />;
        }
        if (searchQuery) {
            return <ResultsGrid 
                title={`Results for "${searchQuery}"`} 
                items={searchResults} 
                onSelect={setSelectedMediaItem} 
                isLoading={isLoading}
                loadMore={loadMore}
                hasMore={hasMore}
            />;
        }

        // Render Home page layout for both "For You" and filtered views
        return (
            <>
                <Hero items={heroItems} onSelect={setSelectedMediaItem} apiKey={apiKey} />
                <div className="relative z-10">
                    {rows.map(row => (
                         <MediaRow key={row.title} title={row.title} items={row.items} onSelect={setSelectedMediaItem} />
                    ))}
                </div>
            </>
        );
    }
    
    return (
        <div className="bg-primary">
            {isLoading && heroItems.length === 0 && rows.length === 0 && searchResults.length === 0 && watchlistItems.length === 0 ? (
                <div className="h-screen w-screen flex items-center justify-center"><Loader /></div>
             ) : renderContent()}

            {selectedMediaItem && (
                <Modal 
                    item={selectedMediaItem} 
                    onClose={() => setSelectedMediaItem(null)} 
                    apiKey={apiKey}
                    onInvalidApiKey={onInvalidApiKey}
                    onSelect={setSelectedMediaItem}
                />
            )}
        </div>
    );
};

export default NetflixView;