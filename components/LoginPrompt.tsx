import React from 'react';
import { createRequestToken } from '../services/tmdbService';
import { FilmIcon } from './Icons';

interface LoginPromptProps {
    apiKey: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ apiKey }) => {
    
    const handleLogin = async () => {
        try {
            const { request_token } = await createRequestToken(apiKey);
            const redirectUrl = window.location.origin + window.location.pathname;
            window.location.href = `https://www.themoviedb.org/authenticate/${request_token}?redirect_to=${encodeURIComponent(redirectUrl)}`;
        } catch (error) {
            console.error("Failed to start TMDB authentication:", error);
            alert("Could not start the login process. Please check your API key and try again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-4">
            <div className="max-w-md w-full text-center bg-zinc-800 p-8 rounded-lg shadow-lg">
                <FilmIcon className="h-12 w-12 mx-auto text-indigo-400 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Login to TMDB</h1>
                <p className="text-zinc-400 mb-6">
                    To personalize your experience and sync your watchlist and ratings, please log in to your TMDB account.
                </p>
                <button
                    onClick={handleLogin}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Login with TMDB
                </button>
            </div>
        </div>
    );
};

export default LoginPrompt;
