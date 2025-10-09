

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Loader from './Loader';
import { triviaQuestions, TriviaQuestion } from '../services/triviaQuestions';

interface TriviaGameProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  onExit: () => void;
}

// The Question interface now directly matches the structure in triviaQuestions.ts
type Question = TriviaQuestion;

type GameState = 'idle' | 'loading' | 'playing' | 'finished';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const TriviaGame: React.FC<TriviaGameProps> = ({ onExit }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(15);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    // FIX: The type `NodeJS.Timeout` is not available in browser environments. The correct type for the return value of `setInterval` in the browser is `number`.
    const timerRef = useRef<number | null>(null);

    const generateQuestions = useCallback(() => {
        setGameState('loading');
        
        // Simulate a brief loading period for better UX, even though it's fast
        setTimeout(() => {
            try {
                const shuffled = shuffleArray(triviaQuestions);
                if (shuffled.length < 10) {
                    throw new Error("Not enough questions in the database.");
                }
                const selectedQuestions = shuffled.slice(0, 10);

                setQuestions(selectedQuestions);
                setCurrentQuestionIndex(0);
                setScore(0);
                setGameState('playing');
            } catch (error) {
                console.error("Error setting up trivia questions:", error);
                setGameState('idle'); // or 'error'
            }
        }, 500); // 500ms delay
    }, []);


    useEffect(() => {
        if (gameState === 'playing' && selectedAnswer === null) {
            timerRef.current = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, selectedAnswer]);

    useEffect(() => {
        if (timer === 0) {
            handleAnswer(-1); // Auto-submit wrong answer if timer runs out
        }
    }, [timer]);

    const handleAnswer = (answerIndex: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSelectedAnswer(answerIndex);
        const correct = answerIndex === questions[currentQuestionIndex].correctAnswerIndex;
        setIsCorrect(correct);
        if (correct) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
                setTimer(15);
            } else {
                setGameState('finished');
            }
        }, 2000);
    };

    const handlePlayAgain = () => {
        setGameState('idle');
        setQuestions([]);
    }

    if (gameState === 'idle') {
        return (
            <div className="w-full max-w-3xl text-center animate-scale-up-center">
                <button onClick={onExit} className="absolute top-24 left-8 text-zinc-300 hover:text-white">&larr; Back to Games</button>
                <h1 className="text-5xl font-bold mb-4 animate-glow">Movie Trivia</h1>
                <p className="text-lg text-zinc-400 mb-8">Test your film knowledge. 10 questions, 15 seconds each. Good luck!</p>
                <button onClick={generateQuestions} className="glass-button glass-button-primary px-8 py-4 rounded-full font-bold text-xl">Start Game</button>
            </div>
        );
    }
    
    if (gameState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center">
                <Loader />
                <p className="mt-4 text-zinc-300">Preparing your game...</p>
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

    const getButtonClass = (index: number) => {
        if (selectedAnswer !== null) {
            if (index === currentQuestion.correctAnswerIndex) return 'bg-green-500/80 border-green-400';
            if (index === selectedAnswer) return 'bg-red-500/80 border-red-400';
            return 'bg-glass border-glass-edge opacity-50';
        }
        return 'bg-glass border-glass-edge hover:bg-cyan-500/20 hover:border-cyan-400';
    }

    return (
        <div className="w-full max-w-3xl text-center animate-text-focus-in">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onExit} className="text-zinc-400 hover:text-white text-sm">&larr; Exit</button>
                <div className="text-lg">Score: <span className="font-bold text-cyan-400">{score}</span></div>
                <div className="text-lg">Question: <span className="font-bold">{currentQuestionIndex + 1}/{questions.length}</span></div>
            </div>
            <div className="relative w-full h-2 bg-zinc-800 rounded-full mb-8">
                <div className="absolute top-0 left-0 h-full bg-cyan-500 rounded-full" style={{ width: `${(timer / 15) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>

            <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-lg">
                <p className="text-sm text-zinc-400 mb-2">Regarding "{currentQuestion.movieTitle}"...</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-8 min-h-[6rem] flex items-center justify-center">{currentQuestion.question}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            disabled={selectedAnswer !== null}
                            className={`p-4 rounded-lg text-lg font-semibold transition-all duration-300 ${getButtonClass(index)}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TriviaGame;
