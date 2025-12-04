import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const geminiApiKey = env.GEMINI_API_KEY || 'AIzaSyAkRoZKZG2lOMS9_vzlIeHsOJAK5dFAGkA';
  return {
    server: {
      port: 3001,
      host: '0.0.0.0',
      proxy: {
        '/mdblist': {
          target: 'https://api.mdblist.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/mdblist/, ''),
        },
        // Proxy to the public mdblist.com site for JSON fallback
        '/mdblist_public': {
          target: 'https://mdblist.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/mdblist_public/, ''),
        },
        // Proxy for FanArt API to avoid CORS issues
        '/fanart': {
          target: 'https://webservice.fanart.tv',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/fanart/, ''),
        },
        // Proxy for FanArt Assets (images)
        '/fanart_assets': {
          target: 'https://assets.fanart.tv',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/fanart_assets/, ''),
          headers: {
            Referer: 'https://fanart.tv',
          },
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
    },
    envPrefix: ['VITE_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@supabase/supabase-js'],
            tmdb: ['services/tmdbService.ts'],
          },
        },
      },
    },
  };
});
