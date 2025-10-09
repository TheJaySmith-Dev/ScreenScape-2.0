import React from 'react';
import { SearchIcon, GearIcon } from './Icons';
import { ViewType } from '../App';

interface HeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    view: ViewType;
    setView: (view: ViewType) => void;
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, view, setView, onSettingsClick }) => {
    const NavButton: React.FC<{ viewName: ViewType, children: React.ReactNode }> = ({ viewName, children }) => (
        <button 
            onClick={() => setView(viewName)} 
            className={`text-lg font-semibold transition-colors duration-300 ${view === viewName ? 'text-white' : 'text-slate-400'} hover:text-white`}
        >
            {children}
        </button>
    );

    return (
        <header className="fixed top-0 left-0 right-0 bg-primary/80 backdrop-blur-xl z-40 h-20 flex items-center border-b border-glass-edge">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-3xl font-bold text-white animate-glow tracking-wider">ScreenScape</h1>
                    <nav className="hidden md:flex items-center gap-6">
                        <NavButton viewName="home">Home</NavButton>
                        <NavButton viewName="watchlist">Watchlist</NavButton>
                        <NavButton viewName="game">Games</NavButton>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-glass border border-glass-edge rounded-full py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none w-48 md:w-64 transition-all"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <button onClick={onSettingsClick} className="text-slate-300 hover:text-white transition-colors">
                        <GearIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
