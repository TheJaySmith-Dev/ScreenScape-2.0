import React from 'react';
import ReactDOM from 'react-dom/client';
import './services/youtubeService'; // This sets up the YouTube API ready callback.
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Loader from './components/Loader';

// Lazy-load route components to reduce initial bundle and speed first paint
const HomeApp = React.lazy(() => import('./App'));
const PreviewPage = React.lazy(() => import('./pages/PreviewPage'));
const ImaxPage = React.lazy(() => import('./pages/ImaxPage'));
const MarvelStudiosPage = React.lazy(() => import('./pages/MarvelStudiosPage'));
const FormattedDetailRoute = React.lazy(() => import('./pages/FormattedDetailRoute'));
const StudioMogulPage = React.lazy(() => import('./pages/StudioMogulPage'));
const BoxOfficeStatsPage = React.lazy(() => import('./pages/BoxOfficeStatsPage'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={<Loader />}> 
          <Routes>
            {/* Root with no page name: Preview page */}
            <Route path="/" element={<PreviewPage />} />
            {/* Named routes */}
          <Route path="/Home" element={<HomeApp />} />
          <Route path="/IMAX" element={<ImaxPage />} />
          <Route path="/IMAX/Marvel" element={<MarvelStudiosPage />} />
          <Route path="/play/studio-mogul" element={<StudioMogulPage />} />
          {/* Formatted detail routes: /IMAX|/Browse with m.|t. prefixes */}
          {/* Simplified IMAX movie route without type prefix */}
          <Route path="/IMAX/:id" element={<FormattedDetailRoute />} />
          <Route path="/IMAX/:type.:id" element={<FormattedDetailRoute />} />
          <Route path="/Browse/:type.:id" element={<FormattedDetailRoute />} />
          <Route path="/Stats/BoxOffice" element={<BoxOfficeStatsPage />} />
          <Route path="/Stats/BoxOffice/" element={<BoxOfficeStatsPage />} />
          <Route path="/stats/boxoffice" element={<BoxOfficeStatsPage />} />
          <Route path="/stats/boxoffice/" element={<BoxOfficeStatsPage />} />
          <Route path="/BoxOffice" element={<BoxOfficeStatsPage />} />
          <Route path="/BoxOffice/" element={<BoxOfficeStatsPage />} />
          <Route path="/stats/BoxOffice" element={<BoxOfficeStatsPage />} />
          <Route path="/stats/BoxOffice/" element={<BoxOfficeStatsPage />} />
          <Route path="/boffice" element={<BoxOfficeStatsPage />} />
          <Route path="/boffice/" element={<BoxOfficeStatsPage />} />
          <Route path="/stats/boffice" element={<BoxOfficeStatsPage />} />
          <Route path="/stats/boffice/" element={<BoxOfficeStatsPage />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
