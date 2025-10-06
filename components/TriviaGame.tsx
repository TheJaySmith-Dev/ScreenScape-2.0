
import React, { useState } from 'react';
import Loader from './Loader';

interface TriviaGameProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  onExit: () => void;
}

const TriviaGame: React.FC<TriviaGameProps> = ({ onExit }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder content for the trivia game
  
  if (isLoading) {
      return <Loader />;
  }

  return (
    <div className="w-full max-w-3xl text-center">
      <button onClick={onExit} className="absolute top-24 left-8 text-zinc-300 hover:text-white">&larr; Back to Games</button>
      <h1 className="text-5xl font-bold mb-8">Movie Trivia</h1>
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-lg">
          <p className="text-xl text-zinc-300">
              The Movie Trivia game is coming soon! Get ready to test your knowledge on everything from classic cinema to modern blockbusters.
          </p>
      </div>
    </div>
  );
};

export default TriviaGame;
