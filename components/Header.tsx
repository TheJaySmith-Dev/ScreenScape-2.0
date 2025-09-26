import React, { useState, useRef, useEffect } from 'react';
import { ViewType, AccountDetails } from '../types';
import { FilmIcon, SwipeIcon, VerticalFeedIcon, SearchIcon, UserIcon, LogoutIcon } from './Icons';

interface HeaderProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: AccountDetails | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, searchQuery, setSearchQuery, user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { type: ViewType.NETFLIX, label: 'Browse', icon: <FilmIcon className="w-5 h-5" /> },
    { type: ViewType.TINDER, label: 'Swipe', icon: <SwipeIcon className="w-5 h-5" /> },
    { type: ViewType.TIKTOK, label: 'Feed', icon: <VerticalFeedIcon className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 px-6 bg-zinc-900/50 backdrop-blur-xl border-b border-glass-edge">
      <div className="flex items-center gap-8">
        <img src="https://i.ibb.co/chvSf4PC/Chat-GPT-Image-Sep-26-2025-at-10-04-22-PM.png" alt="ScreenScape Logo" className="h-10" />
        <nav className="hidden md:flex items-center p-1.5 space-x-2 bg-black/30 backdrop-blur-2xl rounded-full border border-glass-edge shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                  setView(item.type);
                  if (item.type !== ViewType.NETFLIX) setSearchQuery('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                currentView === item.type ? 'bg-indigo-600 text-white' : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {currentView === ViewType.NETFLIX && (
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-lg px-8">
            <div className="relative">
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

      <div className="flex items-center gap-4">
        <nav className="md:hidden flex items-center p-1.5 space-x-1 bg-black/30 backdrop-blur-2xl rounded-full border border-glass-edge shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setView(item.type)
                if (item.type !== ViewType.NETFLIX) setSearchQuery('');
              }}
              className={`p-2.5 rounded-full transition-all duration-300 ${
                currentView === item.type ? 'bg-indigo-600 text-white' : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </nav>
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center gap-2 p-2 rounded-full bg-black/30 hover:bg-white/10 transition-colors border border-transparent hover:border-glass-edge">
              <UserIcon className="w-6 h-6 text-zinc-300"/>
              <span className="hidden lg:block text-sm font-medium text-zinc-200">{user.username}</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-800/90 backdrop-blur-2xl border border-glass-edge rounded-xl shadow-2xl overflow-hidden animate-scale-up-center origin-top-right">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                  <LogoutIcon className="w-5 h-5"/>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
