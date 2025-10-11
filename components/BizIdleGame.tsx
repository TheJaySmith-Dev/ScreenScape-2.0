import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initialCompanies, Company, GAME_TICK_RATE, INITIAL_MONEY } from '../services/bizIdleGameData';

interface BizIdleGameProps {
  onExit: () => void;
}

// Number formatting utility
const formatNumber = (num: number): string => {
  if (num === 0) return '0.00';
  if (num < 1000 && num > -1000) return num.toFixed(2);
  const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const i = Math.floor(Math.log10(Math.abs(num)) / 3);
  if (i >= suffixes.length) {
    return num.toExponential(2);
  }
  const value = (num / Math.pow(1000, i));
  return `${value.toFixed(2)}${suffixes[i]}`;
};

// --- Main Game Component ---
const BizIdleGameComponent: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [money, setMoney] = useState<number>(() => {
    const savedMoney = localStorage.getItem('bizIdle_money');
    return savedMoney ? JSON.parse(savedMoney) : INITIAL_MONEY;
  });

  const [companyLevels, setCompanyLevels] = useState<Record<string, number>>(() => {
    const savedLevels = localStorage.getItem('bizIdle_companyLevels');
    if (savedLevels) {
      const parsed = JSON.parse(savedLevels);
      // Ensure all companies from the new data are present in the state
      return initialCompanies.reduce((acc, comp) => ({ ...acc, [comp.id]: parsed[comp.id] || 0 }), {});
    }
    return initialCompanies.reduce((acc, comp) => ({ ...acc, [comp.id]: 0 }), {});
  });
  
  const [gameTime, setGameTime] = useState<number>(() => {
    const savedTime = localStorage.getItem('bizIdle_gameTime');
    return savedTime ? JSON.parse(savedTime) : 0; // time in seconds
  });

  const calculateCompanyCost = (company: Company, level: number): number => {
    return Math.floor(company.cost * Math.pow(company.costMultiplier, level));
  };

  const calculateCompanyIncome = (company: Company, level: number): number => {
    return company.baseIncome * level;
  };

  const totalIncomePerSecond = useMemo(() => {
    return initialCompanies.reduce((total, company) => {
      const level = companyLevels[company.id] || 0;
      return total + calculateCompanyIncome(company, level);
    }, 0);
  }, [companyLevels]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      setMoney(prevMoney => prevMoney + totalIncomePerSecond / (1000 / GAME_TICK_RATE));
      setGameTime(prevTime => prevTime + (GAME_TICK_RATE / 1000));
    }, GAME_TICK_RATE);

    return () => clearInterval(gameLoop);
  }, [totalIncomePerSecond]);

  useEffect(() => {
    localStorage.setItem('bizIdle_money', JSON.stringify(money));
    localStorage.setItem('bizIdle_companyLevels', JSON.stringify(companyLevels));
    localStorage.setItem('bizIdle_gameTime', JSON.stringify(gameTime));
  }, [money, companyLevels, gameTime]);

  const handleBuyCompany = useCallback((companyId: string) => {
    const company = initialCompanies.find(c => c.id === companyId);
    if (!company) return;

    const level = companyLevels[companyId] || 0;
    const cost = calculateCompanyCost(company, level);

    if (money >= cost) {
      setMoney(prev => prev - cost);
      setCompanyLevels(prev => ({
        ...prev,
        [companyId]: (prev[companyId] || 0) + 1,
      }));
    }
  }, [money, companyLevels]);

  const handleReset = () => {
    if(window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
        localStorage.removeItem('bizIdle_money');
        localStorage.removeItem('bizIdle_companyLevels');
        localStorage.removeItem('bizIdle_gameTime');
        setMoney(INITIAL_MONEY);
        setCompanyLevels(initialCompanies.reduce((acc, comp) => ({ ...acc, [comp.id]: 0 }), {}));
        setGameTime(0);
    }
  }

  const gameDay = Math.floor(gameTime / 60) + 1;

  return (
    <div className="w-full max-w-7xl text-white animate-text-focus-in p-4">
      <div className="sticky top-20 z-10 bg-primary/80 backdrop-blur-md p-4 rounded-xl mb-6 border border-glass-edge shadow-2xl">
        <div className="flex justify-between items-center mb-2">
            <button onClick={onExit} className="text-zinc-300 hover:text-white text-sm">&larr; Back to Games</button>
            <h1 className="text-2xl md:text-3xl font-bold text-center animate-glow">BizIdle</h1>
            <button onClick={handleReset} className="text-zinc-400 hover:text-red-400 text-sm">Reset Progress</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-glass p-3 rounded-lg">
                <p className="text-sm text-zinc-400">Studio Valuation</p>
                <p className="text-2xl md:text-3xl font-bold text-cyan-400">${formatNumber(money)}</p>
            </div>
            <div className="bg-glass p-3 rounded-lg">
                <p className="text-sm text-zinc-400">Revenue</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400">${formatNumber(totalIncomePerSecond)}/s</p>
            </div>
             <div className="bg-glass p-3 rounded-lg">
                <p className="text-sm text-zinc-400">Production Time</p>
                <p className="text-2xl md:text-3xl font-bold text-zinc-300">Day {gameDay}</p>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialCompanies.map(company => {
          const level = companyLevels[company.id];
          const cost = calculateCompanyCost(company, level);
          const income = calculateCompanyIncome(company, level);
          const canAfford = money >= cost;
          return (
            <div key={company.id} className="bg-glass border border-glass-edge rounded-lg p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-grow w-full">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-lg font-bold">{company.name}</h3>
                  <span className="px-3 py-1 bg-cyan-900/50 text-cyan-300 text-sm font-bold rounded-full"> Lvl {level} </span>
                </div>
                <p className="text-xs text-zinc-400">{company.industry}</p>
                <div className="flex justify-between items-center text-sm mt-2 text-zinc-300">
                  <span>Revenue: <span className="font-semibold text-green-400">${formatNumber(income)}/s</span></span>
                </div>
              </div>
              <div className="w-full md:w-auto md:min-w-[12rem] flex-shrink-0">
                <button onClick={() => handleBuyCompany(company.id)} disabled={!canAfford} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 enabled:hover:bg-cyan-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed">
                  <div>Acquire for</div>
                  <div className="text-lg">${formatNumber(cost)}</div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const features = [
    { emoji: '🏙️', title: 'Start From Scratch', description: 'Grow your indie production house into a major media conglomerate.' },
    { emoji: '🎬', title: 'Produce Hit Content', description: 'Greenlight everything from TV dramas to animated features and sci-fi epics.' },
    { emoji: '🧠', title: 'Compete Against AI Rivals', description: 'Dynamic studios evolve, compete for talent, and fight for box office supremacy.' },
    { emoji: '🏆', title: 'Win Industry Awards', description: 'Chase critical acclaim and unlock massive bonuses for your studio.' },
    { emoji: '💰', title: 'Manage Budgets', description: 'Balance blockbuster risks with the steady income of television hits.' },
    { emoji: '🤝', title: 'Acquire Studios', description: 'Buy out the competition through friendly mergers or hostile takeovers.' },
    { emoji: '🌍', title: 'Build a Streaming Empire', description: 'Launch your own streaming service and compete for global subscribers.' },
    { emoji: '🖼️', title: 'Chef’s Kiss UI', description: 'Built with a stunning, futuristic glass interface you’ll love.' },
    { emoji: '🧑‍💼', title: 'Web-Only. No Account Needed.', description: 'Play instantly. No sign-ups. No friction. All Hollywood.' },
    { emoji: '🔁', title: 'Endless Replay Value', description: 'Every session is unique, with unpredictable AI-driven market shifts.' }
];

// --- Wrapper Component with Start Screen ---
const BizIdleGame: React.FC<BizIdleGameProps> = ({ onExit }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handlePlay = () => {
    setIsLaunching(true);
    setTimeout(() => {
        setHasStarted(true);
    }, 1000); 
  };

  if (!hasStarted) {
    return (
      <div className="w-full max-w-5xl text-center animate-scale-up-center p-4">
        <button onClick={onExit} className="absolute top-24 left-4 sm:left-8 text-zinc-300 hover:text-white">&larr; Back to Games</button>

        <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-2 animate-glow">BizIdle</h1>
            <p className="text-base sm:text-lg text-cyan-400 font-semibold">The Ultimate Movie & TV Studio Tycoon Game</p>
        </div>

        <div className="glass-panel text-left p-6 sm:p-8 mb-8 !rounded-xl">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">“From indie shorts to global blockbusters, build your media empire.”</h3>
            <div className="text-zinc-300 space-y-4 text-sm sm:text-base">
                <p><strong>BizIdle</strong> is a movie and TV studio simulation game where you call the shots. Start with a small indie studio and make strategic decisions to produce hit shows, release blockbuster films, build a streaming service, and dominate Hollywood.</p>
                <p>Powered by dynamic AI agents, the industry changes constantly. Rival studios can poach your top talent, negotiate distribution deals, attempt hostile takeovers, or greenlight a competing blockbuster that challenges your release.</p>
                <p>Whether you're chasing awards season glory, creating the next big streaming hit, or building a cinematic universe, <strong>no two playthroughs are ever the same.</strong></p>
            </div>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map(feature => (
                    <div key={feature.title} className="glass-panel text-left p-4 !rounded-lg flex items-start gap-4 h-full">
                        <span className="text-2xl sm:text-3xl mt-1">{feature.emoji}</span>
                        <div>
                            <h4 className="font-bold text-white text-sm sm:text-base">{feature.title}</h4>
                            <p className="text-xs sm:text-sm text-zinc-300">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <button onClick={handlePlay} disabled={isLaunching} className="glass-button glass-button-primary px-12 py-4 rounded-full font-bold text-lg sm:text-xl w-full max-w-sm">
            {isLaunching ? (
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Launching...
                </div>
            ) : (
                "Play Now"
            )}
        </button>
      </div>
    );
  }

  return <BizIdleGameComponent onExit={onExit} />;
};

export default BizIdleGame;