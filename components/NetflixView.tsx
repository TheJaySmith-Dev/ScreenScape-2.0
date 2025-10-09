import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
    getTrending,
    discoverMedia,
    searchMulti,
    normalizeMovie,
    normalizeTVShow,
    getMovieDetails,
    getTVShowDetails,
    getMediaVideos,
    getMediaImages,
    getMediaWatchProviders,
    getTopRatedMoviesByProvider,
    getTopRatedTVShowsByProvider,
    getUpcomingMovies,
    getOnTheAirTVShows,
} from '../services/tmdbService';
import { usePreferences } from '../hooks/usePreferences';
import { useCountdown } from '../hooks/useCountdown';
import { MediaItem, ActiveFilter, Movie, TVShow, Video, LogoImage, WatchProvider, MovieDetails, TVShowDetails } from '../types';
import Loader from './Loader';
import VideoPlayer from './VideoPlayer';
import { Game } from './GameView';
import { DisneyPillLogo, HuluPillLogo, DisneyBrandLogo, PixarBrandLogo, MarvelBrandLogo, StarWarsBrandLogo, NationalGeographicBrandLogo, VolumeUpIcon, VolumeOffIcon } from './Icons';


const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// --- Helper Components ---

const HeroCarousel: React.FC<{ items: MediaItem[], onCardClick: (item: MediaItem) => void, apiKey: string }> = ({ items, onCardClick, apiKey }) => {
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [logo, setLogo] = useState<LogoImage | null>(null);
    const [isLoadingTrailer, setIsLoadingTrailer] = useState(true);
    // FIX: The type `NodeJS.Timeout` is not available in browser environments. The correct type for the return value of `setTimeout` in the browser is `number`.
    const timeoutRef = useRef<number | null>(null);
    
    const currentItem = items[currentItemIndex];

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    useEffect(() => {
        resetTimeout();
        if (items.length > 1) {
            timeoutRef.current = setTimeout(() => {
                setCurrentItemIndex((prevIndex) => (prevIndex + 1) % items.length);
            }, 12000); // Change slide every 12 seconds to allow trailer to play
        }

        return () => {
            resetTimeout();
        };
    }, [currentItemIndex, items.length, resetTimeout]);

    useEffect(() => {
        if (!currentItem) return;

        let isActive = true;
        setIsLoadingTrailer(true);
        setTrailerKey(null);
        setLogo(null);

        const fetchMediaAssets = async () => {
            try {
                const [videosData, imagesData] = await Promise.all([
                    getMediaVideos(apiKey, currentItem.id, currentItem.media_type),
                    getMediaImages(apiKey, currentItem.id, currentItem.media_type)
                ]);
                
                if (!isActive) return;

                // Prioritize clips/teasers for the hero carousel, fallback to trailer
                const officialClip = videosData.results.find(v => v.type === 'Clip' && v.official) || videosData.results.find(v => v.type === 'Clip');
                const officialTeaser = videosData.results.find(v => v.type === 'Teaser' && v.official) || videosData.results.find(v => v.type === 'Teaser');
                const officialTrailer = videosData.results.find(v => v.type === 'Trailer' && v.official) || videosData.results.find(v => v.type === 'Trailer');

                setTrailerKey(officialClip?.key || officialTeaser?.key || officialTrailer?.key || null);

                const bestLogo = imagesData.logos.find(l => l.iso_639_1 === 'en') || imagesData.logos[0] || null;
                setLogo(bestLogo);

            } catch (error) {
                console.error(`Failed to fetch assets for ${currentItem.title}`, error);
                setTrailerKey(null);
                setLogo(null);
            } finally {
                if (isActive) setIsLoadingTrailer(false);
            }
        };

        fetchMediaAssets();

        return () => { isActive = false; };
    }, [currentItem, apiKey]);


    if (!items || items.length === 0) return null;

    return (
        <div className="relative h-[60vh] -mt-20 w-full hero-container bg-black" style={{ '--mouse-x': 0.5, '--mouse-y': 0.5 } as React.CSSProperties}
             onMouseMove={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = (e.clientX - rect.left) / rect.width;
                 const y = (e.clientY - rect.top) / rect.height;
                 e.currentTarget.style.setProperty('--mouse-x', `${x}`);
                 e.currentTarget.style.setProperty('--mouse-y', `${y}`);
             }}>
            <div className="absolute inset-0">
                {isLoadingTrailer ? (
                    <div className="w-full h-full bg-zinc-900 animate-pulse" />
                ) : trailerKey ? (
                    <VideoPlayer videoKey={trailerKey} isMuted={true} loop />
                ) : (
                    <img
                        src={`${IMAGE_BASE_URL}original${currentItem.backdrop_path}`}
                        alt={currentItem.title}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-transparent z-10 hero-light-effect" />

            <div className="absolute bottom-8 md:bottom-10 left-4 md:left-8 z-20 max-w-md hero-parallax-content">
                {logo ? (
                    <img src={`${IMAGE_BASE_URL}w500${logo.file_path}`} alt={`${currentItem.title} logo`} className="max-h-16 md:max-h-20 max-w-[70%] mb-3 drop-shadow-lg" />
                ) : (
                    <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg animate-glow" style={{'--glow-color': 'var(--color-accent-600)'} as React.CSSProperties}>{currentItem.title}</h1>
                )}
                <p className="mt-2 text-xs md:text-sm max-w-sm text-zinc-300 drop-shadow-md line-clamp-2">{currentItem.overview}</p>
                 <button onClick={() => onCardClick(currentItem)} className="mt-3 glass-button glass-button-primary px-4 py-1.5 rounded-full font-bold text-xs">
                    More Info
                </button>
            </div>
             <div className="absolute bottom-4 right-4 z-20 flex space-x-2">
                {items.slice(0, 5).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentItemIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentItemIndex === index ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
};

const Row: React.FC<{ title: string; items: MediaItem[]; onCardClick: (item: MediaItem) => void; }> = memo(({ title, items, onCardClick }) => (
    <div className="py-4 md:py-6">
        <h2 className="text-xl md:text-2xl font-bold px-4 md:px-8 mb-4">{title}</h2>
        <div className="relative">
            <div className="flex space-x-4 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {items.map(item => (
                    <div
                        key={`${item.id}-${item.media_type}`}
                        className="flex-shrink-0 w-36 md:w-48 group cursor-pointer"
                        onClick={() => onCardClick(item)}
                    >
                        <div className="aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                           <img
                                src={item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
));

const UpcomingMovieCard: React.FC<{ item: MediaItem; onCardClick: (item: MediaItem) => void; }> = ({ item, onCardClick }) => {
    const { days, hours, minutes, seconds, hasEnded } = useCountdown(`${item.release_date}T00:00:00`);

    return (
        <div
            className="flex-shrink-0 w-36 md:w-48 group cursor-pointer"
            onClick={() => onCardClick(item)}
        >
            <div className="relative aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                <img
                    src={item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                    {hasEnded ? (
                        <div className="text-center font-bold text-green-400 text-sm">Released!</div>
                    ) : (
                        <div className="text-white text-center text-xs font-bold leading-tight">
                            <div className="grid grid-cols-4 gap-1">
                                <div>{String(days).padStart(2, '0')}<span className="block text-[8px] opacity-70">DAYS</span></div>
                                <div>{String(hours).padStart(2, '0')}<span className="block text-[8px] opacity-70">HRS</span></div>
                                <div>{String(minutes).padStart(2, '0')}<span className="block text-[8px] opacity-70">MIN</span></div>
                                <div>{String(seconds).padStart(2, '0')}<span className="block text-[8px] opacity-70">SEC</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// A simplified modal for showing item details.
const Modal: React.FC<{ item: MediaItem | null; onClose: () => void; apiKey: string; userCountry: string; }> = ({ item, onClose, apiKey, userCountry }) => {
    const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [logo, setLogo] = useState<LogoImage | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [providers, setProviders] = useState<WatchProvider[]>([]);

    useEffect(() => {
        if (!item) return;

        const fetchDetails = async () => {
            try {
                const detailsFn = item.media_type === 'movie' ? getMovieDetails : getTVShowDetails;
                
                const [detailsData, videosData, imagesData, providersData] = await Promise.all([
                    detailsFn(apiKey, item.id),
                    getMediaVideos(apiKey, item.id, item.media_type),
                    getMediaImages(apiKey, item.id, item.media_type),
                    getMediaWatchProviders(apiKey, item.id, item.media_type)
                ]);

                setDetails(detailsData);
                // Prioritize full trailer for the modal view
                const officialTrailer = videosData.results.find(v => v.type === 'Trailer' && v.official) || videosData.results.find(v => v.type === 'Trailer') || null;
                setTrailerKey(officialTrailer?.key || null);
                setLogo(imagesData.logos.find(l => l.iso_639_1 === 'en') || imagesData.logos[0] || null);

                // Streaming availability logic
                let countryProviders = providersData.results[userCountry];
                 if (userCountry === 'ZA') {
                    const ukProviders = providersData.results['GB'];
                    if (ukProviders?.flatrate?.some(p => p.provider_id === 337)) { // Disney+ in UK
                        if (!countryProviders) countryProviders = { link: ukProviders.link, flatrate: [] };
                        if (!countryProviders.flatrate) countryProviders.flatrate = [];
                        countryProviders.flatrate.push(...ukProviders.flatrate.filter(p => p.provider_id === 337));
                    }
                }
                
                if (countryProviders?.flatrate) {
                    setProviders(countryProviders.flatrate);
                } else {
                    setProviders([]);
                }

            } catch (error) {
                console.error("Failed to fetch item details:", error);
            }
        };

        fetchDetails();
        
        // Cleanup
        return () => {
            setDetails(null);
            setTrailerKey(null);
            setLogo(null);
            setProviders([]);
        };
    }, [item, apiKey, userCountry]);

    if (!item) return null;

    const runtime = details ? ('runtime' in details ? details.runtime : (details.episode_run_time?.[0] || null)) : null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-scale-up-center" onClick={onClose}>
            <div className="bg-primary w-full h-full md:max-h-[90vh] md:w-[90vw] max-w-4xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <div className="absolute top-4 right-4 z-40">
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                            &times;
                        </button>
                    </div>

                    <div className="relative h-[40vh] md:h-[60vh] bg-black">
                        {trailerKey ? (
                           <>
                             <VideoPlayer videoKey={trailerKey} isMuted={isMuted} loop />
                             <div className="absolute bottom-4 right-4 z-30">
                                 <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 rounded-full bg-black/50 border border-white/50 text-white flex items-center justify-center transition-opacity hover:opacity-80">
                                     {isMuted ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
                                 </button>
                             </div>
                           </>
                        ) : (
                             item.backdrop_path && <img src={`${IMAGE_BASE_URL}original${item.backdrop_path}`} alt={item.title} className="w-full h-full object-cover" />
                        )}
                         <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent z-10 pointer-events-none" />
                    </div>

                    <div className="p-6 md:p-8 -mt-16 relative z-20">
                       {logo && (
                            <img src={`${IMAGE_BASE_URL}w500${logo.file_path}`} alt={`${item.title} logo`} className="max-h-24 max-w-[70%] mb-4" />
                        )}
                        <h1 className={`text-3xl md:text-4xl font-bold ${logo ? 'hidden' : ''}`}>{item.title}</h1>
                        <div className="flex items-center space-x-4 text-zinc-400 mt-2 text-sm">
                            <span>{item.release_date?.substring(0, 4)}</span>
                            {runtime && <span>{runtime} min</span>}
                            <span className="border border-zinc-500 px-1 rounded text-xs">HD</span>
                            <span>⭐ {item.vote_average.toFixed(1)}</span>
                        </div>
                        <p className="mt-4 text-zinc-300 max-w-2xl">{item.overview}</p>
                        
                        {providers.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-bold text-lg mb-2">Available on:</h3>
                                <div className="flex flex-wrap gap-4">
                                    {providers.map(p => (
                                        <div key={p.provider_id} className="flex items-center gap-2 bg-glass p-2 rounded-lg">
                                            <img src={`${IMAGE_BASE_URL}w92${p.logo_path}`} alt={p.provider_name} className="w-8 h-8 rounded-md" />
                                            <span className="font-semibold">{p.provider_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GamePromoRow: React.FC<{ onSelectGame: (game: Game) => void }> = ({ onSelectGame }) => {
    const GameCard: React.FC<{ title: string; description: string; onClick: () => void; }> = ({ title, description, onClick }) => (
        <button onClick={onClick} className="glass-panel text-left p-6 flex flex-col items-start !rounded-xl h-full">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">{title}</h3>
            <p className="text-zinc-300 text-sm flex-grow">{description}</p>
        </button>
    );
    return (
        <div className="py-4 md:py-6">
            <h2 className="text-xl md:text-2xl font-bold px-4 md:px-8 mb-4">Play a Game</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-8">
                <GameCard title="Movie Trivia" description="Test your film knowledge against the clock." onClick={() => onSelectGame('trivia')} />
                <GameCard title="Six Degrees" description="Connect any two actors in six steps or less." onClick={() => onSelectGame('six-degrees')} />
                <GameCard title="Guess The Poster" description="Identify the movie from its poster." onClick={() => onSelectGame('guess-poster')} />
                <GameCard title="Box Office Compare" description="Higher or lower? Guess the box office smash." onClick={() => onSelectGame('box-office-compare')} />
            </div>
        </div>
    );
}

// --- Main Component ---

interface NetflixViewProps {
    apiKey: string;
    searchQuery: string;
    onInvalidApiKey: () => void;
    view: 'home' | 'watchlist';
    activeFilter: ActiveFilter | null;
    onSelectGame: (game: Game) => void;
    userCountry: string;
}

const companyIDs = {
    'Disney': 2, 'Pixar': 3, 'Marvel': 420, 'Star Wars': 1, 'National Geographic': 7521,
    '20th Century': 25, 'Searchlight': 43,
};

const networkIDs = {
    'Hulu': 453,
};

const NetflixView: React.FC<NetflixViewProps> = ({ apiKey, searchQuery, onInvalidApiKey, view, activeFilter, onSelectGame, userCountry }) => {
    const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
    const [rows, setRows] = useState<{ title: string; items: MediaItem[] }[]>([]);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const { watchlistIds } = usePreferences();
    const [disneyPlusHub, setDisneyPlusHub] = useState<'disney' | 'hulu'>('disney');
    const [activeDisneyBrand, setActiveDisneyBrand] = useState<string>('Disney');

    // Effect to lock body scroll when modal is open
    useEffect(() => {
        if (selectedItem) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        // Cleanup function
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedItem]);

    const fetchAndSetContent = useCallback(async () => {
        setIsLoading(true);
        try {
            if (searchQuery) {
                const response = await searchMulti(apiKey, searchQuery);
                const validResults = response.results
                    .filter((item): item is Movie | TVShow => ('media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv')) && !!item.poster_path)
                    .map(item => item.media_type === 'movie' ? normalizeMovie(item as Movie) : normalizeTVShow(item as TVShow));
                setSearchResults(validResults);
                setHeroItems([]);
                setRows([]);
            } else if (activeFilter) {
                let heroParams: Record<string, string | number> = { sort_by: 'popularity.desc' };
                let newRows: { title: string, items: MediaItem[] }[] = [];
                const today = new Date().toISOString().split('T')[0];

                if (activeFilter.name === 'Disney+') {
                    // DISNEY+ SPECIFIC LOGIC
                    let contentParams: Record<string, string | number> = {};
                    let pageTitle = 'Disney+';

                    if (disneyPlusHub === 'disney') {
                        const brandCompanyId = companyIDs[activeDisneyBrand as keyof typeof companyIDs];
                        contentParams['with_companies'] = brandCompanyId;
                        pageTitle = activeDisneyBrand;
                    } else if (disneyPlusHub === 'hulu') {
                        contentParams['with_networks'] = networkIDs['Hulu'];
                        contentParams['with_companies'] = `${companyIDs['20th Century']}|${companyIDs['Searchlight']}`;
                        pageTitle = 'Hulu';
                    }
                    
                    heroParams = { ...heroParams, ...contentParams };
                    
                    const heroResponse = await discoverMedia(apiKey, heroParams);
                    const heroMedia = heroResponse.results.map(i => normalizeMovie(i)).filter(i => i.backdrop_path);
                    setHeroItems(heroMedia.slice(0, 5));
                    
                    // Fetch 3 curated rows of content for the selected brand/hub
                    const popularPromise = discoverMedia(apiKey, { ...contentParams, sort_by: 'popularity.desc' });
                    const topRatedPromise = discoverMedia(apiKey, { ...contentParams, sort_by: 'vote_average.desc', 'vote_count.gte': 100 });
                    const newReleasesPromise = discoverMedia(apiKey, { ...contentParams, sort_by: 'primary_release_date.desc', 'primary_release_date.lte': today });

                    const [popularData, topRatedData, newReleasesData] = await Promise.all([popularPromise, topRatedPromise, newReleasesPromise]);

                    newRows.push({ title: `Popular on ${pageTitle}`, items: popularData.results.map(i => normalizeMovie(i)) });
                    newRows.push({ title: `Top Rated on ${pageTitle}`, items: topRatedData.results.map(i => normalizeMovie(i)) });
                    newRows.push({ title: `New Releases on ${pageTitle}`, items: newReleasesData.results.map(i => normalizeMovie(i)) });

                } else {
                    // GENERIC SERVICE/STUDIO/NETWORK LOGIC
                    if (activeFilter.type === 'service') {
                        heroParams['with_watch_providers'] = activeFilter.id;
                        heroParams['watch_region'] = userCountry; 
                    }
                    if (activeFilter.type === 'studio') heroParams['with_companies'] = activeFilter.id;
                    if (activeFilter.type === 'network') heroParams['with_networks'] = activeFilter.id;
                    
                    const heroResponse = await discoverMedia(apiKey, heroParams);
                    const heroMedia = heroResponse.results.map(i => normalizeMovie(i)).filter(i => i.backdrop_path);
                    setHeroItems(heroMedia.slice(0, 5));

                    const topMoviesPromise = getTopRatedMoviesByProvider(apiKey, String(activeFilter.id), userCountry);
                    const topShowsPromise = getTopRatedTVShowsByProvider(apiKey, String(activeFilter.id), userCountry);

                    const [topMovies, topShows] = await Promise.all([topMoviesPromise, topShowsPromise]);
                    
                    newRows.push({ title: `Popular on ${activeFilter.name}`, items: heroMedia.slice(5) });
                    newRows.push({ title: `Top Rated Movies on ${activeFilter.name}`, items: topMovies.results.map(i => normalizeMovie(i as Movie)) });
                    newRows.push({ title: `Top Rated Shows on ${activeFilter.name}`, items: topShows.results.map(i => normalizeTVShow(i as TVShow)) });
                }
                setRows(newRows);

            } else { // Home view ("For You")
                const [
                    trendingResponse, 
                    popularResponse, 
                    upcomingMovies, 
                    onTheAirShows
                ] = await Promise.all([
                    getTrending(apiKey),
                    discoverMedia(apiKey, { sort_by: 'popularity.desc' }),
                    getUpcomingMovies(apiKey, userCountry),
                    getOnTheAirTVShows(apiKey)
                ]);

                const trendingItems = trendingResponse.results
                  .filter((item): item is Movie | TVShow => (item.media_type === 'movie' || item.media_type === 'tv') && !!item.backdrop_path)
                  .map(item => item.media_type === 'movie' ? normalizeMovie(item) : normalizeTVShow(item));

                if (trendingItems.length > 0) {
                    setHeroItems(trendingItems.slice(0, 5));
                }

                const newRows = [
                    { title: "Trending This Week", items: trendingItems.slice(5) },
                    { title: "Popular Movies", items: popularResponse.results.map(i => normalizeMovie(i)) },
                    { title: "Coming Soon to Theaters", items: upcomingMovies.results.map(normalizeMovie) },
                    { title: "Currently On Air", items: onTheAirShows.results.map(normalizeTVShow) }
                ];
                setRows(newRows);
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('Invalid API Key')) {
                onInvalidApiKey();
            }
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, onInvalidApiKey, searchQuery, activeFilter, userCountry, disneyPlusHub, activeDisneyBrand]);


    useEffect(() => {
        fetchAndSetContent();
    }, [fetchAndSetContent]);
    
    const handleCardClick = (item: MediaItem) => {
        setSelectedItem(item);
    };

    const disneyBrandButtons = [
        { name: 'Disney', logo: DisneyBrandLogo, id: companyIDs['Disney'] },
        { name: 'Pixar', logo: PixarBrandLogo, id: companyIDs['Pixar'] },
        { name: 'Marvel', logo: MarvelBrandLogo, id: companyIDs['Marvel'] },
        { name: 'Star Wars', logo: StarWarsBrandLogo, id: companyIDs['Star Wars'] },
        { name: 'National Geographic', logo: NationalGeographicBrandLogo, id: companyIDs['National Geographic'] },
    ];

    if (isLoading) {
        return <div className="pt-20"><Loader /></div>;
    }
    
    const renderContent = () => {
        if (searchQuery) {
            return (
                 <div className="container mx-auto px-4 md:px-8 py-8">
                    <h2 className="text-2xl font-bold mb-6">Results for "{searchQuery}"</h2>
                    {searchResults.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {searchResults.map(item => (
                                <div key={`${item.id}-${item.media_type}`} className="group cursor-pointer" onClick={() => handleCardClick(item)}>
                                    <div className="aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                                    <img
                                            src={item.poster_path ? `${IMAGE_BASE_URL}w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-400">No results found.</p>
                    )}
                </div>
            )
        }

        const isHomeView = !activeFilter;
        
        return (
             <div className={activeFilter ? 'pt-8' : ''}>
                {activeFilter?.name === 'Disney+' && (
                    <div className="px-4 md:px-8 mb-6 flex items-center justify-center gap-2 md:gap-4 bg-primary/30 backdrop-blur-sm py-2 sticky top-20 z-30">
                        <button onClick={() => setDisneyPlusHub('disney')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${disneyPlusHub === 'disney' ? 'bg-white text-black scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                           <DisneyPillLogo className="h-5 w-auto" />
                        </button>
                        <button onClick={() => setDisneyPlusHub('hulu')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${disneyPlusHub === 'hulu' ? 'bg-white text-black scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                           <HuluPillLogo className="h-4 w-auto" />
                        </button>
                    </div>
                )}

                {activeFilter?.name === 'Disney+' && disneyPlusHub === 'disney' && (
                     <div className="px-4 md:px-8 mb-6 flex items-center justify-center gap-2 md:gap-4 py-2">
                        {disneyBrandButtons.map(brand => (
                            <button
                                key={brand.name}
                                onClick={() => setActiveDisneyBrand(brand.name)}
                                className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center justify-center bg-zinc-800/60 border-2 ${activeDisneyBrand === brand.name ? 'border-white scale-105' : 'border-transparent hover:bg-zinc-700'}`}
                            >
                                <brand.logo className="h-6 md:h-8 w-auto" />
                            </button>
                        ))}
                    </div>
                )}
                
                {isHomeView && <GamePromoRow onSelectGame={onSelectGame} />}

                {rows.map(row => {
                    if (row.items && row.items.length > 0) {
                        if (row.title === "Coming Soon to Theaters") {
                            return (
                                <div key={row.title} className="py-4 md:py-6">
                                    <h2 className="text-xl md:text-2xl font-bold px-4 md:px-8 mb-4">{row.title}</h2>
                                    <div className="relative">
                                        <div className="flex space-x-4 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                            {row.items.map(item => (
                                                <UpcomingMovieCard key={`${item.id}-upcoming`} item={item} onCardClick={handleCardClick} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return <Row key={row.title} title={row.title} items={row.items} onCardClick={handleCardClick} />;
                    }
                    return null;
                })}
            </div>
        )
    }

    return (
        <div>
            <HeroCarousel items={heroItems} onCardClick={handleCardClick} apiKey={apiKey} />
            {renderContent()}
            <Modal item={selectedItem} onClose={() => setSelectedItem(null)} apiKey={apiKey} userCountry={userCountry} />
        </div>
    );
};

export default NetflixView;
