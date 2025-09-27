import React, { useState } from 'react';
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

const Header: React.FC<HeaderProps> = ({
    currentView,
    setView,
    searchQuery,
    setSearchQuery,
    user,
    onLogout
}) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const getAvatarUrl = () => {
        if (!user) return '';
        const avatarPath = user.avatar.tmdb.avatar_path;
        if (avatarPath) {
            return `https://image.tmdb.org/t/p/w45${avatarPath}`;
        }
        return `https://www.gravatar.com/avatar/${user.avatar.gravatar.hash}?s=45&d=identicon`;
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-50 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-8">
                <h1 className="text-2xl font-bold text-indigo-500">ScreenScape</h1>
                <nav className="flex items-center gap-4">
                    <button
                        onClick={() => setView(ViewType.NETFLIX)}
                        className={`flex items-center gap-2 transition-colors ${currentView === ViewType.NETFLIX ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <FilmIcon className="h-5 w-5" />
                        <span>Browse</span>
                    </button>
                    <button
                        onClick={() => setView(ViewType.TINDER)}
                        className={`flex items-center gap-2 transition-colors ${currentView === ViewType.TINDER ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <SwipeIcon className="h-5 w-5" />
                        <span>Swipe</span>
                    </button>
                     <button
                        onClick={() => setView(ViewType.TIKTOK)}
                        className={`flex items-center gap-2 transition-colors ${currentView === ViewType.TIKTOK ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <VerticalFeedIcon className="h-5 w-5" />
                        <span>Feed</span>
                    </button>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                 {currentView === ViewType.NETFLIX && (
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search movies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-800 bg-opacity-75 text-white placeholder-zinc-400 pl-10 pr-4 py-1.5 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>
                 )}
                <div className="relative">
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2">
                        <img src={getAvatarUrl()} alt={user?.username} className="h-8 w-8 rounded-full" />
                    </button>
                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-md shadow-lg py-1">
                            <div className="px-4 py-2 text-sm text-zinc-300 border-b border-zinc-700 flex items-center gap-2">
                               <UserIcon className="h-5 w-5" />
                               <span>{user?.username}</span>
                            </div>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                                <LogoutIcon className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
