const CACHE_NAME = 'clearpath-encyclopedia-pwa-v1';
const ASSETS_TO_CACHE = [
  '/learn/index.html',
  '/learn/manifest.json',
  '/learn/assets/css/style.css',
  '/learn/assets/js/main.js',
  '/learn/stock-template.html',
  '/learn/economy-template.html',
  '/learn/glossary-template.html',
  '/learn/sector-template.html'
];

// Install Event: cache static resources
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static financial assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => {
      console.error('[Service Worker] Failed to pre-cache assets', err);
    })
  );
});

// Activate Event: clean older cache generations
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache storage:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate cache strategy
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass all caching in development / preview environments to prevent stale scripts from freezing the app
  const isDevHost = url.hostname === 'localhost' || 
                    url.hostname === '127.0.0.1' || 
                    url.hostname.endsWith('.run.app') || 
                    url.hostname.includes('google.com');
  if (isDevHost) return;

  // If request matches static assets inside the encyclopedia, respond with cache or fetch
  if (url.pathname.startsWith('/learn/')) {
    const isHtml = event.request.mode === 'navigate' || 
                   (event.request.headers.get('accept') || '').includes('text/html') ||
                   url.pathname.endsWith('.html');

    if (isHtml) {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clonedResponse);
              });
            }
            return networkResponse;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache, fetch update in background
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
              return networkResponse;
            })
            .catch((err) => {
              console.log('[Service Worker] Background fetch failed (offline Mode active):', err);
            });
          return cachedResponse;
        }

        // Cache miss: run online request
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return networkResponse;
        });
      }).catch(() => {
        // Ultimate fallback
        return caches.match('/learn/index.html');
      })
    );
  }
});
