
import React, { useState, useEffect, useCallback } from 'react';
import { getPopularMovies, getMovieImages } from '../services/tmdbService';
import Loader from './Loader';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface GuessThePosterGameProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  onExit: () => void;
}

interface PosterQuestion {
    posterPath: string;
    options: string[];
    correctAnswer: string;
}

type GameState = 'idle' | 'loading' | 'playing' | 'finished';

const GuessThePosterGame: React.FC<GuessThePosterGameProps> = ({ apiKey, onInvalidApiKey, onExit }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [questions, setQuestions] = useState<PosterQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');

    const generateQuestions = useCallback(async () => {
        setGameState('loading');
        try {
            const popularMoviesResponse = await getPopularMovies(apiKey);
            const moviesWithPosters = popularMoviesResponse.results.filter(m => m.poster_path);
            
            if (moviesWithPosters.length < 10) throw new Error("Not enough movies to generate questions.");

            const shuffledMovies = shuffleArray(moviesWithPosters);
            const selectedMovies = shuffledMovies.slice(0, 20); // Take a larger pool to ensure we find enough posters

            const imagePromises = selectedMovies.map(movie => 
                getMovieImages(apiKey, movie.id).then(images => ({ movie, images }))
            );
            
            const moviesWithImages = await Promise.all(imagePromises);

            const gameQuestions: PosterQuestion[] = [];
            
            for (const { movie, images } of moviesWithImages) {
                if (gameQuestions.length >= 10) break;

                // Prioritize textless posters ('xx'), then null language, then any poster as a fallback
                let bestPoster = images.posters.find(p => p.iso_639_1 === 'xx');
                if (!bestPoster) {
                    bestPoster = images.posters.find(p => p.iso_639_1 === null);
                }
                // As a final fallback, just grab the most popular poster if no textless one exists.
                if (!bestPoster && images.posters.length > 0) {
                    bestPoster = [...images.posters].sort((a, b) => b.vote_average - a.vote_average)[0];
                }

                if (bestPoster) {
                    const wrongMovies = shuffleArray(moviesWithPosters.filter(m => m.id !== movie.id)).slice(0, 3);
                    
                    const options = shuffleArray([
                        movie.title,
                        ...wrongMovies.map(m => m.title)
                    ]);

                    gameQuestions.push({
                        posterPath: bestPoster.file_path,
                        options,
                        correctAnswer: movie.title,
                    });
                }
            }
            
            if (gameQuestions.length < 10) {
                throw new Error("Could not find enough suitable posters for the game.");
            }

            setQuestions(gameQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setGameState('playing');
        } catch (error) {
            console.error("Error generating questions:", error);
            if (error instanceof Error && error.message.includes("Invalid API Key")) {
                onInvalidApiKey();
            }
            setGameState('idle');
        }
    }, [apiKey, onInvalidApiKey]);


    const handleAnswer = (answer: string) => {
        if (selectedAnswer !== null) return;

        const correct = answer === questions[currentQuestionIndex].correctAnswer;
        setSelectedAnswer(answer);
        if (correct) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
            } else {
                setGameState('finished');
            }
        }, 2000);
    };

    const handlePlayAgain = () => {
        setGameState('idle');
        setQuestions([]);
    }

    const getButtonClass = (option: string) => {
        if (selectedAnswer !== null) {
            if (option === questions[currentQuestionIndex].correctAnswer) return 'bg-green-500/80 border-green-400';
            if (option === selectedAnswer) return 'bg-red-500/80 border-red-400';
            return 'bg-glass border-glass-edge opacity-50';
        }
        return 'bg-glass border-glass-edge hover:bg-cyan-500/20 hover:border-cyan-400';
    }

    if (gameState === 'idle') {
        return (
            <div className="w-full max-w-3xl text-center animate-scale-up-center">
                <button onClick={onExit} className="absolute top-24 left-8 text-zinc-300 hover:text-white">&larr; Back to Games</button>
                <h1 className="text-5xl font-bold mb-4 animate-glow">Guess The Poster</h1>
                <p className="text-lg text-zinc-400 mb-8">Can you identify the movie from its poster?</p>
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className="text-zinc-300 font-semibold">Difficulty:</span>
                    <button onClick={() => setDifficulty('easy')} className={`px-4 py-1 rounded-full text-sm transition-colors ${difficulty === 'easy' ? 'bg-cyan-600 text-white' : 'bg-glass hover:bg-white/10'}`}>Easy</button>
                    <button onClick={() => setDifficulty('hard')} className={`px-4 py-1 rounded-full text-sm transition-colors ${difficulty === 'hard' ? 'bg-cyan-600 text-white' : 'bg-glass hover:bg-white/10'}`}>Hard (Blurred)</button>
                </div>
                <button onClick={generateQuestions} className="glass-button glass-button-primary px-8 py-4 rounded-full font-bold text-xl">Start Game</button>
            </div>
        );
    }
    
    if (gameState === 'loading') {
        return (
             <div className="flex flex-col items-center justify-center">
                <Loader />
                <p className="mt-4 text-zinc-300">Finding some good posters...</p>
            </div>
        );
    }

    if (gameState === 'finished') {
        return (
            <div className="w-full max-w-3xl text-center animate-scale-up-center">
                <h1 className="text-5xl font-bold mb-4">Game Over!</h1>
                <p className="text-3xl text-zinc-300 mb-8">Your final score is: <span className="font-bold text-cyan-400">{score} / {questions.length}</span></p>
                <div className="flex justify-center gap-4">
                    <button onClick={handlePlayAgain} className="glass-button glass-button-primary px-6 py-3 rounded-full font-bold">Play Again</button>
                    <button onClick={onExit} className="glass-button glass-button-secondary px-6 py-3 rounded-full font-bold">Exit</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const posterUrl = `${IMAGE_BASE_URL}w500${currentQuestion.posterPath}`;

    return (
        <div className="w-full max-w-4xl text-center animate-text-focus-in">
            <div className="flex justify-between items-center mb-4 px-4">
                <button onClick={onExit} className="text-zinc-400 hover:text-white text-sm">&larr; Exit</button>
                <div className="text-lg">Score: <span className="font-bold text-cyan-400">{score}</span></div>
                <div className="text-lg">Question: <span className="font-bold">{currentQuestionIndex + 1}/{questions.length}</span></div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-4">
                <div className="w-full md:w-1/3 flex justify-center">
                    <div className="aspect-[2/3] w-full max-w-[300px] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl">
                         <img 
                            src={posterUrl} 
                            alt="Movie Poster" 
                            className={`w-full h-full object-cover transition-all duration-500 ${difficulty === 'hard' && selectedAnswer === null ? 'blur-xl scale-110' : 'blur-0 scale-100'}`}
                        />
                    </div>
                </div>
                <div className="w-full md:w-2/3">
                    <h2 className="text-xl font-bold mb-6">Which movie is this?</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}
                                disabled={selectedAnswer !== null}
                                className={`p-4 rounded-lg text-lg font-semibold transition-all duration-300 min-h-[6rem] flex items-center justify-center text-center ${getButtonClass(option)}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuessThePosterGame;