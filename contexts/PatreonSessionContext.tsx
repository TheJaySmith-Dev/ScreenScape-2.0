import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// --- IMPORTANT SECURITY NOTE ---
// The client secret has been moved to the secure backend API route.
// The client ID is public and safe to use here.
const PATREON_CLIENT_ID = "bri-ZacRDVksfX5aawU5UOg5h0hGwQfF8BuxDy3K56qKN2GGtA2SLSkFkMgMxk3a";
// This is the *backend* redirect URI that the user is sent to from Patreon.
const PATREON_REDIRECT_URI = 'https://screenscape.space/api/auth/patreon/callback';

interface PatreonUser {
    id: string;
    full_name: string;
    image_url: string;
}

interface PatreonSession {
    user: PatreonUser | null;
    isPatron: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
    processToken: (token: string) => Promise<void>;
}

const PatreonSessionContext = createContext<PatreonSession | undefined>(undefined);

export const PatreonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<PatreonUser | null>(null);
    const [isPatron, setIsPatron] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('patreon_access_token');
        if (storedToken) {
            setAccessToken(storedToken);
            fetchIdentity(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchIdentity = async (token: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields%5Buser%5D=full_name,image_url&fields%5Bmember%5D=patron_status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch identity');

            const { data, included } = await response.json();
            
            setUser({ id: data.id, full_name: data.attributes.full_name, image_url: data.attributes.image_url });

            const membership = included?.find((item: any) => item.type === 'member');
            const patronStatus = membership?.attributes?.patron_status;
            setIsPatron(patronStatus === 'active_patron');
            
        } catch (error) {
            console.error("Failed to fetch Patreon identity:", error);
            logout(); // Log out if token is invalid
        } finally {
            setIsLoading(false);
        }
    };

    const login = () => {
        const scope = encodeURIComponent('identity identity.memberships');
        // Redirect the user to Patreon. Patreon will then redirect them to our backend API route.
        const authUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${PATREON_CLIENT_ID}&redirect_uri=${encodeURIComponent(PATREON_REDIRECT_URI)}&scope=${scope}`;
        window.location.href = authUrl;
    };

    const logout = () => {
        setUser(null);
        setIsPatron(false);
        setAccessToken(null);
        localStorage.removeItem('patreon_access_token');
        localStorage.removeItem('isAdminAccess');
        // Clear URL params on logout
        window.history.replaceState({}, document.title, window.location.pathname);
    };

    const processToken = async (token: string) => {
        localStorage.setItem('patreon_access_token', token);
        setAccessToken(token);
        await fetchIdentity(token);
    };


    const value = { user, isPatron, isLoading, login, logout, processToken };

    return (
        <PatreonSessionContext.Provider value={value}>
            {children}
        </PatreonSessionContext.Provider>
    );
};

export const usePatreon = (): PatreonSession => {
    const context = useContext(PatreonSessionContext);
    if (context === undefined) {
        throw new Error('usePatreon must be used within a PatreonProvider');
    }
    return context;
};
