const CACHE_NAME = 'discipline-pwa-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/css/style.css',
    '/css/sidebar.css',
    '/css/recent_submissions.css',
    '/css/loader.css',
    '/css/about.css',
    '/img/app-icon.png',
    '/js/app.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/tasks.js',
    '/js/statements.js',
    '/js/discipline_form.js',
    '/js/reports.js',
    '/js/general_reports.js',
    '/js/standings.js',
    '/js/announcements.js',
    '/js/users.js',
    '/js/detentions.js',
    '/js/suspensions.js',
    '/js/recent_submissions.js',
    '/js/about.js',
    '/js/loader.js',
    '/js/pwa.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline page');
            // We can ignore some external failures safely, so we map add one by one
            return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Only intercept GET requests, ignore POST/PUT/DELETE
    if (e.request.method !== 'GET') return;

    // Network-First Strategy 
    // Always try to fetch the freshest version from the server.
    // If successful, save a copy to the cache. If offline, serve the cached copy.
    e.respondWith(
        fetch(e.request).then((response) => {
            // Clone the response because it can only be consumed once
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                // Only cache valid http/https requests
                if (e.request.url.startsWith('http') && response.ok) {
                    cache.put(e.request, clonedResponse);
                }
            });
            return response;
        }).catch(() => {
            // Network request failed, user is offline. Fallback to cache.
            return caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse; // Return the offline cached version
                }
                // Ultimate fallback for missing HTML pages
                if (e.request.mode === 'navigate') {
                    return caches.match('/dashboard.html');
                }
            });
        })
    );
});
