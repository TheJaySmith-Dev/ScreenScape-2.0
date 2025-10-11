import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// --- IMPORTANT SECURITY NOTE ---
// The user has explicitly requested to use these credentials in this environment.
// In a standard production application, these should be handled securely on a backend server.
const PATREON_CLIENT_ID = "bri-ZacRDVksfX5aawU5UOg5h0hGwQfF8BuxDy3K56qKN2GGtA2SLSkFkMgMxk3a";
const PATREON_CLIENT_SECRET = "GTxbalCIYf2mvTmrBv8R2w5dyWNAZNDBemkzZDnl2qZf9h3U5oZ8BT10pnTJZBQF";
const PATREON_REDIRECT_URI = window.location.origin + '/auth/callback';

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
    handleCallback: (code: string) => Promise<void>;
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
            // NOTE: In a real production app, this fetch should be done on a secure backend server
            // to protect your access token and handle API calls safely. This client-side approach
            // is for demonstration purposes in this environment.
            const response = await fetch(`https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields%5Buser%5D=full_name,image_url`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch identity');

            const { data, included } = await response.json();
            
            setUser({ id: data.id, ...data.attributes });

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
        const authUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${PATREON_CLIENT_ID}&redirect_uri=${encodeURIComponent(PATREON_REDIRECT_URI)}&scope=${scope}`;
        window.location.href = authUrl;
    };

    const logout = () => {
        setUser(null);
        setIsPatron(false);
        setAccessToken(null);
        localStorage.removeItem('patreon_access_token');
        localStorage.removeItem('isAdminAccess'); // Also clear admin access on logout
    };

    const handleCallback = async (code: string) => {
        setIsLoading(true);
        try {
            // NOTE: This token exchange is highly insecure on the client-side.
            // In a real app, the `code` must be sent to your backend, which then performs
            // this POST request using your client secret, protecting it from exposure.
            const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.patreon.com/api/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: code,
                    grant_type: 'authorization_code',
                    client_id: PATREON_CLIENT_ID,
                    client_secret: PATREON_CLIENT_SECRET,
                    redirect_uri: PATREON_REDIRECT_URI,
                }),
            });
             if (!response.ok) {
                 const errorText = await response.text();
                 throw new Error(`Token exchange failed: ${errorText}`);
             }
            const { access_token } = await response.json();
            localStorage.setItem('patreon_access_token', access_token);
            setAccessToken(access_token);
            await fetchIdentity(access_token);

        } catch (error) {
            console.error("Patreon callback error:", error);
            setIsLoading(false);
        }
    };


    const value = { user, isPatron, isLoading, login, logout, handleCallback };

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