import React, { useState, useEffect } from 'react';
import TriviaGame from './TriviaGame';
import SixDegreesGame from './SixDegreesGame';
import GuessThePosterGame from './GuessThePosterGame';
import BoxOfficeCompareGame from './BoxOfficeCompareGame';
import BizIdleGame from './BizIdleGame';

export type Game = 'trivia' | 'six-degrees' | 'guess-poster' | 'box-office-compare' | 'biz-idle' | null;

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
      case 'biz-idle':
        return <BizIdleGame onExit={() => setActiveGame(null)} />;
      default:
        return (
          <div className="text-center animate-fade-in-up">
            <h1 className="text-5xl font-bold mb-8 animate-glow">Choose a Game</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <GameCard 
                title="Movie Trivia"
                description="Race the clock with film facts."
                onClick={() => setActiveGame('trivia')}
              />
              <GameCard 
                title="Six Degrees"
                description="Link actors through their roles."
                onClick={() => setActiveGame('six-degrees')}
              />
              <GameCard 
                title="Guess The Poster"
                description="Identify iconic movie designs."
                onClick={() => setActiveGame('guess-poster')}
              />
              <GameCard
                title="Box Office Compare"
                description="Which film earned more?"
                onClick={() => setActiveGame('box-office-compare')}
              />
              <GameCard
                title="BizIdle"
                description="Build studios. Shape the industry."
                onClick={() => setActiveGame('biz-idle')}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-5rem)]">
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
        className="group w-full p-8 glass-panel rounded-2xl text-left transform hover:-translate-y-2 hover:border-accent-500/50 transition-all duration-300 flex flex-col"
    >
        <h2 className="text-3xl font-bold text-accent-500 mb-4 transition-colors duration-300 group-hover:text-white">{title}</h2>
        <p className="text-slate-300 flex-grow">{description}</p>
    </button>
);

export default GameView;