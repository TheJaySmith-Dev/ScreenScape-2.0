

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ViewType } from '../App';
import type { MediaItem, Movie, TVShow, Video, MovieDetails, TVShowDetails, CreditsResponse, ImageResponse, LogoImage, Episode, CastMember, CrewMember } from '../types';
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
} from '../services/tmdbService';
import { usePreferences } from '../hooks/usePreferences';
import Loader from './Loader';
import { PlayIcon, HeartIcon, HeartIconSolid, XIcon, ChevronDownIcon, MuteIcon, UnmuteIcon, NetflixLogo, DisneyPlusLogo, AppleTVPlusLogo, PrimeVideoLogo, HuluLogo } from './Icons';
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

// --- START: BRAND HUB COMPONENTS ---
const serviceHubs = [
  { id: 'disney', providerId: 337, LogoComponent: DisneyPlusLogo, hoverAnimation: "https://lumiere-a.akamaihd.net/v1/images/disney_logo_animation_march_2024_27a0dafe.gif" },
  { id: 'netflix', providerId: 8, LogoComponent: NetflixLogo, hoverAnimation: "https://www.caviarcriativo.com/wp-content/uploads/2020/06/Significados-da-Marca-Netflix-1.gif" },
  { id: 'apple', providerId: 2, LogoComponent: AppleTVPlusLogo, hoverAnimation: "https://cdn.dribbble.com/users/325495/screenshots/4294410/media/b6d616d0132b35a16f2c3510eac40461.gif" },
  { id: 'prime', providerId: 9, LogoComponent: PrimeVideoLogo, hoverAnimation: "https://i.gifer.com/origin/c8/c888e52e4604f323112248c8b6567551_w200.gif" },
  { id: 'hulu', providerId: 15, LogoComponent: HuluLogo, hoverAnimation: "https://i.gifer.com/origin/39/3931630c6d59b2e7a22a6f8b22a275f3_w200.gif" },
];

const HubButton: React.FC<{
    LogoComponent: React.ElementType;
    hoverAnimation: string;
    onClick: () => void;
}> = ({ LogoComponent, hoverAnimation, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative aspect-video rounded-lg bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-700/60 overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:border-zinc-400/80 hover:scale-105"
        >
            <div className="absolute inset-0 w-full h-full p-8 md:p-10 transition-all duration-300 ease-in-out group-hover:opacity-0 text-white flex items-center justify-center">
                <LogoComponent className="w-full h-auto max-h-full" />
            </div>
            <img
                src={isHovered ? hoverAnimation : ''}
                alt="Service Animation"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{ display: isHovered ? 'block' : 'none' }}
            />
        </button>
    );
};

const BrandHub: React.FC<{ onSelectProvider: (providerId: number) => void }> = ({ onSelectProvider }) => (
    <div className="mb-12 px-4 md:px-12">
        <h2 className="text-2xl font-bold mb-4 text-center">Stream Your Favorites</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {serviceHubs.map(hub => (
                <HubButton key={hub.id} {...hub} onClick={() => onSelectProvider(hub.providerId)} />
            ))}
        </div>
    </div>
);
// --- END: BRAND HUB COMPONENTS ---

interface MediaItemCardProps {
    item: MediaItem;
    onSelect: (item: MediaItem) => void;
    genres: Map<number, string>;
    isVertical: boolean;
}

const MediaItemCard: React.FC<MediaItemCardProps> = React.memo(({ item, onSelect, genres, isVertical }) => {
    const imagePath = isVertical ? item.poster_path : item.backdrop_path;
    const imageUrl = imagePath ? `${IMAGE_BASE_URL}w500${imagePath}` : `https://via.placeholder.com/${isVertical ? '500x750' : '500x281'}?text=No+Image`;
    const aspectRatio = isVertical ? 'aspect-[2/3]' : 'aspect-video';

    return (
        <div 
            className={`group relative flex-shrink-0 ${isVertical ? 'w-36 md:w-48' : 'w-64 md:w-80'} ${aspectRatio} rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-105 hover:z-10`}
            onClick={() => onSelect(item)}
        >
            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300"></div>
            <div className="absolute bottom-0 left-0 p-3 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                <h3 className="text-white text-sm font-bold truncate">{item.title}</h3>
                <div className="text-xs text-zinc-400 mt-1 flex items-center">
                    <span>{item.release_date?.substring(0, 4)}</span>
                    <span className="mx-2">&#8226;</span>
                    <span className="truncate">{item.genre_ids[0] ? genres.get(item.genre_ids[0]) : ''}</span>
                </div>
            </div>
        </div>
    );
});


interface MediaRowProps {
    title: string;
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
    genres: Map<number, string>;
    isVertical?: boolean;
}

const MediaRow: React.FC<MediaRowProps> = ({ title, items, onSelect, genres, isVertical = false }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-8 last:mb-0">
            <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-12">{title}</h2>
            <div className="relative">
                <div className="pl-4 md:pl-12 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <div className="flex space-x-4">
                        {items.map(item => (
                            <MediaItemCard key={`${item.media_type}-${item.id}`} item={item} onSelect={onSelect} genres={genres} isVertical={isVertical} />
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
}

const Hero: React.FC<HeroProps> = ({ items, onSelect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const item = items[currentIndex];

    // Auto-advance carousel
    useEffect(() => {
        if (items.length <= 1) return;
        const intervalId = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 8000); // 8 seconds per slide
        return () => clearInterval(intervalId);
    }, [items.length]);

    if (items.length === 0 || !item) {
        return <div className="h-[56.25vw] max-h-screen bg-zinc-900 animate-pulse"></div>;
    }

    const backdropPath = item.backdrop_path ? `${IMAGE_BASE_URL}original${item.backdrop_path}` : '';

    return (
        <div className="relative h-[56.25vw] max-h-screen w-full text-white overflow-hidden">
             {/* Keyed container for animations */}
            <div key={item.id} className="absolute inset-0">
                <div className="absolute inset-0 z-0 animate-scale-up-center duration-1000">
                   {backdropPath && <img src={backdropPath} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-50"></div>
                
                <div className="absolute bottom-10 md:bottom-20 left-4 md:left-12 z-20 max-w-lg animate-text-focus-in">
                    <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow-lg mb-4">{item.title}</h1>
                    <p className="text-sm md:text-base line-clamp-3 mb-6 drop-shadow-md">{item.overview}</p>
                    <div className="flex items-center space-x-3">
                        {/* FIX: The onSelect handler for the Play button was missing the 'item' argument, causing an error. */}
                        <button onClick={() => onSelect(item)} className="flex items-center justify-center bg-white text-black px-6 py-2 rounded-md font-semibold hover:bg-opacity-80 transition">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play
                        </button>
                        <button 
                            onClick={() => onSelect(item)}
                            className="flex items-center justify-center bg-zinc-700/60 text-white px-6 py-2 rounded-md font-semibold hover:bg-zinc-600/60 transition"
                        >
                            More Info
                        </button>
                    </div>
                </div>
            </div>
            {/* Carousel Dots */}
            {items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


interface SearchResultsGridProps {
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
    genres: Map<number, string>;
    isLoading: boolean;
    loadMore: () => void;
    hasMore: boolean;
}

const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({ items, onSelect, genres, isLoading, loadMore, hasMore }) => {
    const observer = useRef<IntersectionObserver>();
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, loadMore]);
    
    return (
        <div className="px-4 md:px-12 pt-28 pb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                 {items.map((item, index) => {
                    const isLastElement = items.length === index + 1;
                    return (
                        <div ref={isLastElement ? lastElementRef : null} key={`${item.media_type}-${item.id}`}>
                            <MediaItemCard 
                                item={item} 
                                onSelect={onSelect} 
                                genres={genres} 
                                isVertical={true} 
                            />
                        </div>
                    );
                })}
            </div>
            {isLoading && <Loader />}
            {!hasMore && !isLoading && items.length > 0 && <p className="text-center text-zinc-500 mt-8">You've reached the end!</p>}
        </div>
    );
};


interface ModalProps {
    item: MediaItem;
    onClose: () => void;
    apiKey: string;
    onInvalidApiKey: () => void;
    onSelect: (item: MediaItem) => void;
    genres: Map<number, string>;
}

const Modal: React.FC<ModalProps> = ({ item, onClose, apiKey, onInvalidApiKey, onSelect, genres }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [trailer, setTrailer] = useState<Video | null>(null);
    const [logo, setLogo] = useState<LogoImage | null>(null);
    const [credits, setCredits] = useState<CreditsResponse | null>(null);
    const [similar, setSimilar] = useState<MediaItem[]>([]);
    const [activeSeason, setActiveSeason] = useState<number | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    const { likedIds, likeMovie, dislikeMovie } = usePreferences();
    const isLiked = likedIds.has(item.id);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                const fetchFn = item.media_type === 'movie' ? getMovieDetails : getTVShowDetails;
                const creditsFn = item.media_type === 'movie' ? getMovieCredits : getTVShowCredits;
                const videoFn = item.media_type === 'movie' ? getMovieVideos : getTVShowVideos;
                const imageFn = item.media_type === 'movie' ? getMovieImages : getTVShowImages;
                const similarFn = item.media_type === 'movie' ? getSimilarMovies : null;

                const [detailsData, creditsData, videoData, imageData, similarData] = await Promise.all([
                    fetchFn(apiKey, item.id),
                    creditsFn(apiKey, item.id),
                    videoFn(apiKey, item.id),
                    imageFn(apiKey, item.id),
                    similarFn ? similarFn(apiKey, item.id) : Promise.resolve(null),
                ]);

                setDetails(detailsData);
                setCredits(creditsData);
                setTrailer(videoData);
                setLogo(imageData.logos.find(l => l.iso_639_1 === 'en') || imageData.logos[0] || null);
                if (similarData && 'results' in similarData) {
                    setSimilar(similarData.results.map(normalizeMovie));
                }

                if (item.media_type === 'tv' && 'seasons' in detailsData) {
                    const firstSeason = detailsData.seasons.find(s => s.season_number > 0);
                    if (firstSeason) {
                        setActiveSeason(firstSeason.season_number);
                    }
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

    useEffect(() => {
        if (item.media_type === 'tv' && activeSeason !== null) {
            const fetchEpisodes = async () => {
                const seasonDetails = await getTVShowSeasonDetails(apiKey, item.id, activeSeason);
                setEpisodes(seasonDetails.episodes);
            };
            fetchEpisodes();
        }
    }, [activeSeason, item, apiKey]);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        likeMovie(item.id);
    }
    
    const handleDislike = (e: React.MouseEvent) => {
        e.stopPropagation();
        dislikeMovie(item.id);
    }

    const backdropPath = details?.backdrop_path ? `${IMAGE_BASE_URL}original${details.backdrop_path}` : '';
    const tvDetails = details as TVShowDetails;
    const movieDetails = details as MovieDetails;
    const director = credits?.crew?.find((member: CrewMember) => member.job === 'Director');

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={onClose}>
            <div 
                className="bg-zinc-900 w-full max-w-3xl max-h-[90vh] rounded-lg overflow-y-auto shadow-2xl animate-scale-up-center scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
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
                                <>
                                <VideoPlayer videoKey={trailer.key} isMuted={isMuted} />
                                <div className="absolute top-4 right-16 z-10">
                                    <button 
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="h-10 w-10 rounded-full border border-white/50 bg-black/30 flex items-center justify-center text-white backdrop-blur-sm"
                                    >
                                        {isMuted ? <MuteIcon className="w-6 h-6" /> : <UnmuteIcon className="w-6 h-6" />}
                                    </button>
                                </div>
                                </>
                            ) : (
                                backdropPath && <img src={backdropPath} alt={item.title} className="w-full h-full object-cover" />
                            )}
                            <button onClick={onClose} className="absolute top-4 right-4 h-10 w-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition z-10">
                                <XIcon className="w-6 h-6" />
                            </button>
                            {/* START: Redesigned Compact Layout */}
                             <div className="absolute bottom-0 left-0 right-0 p-8 z-10 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent">
                                <div className="max-w-[50%] mb-4">
                                     {logo?.file_path ? (
                                        <img src={`${IMAGE_BASE_URL}w500${logo.file_path}`} alt={`${item.title} logo`} className="max-h-20 max-w-full drop-shadow-2xl" />
                                    ) : (
                                        // FIX: TVShowDetails has `name` not `title`. Conditionally access the correct property.
                                        <h1 className="text-4xl font-bold text-white drop-shadow-lg">{(details && ('title' in details ? details.title : (details as TVShowDetails).name)) || item.title}</h1>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-x-12 items-start">
                                    {/* Left Column */}
                                    <div>
                                        <div className="flex items-center space-x-4 mb-4">
                                            <button onClick={onClose} className="flex items-center justify-center bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-opacity-80 transition text-lg">
                                                <PlayIcon className="w-6 h-6 mr-2" />
                                                Play
                                            </button>
                                            <button onClick={handleLike} className={`p-3 rounded-full border-2 ${isLiked ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-zinc-600 text-zinc-400 hover:border-white hover:text-white'}`}>
                                                {isLiked ? <HeartIconSolid className="w-6 h-6"/> : <HeartIcon className="w-6 h-6" />}
                                            </button>
                                            <button onClick={handleDislike} className={`p-3 rounded-full border-2 border-zinc-600 text-zinc-400 hover:border-white hover:text-white`}>
                                                <XIcon className="w-6 h-6" />
                                            </button>
                                        </div>
                                         <div className="flex items-center space-x-4 mb-4 text-zinc-400 text-sm">
                                            {details?.vote_average && details.vote_average > 0 ? <span className="text-green-400 font-semibold">{(details.vote_average * 10).toFixed(0)}% Match</span> : null}
                                            <span>{(details && ('release_date' in details ? details.release_date : details.first_air_date))?.substring(0, 4)}</span>
                                            {item.media_type === 'movie' && movieDetails?.runtime ? <span>{formatRuntime(movieDetails.runtime)}</span> : null}
                                            {item.media_type === 'tv' && tvDetails?.number_of_seasons ? <span>{tvDetails.number_of_seasons} Season{tvDetails.number_of_seasons > 1 ? 's' : ''}</span> : null}
                                        </div>
                                        <p className="text-sm leading-relaxed line-clamp-3">{details?.overview}</p>
                                    </div>
                                    {/* Right Column */}
                                    <div className="text-sm mt-4 md:mt-0">
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
                            </div>
                            {/* END: Redesigned Compact Layout */}
                        </div>

                        <div className="p-8 pt-0">
                            {item.media_type === 'tv' && tvDetails?.seasons?.length > 0 && (
                                <div className="mt-8 border-t border-zinc-800 pt-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold">Episodes</h3>
                                        <select
                                            value={activeSeason ?? ''}
                                            onChange={e => setActiveSeason(Number(e.target.value))}
                                            className="bg-zinc-800 rounded-md px-3 py-1 border border-zinc-700"
                                        >
                                            {tvDetails.seasons.filter(s => s.season_number > 0).map(season => (
                                                <option key={season.id} value={season.season_number}>
                                                    Season {season.season_number}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        {episodes.map(episode => (
                                            <div key={episode.id} className="flex items-start p-3 hover:bg-zinc-800/50 rounded-lg">
                                                <span className="text-xl text-zinc-400 font-semibold mr-4">{episode.episode_number}</span>
                                                <div className="w-48 h-24 mr-4 flex-shrink-0">
                                                    <img 
                                                        src={episode.still_path ? `${IMAGE_BASE_URL}w300${episode.still_path}` : 'https://via.placeholder.com/300x169?text=No+Image'} 
                                                        alt={episode.name} 
                                                        className="w-full h-full object-cover rounded-md" 
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold">{episode.name}</h4>
                                                    <p className="text-sm text-zinc-400 line-clamp-2 mt-1">{episode.overview}</p>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {similar.length > 0 && (
                                <div className="mt-8 border-t border-zinc-800 pt-8">
                                    <MediaRow title="More Like This" items={similar} onSelect={onSelect} genres={genres} isVertical />
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
}

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery, onInvalidApiKey, view }) => {
  const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
  const [rows, setRows] = useState<{ title: string; items: MediaItem[]; isVertical?: boolean }[]>([]);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [genres, setGenres] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { likedIds } = usePreferences();
  const [likedItems, setLikedItems] = useState<MediaItem[]>([]);
  const [isLikedItemsLoading, setIsLikedItemsLoading] = useState(false);
  
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

  useEffect(() => {
    const fetchGenres = async () => {
        try {
            const genreMap = await getGenres(apiKey);
            setGenres(genreMap);
        } catch (error) {
            console.error("Error fetching genres:", error);
            if (error instanceof Error && error.message.includes("Invalid API Key")) {
                onInvalidApiKey();
            }
        }
    };
    fetchGenres();
  }, [apiKey, onInvalidApiKey]);

  const loadDataForView = useCallback(async () => {
    setIsLoading(true);
    resetScroll();
    try {
        let newRows: { title: string; items: MediaItem[], isVertical?: boolean }[] = [];
        let newHeroItems: MediaItem[] = [];

        if (view === 'home') {
            const [trending, popularMovies, popularTv, upcomingMovies, onTheAirTv] = await Promise.all([
                getTrendingAll(apiKey),
                getPopularMovies(apiKey),
                getPopularTVShows(apiKey),
                getUpcomingMovies(apiKey),
                getOnTheAirTVShows(apiKey),
            ]);
            
            newHeroItems = shuffleArray(trending.results.map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow)).filter(item => item.backdrop_path)).slice(0, 5);
            
            newRows = [
                { title: "Trending This Week", items: trending.results.map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow)) },
                { title: "Popular on ScreenScape", items: popularMovies.results.map(normalizeMovie), isVertical: true },
                { title: "Fan Favorites", items: popularTv.results.map(normalizeTVShow), isVertical: true },
                { title: "Coming Soon", items: upcomingMovies.results.map(normalizeMovie) },
                { title: "Currently Airing", items: onTheAirTv.results.map(normalizeTVShow) },
            ];

        } else if (view === 'movies') {
            const [popularMovies, upcomingMovies] = await Promise.all([
                getPopularMovies(apiKey),
                getUpcomingMovies(apiKey),
            ]);
            newHeroItems = shuffleArray(popularMovies.results.map(normalizeMovie).filter(item => item.backdrop_path)).slice(0, 5);
            newRows = [
                { title: "Popular Movies", items: popularMovies.results.map(normalizeMovie), isVertical: true },
                { title: "Upcoming Movies", items: upcomingMovies.results.map(normalizeMovie) },
            ];

        } else if (view === 'tv') {
             const [popularTv, onTheAirTv] = await Promise.all([
                getPopularTVShows(apiKey),
                getOnTheAirTVShows(apiKey),
            ]);
            newHeroItems = shuffleArray(popularTv.results.map(normalizeTVShow).filter(item => item.backdrop_path)).slice(0, 5);
            newRows = [
                { title: "Popular TV Shows", items: popularTv.results.map(normalizeTVShow), isVertical: true },
                { title: "Currently Airing TV", items: onTheAirTv.results.map(normalizeTVShow) },
            ];
        }

        setHeroItems(newHeroItems);
        setRows(newRows);
    } catch (error) {
      console.error(`Error fetching data for ${view}:`, error);
      if (error instanceof Error && error.message.includes("Invalid API Key")) {
        onInvalidApiKey();
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, onInvalidApiKey, view]);

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
    } else {
        loadDataForView();
        setSearchResults([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, view]);

  const loadMoreSearchResults = () => {
    const nextPage = searchPage + 1;
    setSearchPage(nextPage);
    fetchSearchResults(searchQuery, nextPage, false);
  };
  
  const handleSelectProvider = useCallback(async (providerId: number) => {
    setIsLoading(true);
    resetScroll();
    try {
        const [movies, tvShows] = await Promise.all([
            getMoviesByProvider(apiKey, providerId),
            getTVShowsByProvider(apiKey, providerId),
        ]);

        const combined = shuffleArray([
            ...movies.results.map(normalizeMovie),
            ...tvShows.results.map(normalizeTVShow),
        ]);
        
        const service = serviceHubs.find(s => s.providerId === providerId);
        
        setHeroItems(combined.filter(i => i.backdrop_path).slice(0, 5));
        setRows([
            { title: `Top on ${service?.id || 'Service'}`, items: combined },
        ]);

    } catch (error) {
        console.error(`Error fetching data for provider ${providerId}:`, error);
        if (error instanceof Error && error.message.includes("Invalid API Key")) {
            onInvalidApiKey();
        }
    } finally {
        setIsLoading(false);
    }
  }, [apiKey, onInvalidApiKey]);


  useEffect(() => {
    if (view === 'likes') {
        const fetchLikedItems = async () => {
            if (likedIds.size === 0) {
                setLikedItems([]);
                return;
            }

            setIsLikedItemsLoading(true);
            const likedItemsArray: MediaItem[] = [];
            
            // We can't know if an ID is a movie or TV show, so we try fetching both.
            // This is not ideal, but necessary with the current data structure.
            for (const id of likedIds) {
                try {
                    const movieDetails = await getMovieDetails(apiKey, id);
                    likedItemsArray.push(normalizeMovie(movieDetails));
                } catch (movieError) {
                    try {
                        const tvDetails = await getTVShowDetails(apiKey, id);
                        likedItemsArray.push(normalizeTVShow(tvDetails));
                    } catch (tvError) {
                        console.warn(`Could not fetch details for ID ${id}:`, movieError, tvError);
                    }
                }
            }
            setLikedItems(likedItemsArray);
            setIsLikedItemsLoading(false);
        };
        fetchLikedItems();
    }
  }, [view, likedIds, apiKey]);


  const renderContent = () => {
    if (searchQuery) {
        return (
            <SearchResultsGrid 
                items={searchResults}
                onSelect={setSelectedItem}
                genres={genres}
                isLoading={isSearchLoading}
                loadMore={loadMoreSearchResults}
                hasMore={hasMoreResults}
            />
        );
    }
    
    if (view === 'likes') {
        if (isLikedItemsLoading) return <div className="pt-28"><Loader /></div>;
        if (likedItems.length === 0) return <p className="text-center pt-40 text-zinc-400">You haven't liked any titles yet.</p>;
        return (
             <div className="pt-28">
                <MediaRow title="Your Liked Titles" items={likedItems} onSelect={setSelectedItem} genres={genres} isVertical />
            </div>
        )
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
            <Hero items={heroItems} onSelect={setSelectedItem} />
            <div className="py-8">
                 <BrandHub onSelectProvider={handleSelectProvider} />
                {rows.map((row, index) => (
                    <MediaRow key={`${row.title}-${index}`} {...row} onSelect={setSelectedItem} genres={genres} />
                ))}
            </div>
        </>
    );
  };

  return (
    <div>
      {renderContent()}
      {selectedItem && (
        <Modal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            apiKey={apiKey}
            onInvalidApiKey={onInvalidApiKey}
            onSelect={setSelectedItem}
            genres={genres}
        />
      )}
    </div>
  );
};

export default NetflixView;