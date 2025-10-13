import { useState, useEffect, useCallback, useRef } from 'react';
import { SpotifyPlayerState, SpotifyAlbum, SpotifyTrack } from '../types';

const PLAYER_IFRAME_ID = 'spotify-global-player';

export const useSpotifyPlayer = (accessToken: string | null) => {
  const [playerState, setPlayerState] = useState<SpotifyPlayerState>({
    track: null,
    album: null,
    isPlaying: false,
    position: 0,
  });
  const [isSdkReady, setIsSdkReady] = useState(false);
  const embedControllerRef = useRef<any>(null);

  const createIframe = useCallback(() => {
    const iframe = document.createElement('iframe');
    iframe.id = PLAYER_IFRAME_ID;
    iframe.style.display = 'none';
    iframe.src = 'https://open.spotify.com/embed/placeholder';
    document.body.appendChild(iframe);
    return iframe;
  }, []);
  
  useEffect(() => {
    if (!accessToken) return;

    if (!document.getElementById(PLAYER_IFRAME_ID)) {
      createIframe();
    }
    
    if (!(window as any).SpotifyIframeApi) {
      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
      script.async = true;
      document.body.appendChild(script);

      (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
        const element = document.getElementById(PLAYER_IFRAME_ID);
        const options = { width: '0', height: '0' };
        IFrameAPI.createController(element, options, (controller: any) => {
          embedControllerRef.current = controller;
          setIsSdkReady(true);
          console.log('🎧 Spotify Player Ready');
        });
      };
    } else if (!embedControllerRef.current) {
        const IFrameAPI = (window as any).SpotifyIframeApi;
        const element = document.getElementById(PLAYER_IFRAME_ID);
        const options = { width: '0', height: '0' };
        IFrameAPI.createController(element, options, (controller: any) => {
          embedControllerRef.current = controller;
          setIsSdkReady(true);
        });
    }

  }, [accessToken, createIframe]);

  const playAlbum = useCallback((album: SpotifyAlbum) => {
    if (!isSdkReady || !embedControllerRef.current) return;
    console.log(`🎵 Now Playing Album: ${album.name}`);
    embedControllerRef.current.loadUri(album.uri);
    embedControllerRef.current.play();
    setPlayerState(prev => ({ ...prev, album, track: album.tracks.items[0], isPlaying: true }));
  }, [isSdkReady]);

  const togglePlay = useCallback(() => {
    if (!isSdkReady || !embedControllerRef.current) return;
    embedControllerRef.current.togglePlay();
    setPlayerState(prev => ({...prev, isPlaying: !prev.isPlaying}));
  }, [isSdkReady]);

  return { playerState, playAlbum, togglePlay, isSdkReady };
};
