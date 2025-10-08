import React, { useState, useEffect, useCallback } from 'react';
import { boxOfficeData, BoxOfficeMovie } from '../services/boxOfficeData';
import { getMovieDetails } from '../services/tmdbService';
import Loader from './Loader';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const HIGH_SCORE_KEY = 'boxOfficeCompareHighScore';

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Format large numbers into B/M
const formatCurrency = (value: number) => {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(3)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
};

interface BoxOfficeCompareGameProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  onExit: () => void;
}

interface EnrichedMovieData extends BoxOfficeMovie {
    posterPath: string | null;
}

type GameState = 'idle' | 'loading' | 'playing' | 'finished';

const BoxOfficeCompareGame: React.FC<BoxOfficeCompareGameProps> = ({ apiKey, onExit, onInvalidApiKey }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [moviePool, setMoviePool] = useState<EnrichedMovieData[]>([]);
    const [currentMovie, setCurrentMovie] = useState<EnrichedMovieData | null>(null);
    const [nextMovie, setNextMovie] = useState<EnrichedMovieData | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        const storedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }
    }, []);

    const fetchMoviePosters = useCallback(async () => {
        setGameState('loading');
        try {
            const posterPromises = boxOfficeData.map(movie => getMovieDetails(apiKey, movie.tmdbId));
            const movieDetails = await Promise.all(posterPromises);
            
            const enrichedData = boxOfficeData.map((movie, index) => ({
                ...movie,
                posterPath: movieDetails[index].poster_path
            }));

            const shuffled = shuffleArray(enrichedData.filter(m => m.posterPath));
            setMoviePool(shuffled);
            setCurrentMovie(shuffled[0]);
            setNextMovie(shuffled[1]);
            setScore(0);
            setGameState('playing');
        } catch (error) {
            console.error("Error fetching movie data for game:", error);
            if (error instanceof Error && error.message.includes("Invalid API Key")) {
                onInvalidApiKey();
            }
            setGameState('idle');
        }
    }, [apiKey, onInvalidApiKey]);

    const handleGuess = (guess: 'higher' | 'lower') => {
        if (!currentMovie || !nextMovie) return;

        const correct = (guess === 'higher' && nextMovie.boxOffice > currentMovie.boxOffice) ||
                        (guess === 'lower' && nextMovie.boxOffice < currentMovie.boxOffice);
        
        setIsCorrect(correct);
        setShowResult(true);

        setTimeout(() => {
            if (correct) {
                setScore(score + 1);
                setCurrentMovie(nextMovie);
                setNextMovie(moviePool[score + 2]); // score is 0-indexed, so +2 for next movie
                setShowResult(false);
            } else {
                if (score > highScore) {
                    setHighScore(score);
                    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
                }
                setGameState('finished');
            }
        }, 2500); // Show result for 2.5 seconds
    };
    
    const handlePlayAgain = () => {
        setShowResult(false);
        fetchMoviePosters();
    }

    if (gameState === 'idle') {
        return (
            <div className="w-full max-w-3xl text-center animate-scale-up-center">
                <button onClick={onExit} className="absolute top-24 left-8 text-zinc-300 hover:text-white">&larr; Back to Games</button>
                <h1 className="text-5xl font-bold mb-4 animate-glow">Box Office Compare</h1>
                <p className="text-lg text-zinc-400 mb-8">Does the movie on the right have a higher or lower worldwide box office than the movie on the left? See how high you can score!</p>
                <button onClick={fetchMoviePosters} className="glass-button glass-button-primary px-8 py-4 rounded-full font-bold text-xl">Start Game</button>
            </div>
        );
    }
    
    if (gameState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center">
                <Loader />
                <p className="mt-4 text-zinc-300">Fetching box office data...</p>
            </div>
        );
    }

    if (gameState === 'finished') {
        return (
            <div className="w-full max-w-3xl text-center animate-scale-up-center">
                <h1 className="text-5xl font-bold mb-4 text-red-500">Game Over!</h1>
                <p className="text-3xl text-zinc-300 mb-2">Your final score is: <span className="font-bold text-cyan-400">{score}</span></p>
                <p className="text-xl text-zinc-400 mb-8">High Score: <span className="font-bold text-cyan-500">{highScore}</span></p>
                <div className="flex justify-center gap-4">
                    <button onClick={handlePlayAgain} className="glass-button glass-button-primary px-6 py-3 rounded-full font-bold">Play Again</button>
                    <button onClick={onExit} className="glass-button glass-button-secondary px-6 py-3 rounded-full font-bold">Exit</button>
                </div>
            </div>
        );
    }

    const resultOverlayClass = showResult
        ? (isCorrect ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20')
        : 'border-transparent';

    return (
        <div className="w-full max-w-5xl animate-text-focus-in">
            <div className="flex justify-between items-center mb-4 px-4 text-lg">
                <button onClick={onExit} className="text-zinc-400 hover:text-white text-sm">&larr; Exit</button>
                <div>Score: <span className="font-bold text-cyan-400">{score}</span></div>
                <div>High Score: <span className="font-bold text-cyan-500">{highScore}</span></div>
            </div>

            <div className="relative flex justify-center items-stretch">
                {/* Left Card */}
                <div className="w-1/2 p-4 flex flex-col items-center text-center">
                    <img src={`${IMAGE_BASE_URL}w500${currentMovie?.posterPath}`} alt={currentMovie?.title} className="w-full max-w-xs aspect-[2/3] object-cover rounded-xl shadow-2xl" />
                    <h2 className="text-2xl font-bold mt-4">{currentMovie?.title}</h2>
                    <p className="text-sm text-zinc-400">({currentMovie?.year})</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{formatCurrency(currentMovie?.boxOffice || 0)}</p>
                </div>

                {/* VS Separator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-16 h-16 bg-primary border-4 border-cyan-500 rounded-full flex items-center justify-center font-bold text-2xl">VS</div>
                </div>

                {/* Right Card */}
                <div className={`w-1/2 p-4 flex flex-col items-center text-center transition-all duration-300 border-4 rounded-2xl ${resultOverlayClass}`}>
                    <img src={`${IMAGE_BASE_URL}w500${nextMovie?.posterPath}`} alt={nextMovie?.title} className="w-full max-w-xs aspect-[2/3] object-cover rounded-xl shadow-2xl" />
                    <h2 className="text-2xl font-bold mt-4">{nextMovie?.title}</h2>
                    <p className="text-sm text-zinc-400">({nextMovie?.year})</p>
                    
                    {showResult ? (
                        <p className="text-3xl font-bold text-cyan-400 mt-2 animate-scale-up-center">{formatCurrency(nextMovie?.boxOffice || 0)}</p>
                    ) : (
                        <div className="mt-4 flex flex-col gap-3 w-full max-w-xs">
                            <button onClick={() => handleGuess('higher')} className="glass-button bg-green-500/50 hover:bg-green-500/70 border-green-400 w-full py-3 rounded-lg text-lg font-bold">Higher</button>
                            <button onClick={() => handleGuess('lower')} className="glass-button bg-red-500/50 hover:bg-red-500/70 border-red-400 w-full py-3 rounded-lg text-lg font-bold">Lower</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BoxOfficeCompareGame;