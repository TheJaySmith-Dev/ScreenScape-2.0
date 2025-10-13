import React, { useEffect } from 'react';
import Loader from './Loader';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && expiresIn) {
      const expiresAt = new Date().getTime() + parseInt(expiresIn, 10) * 1000;
      localStorage.setItem('spotify_auth_token', accessToken);
      localStorage.setItem('spotify_auth_expires_at', String(expiresAt));
      console.log('🎧 Spotify Connected');
    }
    
    // Redirect to home page after processing
    window.location.href = '/';
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen">
        <Loader />
        <p className="mt-4 text-lg">Connecting to Spotify...</p>
    </div>
  );
};

export default AuthCallback;
