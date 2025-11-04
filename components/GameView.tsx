import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TriviaGame from './TriviaGame';
import SixDegreesGame from './SixDegreesGame';
import GuessThePosterGame from './GuessThePosterGame';
import BoxOfficeCompareGame from './BoxOfficeCompareGame';
import BizIdleGame from './BizIdleGame';
import BoxOfficeMonopolyGame from './BoxOfficeMonopolyGame';
import { useAppleTheme } from './AppleThemeProvider';

export type Game = 'trivia' | 'six-degrees' | 'guess-poster' | 'box-office-compare' | 'biz-idle' | 'box-office-monopoly' | null;

interface GameViewProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  initialGame: Game | null;
}

const GameView: React.FC<GameViewProps> = ({ apiKey, onInvalidApiKey, initialGame }) => {
  const { tokens } = useAppleTheme();
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
      case 'box-office-monopoly':
        return <BoxOfficeMonopolyGame onExit={() => setActiveGame(null)} />;
      default:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              textAlign: 'center',
              padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[1]}px`,
              maxWidth: '1200px',
              margin: '0 auto'
            }}
          >
            <h1 
              className="apple-title-1"
              style={{ 
                color: tokens.colors.label.primary,
                marginBottom: tokens.spacing.standard[2],
                fontWeight: tokens.typography.weights.bold
              }}
            >
              Choose a Game
            </h1>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: tokens.spacing.standard[1],
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
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
              <GameCard
                title="Box Office Monopoly"
                description="Compete against AI moguls in Hollywood strategy."
                onClick={() => setActiveGame('box-office-monopoly')}
              />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${tokens.spacing.standard[2]}px ${tokens.spacing.standard[1]}px`
    }}>
      {renderGame()}
    </div>
  );
};

interface GameCardProps {
    title: string;
    description: string;
    onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, onClick }) => {
  const { tokens } = useAppleTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className="apple-glass-regular apple-depth-2"
      style={{
        width: '100%',
        padding: tokens.spacing.standard[2],
        borderRadius: '20px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: isPressed 
          ? 'scale(0.98) translateY(2px)' 
          : isHovered 
            ? 'scale(1.02) translateY(-4px)' 
            : 'scale(1) translateY(0)',
        willChange: 'transform'
      }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
      whileTap={{ 
        scale: 0.98,
        y: 2,
        transition: { duration: 0.1 }
      }}
    >
      <h2 
        className="apple-title-3"
        style={{ 
          color: tokens.colors.system.blue,
          marginBottom: tokens.spacing.standard[1],
          fontWeight: tokens.typography.weights.bold,
          transition: 'color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {title}
      </h2>
      <p 
        className="apple-body"
        style={{ 
          color: tokens.colors.label.secondary,
          flexGrow: 1,
          margin: 0
        }}
      >
        {description}
      </p>
    </motion.button>
  );
};

export default GameView;
