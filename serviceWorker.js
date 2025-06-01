// serviceWorker.js - Service Worker for KAJISU game music caching

const CACHE_NAME = 'kajisu-music-cache-v1';
const MUSIC_CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds

// Install event - set up the cache
self.addEventListener('install', function (event) {
    console.log('🎵 Service Worker installing...');
    self.skipWaiting(); // Take control immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', function (event) {
    console.log('🎵 Service Worker activating...');
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    // Delete old cache versions
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function () {
            return self.clients.claim(); // Take control of all pages
        })
    );
});

// Fetch event - intercept network requests
self.addEventListener('fetch', function (event) {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle music files (MP3s in music folder or from GitHub Pages)
    if ((url.pathname.includes('/music/') || url.hostname.includes('github.io')) &&
        (url.pathname.endsWith('.mp3') || url.pathname.includes('track-'))) {
        event.respondWith(handleMusicRequest(request));
    }
    // Let other requests (HTML, JS, CSS, etc.) go through normally
});

async function handleMusicRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Check if we have a cached version
    if (cachedResponse) {
        // Check if cache is still fresh
        const cacheDate = cachedResponse.headers.get('sw-cache-date');
        if (cacheDate) {
            const age = Date.now() - parseInt(cacheDate);
            if (age < MUSIC_CACHE_DURATION) {
                console.log('🎵 Serving cached music:', request.url.split('/').pop());
                return cachedResponse;
            } else {
                console.log('⏰ Cache expired for:', request.url.split('/').pop());
                // Remove expired entry
                await cache.delete(request);
            }
        }
    }

    // Not cached or expired - fetch from network
    try {
        console.log('⬇️ Downloading music:', request.url.split('/').pop());
        const response = await fetch(request);

        // Only cache successful responses
        if (response.ok) {
            // Clone the response (we can only read it once)
            const responseToCache = response.clone();

            // Add timestamp header for cache expiration
            const responseWithTimestamp = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: {
                    ...Object.fromEntries(responseToCache.headers.entries()),
                    'sw-cache-date': Date.now().toString()
                }
            });

            // Cache the response
            await cache.put(request, responseWithTimestamp);
            console.log('💾 Cached music:', request.url.split('/').pop());
        }

        return response;
    } catch (error) {
        console.error('❌ Failed to fetch music:', request.url.split('/').pop(), error);

        // If network fails and we have an expired cache, return it anyway
        if (cachedResponse) {
            console.log('🔄 Network failed, serving expired cache:', request.url.split('/').pop());
            return cachedResponse;
        }

        // Return a network error response
        return new Response('Network error', { status: 503 });
    }
}

// Optional: Message handling for debugging
self.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'GET_CACHE_STATUS') {
        getCacheStatus().then(status => {
            event.ports[0].postMessage(status);
        });
    }
});

// Helper function to get cache status (for debugging)
async function getCacheStatus() {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();

    const musicFiles = requests.filter(req =>
        req.url.includes('/music/') || req.url.includes('track-')
    );

    return {
        totalCachedTracks: musicFiles.length,
        cacheNames: musicFiles.map(req => {
            const url = new URL(req.url);
            return url.pathname.split('/').pop();
        })
    };
}