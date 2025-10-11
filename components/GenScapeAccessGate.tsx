import React, { useState, useEffect } from 'react';
import { usePatreon } from '../contexts/PatreonSessionContext';
import { PatreonIcon, LockIcon } from './Icons';
import Loader from './Loader';

const ADMIN_PASSWORD = 'screenscape_admin_access'; // A simple, hardcoded password for admin override

const GenScapeAccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isPatron, isLoading, login } = usePatreon();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check for admin access on component mount
        if (localStorage.getItem('isAdminAccess') === 'true') {
            setIsAdmin(true);
        }
    }, []);

    const handleAdminAccess = () => {
        const pass = prompt('Enter Admin Password:');
        if (pass === ADMIN_PASSWORD) {
            localStorage.setItem('isAdminAccess', 'true');
            setIsAdmin(true);
            alert('Admin access granted!');
        } else if (pass) { // Only show alert if a password was entered
            alert('Incorrect password.');
        }
    };
    
    const AdminLoginButton = () => (
        <div className="absolute bottom-2 right-2">
            <button onClick={handleAdminAccess} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Admin
            </button>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
                <Loader />
                <p className="mt-4 text-slate-400">Verifying your access...</p>
            </div>
        );
    }
    
    // Check for access grant (patron or admin)
    if (user && (isPatron || isAdmin)) {
        return <>{children}</>;
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] p-4">
                <div className="w-full max-w-md text-center glass-panel p-8 rounded-2xl animate-fade-in-up relative">
                    <div className="mx-auto w-16 h-16 bg-[#f96854]/20 border-2 border-[#f96854] rounded-full flex items-center justify-center mb-6">
                       <PatreonIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3">Patreon Access Required</h1>
                    <p className="text-slate-300 mb-6">
                        GenScape is an exclusive feature for our Patreon supporters. Please log in to continue.
                    </p>
                    <button onClick={login} className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto bg-[#F96854] text-white font-bold py-3 px-6 rounded-full transition-transform hover:scale-105">
                        <PatreonIcon className="w-5 h-5" />
                        <span>Login with Patreon</span>
                    </button>
                    <AdminLoginButton />
                </div>
            </div>
        );
    }

    if (!isPatron) {
         return (
            <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] p-4">
                <div className="w-full max-w-md text-center glass-panel p-8 rounded-2xl animate-fade-in-up relative">
                     <div className="mx-auto w-16 h-16 bg-accent-500/20 border-2 border-accent-500 rounded-full flex items-center justify-center mb-6">
                       <LockIcon className="w-8 h-8 text-accent-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3">Unlock GenScape</h1>
                    <p className="text-slate-300 mb-6">
                        Welcome, {user.full_name}! To access our AI image generator, please become a supporter on Patreon.
                    </p>
                    <a href="https://www.patreon.com/join" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto bg-[#F96854] text-white font-bold py-3 px-6 rounded-full transition-transform hover:scale-105">
                        <PatreonIcon className="w-5 h-5" />
                        <span>Become a Patron</span>
                    </a>
                    <AdminLoginButton />
                </div>
            </div>
        );
    }

    return null; // Should not be reached, but good practice
};

export default GenScapeAccessGate;