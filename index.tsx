
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PatreonProvider } from './contexts/PatreonSessionContext';
import './services/youtubeService'; // This sets up the YouTube API ready callback.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PatreonProvider>
      <App />
    </PatreonProvider>
  </React.StrictMode>
);
