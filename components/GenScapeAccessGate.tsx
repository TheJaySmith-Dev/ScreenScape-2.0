import React, { useState, useEffect } from 'react';
import GenScapeUnlock from './GenScapeUnlock';

const GenScapeAccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVerified, setIsVerified] = useState(false);
    const [initialError, setInitialError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Jason's admin access override
        const isAdmin = false; 

        if (isAdmin) {
            localStorage.setItem('genscape_verified', 'true');
            setIsVerified(true);
        } else {
            const isVerifiedInStorage = localStorage.getItem('genscape_verified') === 'true';
            if (isVerifiedInStorage) {
                setIsVerified(true);
            }
        }

        // Check for an error passed via URL param from App.tsx
        const params = new URLSearchParams(window.location.search);
        if (params.get('access_error')) {
            setInitialError('The provided access key in the URL is invalid.');
            // Clean up the URL to prevent the error from showing on refresh
            params.delete('access_error');
            const newQuery = params.toString();
            window.history.replaceState({}, document.title, `?${newQuery}`);
        }
        
        setIsLoading(false);
    }, []);
    
    // Prevent flash of unlock screen for verified users
    if (isLoading) {
        return <div className="min-h-[calc(100vh-5rem)]"></div>;
    }

    if (isVerified) {
        return <>{children}</>;
    }

    return <GenScapeUnlock onUnlock={() => setIsVerified(true)} initialError={initialError} />;
};

export default GenScapeAccessGate;