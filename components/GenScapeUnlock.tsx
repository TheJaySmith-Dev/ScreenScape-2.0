import React, { useState, useEffect } from 'react';
import { validateKey } from '../utils/genscapeKeys';
import { LockIcon } from './Icons';

interface GenScapeUnlockProps {
    onUnlock: () => void;
    initialError?: string | null;
}

const GenScapeUnlock: React.FC<GenScapeUnlockProps> = ({ onUnlock, initialError }) => {
    const [accessKey, setAccessKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialError) {
            setError(initialError);
        }
    }, [initialError]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateKey(accessKey)) {
            localStorage.setItem('genscape_verified', 'true');
            onUnlock();
        } else {
            setError('Invalid access key. Please try again.');
            setAccessKey('');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] p-4">
            <div className="w-full max-w-md text-center glass-panel p-8 rounded-2xl animate-fade-in-up">
                <div className="mx-auto w-16 h-16 bg-accent-500/20 border-2 border-accent-500 rounded-full flex items-center justify-center mb-6">
                    <LockIcon className="w-8 h-8 text-accent-500" />
                </div>
                <h1 className="text-3xl font-bold mb-3">GenScape Access</h1>
                <p className="text-slate-300 mb-6">
                    This is a premium feature. Please enter your access key to continue.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={accessKey}
                        onChange={(e) => {
                            setAccessKey(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Enter Access Key"
                        className="w-full text-center bg-glass border border-glass-edge rounded-full py-3 px-5 text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                        autoFocus
                    />
                    {error && <p className="text-red-400 text-sm -mt-2">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-accent-500 text-white font-bold py-3 px-6 rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!accessKey.trim()}
                    >
                        Unlock
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GenScapeUnlock;