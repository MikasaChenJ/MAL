const CACHE_NAME = 'mal-days-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/main.css',
    './js/main.js',
    './js/player.js',
    './image/logo.png',
    './image/pc.jpg',
    './image/m.jpg',
    'https://cdnjs.cloudflare.com/ajax/libs/lunar-javascript/1.7.2/lunar.min.js',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
