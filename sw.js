
const CACHE_NAME = 'serenemind-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Critical CDN libraries for offline support
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/@google/genai@^1.30.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/react@^19.2.0/',
  'https://aistudiocdn.com/lucide-react@^0.554.0',
  'https://aistudiocdn.com/react-router-dom@^7.9.6',
  'https://aistudiocdn.com/recharts@^3.4.1',
  'https://aistudiocdn.com/firebase@^12.6.0/',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
          // Attempt to cache all, but don't fail installation if some (like opaque CDNs) fail
          return cache.addAll(urlsToCache).catch(err => {
              console.warn("Some assets failed to cache", err);
          });
      })
  );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
            return response;
        }
        // Otherwise fetch from network
        return fetch(event.request).then(
            function(response) {
                // Check if we received a valid response
                if(!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                var responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then(function(cache) {
                        // Only cache same-origin requests dynamically
                        if (event.request.url.startsWith(self.location.origin)) {
                             cache.put(event.request, responseToCache);
                        }
                    });

                return response;
            }
        );
      })
  );
});
