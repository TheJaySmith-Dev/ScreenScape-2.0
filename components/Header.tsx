import React, { useState } from 'react';
import { GearIcon, MenuIcon, XIcon } from './Icons';
import { ViewType } from '../App';

interface HeaderProps {
    view: ViewType;
    setView: (view: ViewType) => void;
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, setView, onSettingsClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const NavButton: React.FC<{ viewName: ViewType, children: React.ReactNode, isMobile?: boolean }> = ({ viewName, children, isMobile = false }) => (
        <button 
            onClick={() => {
                setView(viewName);
                if (isMobile) setIsMenuOpen(false);
            }} 
            className={`font-semibold transition-colors duration-300 ${isMobile ? 'text-xl w-full text-left p-2 rounded-md' : 'text-lg'} ${view === viewName ? (isMobile ? 'bg-white/10 text-white' : 'text-white') : 'text-slate-400'} hover:text-white`}
        >
            {children}
        </button>
    );
    
    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-primary/80 backdrop-blur-xl z-40 h-20 flex items-center border-b border-glass-edge">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    {/* Logo and Desktop Nav */}
                    <div className="flex items-center gap-8">
                        <button onClick={() => setView('screenSearch')} className="text-2xl md:text-3xl font-bold text-white animate-glow tracking-wider">SS</button>
                        <nav className="hidden md:flex items-center gap-6">
                            <NavButton viewName="screenSearch">Home</NavButton>
                            <NavButton viewName="explore">Explore</NavButton>
                            <NavButton viewName="watchlist">Watchlist</NavButton>
                            <NavButton viewName="game">Games</NavButton>
                        </nav>
                    </div>

                    {/* Right-side controls */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Settings Icon (Desktop) */}
                        <button onClick={onSettingsClick} className="text-slate-300 hover:text-white transition-colors p-2 rounded-full glass-button hidden md:block">
                            <GearIcon className="w-6 h-6" />
                        </button>
                        
                        {/* Mobile Menu Icon */}
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white p-2">
                                {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="fixed top-20 left-0 right-0 bg-primary/95 backdrop-blur-lg z-30 p-4 border-b border-glass-edge animate-fade-in-down md:hidden">
                    <nav className="flex flex-col gap-2 mb-4">
                        <NavButton viewName="screenSearch" isMobile>Home</NavButton>
                        <NavButton viewName="explore" isMobile>Explore</NavButton>
                        <NavButton viewName="watchlist" isMobile>Watchlist</NavButton>
                        <NavButton viewName="game" isMobile>Games</NavButton>
                    </nav>
                    <div className="border-t border-glass-edge pt-4 flex flex-col items-start gap-4">
                        <button onClick={() => { onSettingsClick(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-lg">
                            <GearIcon className="w-6 h-6" />
                            Settings
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes animate-fade-in-down {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: animate-fade-in-down 0.3s ease-out both; }
            `}</style>
        </>
    );
};

export default Header;