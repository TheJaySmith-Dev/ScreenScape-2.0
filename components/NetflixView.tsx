




import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ViewType } from '../App';
// FIX: Added WatchProviderCountry to the import list to resolve 'Cannot find name' error.
import type { MediaItem, Movie, TVShow, Video, MovieDetails, TVShowDetails, CreditsResponse, ImageResponse, LogoImage, Episode, CastMember, CrewMember, WatchProviderResponse, WatchProviderCountry, ActiveFilter } from '../types';
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
  getGenres,
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

interface MediaItemCardProps {
    item: MediaItem;
    onSelect: (item: MediaItem) => void;
}

const MediaItemCard: React.FC<MediaItemCardProps> = React.memo(({ item, onSelect }) => {
    const imageUrl = item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : `https://via.placeholder.com/500x750?text=No+Image`;
    
    return (
        <div 
            className="group relative flex-shrink-0 w-36 md:w-48 aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:z-10 shadow-lg hover:shadow-cyan-500/20"
            onClick={() => onSelect(item)}
        >
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300"></div>
            <div className="absolute inset-0 p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                            <MediaItemCard key={`${item.media_type}-${item.id}`} item={item} onSelect={onSelect} />
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
    const [watchProviders, setWatchProviders] = useState<WatchProviderCountry | null>(null);
    
    const item = items[currentIndex];

    const advanceSlide = useCallback(() => {
        if (items.length > 1) {
            setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
        }
    }, [items.length]);

    useEffect(() => {
        if (items.length <= 1) return;
        // FIX: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout.
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
            setWatchProviders(null);
            try {
                const videoFn = item.media_type === 'movie' ? getMovieVideos : getTVShowVideos;
                const providerFn = item.media_type === 'movie' ? getMovieWatchProviders : getTVShowWatchProviders;
                const [videos, providerData] = await Promise.all([
                    videoFn(apiKey, item.id),
                    providerFn(apiKey, item.id)
                ]);
                const bestVideo = videos.find(v => v.type === 'Clip') || videos.find(v => v.type === 'Teaser');
                setTrailer(bestVideo || null);
                setWatchProviders(providerData.results.US || null);
            } catch (error) {
                console.error("Error fetching hero extras", error);
            }
        };
        fetchHeroExtras();
    }, [item, apiKey]);

    if (!item) {
        return <div className="h-[85vh] md:h-[56.25vw] md:max-h-[80vh] w-full bg-zinc-900 animate-pulse"></div>;
    }
    
    const backdropPath = item.backdrop_path ? `${IMAGE_BASE_URL}original${item.backdrop_path}` : '';
    const flatrateProvider = watchProviders?.flatrate?.[0];

    return (
        <div className="relative w-full text-white overflow-hidden h-[85vh] md:h-[56.25vw] md:max-h-[80vh]">
            {/* Background */}
            <div className="absolute inset-0 z-0 animate-scale-up-center">
                <div className="w-full h-full">
                    {trailer?.key ? (
                       <VideoPlayer videoKey={trailer.key} isMuted={true} onEnd={advanceSlide} loop={false} />
                    ) : (
                       backdropPath && <img src={backdropPath} alt={item.title} className="w-full h-full object-cover" />
                    )}
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
                        <a href={watchProviders?.link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center bg-white text-black px-6 py-3 rounded-md font-bold hover:bg-opacity-80 transition text-lg">
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
            {/* Carousel Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
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
    const observer = useRef<IntersectionObserver>();
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
    const [watchProviders, setWatchProviders] = useState<WatchProviderCountry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTrailerMuted, setIsTrailerMuted] = useState(true);

    const { watchlistIds, toggleWatchlist, dislikeItem } = usePreferences();
    const isWatchlisted = watchlistIds.has(item.id);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                const fetchFn = item.media_type === 'movie' ? getMovieDetails : getTVShowDetails;
                const creditsFn = item.media_type === 'movie' ? getMovieCredits : getTVShowCredits;
                const videoFn = item.media_type === 'movie' ? getMovieVideos : getTVShowVideos;
                const imageFn = item.media_type === 'movie' ? getMovieImages : getTVShowImages;
                const similarFn = item.media_type === 'movie' ? getSimilarMovies : null;
                const providerFn = item.media_type === 'movie' ? getMovieWatchProviders : getTVShowWatchProviders;


                const [detailsData, creditsData, videoData, imageData, similarData, providerData] = await Promise.all([
                    fetchFn(apiKey, item.id),
                    creditsFn(apiKey, item.id),
                    videoFn(apiKey, item.id),
                    imageFn(apiKey, item.id),
                    similarFn ? similarFn(apiKey, item.id) : Promise.resolve(null),
                    providerFn(apiKey, item.id),
                ]);

                const bestTrailer = videoData.find(v => v.type === 'Trailer') || videoData.find(v => v.type === 'Teaser') || videoData.find(v => v.type === 'Clip') || videoData[0] || null;

                setDetails(detailsData);
                setCredits(creditsData);
                setTrailer(bestTrailer);
                setLogo(imageData.logos.find(l => l.iso_639_1 === 'en') || imageData.logos[0] || null);
                setWatchProviders(providerData.results.US || null);
                if (similarData && 'results' in similarData) {
                    setSimilar(similarData.results.map(normalizeMovie));
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
        // FIX: Pass item.id to dislikeItem as required by the function signature.
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
                                                <span className="font-semibold">Watch on {provider.provider_name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {similar.length > 0 && (
                                <div className="mt-8 border-t border-zinc-800 pt-8">
                                    <MediaRow title="More Like This" items={similar} onSelect={onSelect} />
                                </div>
                             )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


interface NetflixViewProps {
  apiKey: string;
  searchQuery: string;
  onInvalidApiKey: () => void;
  view: ViewType;
  activeFilter: ActiveFilter | null;
}

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery, onInvalidApiKey, view, activeFilter }) => {
  const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
  const [rows, setRows] = useState<{ title: string; items: MediaItem[] }[]>([]);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { watchlistIds } = usePreferences();
  const [watchlistItems, setWatchlistItems] = useState<MediaItem[]>([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  
  const resetScroll = () => window.scrollTo(0, 0);

  useEffect(() => {
    const handleSelectItem = (event: CustomEvent<MediaItem>) => {
      setSelectedItem(event.detail);
    };
    window.addEventListener('selectMediaItem', handleSelectItem as EventListener);
    return () => {
      window.removeEventListener('selectMediaItem', handleSelectItem as EventListener);
    };
  }, []);

  const loadDataForView = useCallback(async (filter: ActiveFilter | null) => {
    setIsLoading(true);
    resetScroll();
    try {
        let newRows: { title: string; items: MediaItem[] }[] = [];
        let newHeroItems: MediaItem[] = [];

        if (filter) {
            let title = '';
            let results: MediaItem[] = [];

            if (filter.type === 'service') {
                title = `Top on ${filter.name}`;
                const [movies, tvShows] = await Promise.all([
                    getMoviesByProvider(apiKey, filter.id),
                    getTVShowsByProvider(apiKey, filter.id)
                ]);
                results = shuffleArray([...movies.results.map(normalizeMovie), ...tvShows.results.map(normalizeTVShow)]);
            } else if (filter.type === 'studio') {
                title = `Movies from ${filter.name}`;
                const movies = await getMoviesByCompany(apiKey, filter.id);
                results = movies.results.map(normalizeMovie);
            } else if (filter.type === 'network') {
                title = `Shows on ${filter.name}`;
                const tvShows = await discoverTVShows(apiKey, { with_networks: filter.id });
                results = tvShows.results.map(normalizeTVShow);
            }
            
            newHeroItems = results.filter(i => i.backdrop_path).slice(0, 10);
            newRows.push({ title: title, items: results });
        } else {
             // "For You" logic
             const [trending, popularMovies, popularTv, upcomingMovies] = await Promise.all([
                getTrendingAll(apiKey),
                getPopularMovies(apiKey),
                getPopularTVShows(apiKey),
                getUpcomingMovies(apiKey),
            ]);
            const trendingItems = trending.results.map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow)).filter(i => i.backdrop_path);
            const upcomingItems = upcomingMovies.results.map(normalizeMovie).filter(i => i.backdrop_path);
            
            newHeroItems = shuffleArray([...trendingItems.slice(0, 5), ...upcomingItems.slice(0, 5)]);

            newRows = [
                { title: "Trending This Week", items: trendingItems },
                { title: "Popular Movies", items: popularMovies.results.map(normalizeMovie) },
                { title: "Popular TV Shows", items: popularTv.results.map(normalizeTVShow) },
                { title: "Coming Soon to Cinemas", items: upcomingItems },
            ];
        }

        setHeroItems(newHeroItems);
        setRows(newRows);
    } catch (error) {
      console.error(`Error fetching data for view:`, error);
      if (error instanceof Error && error.message.includes("Invalid API Key")) {
        onInvalidApiKey();
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, onInvalidApiKey]);

  const fetchSearchResults = useCallback(async (query: string, page: number, clear: boolean = false) => {
    setIsSearchLoading(true);
    try {
        const data = await searchMulti(apiKey, query, page);
        const validResults = data.results.filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path).map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
        
        setSearchResults(prev => clear ? validResults : [...prev, ...validResults]);
        setHasMoreResults(data.page < data.total_pages);
    } catch (error) {
        console.error("Error fetching search results:", error);
         if (error instanceof Error && error.message.includes("Invalid API Key")) {
            onInvalidApiKey();
        }
    } finally {
        setIsSearchLoading(false);
    }
  }, [apiKey, onInvalidApiKey]);
  
  useEffect(() => {
    if (searchQuery) {
      setSearchResults([]);
      setSearchPage(1);
      setHasMoreResults(true);
      fetchSearchResults(searchQuery, 1, true);
    }
  }, [searchQuery, fetchSearchResults]);

  useEffect(() => {
      if (!searchQuery && view === 'home') {
          loadDataForView(activeFilter);
      }
  }, [view, activeFilter, searchQuery, loadDataForView]);


  const loadMoreSearchResults = () => {
    const nextPage = searchPage + 1;
    setSearchPage(nextPage);
    fetchSearchResults(searchQuery, nextPage, false);
  };
  
  useEffect(() => {
    if (view === 'watchlist') {
        const fetchWatchlistItems = async () => {
            if (watchlistIds.size === 0) {
                setWatchlistItems([]);
                return;
            }

            setIsWatchlistLoading(true);
            const itemsArray: MediaItem[] = [];
            
            // Using Promise.all for parallel fetching
            const promises = Array.from(watchlistIds).map(async (id) => {
                try {
                    const movieDetails = await getMovieDetails(apiKey, id);
                    return normalizeMovie(movieDetails);
                } catch (movieError) {
                    try {
                        const tvDetails = await getTVShowDetails(apiKey, id);
                        return normalizeTVShow(tvDetails);
                    } catch (tvError) {
                        console.warn(`Could not fetch details for ID ${id}:`, movieError, tvError);
                        return null;
                    }
                }
            });

            const results = await Promise.all(promises);
            setWatchlistItems(results.filter((item): item is MediaItem => item !== null));
            setIsWatchlistLoading(false);
        };
        fetchWatchlistItems();
    }
  }, [view, watchlistIds, apiKey]);


  const renderContent = () => {
    if (searchQuery) {
        return (
            <ResultsGrid 
                title={`Results for "${searchQuery}"`}
                items={searchResults}
                onSelect={setSelectedItem}
                isLoading={isSearchLoading}
                loadMore={loadMoreSearchResults}
                hasMore={hasMoreResults}
            />
        );
    }
    
    if (view === 'watchlist') {
        if (watchlistItems.length === 0 && !isWatchlistLoading) {
            return <div className="pt-40 text-center text-zinc-400">Your watchlist is empty.</div>
        }
        return (
            <ResultsGrid
                title="My Watchlist"
                items={watchlistItems}
                onSelect={setSelectedItem}
                isLoading={isWatchlistLoading}
            />
        );
    }

    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
            <Loader />
        </div>
      );
    }
    
    return (
        <>
            <Hero items={heroItems} onSelect={setSelectedItem} apiKey={apiKey} />
            <div className="py-8">
                {rows.map((row, index) => (
                    <MediaRow key={`${row.title}-${index}`} {...row} onSelect={setSelectedItem} />
                ))}
            </div>
        </>
    );
  };

  return (
    <div className="-mt-36 md:-mt-20">
      {renderContent()}
      {selectedItem && (
        <Modal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            apiKey={apiKey}
            onInvalidApiKey={onInvalidApiKey}
            onSelect={setSelectedItem}
        />
      )}
    </div>
  );
};

export default NetflixView;