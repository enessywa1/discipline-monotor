const CACHE_NAME = 'discipline-pwa-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/css/style.css',
    '/css/sidebar.css',
    '/css/recent_submissions.css',
    '/css/loader.css',
    '/css/about.css',
    '/img/logo.png',
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
    const url = new URL(e.request.url);

    // 1. API GET Requests - Network First, fallback to cache
    if (url.pathname.startsWith('/api') && e.request.method === 'GET') {
        e.respondWith(
            fetch(e.request).then((response) => {
                // If valid response, clone and cache it
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, response.clone());
                    return response;
                });
            }).catch(() => {
                // If network fails, serve from cache
                return caches.match(e.request);
            })
        );
        return;
    }

    // 2. API POST/PUT/DELETE - Let the browser handle it (PWA.safeFetch intercepts failures front-end)
    if (url.pathname.startsWith('/api') && e.request.method !== 'GET') {
        return; 
    }

    // 3. Static Assets - Cache First, fallback to network
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(e.request).then((response) => {
                // Ignore caching external resources dynamically since we didn't list them
                // Or we can cache them dynamically too
                return caches.open(CACHE_NAME).then((cache) => {
                    // Just cache it dynamically
                    if (e.request.url.startsWith('http') && response.ok) {
                        cache.put(e.request, response.clone());
                    }
                    return response;
                });
            });
        }).catch(() => {
             // Fallback if network and cache fail (for navigation requests)
             if (e.request.mode === 'navigate') {
                 return caches.match('/dashboard.html');
             }
        })
    );
});
