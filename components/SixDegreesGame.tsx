import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Use the specific `searchPerson` function instead of aliasing `searchMulti`.
import { searchPerson, getPersonMovieCredits, getMovieCredits } from '../services/tmdbService';
import { Person, PersonMovieCredit, CastMember } from '../types';
import Loader from './Loader';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface SixDegreesGameProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  onExit: () => void;
}

type GameState = 'setup' | 'playing' | 'won' | 'lost';
type PathItem = { type: 'actor'; data: Person } | { type: 'movie'; data: { id: number; title: string } };

const ActorSearch: React.FC<{ onSelect: (actor: Person) => void, apiKey: string }> = ({ onSelect, apiKey }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Person[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    // FIX: Initialize useRef with null for explicit type safety.
    // FIX: The type `NodeJS.Timeout` is not available in browser environments. The correct type for the return value of `setTimeout` in the browser is `number`.
    const debounceTimeout = useRef<number | null>(null);

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }
        try {
            const response = await searchPerson(apiKey, searchQuery);
            // FIX: Filter for actors with profile pictures and in the 'Acting' department for better results.
            const persons = response.results.filter(p => p.known_for_department === 'Acting' && p.profile_path);
            setResults(persons);
            setIsOpen(true);
        } catch (error) {
            console.error("Actor search failed:", error);
        }
    }, [apiKey]);

    useEffect(() => {
        if(debounceTimeout.current) clearTimeout(debounceTimeout.current);
        if (query) {
            // FIX: Use window.setTimeout to ensure browser-compatible return type (number), resolving NodeJS.Timeout type error.
            debounceTimeout.current = window.setTimeout(() => handleSearch(query), 300);
        } else {
            setResults([]);
        }
    }, [query, handleSearch]);

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for an actor..."
                className="w-full bg-glass border border-glass-edge rounded-full py-3 px-5 text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
            {isOpen && results.length > 0 && (
                <ul className="absolute z-10 w-full mt-2 bg-primary/90 backdrop-blur-md border border-glass-edge rounded-lg max-h-60 overflow-y-auto">
                    {results.map(actor => (
                        <li key={actor.id}
                            onClick={() => {
                                onSelect(actor);
                                setQuery(actor.name);
                                setIsOpen(false);
                            }}
                            className="flex items-center p-2 hover:bg-white/10 cursor-pointer">
                            <img src={`${IMAGE_BASE_URL}w92${actor.profile_path}`} alt={actor.name} className="w-10 h-10 object-cover rounded-full mr-3" />
                            <span>{actor.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const SixDegreesGame: React.FC<SixDegreesGameProps> = ({ apiKey, onExit }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [startActor, setStartActor] = useState<Person | null>(null);
    const [endActor, setEndActor] = useState<Person | null>(null);
    const [path, setPath] = useState<PathItem[]>([]);
    const [currentView, setCurrentView] = useState<'actor' | 'movie'>('actor');
    const [currentData, setCurrentData] = useState<PersonMovieCredit[] | CastMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const startGame = () => {
        if (!startActor || !endActor || startActor.id === endActor.id) return;
        setPath([{ type: 'actor', data: startActor }]);
        setGameState('playing');
        setCurrentView('actor');
    };

    const fetchActorMovies = useCallback(async (actorId: number) => {
        setIsLoading(true);
        try {
            const credits = await getPersonMovieCredits(apiKey, actorId);
            setCurrentData(credits.cast.sort((a,b) => (b.release_date || '').localeCompare(a.release_date || '')));
        } catch (error) {
            console.error("Failed to fetch actor credits:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey]);
    
    const fetchMovieCast = useCallback(async (movieId: number) => {
        setIsLoading(true);
        try {
            const credits = await getMovieCredits(apiKey, movieId);
            const cast = credits.cast.filter(c => c.profile_path);
            setCurrentData(cast);
            if (cast.some(c => c.id === endActor?.id)) {
                setGameState('won');
            }
        } catch (error) {
            console.error("Failed to fetch movie credits:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, endActor]);

    useEffect(() => {
        if (gameState === 'playing') {
            const lastItem = path[path.length - 1];
            if (lastItem.type === 'actor') {
                fetchActorMovies(lastItem.data.id);
            } else if (lastItem.type === 'movie') {
                fetchMovieCast(lastItem.data.id);
            }
        }
    }, [gameState, path, fetchActorMovies, fetchMovieCast]);

    const handleSelectMovie = (movie: PersonMovieCredit) => {
        // FIX: Explicitly type the new path item to prevent type widening of 'type' property.
        const newItem: PathItem = { type: 'movie', data: { id: movie.id, title: movie.title } };
        const newPath = [...path, newItem];
        if (newPath.length > 12) { // 6 actor-movie pairs
            setGameState('lost');
        } else {
            setPath(newPath);
            setCurrentView('movie');
        }
    };
    
    const handleSelectActor = (actor: CastMember) => {
        // FIX: Explicitly type the new path item to prevent type widening of 'type' property.
        const newItem: PathItem = { type: 'actor', data: { id: actor.id, name: actor.name, profile_path: actor.profile_path, known_for_department: 'Acting' } };
        const newPath = [...path, newItem];
        if (newPath.length > 12) {
             setGameState('lost');
        } else {
            setPath(newPath);
            setCurrentView('actor');
        }
    };
    
    const resetGame = () => {
        setGameState('setup');
        setStartActor(null);
        setEndActor(null);
        setPath([]);
        setCurrentData([]);
    };

    const renderGameContent = () => {
        const lastItem = path[path.length - 1];
        const title = currentView === 'actor' 
            ? `Movies with ${(lastItem.data as Person).name}` 
            : `Cast of ${(lastItem.data as {title: string}).title}`;

        return (
            <>
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                {isLoading ? <Loader /> : (
                    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {currentData.map(item => (
                            <li key={item.id} 
                                className="bg-glass p-2 rounded-lg text-center cursor-pointer hover:border-cyan-500 border border-transparent transition-colors"
                                onClick={() => currentView === 'actor' ? handleSelectMovie(item as PersonMovieCredit) : handleSelectActor(item as CastMember)}
                            >
                                <img
                                    src={(item as PersonMovieCredit).poster_path || (item as CastMember).profile_path ? `${IMAGE_BASE_URL}w185${(item as PersonMovieCredit).poster_path || (item as CastMember).profile_path}` : 'https://via.placeholder.com/185x278?text=N/A'}
                                    alt={(item as PersonMovieCredit).title || (item as CastMember).name}
                                    className="w-full aspect-[2/3] object-cover rounded-md mb-2"
                                />
                                <span className="font-semibold text-sm">{(item as PersonMovieCredit).title || (item as CastMember).name}</span>
                                {(item as CastMember).character && <span className="text-xs text-zinc-400 block">as {(item as CastMember).character}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </>
        );
    };

    if (gameState === 'setup') {
        return (
            <div className="w-full max-w-3xl text-center animate-scale-up-center">
                <button onClick={onExit} className="absolute top-24 left-8 text-zinc-300 hover:text-white">&larr; Back to Games</button>
                <h1 className="text-5xl font-bold mb-4 animate-glow">Six Degrees</h1>
                <p className="text-lg text-zinc-400 mb-8">Connect two actors in six moves or less.</p>
                <div className="space-y-4 mb-8">
                    <ActorSearch apiKey={apiKey} onSelect={setStartActor} />
                    <ActorSearch apiKey={apiKey} onSelect={setEndActor} />
                </div>
                <button onClick={startGame} disabled={!startActor || !endActor || startActor.id === endActor.id} className="glass-button glass-button-primary px-8 py-4 rounded-full font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed">Start Game</button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl text-center animate-text-focus-in">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <span className="font-bold">Start:</span> {startActor?.name}
                </div>
                <div className="font-bold text-2xl text-cyan-400">
                    Degree: {Math.floor(path.length / 2)}
                </div>
                <div>
                    <span className="font-bold">Target:</span> {endActor?.name}
                </div>
            </div>

            <div className="flex items-center justify-center flex-wrap gap-2 p-2 bg-black/20 rounded-lg mb-4 text-sm">
                {path.map((item, index) => (
                    <React.Fragment key={`${item.data.id}-${index}`}>
                        {index > 0 && <span className="text-zinc-500">&rarr;</span>}
                        <span className={`px-2 py-1 rounded ${item.type === 'actor' ? 'bg-cyan-800' : 'bg-zinc-700'}`}>
                            {item.type === 'actor' ? (item.data as Person).name : (item.data as {title: string}).title}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {(gameState === 'won' || gameState === 'lost') ? (
                <div className="bg-glass p-8 rounded-xl animate-scale-up-center">
                    <h2 className={`text-4xl font-bold mb-4 ${gameState === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                        {gameState === 'won' ? `You did it in ${Math.floor(path.length / 2)} degrees!` : 'Out of moves!'}
                    </h2>
                    <div className="flex justify-center gap-4 mt-8">
                         <button onClick={resetGame} className="glass-button glass-button-primary px-6 py-3 rounded-full font-bold">Play Again</button>
                         <button onClick={onExit} className="glass-button glass-button-secondary px-6 py-3 rounded-full font-bold">Exit</button>
                    </div>
                </div>
            ) : renderGameContent()}
        </div>
    );
};

export default SixDegreesGame;