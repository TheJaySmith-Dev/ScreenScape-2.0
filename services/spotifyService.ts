import { SpotifyUser, SpotifyAlbum } from '../types';

const API_BASE_URL = 'https://api.spotify.com/v1';

const spotifyFetch = async <T>(token: string, endpoint: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // The token is invalid or expired. The auth hook will handle this.
      throw new Error('Spotify token is invalid or expired.');
    }
    throw new Error(`Spotify API error: ${response.statusText}`);
  }
  // Spotify can return 204 No Content for some requests
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
};

export const getMyProfile = (token: string): Promise<SpotifyUser> => {
  return spotifyFetch(token, '/me');
};

export const searchAlbums = async (token: string, query: string): Promise<{albums: {items: SpotifyAlbum[]}}> => {
  const formattedQuery = `"${query}" soundtrack OR "${query}" official score`;
  const url = `/search?q=${encodeURIComponent(formattedQuery)}&type=album&limit=10`;
  return spotifyFetch(token, url);
};

export const getAlbumDetails = (token: string, albumId: string): Promise<SpotifyAlbum> => {
    return spotifyFetch(token, `/albums/${albumId}`);
};
