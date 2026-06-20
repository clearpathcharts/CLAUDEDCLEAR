const CACHE_NAME = 'cpms-tv-v1';
const ASSETS = [
  './',
  './index.html',
  './player.html',
  './manifest.webmanifest',
  './css/netflix-style.css',
  './js/homepage.js',
  './js/netflix-player.js',
  './js/pwa-register.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
