

import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import type { ViewType } from '../App';
import type { MediaItem, Movie, TVShow, Video, MovieDetails, TVShowDetails, CreditsResponse, ImageResponse, Episode, CastMember, CrewMember, WatchProviderResponse, WatchProviderCountry, ActiveFilter, PaginatedResponse } from '../types';
import type { Game } from './GameView';
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
  getSimilarTVShows,
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
import { useCountdown } from '../hooks/useCountdown';
import Loader from './Loader';
import { PlayIcon, StarIcon, StarIconSolid, XIcon, MuteIcon, UnmuteIcon, InfoIcon } from './Icons';
import VideoPlayer from './VideoPlayer';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const ENABLE_MODAL_IMAGE_BETA = (import.meta.env.VITE_ENABLE_MODAL_IMAGE_BETA ?? 'false') === 'true';

// --- Interaction Helpers ---
const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.style.position = 'relative'; 
    element.style.overflow = 'hidden';

    const circle = document.createElement("span");
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;
    const rect = element.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    
    const oldRipple = element.querySelector(".ripple");
    if (oldRipple) oldRipple.remove();
    
    element.appendChild(circle);

    setTimeout(() => circle.remove(), 600);
};

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

type TMDBImage = {
  file_path?: string | null;
  aspect_ratio?: number | null;
  width?: number;
  height?: number;
  iso_639_1?: string | null;
};

const DisneyPlusLogoOverlay: React.FC<{className?: string}> = ({ className = '' }) => (
    <img
        src="https://i.ibb.co/WWNxt1Gy/IMG-3932.png"
        alt="Available on Disney+"
        className={`absolute bottom-2 right-2 w-10 md:w-12 h-auto z-30 opacity-90 rounded-sm pointer-events-none ${className}`}
    />
);

const CountdownTimer: React.FC<{ releaseDate: string }> = ({ releaseDate }) => {
    const { days, hours, minutes, seconds, hasEnded } = useCountdown(releaseDate);

    if (hasEnded) {
        return (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-center text-xs font-semibold text-green-400 backdrop-blur-sm">
                Released!
            </div>
        );
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-center text-xs text-white backdrop-blur-sm">
            <span className="font-bold">{days}</span>d <span className="font-bold">{hours}</span>h <span className="font-bold">{minutes}</span>m <span className="font-bold">{seconds}</span>s
        </div>
    );
};

interface MediaItemCardProps {
    item: MediaItem;
    onSelect: (item: MediaItem) => void;
    isUpcoming?: boolean;
}

const MediaItemCard: React.FC<MediaItemCardProps> = React.memo(({ item, onSelect, isUpcoming }) => {
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
                {!isUpcoming && (
                    <div className="text-xs text-zinc-300 mt-1 flex items-center">
                        <span>{item.release_date?.substring(0, 4)}</span>
                    </div>
                )}
            </div>
            {isUpcoming && item.release_date && <CountdownTimer releaseDate={item.release_date} />}
        </div>
    );
});


interface MediaRowProps {
    title: string;
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
    isUpcomingRow?: boolean;
}

const MediaRow: React.FC<MediaRowProps> = ({ title, items, onSelect, isUpcomingRow }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-8 md:mb-12 last:mb-0">
            <h2 className="text-xl md:text-3xl font-bold mb-4 px-4 md:px-12">{title}</h2>
            <div className="relative">
                <div className="pl-4 md:pl-12 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <div className="flex space-x-4">
                        {items.filter(item => item.poster_path).map(item => (
                            <div key={`${item.media_type}-${item.id}`} className="flex-shrink-0 w-36 md:w-48">
                                <MediaItemCard item={item} onSelect={onSelect} isUpcoming={isUpcomingRow} />
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
    const animationFrameRef = useRef<number | undefined>(undefined);
    const heroContainerRef = useRef<HTMLDivElement>(null);
    
    const item = items[currentIndex];

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroContainerRef.current) return;
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = heroContainerRef.current;
            const x = clientX / offsetWidth;
            const y = clientY / offsetHeight;

            heroContainerRef.current.style.setProperty('--mouse-x', `${x}`);
            heroContainerRef.current.style.setProperty('--mouse-y', `${y}`);
        };

        const currentHero = heroContainerRef.current;
        currentHero?.addEventListener('mousemove', handleMouseMove);
        return () => currentHero?.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
            if (timerId) clearTimeout(timerId);
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

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        if (trailer) {
            progress.style.transition = 'none';
            progress.style.width = '100%';
        } else {
            const duration = 8000;
            progress.style.transition = '';
            progress.style.width = '0%';
            let start: number | null = null;

            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const elapsed = timestamp - start;
                const percent = Math.min((elapsed / duration) * 100, 100);
                if (progress) progress.style.width = percent + '%';
                if (percent < 100) animationFrameRef.current = requestAnimationFrame(step);
            };
            animationFrameRef.current = requestAnimationFrame(step);
        }

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [currentIndex, trailer]);


    if (!item) {
        return <div className="h-[85vh] md:h-[56.25vw] md:max-h-[80vh] w-full bg-zinc-900 animate-pulse"></div>;
    }
    
    const backdropPath = item.backdrop_path ? `${IMAGE_BASE_URL}original${item.backdrop_path}` : '';
    const flatrateProvider = item.watchProviders?.flatrate?.[0];
    const isDisneyPlus = item.watchProviders?.flatrate?.some(p => p.provider_id === 337);

    return (
        <div ref={heroContainerRef} className="hero-container relative w-full text-white overflow-hidden h-[85vh] md:h-auto md:aspect-[16/9] md:max-h-[80vh]">
            <div className="absolute inset-0 z-0 animate-scale-up-center">
                <div className="w-full h-full relative hero-light-effect">
                    {trailer?.key ? (
                       <VideoPlayer videoKey={trailer.key} isMuted={true} onEnd={() => advanceSlide()} loop={false} />
                    ) : (
                       backdropPath && <img src={backdropPath} alt={item.title} className="w-full h-full object-cover" />
                    )}
                    {isDisneyPlus && <DisneyPlusLogoOverlay className="!bottom-4 !right-4 md:!bottom-6 md:!right-6 !w-12 md:!w-16" />}
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent"></div>
            
            <div className="absolute bottom-[10%] left-4 right-4 md:left-12 md:right-auto z-20 md:max-w-lg animate-text-focus-in text-center md:text-left hero-parallax-content">
                <h1 className="text-3xl md:text-6xl font-extrabold drop-shadow-lg mb-2 md:mb-4">{item.title}</h1>
                <p className="text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-4 md:mb-6 drop-shadow-md text-zinc-300">{item.overview}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-3 sm:space-y-0 sm:space-x-3">
                    {flatrateProvider ? (
                        <a href={item.watchProviders?.link} target="_blank" rel="noopener noreferrer" onClick={createRipple} className="w-full sm:w-auto flex items-center justify-center glass-button glass-button-primary px-6 py-3 rounded-full font-bold text-white text-lg">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play on {serviceNameMap[flatrateProvider.provider_id] || flatrateProvider.provider_name}
                        </a>
                    ) : (
                        <button onClick={(e) => { onSelect(item); createRipple(e); }} className="w-full sm:w-auto flex items-center justify-center glass-button glass-button-primary px-6 py-3 rounded-full font-bold text-white text-lg">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play
                        </button>
                    )}
                    <button 
                        onClick={(e) => { onSelect(item); createRipple(e); }}
                        className="w-full sm:w-auto flex items-center justify-center glass-button glass-button-secondary text-white px-6 py-3 rounded-full font-semibold"
                    >
                        <InfoIcon className="w-6 h-6 mr-2" />
                        More Info
                    </button>
                </div>
            </div>
            <div className="liquid-progress-bar">
                <div className="liquid-bar-bg">
                    <div className="liquid-bar-fill" ref={progressBarRef}></div>
                </div>
            </div>
        </div>
    );
};


const GamePromoCard: React.FC<{ title: string; imageUrl: string; onClick: () => void }> = ({ title, imageUrl, onClick }) => (
    <div
        className="group relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:z-20 shadow-lg hover:shadow-cyan-500/20"
        onClick={onClick}
    >
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        {/* Add a subtle overlay on hover for feedback, but no text */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 z-10"></div>
    </div>
);

interface GameRowProps {
    onSelectGame: (game: Game) => void;
}

const GameRow: React.FC<GameRowProps> = ({ onSelectGame }) => {
    const games = [
        {
            id: 'trivia',
            title: 'Movie Trivia',
            imageUrl: 'https://i.postimg.cc/j55v2NhM/Movie-Trivia.avif',
        },
        {
            id: 'six-degrees',
            title: 'Six Degrees',
            imageUrl: 'https://i.postimg.cc/SQcVsy65/Six-Degrees.avif',
        },
        {
            id: 'guess-poster',
            title: 'Guess The Poster',
            imageUrl: 'https://i.postimg.cc/RV7MXncF/Guess-The-Poster.avif',
        },
        {
            id: 'box-office-compare',
            title: 'Box Office Compare',
            imageUrl: 'https://i.postimg.cc/6QcMy6kc/Box-Office-Compare.png',
        }
    ];

    return (
        <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-3xl font-bold mb-4 px-4 md:px-12">SS Games</h2>
            <div className="pl-4 md:pl-12 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <div className="flex space-x-4">
                    {games.map(game => (
                        <div key={game.id} className="flex-shrink-0 w-64 md:w-80">
                           <GamePromoCard
                                title={game.title}
                                imageUrl={game.imageUrl}
                                onClick={() => onSelectGame(game.id as Game)}
                           />
                        </div>
                    ))}
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
                          <MediaItemCard item={item} onSelect={onSelect} />
                        </div>
                    )
                })}
            </div>
            {isLoading && <Loader />}
        </div>
    );
};


interface ModalProps {
  item: MediaItem;
  apiKey: string;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}

interface ImageCarouselProps {
  title: string;
  images: TMDBImage[];
  size: string;
  altPrefix: string;
  isLogo?: boolean;
}

const ArrowIcon: React.FC<{ direction: 'left' | 'right'; className?: string }> = ({ direction, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    {direction === 'left' ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    )}
  </svg>
);

const ImageCarousel: React.FC<ImageCarouselProps> = ({ title, images, size, altPrefix, isLogo }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const carouselId = useId();
  const scrollAmount = 600;

  const validImages = images.filter((img): img is TMDBImage & { file_path: string } => Boolean(img.file_path));

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const itemSizeClass = isLogo
    ? 'h-28 md:h-32 min-w-[180px] md:min-w-[220px]'
    : size === 'w780'
      ? 'h-44 md:h-56 min-w-[260px] md:min-w-[320px]'
      : 'h-48 min-w-[150px] md:min-w-[190px]';

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {validImages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label={`Scroll ${title} left`}
              aria-controls={carouselId}
              className="w-9 h-9 rounded-full border border-glass-edge bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label={`Scroll ${title} right`}
              aria-controls={carouselId}
              className="w-9 h-9 rounded-full border border-glass-edge bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        )}
      </div>
      {validImages.length > 0 ? (
        <div className="relative">
          <div
            id={carouselId}
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent snap-x snap-mandatory focus:outline-none"
            tabIndex={0}
            role="list"
          >
            {validImages.map((image, index) => (
              <div
                key={`${image.file_path}-${index}`}
                className={`flex-shrink-0 ${itemSizeClass} rounded-xl border border-glass-edge bg-black/40 backdrop-blur-md overflow-hidden snap-start`}
                role="listitem"
              >
                <img
                  src={`${IMAGE_BASE_URL}${size}${image.file_path}`}
                  alt={`${altPrefix} ${index + 1}`}
                  className={`w-full h-full ${isLogo ? 'object-contain p-4 bg-white/10' : 'object-cover'}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-glass border border-glass-edge rounded-lg px-4 py-6 text-center text-sm text-zinc-400">
          No {title.toLowerCase()} available.
        </div>
      )}
    </div>
  );
};

const Modal: React.FC<ModalProps> = ({ item, apiKey, onClose, onSelect }) => {
  const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [similarItems, setSimilarItems] = useState<MediaItem[]>([]);
  const [images, setImages] = useState<ImageResponse | null>(null);
  const { isInWatchlist, toggleWatchlist } = usePreferences();

  useEffect(() => {
    const fetchDetails = async () => {
        try {
            const detailsFn = item.media_type === 'movie' ? getMovieDetails : getTVShowDetails;
            const videoFn = item.media_type === 'movie' ? getMovieVideos : getTVShowVideos;
            const similarFn = item.media_type === 'movie' ? getSimilarMovies : getSimilarTVShows;
            const imagesFn = item.media_type === 'movie' ? getMovieImages : getTVShowImages;

            const [detailsData, videoData, similarData, imagesData] = await Promise.all([
                detailsFn(apiKey, item.id),
                videoFn(apiKey, item.id),
                similarFn(apiKey, item.id),
                ENABLE_MODAL_IMAGE_BETA ? imagesFn(apiKey, item.id) : Promise.resolve(null as ImageResponse | null),
            ]);

            setDetails(detailsData);

            const bestVideo = videoData.find(v => v.type === 'Trailer') || videoData.find(v => v.type === 'Teaser') || videoData[0];
            setTrailer(bestVideo || null);

            const normalizedSimilar = (similarData.results as (Movie | TVShow)[])
                .map(i => i.media_type === 'movie' ? normalizeMovie(i as Movie) : normalizeTVShow(i as TVShow))
                .filter(i => i.poster_path);
            setSimilarItems(normalizedSimilar);

            setImages(ENABLE_MODAL_IMAGE_BETA ? imagesData : null);

        } catch (e) {
            console.error("Failed to fetch modal details", e);
        }
    };
    setDetails(null);
    setTrailer(null);
    setSimilarItems([]);
    setImages(null);
    fetchDetails();
  }, [item, apiKey]);

  const backdropPath = details?.backdrop_path ? `${IMAGE_BASE_URL}original${details.backdrop_path}` : '';
  const flatrateProvider = item.watchProviders?.flatrate?.[0];
  const backdropImages = (images?.backdrops ?? []) as TMDBImage[];
  const posterImages = (images?.posters ?? []) as TMDBImage[];
  const logoImages = (images?.logos ?? []) as TMDBImage[];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-scale-up-center" onClick={onClose}>
        <div className="w-full h-full md:h-auto md:w-full max-w-4xl bg-primary md:rounded-xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-3 right-3 z-50">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="relative aspect-video">
                {trailer?.key ? (
                    <>
                    <VideoPlayer videoKey={trailer.key} isMuted={isMuted} loop={true} />
                    <div className="absolute bottom-4 right-4 z-40">
                        <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                            {isMuted ? <MuteIcon className="w-6 h-6" /> : <UnmuteIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    </>
                ) : (
                    backdropPath && <img src={backdropPath} alt={item.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>
            </div>

            <div className="p-6 md:p-8 max-h-[calc(100vh-56.25vw)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <h1 className="text-3xl md:text-5xl font-bold mb-2">{item.title}</h1>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-zinc-400 text-sm mb-4">
                    <span>{item.release_date?.substring(0, 4)}</span>
                    <span className="font-bold text-green-400 border border-green-400/50 px-1.5 py-0.5 rounded text-xs">{item.vote_average?.toFixed(1)}</span>
                    {details && 'runtime' in details && details.runtime && <span>{formatRuntime(details.runtime)}</span>}
                    {details && 'number_of_seasons' in details && <span>{details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}</span>}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {flatrateProvider ? (
                        <a href={item.watchProviders?.link} target="_blank" rel="noopener noreferrer" onClick={createRipple} className="w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center justify-center glass-button glass-button-primary px-6 py-3 rounded-full font-bold text-white text-lg">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play on {serviceNameMap[flatrateProvider.provider_id] || flatrateProvider.provider_name}
                        </a>
                    ) : (
                         <button onClick={createRipple} className="w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center justify-center glass-button glass-button-primary px-6 py-3 rounded-full font-bold text-white text-lg">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play Trailer
                        </button>
                    )}
                     <button onClick={(e) => { toggleWatchlist(item.id); createRipple(e); }} className={`w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center justify-center glass-button glass-button-secondary px-5 py-3 rounded-full font-semibold ${isInWatchlist(item.id) ? 'text-cyan-300' : 'text-white'}`}>
                        <StarIcon className="w-6 h-6 mr-2" isActive={isInWatchlist(item.id)} />
                        {isInWatchlist(item.id) ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>

                <p className="text-zinc-300 mb-6">{item.overview}</p>

                {details && details.genres && details.genres.length > 0 && (
                     <div className="flex flex-wrap gap-2 text-sm text-zinc-400">
                        <span className="font-semibold text-zinc-200">Genres:</span>
                        {details.genres.map(g => g.name).join(', ')}
                    </div>
                )}

                {ENABLE_MODAL_IMAGE_BETA && (
                  <div className="space-y-4">
                    <ImageCarousel
                      title="Backdrops"
                      images={backdropImages}
                      size="w780"
                      altPrefix={`${item.title} backdrop`}
                    />

                    <ImageCarousel
                      title="Posters"
                      images={posterImages}
                      size="w300"
                      altPrefix={`${item.title} poster`}
                    />

                    <ImageCarousel
                      title="Logos"
                      images={logoImages}
                      size="w300"
                      altPrefix={`${item.title} logo`}
                      isLogo
                    />
                  </div>
                )}

                {similarItems.length > 0 && (
                    <div className="mt-8">
                         <MediaRow title="More Like This" items={similarItems} onSelect={(selected) => {
                             onClose(); // Close current modal first
                             setTimeout(() => onSelect(selected), 150); // Open new one after transition
                         }} />
                    </div>
                )}
            </div>
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
  onSelectGame: (game: Game) => void;
}

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery, onInvalidApiKey, view, activeFilter, onSelectGame }) => {
  const [data, setData] = useState<{ [key: string]: MediaItem[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const { watchlistIds, dislikeItem, isDisliked } = usePreferences();
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  const processApiResponse = useCallback(<T extends Movie | TVShow>(response: PaginatedResponse<T>, normalizeFn: (item: T) => MediaItem) => {
      return response.results
        .map(normalizeFn)
        .filter(item => item.poster_path && !isDisliked(item.id));
  }, [isDisliked]);

  const fetchWithWatchProviders = useCallback(async (items: MediaItem[]): Promise<MediaItem[]> => {
    const providerPromises = items.map(async (item) => {
        const providerFn = item.media_type === 'movie' ? getMovieWatchProviders : getTVShowWatchProviders;
        try {
            const providers = await providerFn(apiKey, item.id);
            const gbProviders = providers.results?.GB;
            return { ...item, watchProviders: gbProviders || null };
        } catch {
            return { ...item, watchProviders: null };
        }
    });
    return Promise.all(providerPromises);
  }, [apiKey]);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [trending, popularMovies, popularTV, upcomingMovies, onTheAirTV] = await Promise.all([
            getTrendingAll(apiKey).then(res => processApiResponse(res, item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow))),
            getPopularMovies(apiKey).then(res => processApiResponse(res, normalizeMovie)),
            getPopularTVShows(apiKey).then(res => processApiResponse(res, normalizeTVShow)),
            getUpcomingMovies(apiKey).then(res => processApiResponse(res, normalizeMovie)),
            getOnTheAirTVShows(apiKey).then(res => processApiResponse(res, normalizeTVShow))
        ]);

        const trendingWithProviders = await fetchWithWatchProviders(trending);
        const upcomingWithProviders = await fetchWithWatchProviders(upcomingMovies);
        
        const heroItems = shuffleArray([...trendingWithProviders.slice(0, 5), ...upcomingWithProviders.slice(0, 5)]).slice(0, 10);
        
        setData({
            'For You': heroItems,
            'Trending Now': trendingWithProviders,
            'Popular Movies': popularMovies,
            'Popular TV Shows': popularTV,
            'Upcoming Movies': upcomingWithProviders,
            'On The Air': onTheAirTV,
        });
    } catch (e: any) {
        if (e.message.includes("Invalid API Key")) {
            onInvalidApiKey();
        }
        setError('Failed to fetch data.');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [apiKey, onInvalidApiKey, processApiResponse, fetchWithWatchProviders]);

  const handleSearch = useCallback(async (query: string, page: number = 1) => {
      if (!query) {
          setSearchResults([]);
          setHasMoreResults(false);
          return;
      }
      setIsLoading(true);
      try {
          const response = await searchMulti(apiKey, query, page);
          // FIX: Add type guard to safely filter for only Movie or TVShow types, as Person type does not have media_type.
          const newResults = response.results
            .filter((item): item is Movie | TVShow => ('media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv')))
            .map(item => item.media_type === 'movie' ? normalizeMovie(item) : normalizeTVShow(item))
            .filter(item => item.poster_path && !isDisliked(item.id));
            
          setSearchResults(prev => page === 1 ? newResults : [...prev, ...newResults]);
          setHasMoreResults(response.page < response.total_pages);
      } catch (e) {
          console.error("Search failed:", e);
      } finally {
          setIsLoading(false);
      }
  }, [apiKey, isDisliked]);

  const handleFilter = useCallback(async (filter: ActiveFilter) => {
      setIsLoading(true);
      setSearchResults([]); // Clear previous results
      try {
          let moviePromise, tvPromise;
          switch (filter.type) {
              case 'service':
                  moviePromise = getMoviesByProvider(apiKey, filter.id);
                  tvPromise = getTVShowsByProvider(apiKey, filter.id);
                  break;
              case 'studio':
                  moviePromise = getMoviesByCompany(apiKey, filter.id);
                  tvPromise = Promise.resolve(null); // No direct TV equivalent for studio
                  break;
              case 'network':
                  moviePromise = Promise.resolve(null); // No movie equivalent for network
                  tvPromise = discoverTVShows(apiKey, { with_networks: filter.id, sort_by: 'popularity.desc' });
                  break;
          }
          const [movieRes, tvRes] = await Promise.all([moviePromise, tvPromise]);
          const movies = movieRes ? processApiResponse(movieRes, normalizeMovie) : [];
          const tvShows = tvRes ? processApiResponse(tvRes, normalizeTVShow) : [];
          
          // Simple interleaving for better mix
          const combined = [];
          const maxLength = Math.max(movies.length, tvShows.length);
          for (let i = 0; i < maxLength; i++) {
              if (movies[i]) combined.push(movies[i]);
              if (tvShows[i]) combined.push(tvShows[i]);
          }
          setSearchResults(combined);
          setHasMoreResults(false); // Pagination not handled for filters for simplicity
      } catch (e) {
          console.error("Filter failed:", e);
      } finally {
          setIsLoading(false);
      }
  }, [apiKey, processApiResponse]);

  const handleSelectMedia = useCallback(async (item: MediaItem) => {
      const providers = await fetchWithWatchProviders([item]);
      setSelectedItem(providers[0]);
  }, [fetchWithWatchProviders]);

  const handleCloseModal = () => {
    setSelectedItem(null);
  }
  
  // Custom event listener for AI assistant navigation
  useEffect(() => {
    const handleSelectEvent = (event: CustomEvent<MediaItem>) => {
        handleSelectMedia(event.detail);
    };
    window.addEventListener('selectMediaItem', handleSelectEvent as EventListener);
    return () => window.removeEventListener('selectMediaItem', handleSelectEvent as EventListener);
  }, [handleSelectMedia]);

  // Main effect to fetch data
  useEffect(() => {
    if (view === 'home' && !searchQuery && !activeFilter) {
      fetchData();
    }
  }, [view, searchQuery, activeFilter, fetchData]);

  // Effect for handling search
  useEffect(() => {
      setSearchPage(1); // Reset page on new query
      handleSearch(searchQuery, 1);
  }, [searchQuery, handleSearch]);

  // Effect for handling filters
  useEffect(() => {
      if(activeFilter) {
          handleFilter(activeFilter);
      }
  }, [activeFilter, handleFilter]);
  
  const loadMoreResults = () => {
      const newPage = searchPage + 1;
      setSearchPage(newPage);
      handleSearch(searchQuery, newPage);
  };

  const renderContent = () => {
    if (isLoading && searchResults.length === 0 && view !== 'watchlist') {
        return (
            <>
                <div className="h-[85vh] md:h-auto md:aspect-[16/9] md:max-h-[80vh] w-full bg-zinc-900 animate-pulse mb-8"></div>
                <div className="px-4 md:px-12">
                    <div className="h-8 w-1/4 bg-zinc-800 rounded mb-4 animate-pulse"></div>
                    <div className="flex space-x-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="flex-shrink-0 w-36 md:w-48 aspect-[2/3] bg-zinc-800 rounded-lg animate-pulse"></div>)}
                    </div>
                </div>
            </>
        )
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    if (searchQuery || activeFilter) {
      const title = activeFilter ? `Discover on ${activeFilter.name}` : `Results for "${searchQuery}"`;
      return <ResultsGrid title={title} items={searchResults} onSelect={handleSelectMedia} isLoading={isLoading} loadMore={loadMoreResults} hasMore={hasMoreResults} />
    }
    
    if (view === 'watchlist') {
        // This is a simplified client-side watchlist. For larger lists, pagination/API would be needed.
        const watchlistItems = [...(data['Trending Now'] || []), ...(data['Popular Movies'] || []), ...(data['Popular TV Shows'] || [])];
        const uniqueItems = Array.from(new Map(watchlistItems.map(item => [item.id, item])).values());
        const filteredWatchlist = uniqueItems.filter(item => watchlistIds.has(item.id));
        return <ResultsGrid title="My Watchlist" items={filteredWatchlist} onSelect={handleSelectMedia} isLoading={false} />
    }

    return (
      <>
        <Hero items={data['For You'] || []} onSelect={handleSelectMedia} apiKey={apiKey} />
        {data['Trending Now'] && <MediaRow key="Trending Now" title="Trending Now" items={data['Trending Now']} onSelect={handleSelectMedia} />}
        <GameRow onSelectGame={onSelectGame} />
        {Object.entries(data).map(([title, items]) =>
            (title !== 'For You' && title !== 'Trending Now') && <MediaRow key={title} title={title} items={items} onSelect={handleSelectMedia} isUpcomingRow={title === 'Upcoming Movies'} />
        )}
      </>
    );
  };
  
  return (
    <>
      {renderContent()}
      {selectedItem && (
        <Modal 
            item={selectedItem} 
            apiKey={apiKey} 
            onClose={handleCloseModal}
            onSelect={handleSelectMedia}
        />
      )}
    </>
  );
};

export default NetflixView;