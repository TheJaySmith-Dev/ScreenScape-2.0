
import React, { useState, useEffect } from 'react';
import TriviaGame from './TriviaGame';
import SixDegreesGame from './SixDegreesGame';
import GuessThePosterGame from './GuessThePosterGame';
import BoxOfficeCompareGame from './BoxOfficeCompareGame';

export type Game = 'trivia' | 'six-degrees' | 'guess-poster' | 'box-office-compare' | null;

interface GameViewProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  initialGame: Game | null;
}

const GameView: React.FC<GameViewProps> = ({ apiKey, onInvalidApiKey, initialGame }) => {
  const [activeGame, setActiveGame] = useState<Game>(initialGame);

  useEffect(() => {
    if (initialGame) {
      setActiveGame(initialGame);
    }
  }, [initialGame]);

  const renderGame = () => {
    switch (activeGame) {
      case 'trivia':
        return <TriviaGame apiKey={apiKey} onInvalidApiKey={onInvalidApiKey} onExit={() => setActiveGame(null)} />;
      case 'six-degrees':
        return <SixDegreesGame apiKey={apiKey} onInvalidApiKey={onInvalidApiKey} onExit={() => setActiveGame(null)} />;
      case 'guess-poster':
        return <GuessThePosterGame apiKey={apiKey} onInvalidApiKey={onInvalidApiKey} onExit={() => setActiveGame(null)} />;
      case 'box-office-compare':
        return <BoxOfficeCompareGame apiKey={apiKey} onInvalidApiKey={onInvalidApiKey} onExit={() => setActiveGame(null)} />;
      default:
        return (
          <div className="text-center animate-text-focus-in">
            <h1 className="text-5xl font-bold mb-8 animate-glow">Choose a Game</h1>
            <div className="flex flex-wrap items-stretch justify-center gap-8">
              <GameCard 
                title="Movie Trivia"
                description="Test your film knowledge against the clock. How many questions can you answer?"
                onClick={() => setActiveGame('trivia')}
              />
              <GameCard 
                title="Six Degrees"
                description="Connect any two actors through their movie roles in six steps or less."
                onClick={() => setActiveGame('six-degrees')}
              />
              <GameCard
                title="Guess The Poster"
                description="How well do you know movie posters? Guess the film from a single image."
                onClick={() => setActiveGame('guess-poster')}
              />
              <GameCard
                title="Box Office Compare"
                description="Decide which blockbuster earned more at the worldwide box office."
                onClick={() => setActiveGame('box-office-compare')}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      {renderGame()}
    </div>
  );
};

interface GameCardProps {
    title: string;
    description: string;
    onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full max-w-sm p-8 bg-glass border border-glass-edge rounded-xl shadow-2xl text-left transform hover:scale-105 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-md flex flex-col"
    >
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">{title}</h2>
        <p className="text-zinc-300 flex-grow">{description}</p>
    </button>
);


export default GameView;
