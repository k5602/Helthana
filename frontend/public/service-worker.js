const CACHE_NAME = 'health-guide-v1';
const urlsToCache = [
  '/',
  '/dashboard.html',
  '/login.html',
  '/signup.html',
  '/src/style.css',
  '/src/main.js',
  '/src/api.js',
  '/src/auth.js',
  '/src/ui.js',
  '/src/offline.js',
  '/src/navigation.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.css'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
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