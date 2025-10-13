// This service worker is a workaround for servers not configured for single-page applications (SPAs).
// It intercepts navigation requests to the /callback route and serves the root index.html instead.
// This allows the client-side router to handle the authentication callback without a 404 error.

self.addEventListener('install', (event) => {
  // Activate worker immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // Become available to all pages
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept navigation requests.
  if (event.request.mode !== 'navigate') {
    return;
  }

  // If the request is for the callback path, serve the main index.html file.
  if (url.pathname === '/callback') {
    event.respondWith(
      // Fetch the root of the site, which will serve the index.html SPA shell.
      fetch(url.origin)
    );
  }
});
