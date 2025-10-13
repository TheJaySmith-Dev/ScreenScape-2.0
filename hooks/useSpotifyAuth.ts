import { useState, useEffect, useCallback } from 'react';
import { SpotifyUser } from '../types';
import { getMyProfile } from '../services/spotifyService';

const CLIENT_ID = 'fb4eb7f03647432fa68fe30883715906';
const REDIRECT_URI = 'https://screenscape.space/callback';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

const AUTH_TOKEN_KEY = 'spotify_auth_token';
const AUTH_EXPIRES_AT_KEY = 'spotify_auth_expires_at';

export const useSpotifyAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const expiresAt = localStorage.getItem(AUTH_EXPIRES_AT_KEY);

    if (token && expiresAt && new Date().getTime() < Number(expiresAt)) {
      setAccessToken(token);
      setIsAuthenticated(true);
    } else {
      logout(); // Clear expired token
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (accessToken && !user) {
        try {
          const profile = await getMyProfile(accessToken);
          setUser(profile);
        } catch (error) {
          console.error("Failed to fetch Spotify user profile", error);
          // Token might be invalid, prompt for re-login
          logout();
        }
      }
    };
    fetchUser();
  }, [accessToken, user]);

  const login = useCallback(() => {
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    window.location.href = authUrl.toString();
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
  }, []);

  return { isAuthenticated, accessToken, user, login, logout };
};
