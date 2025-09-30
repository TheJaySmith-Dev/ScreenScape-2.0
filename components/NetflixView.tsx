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
import { PlayIcon, HeartIcon, HeartIconSolid, XIcon, ChevronDownIcon, MuteIcon, UnmuteIcon } from './Icons';
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
  { id: 'disney', brandColor: 'bg-brand-disney', providerId: 337, logo: "https://lumiere-a.akamaihd.net/v1/images/a8e5567d1658de062d95d079ebf536b0_4096x2309_6dedcc02.png?region=0%2C0%2C4096%2C2309", hoverAnimation: "https://lumiere-a.akamaihd.net/v1/images/disney_logo_animation_march_2024_27a0dafe.gif" },
  { id: 'netflix', brandColor: 'bg-brand-netflix', providerId: 8, logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1280px-Netflix_2015_logo.svg.png", hoverAnimation: "https://www.caviarcriativo.com/wp-content/uploads/2020/06/Significados-da-Marca-Netflix-1.gif" },
  { id: 'apple', brandColor: 'bg-brand-apple', providerId: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1024px-Apple_logo_black.svg.png", hoverAnimation: "https://cdn.dribbble.com/users/325495/screenshots/4294410/media/b6d616d0132b35a16f2c3510eac40461.gif" },
  { id: 'prime', brandColor: 'bg-brand-prime', providerId: 9, logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Amazon_Prime_Video_logo.svg/2560px-Amazon_Prime_Video_logo.svg.png", hoverAnimation: "https://i.gifer.com/origin/c8/c888e52e4604f323112248c8b6567551_w200.gif" },
  { id: 'hulu', brandColor: 'bg-[#1CE783]', providerId: 15, logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Hulu_logo_%282018%29.svg", hoverAnimation: "https://i.gifer.com/origin/39/3931630c6d59b2e7a22a6f8b22a275f3_w200.gif" },
];

const HubButton: React.FC<{
    logo: string;
    hoverAnimation: string;
    onClick: () => void;
}> = ({ logo, hoverAnimation, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative aspect-video rounded-lg bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-700/60 overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:border-zinc-400/80 hover:scale-105"
        >
            <img
                src={logo}
                alt="Service Logo"
                className={`absolute inset-0 w-full h-full object-contain p-4 md:p-6 transition-all duration-300 ease-in-out group-hover:opacity-0 brightness-0 invert ${logo.includes("disney") ? "scale-125" : ""}`}
            />
            <img
                src={isHovered ? hoverAnimation : ''}
                alt="Service Animation"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{ display: isHovered ? 'block' : 'none' }}
            />
        </button>
    );
};
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
                        <button className="flex items-center justify-center bg-white text-black px-6 py-2 rounded-md font-semibold hover:bg-opacity-80 transition">
                            <PlayIcon className="w-6 h-6 mr-2" />
                            Play
                        </button>
                        <button 
                            onClick={() => onSelect(item)}
                            className="flex items-center justify-center bg-zinc-700 bg-opacity-70 text-white px-6 py-2 rounded-md font-semibold hover:bg-opacity-50 transition"
                        >
                            <ChevronDownIcon className="w-6 h-6 mr-2" />
                            More Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

const CreditRow: React.FC<{ title: string; people: (CastMember | CrewMember)[] }> = ({ title, people }) => {
    if (!people || people.length === 0) return null;

    return (
        <div className="mb-6">
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <div className="flex space-x-4">
                    {people.map((person) => {
                        const profilePath = 'profile_path' in person ? person.profile_path : null;
                        const imageUrl = profilePath ? `${IMAGE_BASE_URL}w185${profilePath}` : 'https://via.placeholder.com/185x278?text=No+Image';
                        return (
                            <div key={person.id} className="flex-shrink-0 w-28 text-center">
                                <img src={imageUrl} alt={person.name} className="w-full h-40 object-cover rounded-lg mb-2" />
                                <p className="font-semibold text-sm truncate">{person.name}</p>
                                {'character' in person && <p className="text-xs text-zinc-400 truncate">{person.character}</p>}
                                {'job' in person && <p className="text-xs text-zinc-400 truncate">{person.job}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


interface SeasonAccordionProps {
  seasons: TVShowDetails['seasons'];
  tvId: number;
  apiKey: string;
}

const SeasonAccordion: React.FC<SeasonAccordionProps> = ({ seasons, tvId, apiKey }) => {
    const [openSeason, setOpenSeason] = useState<number | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleSeason = async (seasonNumber: number) => {
        if (openSeason === seasonNumber) {
            setOpenSeason(null);
        } else {
            setIsLoading(true);
            setOpenSeason(seasonNumber);
            try {
                const seasonDetails = await getTVShowSeasonDetails(apiKey, tvId, seasonNumber);
                setEpisodes(seasonDetails.episodes);
            } catch (error) {
                console.error("Failed to fetch season details:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xl font-bold mb-3">Seasons</h3>
            {seasons.map((season) => (
                <div key={season.id} className="bg-zinc-800/50 rounded-lg">
                    <button
                        onClick={() => handleToggleSeason(season.season_number)}
                        className="w-full flex justify-between items-center p-4 text-left"
                    >
                        <span className="font-semibold">{season.name} ({season.episode_count} episodes)</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSeason === season.season_number ? 'rotate-180' : ''}`} />
                    </button>
                    {openSeason === season.season_number && (
                        <div className="p-4 border-t border-zinc-700">
                            {isLoading ? <Loader /> : (
                                <ul className="space-y-3">
                                    {episodes.map(ep => (
                                        <li key={ep.id}>
                                            <p className="font-semibold">{ep.episode_number}. {ep.name}</p>
                                            <p className="text-sm text-zinc-400 line-clamp-2">{ep.overview}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

interface MediaModalProps {
    item: MediaItem;
    apiKey: string;
    onClose: () => void;
    genres: Map<number, string>;
}

const MediaModal: React.FC<MediaModalProps> = ({ item, apiKey, onClose, genres }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [trailer, setTrailer] = useState<Video | null>(null);
    const [logo, setLogo] = useState<LogoImage | null>(null);
    const [credits, setCredits] = useState<CreditsResponse | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const { likedIds, dislikedIds, likeMovie, dislikeMovie } = usePreferences();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const detailPromise = item.media_type === 'movie' ? getMovieDetails(apiKey, item.id) : getTVShowDetails(apiKey, item.id);
                const videoPromise = item.media_type === 'movie' ? getMovieVideos(apiKey, item.id) : getTVShowVideos(apiKey, item.id);
                const imagePromise = item.media_type === 'movie' ? getMovieImages(apiKey, item.id) : getTVShowImages(apiKey, item.id);
                const creditPromise = item.media_type === 'movie' ? getMovieCredits(apiKey, item.id) : getTVShowCredits(apiKey, item.id);
                
                const [detailData, videoData, imageData, creditData] = await Promise.all([detailPromise, videoPromise, imagePromise, creditPromise]);
                
                // FIX: Explicitly handle the two cases for the detail data to satisfy TypeScript's type checker.
                if (item.media_type === 'movie') {
                    setDetails({ ...(detailData as MovieDetails), media_type: item.media_type });
                } else {
                    setDetails({ ...(detailData as TVShowDetails), media_type: item.media_type });
                }
                setTrailer(videoData);
                setCredits(creditData);

                if (imageData.logos && imageData.logos.length > 0) {
                    const bestLogo = imageData.logos.sort((a, b) => b.vote_average - a.vote_average)[0];
                    setLogo(bestLogo);
                }
            } catch (error) {
                console.error("Failed to fetch media details:", error);
            }
        };
        fetchDetails();
    }, [item, apiKey]);

    if (!details) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                <Loader />
            </div>
        );
    }
    
    const crewToDisplay = credits?.crew.filter(c => ['Director', 'Screenplay', 'Writer', 'Creator'].includes(c.job)) ?? [];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 animate-scale-up-center" onClick={onClose}>
            <div className="relative w-full h-full max-w-4xl mx-auto my-12 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 z-30 text-white bg-black/50 rounded-full p-1 hover:bg-white/20 transition">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="relative w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {/* Trailer Section */}
                    <div className="relative w-full h-[60vh] bg-black">
                        {trailer?.key ? (
                            <VideoPlayer videoKey={trailer.key} isMuted={isMuted} />
                        ) : (
                            details.backdrop_path && <img src={`${IMAGE_BASE_URL}original${details.backdrop_path}`} alt={item.title} className="w-full h-full object-cover"/>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                        {trailer?.key && (
                            <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-4 right-4 z-20 h-10 w-10 border-2 border-white/70 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition">
                                {isMuted ? <MuteIcon className="h-6 w-6" /> : <UnmuteIcon className="h-6 w-6" />}
                            </button>
                        )}
                    </div>
                    
                    {/* Content Section */}
                    <div className="relative px-4 sm:px-8 md:px-12 pb-12 -mt-24 z-10">
                        {logo ? (
                           <img src={`${IMAGE_BASE_URL}w500${logo.file_path}`} alt={`${item.title} logo`} className="max-w-xs max-h-32 mb-4" />
                        ) : (
                           // FIX: Use the `in` operator as a type guard to safely access title or name.
                           <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{'title' in details ? details.title : details.name}</h1>
                        )}
                       
                        <div className="flex items-center space-x-4 text-zinc-400 text-sm mb-4">
                            <span>{('release_date' in details ? details.release_date : details.first_air_date)?.substring(0, 4)}</span>
                            <span>&#8226;</span>
                            <span>{('runtime' in details ? formatRuntime(details.runtime) : formatRuntime(details.episode_run_time?.[0] || 0))}</span>
                            <span>&#8226;</span>
                            <span className="text-green-400 font-semibold">{(details.vote_average * 10).toFixed(0)}% Match</span>
                        </div>

                        <div className="flex items-center space-x-3 mb-6">
                            <button onClick={() => likeMovie(item.id)} className={`transition ${likedIds.has(item.id) ? 'text-indigo-400' : 'text-white'}`}>
                                <HeartIconSolid className="w-8 h-8" />
                            </button>
                             <button onClick={() => dislikeMovie(item.id)} className={`transition ${dislikedIds.has(item.id) ? 'text-red-500' : 'text-white'}`}>
                                <XIcon className="w-9 h-9" />
                            </button>
                        </div>
                        
                        <p className="text-base mb-6 max-w-2xl">{details.overview}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            {details.genres.map(g => <span key={g.id} className="px-3 py-1 bg-zinc-800 rounded-full text-xs">{g.name}</span>)}
                        </div>

                        {credits && <CreditRow title="Cast" people={credits.cast.slice(0, 20)} />}
                        {credits && <CreditRow title="Crew" people={crewToDisplay} />}
                        
                        {details.media_type === 'tv' && 'seasons' in details && (
                            <SeasonAccordion seasons={details.seasons} tvId={details.id} apiKey={apiKey} />
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}


interface NetflixViewProps {
  apiKey: string;
  searchQuery: string;
  onInvalidApiKey: () => void;
  view: ViewType;
}

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery, onInvalidApiKey, view }) => {
  const [mediaRows, setMediaRows] = useState<Record<string, MediaItem[]>>({});
  const [searchResults, setSearchResults] = useState<MediaItem[] | null>(null);
  const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [genres, setGenres] = useState<Map<number, string>>(new Map());
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  const fetchAndSetRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const genreMap = await getGenres(apiKey);
      setGenres(genreMap);

      let rows: Record<string, MediaItem[]> = {};
      
      const processResults = <T extends Movie | TVShow>(results: T[], type: 'movie' | 'tv') => {
        return results.map(item => type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
      };

      if (selectedProvider) {
        const [movies, tvShows] = await Promise.all([
          getMoviesByProvider(apiKey, selectedProvider).then(res => processResults(res.results, 'movie')),
          getTVShowsByProvider(apiKey, selectedProvider).then(res => processResults(res.results, 'tv')),
        ]);
        rows['Movies on this Service'] = movies;
        rows['TV Shows on this Service'] = tvShows;
        const hero = movies[0] || tvShows[0] || null;
        setHeroItems(hero ? [hero] : []);
      } else if (view === 'home') {
          const [trendingRes, popularMoviesRes, popularTVRes, upcomingRes] = await Promise.all([
            getTrendingAll(apiKey),
            getPopularMovies(apiKey),
            getPopularTVShows(apiKey),
            getUpcomingMovies(apiKey),
        ]);

        const trendingNorm = (trendingRes.results as any[])
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .map(item => item.media_type === 'movie'
                ? normalizeMovie(item as Movie)
                : normalizeTVShow(item as TVShow)
            );
        
        const upcomingNorm = processResults(upcomingRes.results, 'movie');
        const popularMoviesNorm = processResults(popularMoviesRes.results, 'movie');
        const popularTVNorm = processResults(popularTVRes.results, 'tv');

        const trendingForHero = trendingNorm.slice(0, 5);
        const newForHero = upcomingNorm.slice(0, 5);
        const combinedHeroItems = shuffleArray([...trendingForHero, ...newForHero]);
        setHeroItems(combinedHeroItems);

        rows = { 
            'Trending Now': trendingNorm, 
            'Popular Movies': popularMoviesNorm, 
            'Popular TV Shows': popularTVNorm, 
            'Coming Soon': upcomingNorm 
        };
      } else if (view === 'movies') {
        const [popular, upcoming] = await Promise.all([
            getPopularMovies(apiKey).then(res => processResults(res.results, 'movie')),
            getUpcomingMovies(apiKey).then(res => processResults(res.results, 'movie')),
        ]);
        rows = { 'Popular Movies': popular, 'Coming Soon': upcoming };
        const hero = popular[0] || null;
        setHeroItems(hero ? [hero] : []);
      } else if (view === 'tv') {
        const [popular, onTheAir] = await Promise.all([
            getPopularTVShows(apiKey).then(res => processResults(res.results, 'tv')),
            getOnTheAirTVShows(apiKey).then(res => processResults(res.results, 'tv')),
        ]);
        rows = { 'Popular TV Shows': popular, 'Currently Airing': onTheAir };
        const hero = popular[0] || null;
        setHeroItems(hero ? [hero] : []);
      }
      
      setMediaRows(rows);

    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      if (error.message.includes("Invalid API Key")) {
        onInvalidApiKey();
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, onInvalidApiKey, view, selectedProvider]);

  useEffect(() => {
    fetchAndSetRows();
  }, [fetchAndSetRows]);

  useEffect(() => {
    if (searchQuery) {
      setIsLoading(true);
      searchMulti(apiKey, searchQuery)
        .then(response => {
          const results = response.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
          setSearchResults(results);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Search failed:", error);
          setIsLoading(false);
        });
    } else {
      setSearchResults(null);
      // When clearing search, refetch original view data if we were showing provider data
      if(selectedProvider) {
          setSelectedProvider(null);
      }
    }
  }, [searchQuery, apiKey]);

  const handleSelectProvider = (providerId: number) => {
    setSelectedItem(null);
    setSearchResults(null);
    setSelectedProvider(providerId);
  }

  const handleSelect = (item: MediaItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const currentRows = searchResults ? { [`Search Results for "${searchQuery}"`]: searchResults } : mediaRows;

  return (
    <div className="pt-24">
      {isLoading && Object.keys(currentRows).length === 0 ? (
         <div className="h-[calc(100vh-6rem)] flex items-center justify-center"> <Loader /> </div>
      ) : (
        <>
            {!searchQuery && <Hero items={heroItems} onSelect={handleSelect} />}

            <div className="px-4 md:px-12 my-8">
                <div className="grid grid-cols-5 gap-2 md:gap-4">
                    {serviceHubs.map(hub => (
                        <HubButton key={hub.id} {...hub} onClick={() => handleSelectProvider(hub.providerId)} />
                    ))}
                </div>
            </div>

            <div className="pb-12">
                {Object.entries(currentRows).map(([title, items]) => (
                    <MediaRow
                        key={title}
                        title={title}
                        items={items}
                        onSelect={handleSelect}
                        genres={genres}
                        isVertical={title === 'Coming Soon'}
                    />
                ))}
            </div>
        </>
      )}

      {selectedItem && (
        <MediaModal
            item={selectedItem}
            apiKey={apiKey}
            onClose={handleCloseModal}
            genres={genres}
        />
      )}
    </div>
  );
};

export default NetflixView;