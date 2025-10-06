
import React, { useState } from 'react';
import Loader from './Loader';

interface SixDegreesGameProps {
  apiKey: string;
  onInvalidApiKey: () => void;
  onExit: () => void;
}

const SixDegreesGame: React.FC<SixDegreesGameProps> = ({ onExit }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Placeholder content for the Six Degrees game

  if (isLoading) {
      return <Loader />;
  }
  
  return (
    <div className="w-full max-w-3xl text-center">
      <button onClick={onExit} className="absolute top-24 left-8 text-zinc-300 hover:text-white">&larr; Back to Games</button>
      <h1 className="text-5xl font-bold mb-8">Six Degrees</h1>
      <div className="bg-glass border border-glass-edge rounded-xl p-8 shadow-lg">
          <p className="text-xl text-zinc-300">
              The Six Degrees game is under construction. Soon you'll be able to challenge yourself to connect your favorite actors!
          </p>
      </div>
    </div>
  );
};

export default SixDegreesGame;
