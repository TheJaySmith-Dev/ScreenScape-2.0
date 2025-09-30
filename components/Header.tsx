import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, HomeIcon, FilmIcon, TVIcon, LikesIcon, AiIcon } from './Icons';
import type { ViewType } from '../App';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  view: ViewType;
  setView: (view: ViewType) => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center h-16 w-16 text-xs transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
        aria-label={label}
    >
        <div className="transition-transform duration-300">
            {icon}
        </div>
        <span className={`mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
        {isActive && <div className="absolute bottom-1 w-2 h-2 bg-indigo-400 rounded-full"></div>}
    </button>
);


const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, view, setView }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery) {
        setIsSearchFocused(true);
    }
  }, [searchQuery]);

  const navItems: { id: ViewType; label: string; icon: (isActive: boolean) => React.ReactNode }[] = [
      { id: 'home', label: 'Home', icon: (isActive) => <HomeIcon className="w-6 h-6" isActive={isActive} /> },
      { id: 'movies', label: 'Movies', icon: (isActive) => <FilmIcon className="w-6 h-6" isActive={isActive} /> },
      { id: 'tv', label: 'TV', icon: (isActive) => <TVIcon className="w-6 h-6" isActive={isActive} /> },
      { id: 'ai', label: 'AI', icon: (isActive) => <AiIcon className="w-6 h-6" isActive={isActive} /> },
  ];

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center px-4">
      <div className="flex items-center gap-2">
        {/* Main Nav Pill */}
        <div className={`relative flex items-center h-20 bg-glass backdrop-blur-2xl border border-glass-edge rounded-full shadow-2xl transition-all duration-500 ease-in-out ${isSearchFocused ? 'w-[24rem] max-w-[90vw]' : 'w-auto'}`}>
            
          {/* Nav Items Container */}
          <div className={`flex items-center justify-around transition-all duration-500 ease-in-out ${isSearchFocused ? 'w-0 opacity-0' : 'w-full opacity-100 px-2'}`}>
              {navItems.map(item => {
                  const isActive = view === item.id;
                  return (
                      <NavItem 
                          key={item.id}
                          label={item.label}
                          icon={item.icon(isActive)}
                          isActive={isActive}
                          onClick={() => setView(item.id)}
                      />
                  );
              })}
          </div>
          
          {/* Search Input Container */}
          <div className={`absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-in-out ${isSearchFocused ? 'w-full opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <SearchIcon className="text-zinc-400 text-xl" />
              </div>
              <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if(!searchQuery) setIsSearchFocused(false) }}
                  placeholder="Search titles, genres, actors..."
                  className="block w-full rounded-full border-0 bg-transparent py-3 pl-11 pr-3 text-white placeholder:text-zinc-400 focus:ring-0 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          
          {/* Search Icon (visible when search is not focused) */}
          <div className={`flex items-center justify-center transition-opacity duration-500 ease-in-out ${isSearchFocused ? 'opacity-0 w-0' : 'opacity-100'}`}>
               <button
                  onClick={() => {
                      setIsSearchFocused(true);
                      searchInputRef.current?.focus();
                  }}
                  className="flex items-center justify-center h-16 w-16 text-zinc-400 hover:text-white"
                  aria-label="Open search"
              >
                  <SearchIcon className="text-2xl" />
              </button>
          </div>
        </div>
         {/* Likes Button */}
         <div className={`transition-all duration-500 ${isSearchFocused ? 'w-0 opacity-0 -translate-x-4' : 'w-auto opacity-100'}`}>
            <button
              onClick={() => setView('likes')}
              className={`relative flex flex-col items-center justify-center h-16 w-16 bg-glass backdrop-blur-2xl border border-glass-edge rounded-full shadow-lg transition-colors duration-300 group ${view === 'likes' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
              aria-label="Likes"
            >
                <LikesIcon className="w-6 h-6" isActive={view === 'likes'} />
                <span className="text-xs mt-1 opacity-70 group-hover:opacity-100">Likes</span>
                {view === 'likes' && <div className="absolute bottom-1 w-2 h-2 bg-indigo-400 rounded-full"></div>}
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;