const CACHE_VERSION = 'v13-footer-fit';
const STATIC_CACHE = `mal-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `mal-runtime-${CACHE_VERSION}`;

const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/main.css?v=20260610-footer-fit',
    './js/config.js?v=20260610-typography-v2',
    './js/state.js?v=20260610-typography-v2',
    './js/utils/dom.js?v=20260610-typography-v2',
    './js/services/time.js?v=20260610-typography-v2',
    './js/services/api.js?v=20260610-typography-v2',
    './js/services/weather.js?v=20260610-typography-v2',
    './js/components/countdown.js?v=20260610-typography-v2',
    './js/components/gallery.js?v=20260610-typography-v2',
    './js/player.js?v=20260610-typography-v2',
    './js/main.js?v=20260610-typography-v2',
    './image/logo.png',
    './image/mal-mark.svg',
    './image/icon-192.png',
    './image/icon-512.png',
    './image/icon-maskable-512.png',
    './image/apple-touch-icon.png',
    './image/favicon.png',
    './image/pc.jpg',
    './image/m.jpg',
    './music/onelastkiss.mp3',
    './archives/2025/index.html',
    './archives/2025/birthday.css',
    './archives/2025/birthday.js',
    './archives/2025/text.png',
    './archives/2025/onelastkiss.MP3',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => Promise.allSettled(CORE_ASSETS.map(asset => cache.add(asset))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, './index.html'));
        return;
    }

    if (isSameOrigin) {
        const shouldRefresh = request.destination === 'script' ||
            request.destination === 'style' ||
            request.destination === 'manifest' ||
            /\.(?:html|js|css|json|svg)$/.test(url.pathname);

        event.respondWith(shouldRefresh ? networkFirst(request) : cacheFirst(request));
        return;
    }

    event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirst(request, fallbackUrl) {
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (fallbackUrl) return caches.match(fallbackUrl);
        throw error;
    }
}
