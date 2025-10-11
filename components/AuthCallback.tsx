import React, { useEffect, useState } from 'react';
import { usePatreon } from '../contexts/PatreonSessionContext';
import Loader from './Loader';

const AuthCallback: React.FC = () => {
    const { handleCallback } = usePatreon();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            handleCallback(code)
                .then(() => {
                    // On success, redirect to the premium feature page
                    window.location.href = '/genscape';
                })
                .catch(err => {
                    console.error(err);
                    setError("Authentication failed. Please try again.");
                });
        } else {
            setError("No authorization code found. Redirecting...");
            setTimeout(() => {
                 window.location.href = '/';
            }, 2000);
        }
    }, [handleCallback]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
            {error ? (
                <div className="text-center text-red-400">
                    <p className="text-2xl font-bold mb-4">Error</p>
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    <Loader />
                    <p className="mt-4 text-slate-400">Authenticating with Patreon...</p>
                </>
            )}
        </div>
    );
};

export default AuthCallback;