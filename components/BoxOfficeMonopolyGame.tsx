import React, { useState, useEffect, useCallback } from 'react';
import {
  GameState, AIPlayer, Property, ChanceCard, getRandomProperties, getShuffledChanceCards, createRandomAIOpponents,
  STARTING_MONEY, SALARY_PASS_GO, BOARD_SIZE, JAIL_POSITION, GO_POSITION
} from '../services/boxOfficeMonopolyData';
import { queryOpenRouter } from './openrouter';
import Loader from './Loader';

// Dice component
const Dice: React.FC<{ value: number; isRolling: boolean }> = ({ value, isRolling }) => (
  <div className={`inline-block w-8 h-8 mx-1 border-2 border-white rounded-lg flex items-center justify-center font-bold text-white ${isRolling ? 'animate-bounce' : ''}`}>
    {value}
  </div>
);

// Board space component
const BoardSpace: React.FC<{
  property?: Property;
  position: number;
  isChanceSpace?: boolean;
  players: Array<{ id: string; position: number; name: string; emoji: string }>;
}> = ({ property, position, isChanceSpace, players }) => {
  const playerTokens = players.filter(p => p.position === position);

  return (
    <div className={`relative w-16 h-16 border border-glass-edge rounded-lg flex items-center justify-center text-xs ${property ? 'bg-glass' : isChanceSpace ? 'bg-amber-500/20' : 'bg-primary/50'}`}>
      {property ? (
        <div className="text-center">
          <div className={`w-2 h-2 rounded-full mb-1 ${
            property.colorGroup === 'red' ? 'bg-red-500' :
            property.colorGroup === 'blue' ? 'bg-blue-500' :
            property.colorGroup === 'green' ? 'bg-green-500' :
            property.colorGroup === 'yellow' ? 'bg-yellow-500' :
            property.colorGroup === 'purple' ? 'bg-purple-500' :
            property.colorGroup === 'orange' ? 'bg-orange-500' :
            property.colorGroup === 'pink' ? 'bg-pink-500' : 'bg-brown-500'
          }`}></div>
          <div className="font-bold text-xs">{property.name.split(' ')[0]}</div>
        </div>
      ) : isChanceSpace ? (
        <span className="text-2xl">🎲</span>
      ) : (
        <div className="text-center">
          <span className="text-xl">{position === 0 ? '🏠' : position === JAIL_POSITION ? '⚖️' : `${position}`}</span>
        </div>
      )}

      {playerTokens.length > 0 && (
        <div className="absolute -top-2 -right-2 flex -space-x-1">
          {playerTokens.slice(0, 2).map((player, i) => (
            <span key={player.id} className="text-lg" title={player.name}>{player.emoji}</span>
          ))}
          {playerTokens.length > 2 && <span className="text-xs bg-white text-black rounded-full w-4 h-4 flex items-center justify-center">+{playerTokens.length - 2}</span>}
        </div>
      )}
    </div>
  );
};

// Main game component
const BoxOfficeMonopolyGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  // Initial game setup
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedGame = localStorage.getItem('boxOfficeMonopoly');
    if (savedGame) {
      return JSON.parse(savedGame);
    }

    // New game setup
    const properties = getRandomProperties(24);
    const chanceCards = getShuffledChanceCards();
    const aiOpponents = createRandomAIOpponents();

    return {
      humanPlayer: {
        money: STARTING_MONEY,
        position: 0,
        properties: [],
        inJail: false,
        jailTurns: 0,
      },
      aiOpponents,
      currentPlayerIndex: 0,
      properties,
      chanceCards,
      chanceCardIndex: 0,
      gameRound: 1,
      gameStarted: false,
      gameOver: false,
      lastRoll: null,
      doublesCount: 0,
    };
  });

  const [diceValues, setDiceValues] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [showChanceCard, setShowChanceCard] = useState(false);
  const [currentChanceCard, setCurrentChanceCard] = useState<ChanceCard | null>(null);
  const [isAITurn, setIsAITurn] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState<Property | null>(null);
  const [waitingForAI, setWaitingForAI] = useState(false);

  // Save game state
  useEffect(() => {
    localStorage.setItem('boxOfficeMonopoly', JSON.stringify(gameState));
  }, [gameState]);

  // Get current player (human or AI)
  const currentPlayer = gameState.currentPlayerIndex === 0 ?
    { name: 'You', emoji: '👨‍💼', currentStrategy: '', ...gameState.humanPlayer } :
    gameState.aiOpponents[gameState.currentPlayerIndex - 1];
  const isHumanTurn = gameState.currentPlayerIndex === 0;

  // Roll dice
  const rollDice = useCallback(() => {
    if (isRolling || isAITurn || !gameState.gameStarted) return;

    setIsRolling(true);
    setTimeout(() => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      setDiceValues([die1, die2]);
      setIsRolling(false);

      setGameState(prev => ({
        ...prev,
        lastRoll: [die1, die2],
        doublesCount: (die1 === die2 && prev.lastRoll?.[0] === prev.lastRoll?.[1]) ? prev.doublesCount + 1 : (die1 === die2 ? 1 : 0),
      }));

      // Handle dice result after a brief delay
      setTimeout(() => {
        handleDiceResult(die1, die2);
      }, 1000);
    }, 1500);
  }, [gameState.gameStarted, isRolling, isAITurn]);

  // Handle dice result (movement, landing on spaces)
  const handleDiceResult = useCallback(async (die1: number, die2: number) => {
    const total = die1 + die2;
    const isDoubles = die1 === die2;

    setGameState(prev => {
      let newPos = (prev.currentPlayerIndex === 0 ? prev.humanPlayer.position : prev.aiOpponents[prev.currentPlayerIndex - 1].position) + total;

      // Pass GO
      if (newPos >= BOARD_SIZE) {
        newPos = newPos % BOARD_SIZE;
        if (prev.currentPlayerIndex === 0) {
          prev.humanPlayer.money += SALARY_PASS_GO;
        } else {
          prev.aiOpponents[prev.currentPlayerIndex - 1].money += SALARY_PASS_GO;
        }
      }

      // Update position
      if (prev.currentPlayerIndex === 0) {
        prev.humanPlayer.position = newPos;
      } else {
        prev.aiOpponents[prev.currentPlayerIndex - 1].position = newPos;
      }

      // Check if landed on chance space (every 8th space starting from 2)
      const chancePositions = [2, 10, 18, 26, 34];
      if (chancePositions.includes(newPos % BOARD_SIZE)) {
        // Draw chance card
        const card = prev.chanceCards[prev.chanceCardIndex % prev.chanceCards.length];
        setCurrentChanceCard(card);
        setShowChanceCard(true);
        prev.chanceCardIndex = (prev.chanceCardIndex + 1) % prev.chanceCards.length;
      }

      return { ...prev };
    });

    // If AI turn, wait for decision
    if (!isHumanTurn) {
      setWaitingForAI(true);
      // AI decision will be made after chance card if any
    }
  }, [isHumanTurn]);

  // Handle chance card effects
  const handleChanceCard = useCallback(async (card: ChanceCard) => {
    setShowChanceCard(false);

    const currentPlayer = gameState.currentPlayerIndex === 0 ? gameState.humanPlayer :
      gameState.aiOpponents[gameState.currentPlayerIndex - 1];
    const allPlayers = [gameState.humanPlayer, ...gameState.aiOpponents];

    switch (card.type) {
      case 'collection':
        setGameState(prev => {
          const collection = (card.value || 0) * (allPlayers.length - 1); // From each other player
          allPlayers.forEach(player => {
            if (player !== currentPlayer) {
              player.money -= (card.value || 0);
              if (player === prev.humanPlayer) {
                prev.humanPlayer.money += (card.value || 0);
              } else {
                prev.aiOpponents.forEach(ai => {
                  if (ai === player) ai.money += (card.value || 0);
                });
              }
            }
          });
          return { ...prev };
        });
        break;

      case 'payment':
        setGameState(prev => {
          if (prev.currentPlayerIndex === 0) {
            prev.humanPlayer.money -= (card.value || 0);
          } else {
            prev.aiOpponents[prev.currentPlayerIndex - 1].money -= (card.value || 0);
          }
          return { ...prev };
        });
        break;

      case 'movement':
        // Movement handled automatically by chance card effect
        break;

      case 'property_action':
        if (card.action === 'upgrade_house' && card.value) {
          // AI can get "franchise expansion" chance card
          if (!isHumanTurn) {
            // AI logic for upgrading houses
            const ai = gameState.aiOpponents[gameState.currentPlayerIndex - 1];
            const ownedProps = ai.properties.filter(p => p.houses < 4);
            if (ownedProps.length > 0) {
              const prop = ownedProps[Math.floor(Math.random() * ownedProps.length)];
              if (ai.money >= card.value) {
                setGameState(prev => {
                  const aiIndex = prev.currentPlayerIndex - 1;
                  prev.aiOpponents[aiIndex].money -= card.value;
                  const propIndex = prev.aiOpponents[aiIndex].properties.findIndex(p => p.id === prop.id);
                  if (propIndex !== -1) {
                    prev.aiOpponents[aiIndex].properties[propIndex].houses += 1;
                  }
                  return { ...prev };
                });
              }
            }
          }
        }
        break;
    }

    // After chance card, if AI turn, make AI decision
    if (!isHumanTurn) {
      await makeAIDecision();
    }
  }, [gameState, isHumanTurn]);

  // Process landing on property and rent payment
  const processPropertyLanding = useCallback((property: Property, player: any, isAI: boolean) => {
    if (!property.ownedBy) {
      // Property is unowned - offer to buy
      if (isAI) {
        // AI decision to buy
        const ai = gameState.aiOpponents[gameState.currentPlayerIndex - 1];
        const shouldBuy = ai.strategy === 'opportunistic' || ai.strategy === 'aggressive' ||
                          (ai.strategy === 'speculative' && property.basePrice < ai.money * 0.3);
        if (shouldBuy && ai.money >= property.basePrice) {
          setGameState(prev => {
            const aiIndex = prev.currentPlayerIndex - 1;
            prev.aiOpponents[aiIndex].money -= property.basePrice;
            prev.aiOpponents[aiIndex].properties.push({ ...property, ownedBy: ai.id });
            const propIndex = prev.properties.findIndex(p => p.id === property.id);
            prev.properties[propIndex].ownedBy = ai.id;
            return { ...prev };
          });
        }
        nextTurn();
      } else {
        // Show buy modal for human
        setShowPropertyModal(property);
      }
    } else if (property.ownedBy !== (isAI ? gameState.aiOpponents[gameState.currentPlayerIndex - 1].id : 'human')) {
      // Pay rent
      const rent = property.rentBase * (property.houses + 1);
      setGameState(prev => {
        if (isAI) {
          const aiIndex = prev.currentPlayerIndex - 1;
          prev.aiOpponents[aiIndex].money -= rent;
          // Find owner
          if (property.ownedBy === 'human') {
            prev.humanPlayer.money += rent;
          } else {
            const ownerAI = prev.aiOpponents.find(ai => ai.id === property.ownedBy);
            if (ownerAI) ownerAI.money += rent;
          }
        } else {
          prev.humanPlayer.money -= rent;
          // Find AI owner
          const ownerAI = prev.aiOpponents.find(ai => ai.id === property.ownedBy);
          if (ownerAI) ownerAI.money += rent;
        }
        return { ...prev };
      });
      nextTurn();
    } else {
      // Own property - nothing happens
      nextTurn();
    }
  }, [gameState]);

  // Buy property (human action)
  const buyProperty = useCallback(() => {
    if (!showPropertyModal) return;

    setGameState(prev => {
      const propIndex = prev.properties.findIndex(p => p.id === showPropertyModal.id);
      if (propIndex !== -1 && prev.humanPlayer.money >= showPropertyModal.basePrice) {
        prev.humanPlayer.money -= showPropertyModal.basePrice;
        prev.humanPlayer.properties.push({ ...showPropertyModal, ownedBy: 'human' });
        prev.properties[propIndex].ownedBy = 'human';
      }
      return { ...prev };
    });
    setShowPropertyModal(null);
    nextTurn();
  }, [showPropertyModal]);

  // Next turn
  const nextTurn = useCallback(() => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + 1) % (prev.aiOpponents.length + 1);
      if (nextIndex === 0) prev.gameRound += 1;
      return { ...prev, currentPlayerIndex: nextIndex };
    });

    // Check for winners
    setGameState(prev => {
      const humanBankrupt = prev.humanPlayer.money < 0 || prev.humanPlayer.properties.filter(p => p.mortgaged).length > prev.humanPlayer.properties.length / 2;
      const aiBankrupt = prev.aiOpponents.find(ai => ai.money < 0 || ai.properties.filter(p => p.mortgaged).length > ai.properties.length / 2);

      if (humanBankrupt) {
        prev.gameOver = true;
        prev.winner = `AI (${prev.aiOpponents.find(ai => !prev.aiOpponents.some(a => a.money < 0) || ai !== aiBankrupt)?.name})`;
      } else if (aiBankrupt) {
        prev.gameOver = true;
        prev.winner = 'You (Human)';
      }
      return { ...prev };
    });
  }, []);

  // AI decision making with OpenRouter
  const makeAIDecision = useCallback(async () => {
    const ai = gameState.aiOpponents[gameState.currentPlayerIndex - 1];
    const allPlayers = [gameState.humanPlayer, ...gameState.aiOpponents];
    const landedProperty = gameState.properties.find(p => p.position === ai.position);

    // Build context for AI
    const context = `
You are ${ai.name}, a ${ai.strategy} Hollywood mogul playing Monopoly.

Current game state:
- Your money: $${ai.money}
- Properties you own: ${ai.properties.map(p => p.name).join(', ') || 'none'}
- Your current board position: ${ai.position}
- All players status: ${allPlayers.map(p =>
    p === gameState.humanPlayer
      ? `Human Player: $${p.money}, owns ${p.properties.length} properties`
      : `${p.name}: $${p.money}, owns ${p.properties.length} properties`
  ).join('; ')}

You just rolled dice and landed on ${landedProperty ? `the property "${landedProperty.name}" (${landedProperty.franchise}) priced at $${landedProperty.basePrice}` : 'an empty space'}.

Your strategy: ${ai.personality}

Respond as a single action command:
- If you want to buy the property: "BUY_PROPERTY"
- If you want to pass/auction: "PASS"
- Otherwise: "CONTINUE"

Make this decision based on your personality and current finances.
`;

    try {
      const prompt = context;
      const response = await queryOpenRouter(prompt);

      // Parse the response to find the action
      let action = 'PASS'; // Default fallback
      const upperResponse = response.toUpperCase();

      if (upperResponse.includes('BUY_PROPERTY') || (landedProperty && ai.money > landedProperty.basePrice && ai.strategy === 'opportunistic')) {
        action = 'BUY_PROPERTY';
      } else if (upperResponse.includes('PASS') || upperResponse.includes('AUCTION')) {
        action = 'PASS';
      }

      ai.currentStrategy = `Decided to ${action.toLowerCase().replace('_', ' ')} - ${response.slice(0, 50)}...`;
      ai.conversationHistory.push(`Turn ${gameState.gameRound}: ${action} - ${response}`);

      // Execute the AI action
      if (action === 'BUY_PROPERTY' && landedProperty && !landedProperty.ownedBy && ai.money >= landedProperty.basePrice) {
        setGameState(prev => {
          const aiIndex = prev.currentPlayerIndex - 1;
          prev.aiOpponents[aiIndex].money -= landedProperty.basePrice;
          prev.aiOpponents[aiIndex].properties.push({ ...landedProperty, ownedBy: ai.id });
          const propIndex = prev.properties.findIndex(p => p.id === landedProperty.id);
          prev.properties[propIndex].ownedBy = ai.id;
          return { ...prev };
        });
      }
      // For PASS, just continue to next turn

      await new Promise(resolve => setTimeout(resolve, 1500)); // Show thinking time

    } catch (error) {
      console.error('AI decision error:', error);
      // Fallback: random action
      if (landedProperty && !landedProperty.ownedBy && ai.money > landedProperty.basePrice * 0.8) {
        setGameState(prev => {
          const aiIndex = prev.currentPlayerIndex - 1;
          prev.aiOpponents[aiIndex].money -= landedProperty.basePrice;
          prev.aiOpponents[aiIndex].properties.push({ ...landedProperty, ownedBy: ai.id });
          const propIndex = prev.properties.findIndex(p => p.id === landedProperty.id);
          prev.properties[propIndex].ownedBy = ai.id;
          return { ...prev };
        });
      }
    }

    // Process rent if landed on owned property
    if (landedProperty && landedProperty.ownedBy && landedProperty.ownedBy !== ai.id) {
      const rent = landedProperty.rentBase * (landedProperty.houses + 1);
      setGameState(prev => {
        const aiIndex = prev.currentPlayerIndex - 1;
        prev.aiOpponents[aiIndex].money -= rent;
        return { ...prev };
      });
    }

    setWaitingForAI(false);
    setIsAITurn(false);

    // Next turn after delay
    setTimeout(() => nextTurn(), 1000);
  }, [gameState]);

  // Start new game
  const startNewGame = () => {
    const properties = getRandomProperties(24);
    const chanceCards = getShuffledChanceCards();
    const aiOpponents = createRandomAIOpponents();

    setGameState({
      humanPlayer: {
        money: STARTING_MONEY,
        position: 0,
        properties: [],
        inJail: false,
        jailTurns: 0,
      },
      aiOpponents,
      currentPlayerIndex: 0,
      properties,
      chanceCards,
      chanceCardIndex: 0,
      gameRound: 1,
      gameStarted: true,
      gameOver: false,
      lastRoll: null,
      doublesCount: 0,
    });
  };

  // Render board
  const renderBoard = () => {
    const allPlayers = [
      { id: 'human', position: gameState.humanPlayer.position, name: 'You', emoji: '👨‍💼' },
      ...gameState.aiOpponents.map(ai => ({ id: ai.id, position: ai.position, name: ai.name, emoji: ai.emoji }))
    ];

    const spaces = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const property = gameState.properties.find(p => p.position === i);
      const isChanceMove = [2, 10, 18, 26, 34].includes(i);
      spaces.push(
        <BoardSpace
          key={i}
          property={property}
          position={i}
          isChanceSpace={isChanceMove}
          players={allPlayers}
        />
      );
    }

    return (
      <div className="grid grid-cols-11 gap-1 mb-4">
        {/* Top row */}
        {spaces.slice(0, 11).reverse()}
        {/* Right column */}
        <div className="flex flex-col-reverse">
          {spaces.slice(11, 20)}
        </div>
        {/* Bottom row */}
        {spaces.slice(20, 31)}
        {/* Left column */}
        <div className="flex flex-col-reverse">
          {spaces.slice(31, 40).reverse()}
        </div>
      </div>
    );
  };

  // Show start screen if not started
  if (!gameState.gameStarted) {
    return (
      <div className="w-full max-w-4xl text-center animate-scale-up-center p-4">
        <button onClick={onExit} className="absolute top-24 left-4 text-zinc-300 hover:text-white">&larr; Back to Games</button>

        <h1 className="text-5xl font-bold mb-4 animate-glow">Box Office Monopoly</h1>
        <p className="text-lg text-zinc-400 mb-8">
          The ultimate movie mogul strategy game. Acquire franchises, dominate the box office, and bankrupt your AI rivals.
        </p>

        <div className="glass-panel p-8 mb-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Game Features</h2>
          <ul className="text-left space-y-2 text-sm">
            <li>🎲 Play against 3 AI movie executives with different personalities</li>
            <li>🏗️ Build empires by acquiring film franchises and studios</li>
            <li>🎪 Hollywood chance cards with film industry twists</li>
            <li>💰 Strategic decision-making: Buy, upgrade, and collect rent</li>
            <li>🎭 Each game is completely unique with randomized boards</li>
            <li>🤖 AI opponents make clever decisions based on personality</li>
          </ul>
        </div>

        <button onClick={startNewGame} className="glass-button glass-button-primary px-8 py-4 rounded-full font-bold text-xl">
          Start Your Hollywood Empire!
        </button>
      </div>
    );
  }

  // Show game over screen
  if (gameState.gameOver) {
    return (
      <div className="w-full max-w-4xl text-center animate-scale-up-center p-4">
        <h1 className="text-4xl font-bold mb-4 text-cyan-400">Game Over!</h1>
        <p className="text-2xl mb-8">
          {gameState.winner ? `Winner: ${gameState.winner}` : 'Game ended'}
        </p>

        <div className="flex justify-center gap-4">
          <button onClick={startNewGame} className="glass-button glass-button-primary px-6 py-3 rounded-full font-bold">
            Play Again
          </button>
          <button onClick={onExit} className="glass-button glass-button-secondary px-6 py-3 rounded-full font-bold">
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl text-white animate-text-focus-in p-4">
      {/* Header */}
      <div className="sticky top-20 z-10 bg-primary/80 backdrop-blur-md p-4 rounded-xl mb-6 border border-glass-edge">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onExit} className="text-zinc-300 hover:text-white">&larr; Back to Games</button>
          <h1 className="text-xl font-bold">Box Office Monopoly - Round {gameState.gameRound}</h1>
          <div className="text-sm">Turn: <span className="font-bold text-cyan-400">
            {isHumanTurn ? 'Your Turn' : `${currentPlayer.name.split(' ')[0]}...`}
          </span></div>
        </div>

        {/* Player statuses */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-glass p-3 rounded-lg">
            <p className="text-sm text-zinc-400">Your Money</p>
            <p className="text-xl font-bold text-green-400">${gameState.humanPlayer.money}</p>
          </div>
          {gameState.aiOpponents.map(ai => (
            <div key={ai.id} className="bg-glass p-3 rounded-lg">
              <p className="text-sm text-zinc-400">{ai.emoji} {ai.name.split(' ')[0]}</p>
              <p className="text-xl font-bold text-green-400">${ai.money}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex justify-center mb-6">
        {renderBoard()}
      </div>

      {/* Dice */}
      <div className="flex justify-center items-center mb-6">
        <Dice value={diceValues[0]} isRolling={isRolling} />
        <Dice value={diceValues[1]} isRolling={isRolling} />
        {isHumanTurn && (
          <button
            onClick={rollDice}
            disabled={isRolling || waitingForAI}
            className="ml-4 glass-button glass-button-primary px-6 py-2 rounded-full font-bold disabled:opacity-50"
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        )}
        {waitingForAI && <span className="ml-4 text-cyan-400">AI thinking...</span>}
      </div>

      {/* Property modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-primary border border-glass-edge rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">{showPropertyModal.name}</h3>
            <p className="text-zinc-400 mb-4">{showPropertyModal.franchise}</p>
            <p className="mb-4">Price: <span className="font-bold text-cyan-400">${showPropertyModal.basePrice}</span></p>
            <div className="flex gap-2">
              <button onClick={buyProperty} className="flex-1 glass-button bg-green-500/50 hover:bg-green-500/70">
                Buy Property
              </button>
              <button onClick={() => { setShowPropertyModal(null); nextTurn(); }} className="flex-1 glass-button bg-red-500/50 hover:bg-red-500/70">
                Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chance card modal */}
      {showChanceCard && currentChanceCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-primary border border-glass-edge rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎲</span>
              <h3 className="text-xl font-bold">{currentChanceCard.title}</h3>
            </div>
            <p className="mb-4">{currentChanceCard.description}</p>
            <p className="text-sm text-zinc-400 italic">{currentChanceCard.flavor}</p>
            <button
              onClick={() => handleChanceCard(currentChanceCard)}
              className="w-full mt-4 glass-button glass-button-primary py-3 rounded-full font-bold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* AI status */}
      {isAITurn && waitingForAI && (
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-cyan-400">{currentPlayer.name} is making decisions...</p>
          {currentPlayer.currentStrategy && (
            <p className="text-sm text-zinc-400 italic max-w-2xl mx-auto mt-2">
              "{currentPlayer.currentStrategy.slice(0, 200)}{currentPlayer.currentStrategy.length > 200 ? '...' : ''}"
            </p>
          )}
        </div>
      )}

      {/* Current player info */}
      <div className="text-center">
        <p className="text-lg">
          {isHumanTurn ? '🎬 Your move!' :
           waitingForAI ? `${currentPlayer.emoji} ${currentPlayer.name} is thinking...` :
           `${currentPlayer.emoji} Waiting for ${currentPlayer.name}...`
          }
        </p>
      </div>
    </div>
  );
};

export default BoxOfficeMonopolyGame;
