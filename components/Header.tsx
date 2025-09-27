import React, { useState } from 'react';
import { ViewType } from '../types';
import { FilmIcon, SwipeIcon, VerticalFeedIcon, SearchIcon, XIcon } from './Icons';

interface HeaderProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, searchQuery, setSearchQuery }) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const navItems = [
    { type: ViewType.NETFLIX, label: 'Browse', icon: <FilmIcon className="w-5 h-5" /> },
    { type: ViewType.TINDER, label: 'Swipe', icon: <SwipeIcon className="w-5 h-5" /> },
    { type: ViewType.TIKTOK, label: 'Feed', icon: <VerticalFeedIcon className="w-5 h-5" /> },
  ];

  const handleSetView = (view: ViewType) => {
    setView(view);
    if (view !== ViewType.NETFLIX) {
      setSearchQuery('');
    }
    setIsMobileSearchOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:px-6">
        <div className="flex-shrink-0">
          <img src="https://i.ibb.co/chvSf4PC/Chat-GPT-Image-Sep-26-2025-at-10-04-22-PM.png" alt="ScreenScape Logo" className="h-8 sm:h-10" />
        </div>

        {currentView === ViewType.NETFLIX && (
          <div className="hidden md:flex flex-1 justify-center px-8">
              <div className="relative w-full max-w-lg">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <SearchIcon className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for titles..."
                      className="block w-full rounded-full border-0 bg-black/30 backdrop-blur-2xl py-2.5 pl-11 pr-3 text-white shadow-sm ring-1 ring-inset ring-glass-edge placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
                  />
              </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
            {currentView === ViewType.NETFLIX && (
                <button
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="p-2 rounded-full text-zinc-300 hover:bg-white/10 md:hidden"
                    aria-label="Open search"
                >
                    <SearchIcon className="w-6 h-6" />
                </button>
            )}
            <nav className="flex items-center p-1 sm:p-1.5 space-x-1 sm:space-x-2 bg-black/30 backdrop-blur-2xl rounded-full border border-glass-edge shadow-lg">
                {navItems.map((item) => (
                <button
                    key={item.type}
                    onClick={() => handleSetView(item.type)}
                    className={`flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    currentView === item.type
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-300 hover:bg-white/10'
                    }`}
                >
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                </button>
                ))}
            </nav>
        </div>
      </header>

      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-zinc-900/90 backdrop-blur-md z-[60] p-4 animate-text-focus-in">
          <div className="relative w-full max-w-lg mx-auto mt-20">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <SearchIcon className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for titles..."
              className="block w-full rounded-full border-0 bg-black/30 backdrop-blur-2xl py-3 pl-11 pr-11 text-white shadow-sm ring-1 ring-inset ring-glass-edge placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all"
            />
             <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="absolute inset-y-0 right-0 flex items-center pr-4"
                aria-label="Close search"
            >
                <XIcon className="w-6 h-6 text-zinc-400" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;