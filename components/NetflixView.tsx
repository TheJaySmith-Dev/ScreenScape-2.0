import React, { useState, useEffect, useMemo } from 'react';
// FIX: Import PaginatedResponse to resolve 'Cannot find name' error.
import type { MediaItem, Movie, TVShow, MovieDetails, TVShowDetails, CreditsResponse, Episode, NextEpisodeToAir, WatchProviderResponse, PaginatedResponse } from '../types';
import { 
    getPopularMovies, getPopularTVShows, getTrendingAll, searchMulti, 
    getMovieVideos, getMovieDetails, getMovieCredits, getMovieImages, 
    getTVShowDetails, getTVShowCredits, getTVShowVideos, getTVShowImages,
    getMoviesByProvider, getTVShowsByProvider, getUpcomingMovies, getOnTheAirTVShows, getMoviesByKeyword,
    normalizeMovie, normalizeTVShow, discoverTVShows, discoverMovies, getMovieWatchProviders, getTVShowWatchProviders
} from '../services/tmdbService';
import { usePreferences } from '../hooks/usePreferences';
import Loader from './Loader';
import VideoPlayer from './VideoPlayer';
import { PlayIcon, HeartIcon, XIcon, HeartIconSolid, MuteIcon, UnmuteIcon } from './Icons';

interface NetflixViewProps {
  apiKey: string;
  searchQuery: string;
  onInvalidApiKey: () => void;
}

const serviceHubs = [
  { 
    id: 337, 
    name: 'Disney+', 
    logo: 'https://lumiere-a.akamaihd.net/v1/images/disney_logo_march_2024_050fef2e.png?region=0%2C0%2C1920%2C1080',
    originalsNetworkId: 2739 
  },
];

const subHubs = [
    {
        id: 15,
        name: 'Hulu',
        logo: 'https://disney.images.edge.bamgrid.com/ripcut-delivery/v2/variant/disney/81FA4D830379184F4220A87D3197E9A13BB6F3873862C9EA8BE66A6B1834BD37/compose?format=webp&width=800',
        parentId: 337, // Belongs to Disney+
        video: 'https://vod-bgc-na-east-1.media.dssott.com/bgui/ps01/disney/bgui/2023/11/13/1699896662-xyz.mp4',
        introVideo: 'https://vod-bgc-na-east-1.media.dssott.com/bgui/ps01/disney/bgui/2025/03/07/1741367926-hulu.mp4'
    }
]

const useCountdown = (targetDate: string) => {
    const countDownDate = useMemo(() => new Date(targetDate).getTime(), [targetDate]);

    const [countDown, setCountDown] = useState(countDownDate - new Date().getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(countDownDate - new Date().getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [countDownDate]);

    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

    if (countDown < 0) {
        return "Released!";
    }

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};


const CountdownClock: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const timeLeft = useCountdown(targetDate);
    return <span className="font-mono text-sm md:text-base">{timeLeft}</span>;
};

const UpcomingEpisodeCard: React.FC<{ show: MediaItem; episode: NextEpisodeToAir; }> = ({ show, episode }) => {
    if (!episode.still_path) return null;

    return (
        <div className="flex-shrink-0 w-80 md:w-96 bg-zinc-800/60 rounded-lg overflow-hidden shadow-lg">
            <div className="relative aspect-video">
                 <img src={`https://image.tmdb.org/t/p/w780${episode.still_path}`} alt={episode.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </div>
            <div className="p-4 space-y-2">
                <p className="text-xs text-zinc-400">{show.title} - S{episode.season_number} E{episode.episode_number}</p>
                <h4 className="font-bold text-base line-clamp-1">{episode.name}</h4>
                <p className="text-xs text-zinc-300 line-clamp-2">{episode.overview}</p>
                 <div className="pt-2 text-center bg-black/30 rounded-md py-2 mt-2">
                    <p className="text-xs text-indigo-300 mb-1">Airs in</p>
                    <CountdownClock targetDate={episode.air_date} />
                </div>
            </div>
        </div>
    );
};

const UpcomingMovieCard: React.FC<{ item: MediaItem; onSelect: (item: MediaItem) => void; }> = ({ item, onSelect }) => {
  if (!item.poster_path) return null;
  return (
    <div className="flex-shrink-0 relative w-40 md:w-48 group">
      <div className="cursor-pointer" onClick={() => onSelect(item)}>
        <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} className="rounded-lg shadow-lg" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
            <PlayIcon className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="text-center bg-black/30 rounded-md py-2 mt-2">
            <p className="text-xs text-indigo-300 mb-1">Releases in</p>
            <CountdownClock targetDate={item.release_date} />
       </div>
    </div>
  );
};

const BackdropMovieCard: React.FC<{ item: MediaItem; onSelect: (item: MediaItem) => void; }> = ({ item, onSelect }) => {
  if (!item.backdrop_path) return null;
  return (
    <div className="flex-shrink-0 relative w-72 md:w-80 aspect-video cursor-pointer transform hover:scale-105 transition-transform duration-300 group rounded-lg overflow-hidden shadow-lg" onClick={() => onSelect(item)}>
      <img src={`https://image.tmdb.org/t/p/w780${item.backdrop_path}`} alt={item.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 p-4 w-full flex items-end h-full">
         <h3 className="text-white text-lg font-bold drop-shadow-lg line-clamp-2">{item.title}</h3>
      </div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <PlayIcon className="w-12 h-12 text-white" />
      </div>
    </div>
  );
};

const PosterMovieCard: React.FC<{ item: MediaItem; onSelect: (item: MediaItem) => void; }> = ({ item, onSelect }) => {
  if (!item.poster_path) return null;
  return (
    <div className="flex-shrink-0 relative w-40 md:w-48 cursor-pointer transform hover:scale-105 transition-transform duration-300 group" onClick={() => onSelect(item)}>
      <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} className="rounded-lg shadow-lg" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
        <PlayIcon className="w-12 h-12 text-white" />
      </div>
    </div>
  );
};

const MediaRow: React.FC<{ title: string; items: MediaItem[]; onSelect: (item: MediaItem) => void; cardType?: 'poster' | 'backdrop' }> = ({ title, items, onSelect, cardType = 'backdrop' }) => {
    if (items.length === 0) return null;
    const CardComponent = cardType === 'poster' ? PosterMovieCard : BackdropMovieCard;
    return (
        <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 px-6 md:px-12">{title}</h2>
            <div className="flex overflow-x-auto space-x-4 px-6 md:px-12 pb-4 scrollbar-hide">
            {items.map(item => <CardComponent key={`${item.media_type}-${item.id}`} item={item} onSelect={onSelect} />)}
            </div>
        </section>
    );
};

const UpcomingMediaRow: React.FC<{ title: string; items: MediaItem[]; onSelect: (item: MediaItem) => void; }> = ({ title, items, onSelect }) => {
    if (items.length === 0) return null;
    return (
        <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 px-6 md:px-12">{title}</h2>
            <div className="flex overflow-x-auto space-x-4 px-6 md:px-12 pb-4 scrollbar-hide">
            {items.map(item => <UpcomingMovieCard key={`${item.media_type}-${item.id}`} item={item} onSelect={onSelect} />)}
            </div>
        </section>
    );
};

const UpcomingEpisodesRow: React.FC<{ title: string; items: {show: MediaItem, episode: NextEpisodeToAir}[]; }> = ({ title, items }) => {
    if (items.length === 0) return null;
    return (
        <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 px-6 md:px-12">{title}</h2>
            <div className="flex overflow-x-auto space-x-4 px-6 md:px-12 pb-4 scrollbar-hide">
            {items.map(item => <UpcomingEpisodeCard key={item.episode.id} show={item.show} episode={item.episode} />)}
            </div>
        </section>
    );
};


const HubButton: React.FC<{
  hub: { id: number, name: string, logo: string };
  onClick: () => void;
  isActive: boolean;
}> = ({ hub, onClick, isActive }) => (
    <div className="flex-shrink-0 w-1/3 sm:w-1/4 md:w-1/6 p-1.5 md:p-2">
        <button
            onClick={onClick}
            className={`w-full aspect-video bg-[#3A3C42]/80 backdrop-blur-xl rounded-lg border-2  transition-all duration-300 transform hover:scale-105 hover:border-white/80 hover:shadow-2xl group ${isActive ? 'border-white/90 shadow-indigo-500/30' : 'border-zinc-700/80'}`}
        >
            <div className="p-2 md:p-4 flex items-center justify-center h-full">
                <img src={hub.logo} alt={hub.name} className="max-h-8 md:max-h-10 max-w-full group-hover:scale-110 transition-transform duration-300" />
            </div>
        </button>
    </div>
);

const SubHubButton: React.FC<{
  hub: { id: number; name: string; logo: string; video?: string; };
  onClick: () => void;
  isActive: boolean;
}> = ({ hub, onClick, isActive }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="flex-shrink-0 w-1/3 sm:w-1/4 md:w-1/6 p-1.5 md:p-2">
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`relative w-full aspect-video bg-[#282a30]/80 backdrop-blur-xl rounded-lg border-2 transition-all duration-300 transform hover:scale-105 hover:border-white/80 hover:shadow-2xl group overflow-hidden ${isActive ? 'border-white/90 shadow-indigo-500/30' : 'border-zinc-700/80'}`}
            >
                {hub.video && (
                    <video
                        src={hub.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered || isActive ? 'opacity-100' : 'opacity-0'}`}
                    />
                )}
                <div className="relative z-10 p-2 md:p-4 flex items-center justify-center h-full bg-black/20">
                    <img src={hub.logo} alt={hub.name} className="max-h-16 md:max-h-20 max-w-full group-hover:scale-110 transition-transform duration-300" />
                </div>
            </button>
        </div>
    );
};


const MediaModal: React.FC<{ 
    item: MediaItem; 
    apiKey: string; 
    onClose: () => void;
    likedIds: Set<number>;
    likeMovie: (id: number) => void;
    dislikeMovie: (id: number) => void;
    onInvalidApiKey: () => void;
}> = ({ item, apiKey, onClose, likedIds, likeMovie, dislikeMovie, onInvalidApiKey }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [credits, setCredits] = useState<CreditsResponse | null>(null);
    const [videoKey, setVideoKey] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const fetchAllDetails = async () => {
            setIsLoading(true);
            try {
                const isMovie = item.media_type === 'movie';
                const [detailsRes, creditsRes, videoRes, imagesRes] = await Promise.all([
                    isMovie ? getMovieDetails(apiKey, item.id) : getTVShowDetails(apiKey, item.id),
                    isMovie ? getMovieCredits(apiKey, item.id) : getTVShowCredits(apiKey, item.id),
                    isMovie ? getMovieVideos(apiKey, item.id) : getTVShowVideos(apiKey, item.id),
                    isMovie ? getMovieImages(apiKey, item.id) : getTVShowImages(apiKey, item.id),
                ]);
                
                setDetails(detailsRes as (MovieDetails | TVShowDetails));
                setCredits(creditsRes);
                if(videoRes) setVideoKey(videoRes.key);

                const bestLogo = imagesRes.logos?.find(l => l.iso_639_1 === 'en' && l.aspect_ratio > 2) || imagesRes.logos?.[0];
                if (bestLogo) {
                    setLogoUrl(`https://image.tmdb.org/t/p/original${bestLogo.file_path}`);
                }
            } catch (error: any) {
                console.error("Failed to fetch all media details:", error);
                 if (error.message.includes('401')) {
                    onInvalidApiKey();
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllDetails();
    }, [apiKey, item, onInvalidApiKey]);

    const formatRuntime = (d: MovieDetails | TVShowDetails) => {
        if ('runtime' in d && d.runtime) {
            const hours = Math.floor(d.runtime / 60);
            const minutes = d.runtime % 60;
            return `${hours}h ${minutes}m`;
        }
        if ('episode_run_time' in d && d.episode_run_time && d.episode_run_time.length > 0) {
            return `${d.episode_run_time[0]}m per episode`;
        }
        return '';
    };

    const handleDislike = () => {
        dislikeMovie(item.id);
        onClose();
    };

    const isLiked = likedIds.has(item.id);

    const director = credits?.crew.find(c => c.job === 'Director');
    const creators = credits?.crew.filter(c => c.job === 'Creator');
    const producers = credits?.crew.filter(c => c.job === 'Producer').slice(0, 2);
    const writers = credits?.crew.filter(c => c.job === 'Screenplay' || c.job === 'Writer').slice(0, 2);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-scale-up-center" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl overflow-hidden w-full max-w-4xl h-[90vh] shadow-2xl relative border border-glass-edge mx-2 sm:mx-4" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 z-20 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="absolute top-3 right-14 z-20">
                    {videoKey && (
                        <button onClick={() => setIsMuted(!isMuted)} className="text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors">
                            {isMuted ? <MuteIcon className="w-6 h-6" /> : <UnmuteIcon className="w-6 h-6" />}
                        </button>
                    )}
                </div>

                <div className="absolute inset-0 z-0">
                    {videoKey ? <VideoPlayer videoKey={videoKey} isMuted={isMuted} /> : <img src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`} alt="" className="w-full h-full object-cover"/> }
                </div>

                <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide">
                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 p-6 md:p-12">
                       <div className="h-[55vh] sm:h-[40vh]"></div> {/* Spacer */}

                        {logoUrl ? (
                            <img src={logoUrl} alt={`${item.title} logo`} className="max-w-[70%] md:max-w-md max-h-12 sm:max-h-16 md:max-h-20 lg:max-h-24 mb-6" />
                        ) : (
                            <h2 className="text-3xl md:text-5xl font-black mb-6">{item.title}</h2>
                        )}

                        {isLoading ? <Loader /> : details && (
                            <div className="space-y-8">
                                <div className="flex items-center space-x-4 text-sm md:text-base flex-wrap">
                                    <span className="text-green-400 font-semibold">{((details.vote_average || 0) * 10).toFixed(0)}% Match</span>
                                    {details && 'status' in details ? (
                                        <span className="text-zinc-400">
                                            {(() => {
                                                const startYear = details.first_air_date ? new Date(details.first_air_date).getFullYear() : '';
                                                if (!startYear) return '';
                                                
                                                const isOngoing = details.status === 'Returning Series' || details.status === 'In Production' || details.status === 'Pilot';

                                                if (isOngoing) {
                                                    return `${startYear} - `;
                                                }

                                                const endYear = details.last_air_date ? new Date(details.last_air_date).getFullYear() : '';
                                                if (endYear && startYear !== endYear) {
                                                    return `${startYear} - ${endYear}`;
                                                }
                                                
                                                return `${startYear}`;
                                            })()}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-400">{item.release_date?.split('-')[0]}</span>
                                    )}
                                    {'number_of_seasons' in details && details.number_of_seasons && <span className="text-zinc-400">{details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}</span>}
                                    <span className="text-zinc-400">{formatRuntime(details)}</span>
                                </div>
                                <div className="flex items-center space-x-4 mt-4">
                                     <button onClick={() => likeMovie(item.id)} className={`p-3 rounded-full transition-all duration-300 ${isLiked ? 'bg-green-500/30' : 'bg-white/10 backdrop-blur-xl border border-glass-edge hover:bg-green-500/30'}`}>
                                        {isLiked ? <HeartIconSolid className="w-6 h-6 text-green-400" /> : <HeartIcon className="w-6 h-6 text-green-400" />}
                                    </button>
                                    <button onClick={handleDislike} className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-glass-edge hover:bg-red-500/30 transition-all duration-300">
                                        <XIcon className="w-6 h-6 text-red-400" />
                                    </button>
                                </div>
                                <p className="text-zinc-300 max-w-3xl text-sm md:text-base pt-4">{details.overview}</p>
                                
                                {credits && credits.cast.length > 0 && (
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold mb-4">Top Billed Cast</h3>
                                        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                                            {credits.cast.slice(0, 10).map(member => member.profile_path && (
                                                <div key={member.id} className="flex-shrink-0 w-28 md:w-32 text-center">
                                                    <img src={`https://image.tmdb.org/t/p/w300${member.profile_path}`} alt={member.name} className="rounded-lg shadow-md mb-2 w-full h-40 md:h-44 object-cover"/>
                                                    <p className="font-semibold text-xs md:text-sm">{member.name}</p>
                                                    <p className="text-xs text-zinc-400">{member.character}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs md:text-sm text-zinc-400 max-w-3xl">
                                    <p><span className="font-semibold text-zinc-300">Genres: </span>{details.genres.map(g => g.name).join(', ')}</p>
                                    {director && <p><span className="font-semibold text-zinc-300">Director: </span>{director.name}</p>}
                                    {creators && creators.length > 0 && <p><span className="font-semibold text-zinc-300">Creators: </span>{creators.map(c => c.name).join(', ')}</p>}
                                    {producers && producers.length > 0 && <p><span className="font-semibold text-zinc-300">Producers: </span>{producers.map(p => p.name).join(', ')}</p>}
                                    {writers && writers.length > 0 && <p><span className="font-semibold text-zinc-300">Writers: </span>{writers.map(w => w.name).join(', ')}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const HeroCarousel: React.FC<{ items: MediaItem[]; onSelectItem: (item: MediaItem) => void; }> = ({ items, onSelectItem }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [items]);

    useEffect(() => {
        if (items.length === 0) return;
        const timer = setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, 7000);
        return () => clearTimeout(timer);
    }, [currentIndex, items]);
    
    if (items.length === 0) return null;

    const currentItem = items[currentIndex];
     if (!currentItem) return null;

    return (
        <div className="relative h-full w-full">
            {items.map((item, index) => (
                 <div
                    key={`${item.media_type}-${item.id}`}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                    {item.backdrop_path && <img src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`} alt={item.title} className="w-full h-full object-cover" />}
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
             <div className="absolute bottom-10 left-6 md:left-12 max-w-lg">
                <div className="relative w-full h-24">
                    <h1 className="absolute inset-0 text-3xl md:text-6xl font-black text-white animate-text-focus-in" key={currentItem.id}>{currentItem.title}</h1>
                </div>
                <p className="mt-4 text-sm text-zinc-200 line-clamp-3">{currentItem.overview}</p>
                <button onClick={() => onSelectItem(currentItem)} className="mt-6 flex items-center space-x-2 bg-white text-black font-bold px-6 py-3 rounded hover:bg-zinc-200 transition-colors">
                  <PlayIcon className="w-6 h-6" />
                  <span>More Info</span>
                </button>
              </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

const IntroVideoOverlay: React.FC<{ videoSrc: string; onFinish: () => void; }> = ({ videoSrc, onFinish }) => {
    return (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center animate-text-focus-in">
            <video
                key={videoSrc}
                src={videoSrc}
                autoPlay
                playsInline
                onEnded={onFinish}
                className="w-full h-full object-cover"
            />
            <button 
                onClick={onFinish}
                className="absolute bottom-8 right-8 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md hover:bg-white/20 transition-colors"
            >
                Skip Intro
            </button>
        </div>
    );
};


const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery, onInvalidApiKey }) => {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [upcoming, setUpcoming] = useState<MediaItem[]>([]);
  const [seasonalMovies, setSeasonalMovies] = useState<MediaItem[]>([]);
  const [seasonalTitle, setSeasonalTitle] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const { likedIds, likeMovie, dislikeMovie } = usePreferences();
  const [activeHub, setActiveHub] = useState<(typeof serviceHubs)[0] | null>(null);
  const [activeSubHub, setActiveSubHub] = useState<(typeof subHubs)[0] | null>(null);
  const [hubContent, setHubContent] = useState<Record<string, MediaItem[]>>({});
  const [hubUpcomingContent, setHubUpcomingContent] = useState<{movies: MediaItem[], episodes: {show: MediaItem, episode: NextEpisodeToAir}[]}>({ movies: [], episodes: [] });
  const [isHubLoading, setIsHubLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [introVideoSrc, setIntroVideoSrc] = useState<string | null>(null);


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const [trendingRes, popularMoviesRes, popularTVRes, upcomingMoviesRes, onTheAirTVRes] = await Promise.all([
          getTrendingAll(apiKey),
          getPopularMovies(apiKey),
          getPopularTVShows(apiKey),
          getUpcomingMovies(apiKey),
          getOnTheAirTVShows(apiKey),
        ]);

        const normalizedTrending = trendingRes.results
            .filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.backdrop_path)
            .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
        setTrending(normalizedTrending);

        const popularMovies = popularMoviesRes.results.map((movie) => normalizeMovie(movie));
        const popularTVShows = popularTVRes.results.map((tvShow) => normalizeTVShow(tvShow));
        const combinedPopularItems = [...popularMovies, ...popularTVShows]
            .sort((a, b) => b.popularity - a.popularity);
        setPopular(combinedPopularItems);

        const upcomingMoviesItems = upcomingMoviesRes.results.map((movie) => normalizeMovie(movie));
        const onTheAirTVShowsItems = onTheAirTVRes.results.map((tvShow) => normalizeTVShow(tvShow));
        const combinedUpcomingItems = [...upcomingMoviesItems, ...onTheAirTVShowsItems]
            .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
        setUpcoming(combinedUpcomingItems);


        const currentMonth = new Date().getMonth(); // 9 for Oct, 11 for Dec
        if (currentMonth === 9) { // October
            setSeasonalTitle('Spooky Season');
            const spookyRes = await getMoviesByKeyword(apiKey, 9715); // Halloween keyword
            setSeasonalMovies(spookyRes.results.map(normalizeMovie));
        } else if (currentMonth === 11) { // December
            setSeasonalTitle('Holiday Season');
            const holidayRes = await getMoviesByKeyword(apiKey, 207317); // Christmas movie keyword
            setSeasonalMovies(holidayRes.results.map(normalizeMovie));
        } else {
            setSeasonalTitle('');
            setSeasonalMovies([]);
        }

      } catch (error: any) {
        console.error('Failed to fetch initial data:', error);
        if (error.message.includes('401')) {
            onInvalidApiKey();
        } else {
            setError('Could not load data. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [apiKey, onInvalidApiKey]);

  useEffect(() => {
    if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
    }

    const performSearch = async () => {
      if (searchQuery.trim().length > 2) {
        try {
          setError(null);
          setIsSearching(true);
          const res = await searchMulti(apiKey, searchQuery);
          const normalizedResults = res.results
            .filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.backdrop_path)
            .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
          
          const providerIdToFilter = activeSubHub?.id || activeHub?.id;

          if (providerIdToFilter) {
            const providerPromises = normalizedResults.map(item => 
              item.media_type === 'movie' 
                ? getMovieWatchProviders(apiKey, item.id) 
                : getTVShowWatchProviders(apiKey, item.id)
            );
            const settledProviders = await Promise.allSettled(providerPromises);

            const filteredResults = normalizedResults.filter((_, index) => {
              const result = settledProviders[index];
              if (result.status === 'fulfilled') {
                const providers = (result.value as WatchProviderResponse).results['US']?.flatrate;
                return providers?.some(p => p.provider_id === providerIdToFilter) || false;
              }
              return false;
            });
            setSearchResults(filteredResults);
          } else {
            setSearchResults(normalizedResults);
          }

        } catch (error: any) {
          console.error('Failed to perform search:', error);
          if (error.message.includes('401')) {
            onInvalidApiKey();
          } else {
            setError('Could not perform search.');
          }
        } finally {
          setIsSearching(false);
        }
      }
    };
    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, apiKey, onInvalidApiKey, activeHub, activeSubHub]);

  useEffect(() => {
    const fetchHubContent = async () => {
        const currentProvider = activeSubHub || activeHub;
        if (!currentProvider) {
            setHubContent({});
            setHubUpcomingContent({ movies: [], episodes: [] });
            return;
        };
        setIsHubLoading(true);
        setError(null);
        try {
            const providerId = currentProvider.id;
            const originalsId = activeHub?.originalsNetworkId;
            
            const popularMoviesPromise = getMoviesByProvider(apiKey, providerId, 'popularity.desc');
            const popularTVPromise = getTVShowsByProvider(apiKey, providerId, 'popularity.desc');
            const newMoviesPromise = getMoviesByProvider(apiKey, providerId, 'primary_release_date.desc');
            const newTVPromise = getTVShowsByProvider(apiKey, providerId, 'first_air_date.desc');

            const originalsTVPromise = (originalsId && !activeSubHub)
                ? discoverTVShows(apiKey, { with_networks: originalsId, 'sort_by': 'popularity.desc' })
                : Promise.resolve(null);
            
            const [popularMoviesRes, popularTVRes, newMoviesRes, newTVRes, originalsTVRes] = await Promise.all([
                popularMoviesPromise,
                popularTVPromise,
                newMoviesPromise,
                newTVPromise,
                originalsTVPromise,
            ]);

            const popularMovies = popularMoviesRes.results.map(normalizeMovie);
            const popularTV = popularTVRes.results.map(normalizeTVShow);
            const popularItems = [...popularMovies, ...popularTV]
                .sort((a, b) => b.popularity - a.popularity);
            
            const newMovies = newMoviesRes.results.map(normalizeMovie);
            const newTV = newTVRes.results.map(normalizeTVShow);
            const newItems = [...newMovies, ...newTV]
                .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
            
            setHubContent({
                popular: popularItems,
                new: newItems,
                originals: originalsTVRes ? originalsTVRes.results.map(normalizeTVShow) : [],
            });

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + 90);
            const futureDateStr = futureDate.toISOString().split('T')[0];

            const [upcomingMoviesRes, onTheAirShowsRes] = await Promise.all([
                discoverMovies(apiKey, { 'with_watch_providers': providerId, 'watch_region': 'US', 'primary_release_date.gte': todayStr, 'primary_release_date.lte': futureDateStr, 'sort_by': 'popularity.desc' }),
                discoverTVShows(apiKey, { 'with_watch_providers': providerId, 'watch_region': 'US', 'air_date.gte': todayStr, 'sort_by': 'popularity.desc' })
            ]);

            const upcomingMovies = upcomingMoviesRes.results.map(normalizeMovie);
            
            const showsToCheck = onTheAirShowsRes.results.slice(0, 20);
            const showDetailPromises = showsToCheck.map(show => getTVShowDetails(apiKey, show.id));
            const settledShowDetails = await Promise.allSettled(showDetailPromises);

            const upcomingEpisodes = settledShowDetails
                .filter((result): result is PromiseFulfilledResult<TVShowDetails> => result.status === 'fulfilled' && !!result.value.next_episode_to_air)
                .map(result => result.value)
                .filter(details => {
                    if (!details.next_episode_to_air) return false;
                    const airDate = new Date(details.next_episode_to_air.air_date);
                    return airDate >= new Date(new Date().setHours(0, 0, 0, 0));
                })
                .map(details => ({ show: normalizeTVShow(details), episode: details.next_episode_to_air! }))
                .sort((a, b) => new Date(a.episode.air_date).getTime() - new Date(b.episode.air_date).getTime());
            
            setHubUpcomingContent({ movies: upcomingMovies, episodes: upcomingEpisodes });

        } catch (error: any) {
            console.error(`Failed to fetch content for hub ${currentProvider.name}`, error);
            if (error.message.includes('401')) {
                onInvalidApiKey();
            } else {
                setError(`Could not load content for ${currentProvider.name}.`);
            }
        } finally {
            setIsHubLoading(false);
        }
    }
    fetchHubContent();
  }, [activeHub, activeSubHub, apiKey, onInvalidApiKey]);

  const handleSelectItem = (item: MediaItem) => {
    setSelectedMedia(item);
  };
  
  const handleCloseModal = () => {
    setSelectedMedia(null);
  }

  const handleHubClick = (hub: typeof serviceHubs[0]) => {
      setActiveSubHub(null); // Always reset sub-hub when main hub changes
      setIntroVideoSrc(null);
      if (activeHub?.id === hub.id) {
          setActiveHub(null);
      } else {
          setActiveHub(hub);
      }
  }

  const handleSubHubClick = (subHub: typeof subHubs[0]) => {
      if (activeSubHub?.id === subHub.id) {
          setActiveSubHub(null);
          setIntroVideoSrc(null);
      } else {
          setActiveSubHub(subHub);
          if (subHub.introVideo) {
              setIntroVideoSrc(subHub.introVideo);
          }
      }
  }

  if (isLoading && trending.length === 0 && !error) {
    return <div className="flex justify-center items-center h-screen"><Loader /></div>;
  }
  
  if (error) {
      return <div className="text-center text-red-500 mt-20 p-4">{error}</div>
  }

  const renderContent = () => {
    if (searchQuery.trim().length > 2) {
      if (isSearching) return <Loader />;
      const title = `Results for "${searchQuery}"${activeSubHub ? ` on ${activeSubHub.name}` : activeHub ? ` on ${activeHub.name}` : ''}`;
      return <MediaRow title={title} items={searchResults} onSelect={handleSelectItem} />;
    }

    if (activeHub) {
        const hubName = activeSubHub?.name || activeHub.name;
        if (isHubLoading && !hubContent.popular) return <div className="flex justify-center items-center py-10"><Loader /></div>;
        return (
            <>
                <MediaRow title={`Popular on ${hubName}`} items={hubContent.popular || []} onSelect={handleSelectItem} />
                <MediaRow title={`New on ${hubName}`} items={hubContent.new || []} onSelect={handleSelectItem} />
                {!activeSubHub && <MediaRow title={`${activeHub.name} Originals`} items={hubContent.originals || []} onSelect={handleSelectItem} cardType="poster" />}
                
                {isHubLoading && hubUpcomingContent.movies.length === 0 && hubUpcomingContent.episodes.length === 0 && <div className="flex justify-center items-center py-10"><Loader /></div>}
                
                <UpcomingMediaRow title={`Coming Soon to ${hubName}`} items={hubUpcomingContent.movies} onSelect={handleSelectItem} />
                <UpcomingEpisodesRow title="Upcoming Episodes" items={hubUpcomingContent.episodes} />
            </>
        );
    }

    return (
      <>
        {seasonalMovies.length > 0 && <MediaRow title={seasonalTitle} items={seasonalMovies} onSelect={handleSelectItem} />}
        <MediaRow title="Trending Now" items={trending} onSelect={handleSelectItem} />
        <MediaRow title="Popular on ScreenScape" items={popular} onSelect={handleSelectItem} />
        {upcoming.length > 0 && <MediaRow title="Coming Soon" items={upcoming} onSelect={handleSelectItem} cardType="poster" />}
      </>
    );
  };

  const renderHeroSection = () => {
      if (searchQuery || introVideoSrc) return null;
      
      const heroContainerClass = 'relative h-[60vh] w-full overflow-hidden -mt-24';

      const itemsForCarousel = activeHub ? (hubContent.popular || []) : trending;

      if(activeHub && isHubLoading) {
          return <div className="h-[60vh] w-full flex items-center justify-center -mt-24"><Loader /></div>;
      }

      return (
        <div className={heroContainerClass}>
            <HeroCarousel items={itemsForCarousel.slice(0, 5)} onSelectItem={handleSelectItem} />
        </div>
      );
  }

  return (
    <>
      {introVideoSrc && <IntroVideoOverlay videoSrc={introVideoSrc} onFinish={() => setIntroVideoSrc(null)} />}
      {renderHeroSection()}
      
      <div className="px-6 md:px-12 mt-8">
        <div className="flex flex-wrap -mx-1.5 md:-mx-2">
            {serviceHubs.map(hub => <HubButton key={hub.id} hub={hub} onClick={() => handleHubClick(hub)} isActive={activeHub?.id === hub.id} />)}
        </div>
      </div>
      
      {activeHub && (
        <div className="px-6 md:px-12 mt-4 border-b border-zinc-700/50 pb-6">
            <div className="flex flex-wrap -mx-1.5 md:-mx-2">
                {subHubs.filter(sh => sh.parentId === activeHub.id).map(subHub => (
                    <SubHubButton key={subHub.id} hub={subHub} onClick={() => handleSubHubClick(subHub)} isActive={activeSubHub?.id === subHub.id} />
                ))}
            </div>
        </div>
      )}

      <div className="mt-8">
        {renderContent()}
      </div>

      {selectedMedia && (
        <MediaModal 
            item={selectedMedia} 
            apiKey={apiKey} 
            onClose={handleCloseModal}
            likedIds={likedIds}
            likeMovie={likeMovie}
            dislikeMovie={dislikeMovie}
            onInvalidApiKey={onInvalidApiKey}
        />
      )}
    </>
  );
};

export default NetflixView;