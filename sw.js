const CACHE_NAME = 'chess-game-cache-v1';
const urlsToCache = [
    '/',
    '/chess.html',
    '/chess.css',
    '/Game.js',
    '/Board.js',
    '/server.js',
    '/data.js',
    '/piece.js',
    '/ai.js',
    '/SimulationGame.js',
    '/History.js',
    '/manifest.json',
    '/img/white-rook.webp',
    '/img/white-queen.webp',
    '/img/white-pawn.webp',
    '/img/white-knight.webp',
    '/img/white-king.webp',
    '/img/white-bishop.webp',
    '/img/black-rook.webp',
    '/img/black-queen.webp',
    '/img/black-pawn.webp',
    '/img/black-knight.webp',
    '/img/black-king.webp',
    '/img/black-bishop.webp'
    // Add paths to your icon images here once they are added to img/icons/
    // '/img/icons/icon-192x192.png',
    // '/img/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
}); 