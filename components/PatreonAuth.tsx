
import React, { useState, useRef, useEffect } from 'react';
import { usePatreon } from '../contexts/PatreonSessionContext';
import { PatreonIcon } from './Icons';

const PatreonAuth: React.FC = () => {
    const { user, login, logout, isLoading } = usePatreon();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return <div className="w-36 h-10 bg-glass rounded-full animate-pulse"></div>;
    }

    if (!user) {
        return (
            <button onClick={login} className="flex items-center justify-center gap-2 bg-[#F96854] text-white font-bold py-2 px-4 rounded-full transition-transform hover:scale-105">
                <PatreonIcon className="w-4 h-4" />
                <span>Login</span>
            </button>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 glass-button p-1 pr-3 rounded-full">
                <img src={user.image_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                <span className="font-semibold text-sm hidden sm:inline">{user.full_name}</span>
            </button>

            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-primary/90 backdrop-blur-md border border-glass-edge rounded-lg shadow-2xl animate-fade-in">
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-slate-300 hover:bg-white/10">
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default PatreonAuth;
