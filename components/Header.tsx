import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, StarIcon, UserIcon, ChevronDownIcon, MenuIcon, XIcon } from './Icons';
import type { ViewType } from '../App';
import type { ActiveFilter, FilterCategory } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  view: ViewType;
  setView: (view: ViewType) => void;
  activeFilter: ActiveFilter | null;
  setActiveFilter: (filter: ActiveFilter | null) => void;
}

const services = [
  { id: 8, name: 'Netflix' },
  { id: 337, name: 'Disney+' },
  { id: 1899, name: 'Max' },
  { id: 9, name: 'Prime Video' },
  { id: 15, name: 'Hulu' },
  { id: 2, name: 'Apple TV+' },
  { id: 531, name: 'Paramount+' },
  { id: 387, name: 'Peacock' },
];

const studios = [
  { id: 2, name: 'Walt Disney' },
  { id: 4, name: 'Paramount' },
  { id: 5, name: 'Columbia' },
  { id: 25, name: '20th Century' },
  { id: 33, name: 'Universal' },
  { id: 34, name: 'Sony Pictures' },
  { id: 174, name: 'Warner Bros.' },
  { id: 1632, name: 'Lionsgate' },
  { id: 41077, name: 'A24' },
];

const networks = [
  { id: 213, name: 'Netflix' },
  { id: 49, name: 'HBO' },
  { id: 88, name: 'FX' },
  { id: 174, name: 'AMC' },
  { id: 67, name: 'Showtime' },
  { id: 318, name: 'Starz' },
  { id: 2, name: 'ABC' },
  { id: 16, name: 'CBS' },
  { id: 6, name: 'NBC' },
  { id: 19, name: 'FOX' },
];

const mainNavItems = ['For You', 'Stream', 'Studios', 'Networks'];
const menuData: { [key: string]: { type: FilterCategory, items: {id: number, name: string}[] } } = {
    'Stream': { type: 'service', items: services },
    'Studios': { type: 'studio', items: studios },
    'Networks': { type: 'network', items: networks },
};


const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, view, setView, activeFilter, setActiveFilter }) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSubMenu, setOpenMobileSubMenu] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchVisible) {
      searchInputRef.current?.focus();
    }
  }, [isSearchVisible]);
  
  useEffect(() => {
    if(searchQuery) setIsSearchVisible(true);
  }, [searchQuery])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleSelect = (type: FilterCategory, id: number, name: string) => {
    setActiveFilter({ type, id, name });
    setOpenMenu(null); // Close desktop dropdown
    setIsMobileMenuOpen(false); // Close mobile menu
  }

  const handleForYouClick = () => {
    setActiveFilter(null);
    setIsMobileMenuOpen(false);
  }
  
  const handleMobileSubMenuToggle = (item: string) => {
    setOpenMobileSubMenu(prev => prev === item ? null : item);
  }
  
  const getButtonClass = (item: string) => {
    const isForYouActive = item === 'For You' && !activeFilter;
    const isCategoryActive = item !== 'For You' && activeFilter?.type === menuData[item]?.type;
    return `px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
        isForYouActive || isCategoryActive
        ? 'text-cyan-300 bg-white/10'
        : 'text-zinc-300 hover:text-white hover:bg-white/5'
    }`;
  }

  const renderDesktopNavItems = () => (
      mainNavItems.map(item => {
        if (item === 'For You') {
            return (
                <button key={item} onClick={handleForYouClick} className={getButtonClass(item)}>
                    For You
                </button>
            )
        }
        return (
            <div 
                key={item} 
                className="relative" 
                onMouseEnter={() => setOpenMenu(item)} 
                onMouseLeave={() => setOpenMenu(null)}
            >
                <button className={`${getButtonClass(item)} flex items-center gap-1`}>
                    {item}
                    <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${openMenu === item ? 'rotate-180' : ''}`}
                    />
                </button>
                {openMenu === item && (
                    <div className="absolute top-full mt-2 w-48 max-h-72 overflow-y-auto bg-primary/80 backdrop-blur-md border border-glass-edge rounded-lg shadow-2xl p-2 z-50 left-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {menuData[item].items.map(subItem => (
                            <button 
                                key={subItem.id} 
                                onClick={() => handleSelect(menuData[item].type, subItem.id, subItem.name)} 
                                className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${activeFilter?.id === subItem.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-zinc-200'}`}
                            >
                                {subItem.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )
    })
  );


  return (
    <React.Fragment>
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-gradient-to-b from-primary to-transparent flex items-center justify-between px-4 md:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-8">
          <h1 
            className="text-2xl font-bold cursor-pointer animate-glow"
            onClick={() => {
              setView('home');
              setActiveFilter(null);
            }}
          >
            ScreenScape
          </h1>
        </div>

        {/* Center Section - Desktop Navigation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6">
          {renderDesktopNavItems()}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center transition-all duration-300 ${isSearchVisible ? 'w-48 md:w-64' : 'w-0'}`}>
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="text-zinc-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setIsSearchVisible(false) }}
                placeholder="Search..."
                className={`w-full bg-glass border border-glass-edge rounded-full py-2 pl-10 pr-3 text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all duration-300 ${isSearchVisible ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </div>
          
          <button onClick={() => setIsSearchVisible(true)} className="text-zinc-300 hover:text-white transition-colors" aria-label="Search">
            <SearchIcon className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setView('watchlist')} 
            className={`text-zinc-300 hover:text-white transition-colors ${view === 'watchlist' ? 'text-cyan-400' : ''}`} 
            aria-label="Watchlist"
          >
            <StarIcon className="w-6 h-6" isActive={view === 'watchlist'} />
          </button>

          <button className="text-zinc-300 hover:text-white transition-colors" aria-label="Profile">
            <UserIcon className="w-6 h-6" />
          </button>
          
           {/* Hamburger Menu Button */}
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-zinc-300 hover:text-white transition-colors" aria-label="Open menu">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[100] bg-primary/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-end p-5">
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                  <XIcon className="w-8 h-8 text-zinc-300 hover:text-white" />
              </button>
          </div>
          <nav className="flex flex-col items-center justify-center h-full -mt-20 text-center">
              <ul className="space-y-8">
                  <li>
                      <button 
                          onClick={handleForYouClick} 
                          className={`text-2xl font-bold transition-colors ${!activeFilter ? 'text-cyan-400' : 'text-white hover:text-cyan-300'}`}
                      >
                          For You
                      </button>
                  </li>
                  {['Stream', 'Studios', 'Networks'].map(item => (
                      <li key={item}>
                          <button 
                              onClick={() => handleMobileSubMenuToggle(item)}
                              className={`text-2xl font-bold flex items-center gap-2 mx-auto transition-colors ${activeFilter?.type === menuData[item].type ? 'text-cyan-400' : 'text-white hover:text-cyan-300'}`}
                          >
                              {item}
                              <ChevronDownIcon className={`w-5 h-5 transition-transform ${openMobileSubMenu === item ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <div className={`grid transition-all duration-300 ease-in-out ${openMobileSubMenu === item ? 'grid-rows-[1fr] mt-6' : 'grid-rows-[0fr]'}`}>
                              <div className="overflow-hidden">
                                  <ul className="space-y-4">
                                      {menuData[item].items.map(subItem => (
                                          <li key={subItem.id}>
                                              <button
                                                  onClick={() => handleSelect(menuData[item].type, subItem.id, subItem.name)}
                                                  className={`text-lg font-medium transition-colors ${activeFilter?.id === subItem.id ? 'text-cyan-300' : 'text-zinc-400 hover:text-white'}`}
                                              >
                                                  {subItem.name}
                                              </button>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          </div>
                      </li>
                  ))}
              </ul>
          </nav>
      </div>
    </React.Fragment>
  );
};

export default Header;