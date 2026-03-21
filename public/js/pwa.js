// pwa.js - Handles Service Worker Registration, Offline State, and Background Sync Queue

const PWA = {
    db: null,
    isOnline: window.navigator.onLine,
    
    init: async () => {
        // 1. Initialize IndexedDB for Sync Queue
        await PWA.initDB();
        
        // 2. Register Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('/service-worker.js');
                console.log('✅ ServiceWorker registered with scope:', reg.scope);
            } catch (err) {
                console.error('❌ ServiceWorker registration failed:', err);
            }
        }
        
        // 3. Monitor Network Status
        window.addEventListener('online', PWA.updateOnlineStatus);
        window.addEventListener('offline', PWA.updateOnlineStatus);
        
        // Initial setup
        PWA.updateOnlineStatus();

        // Setup Fetch Interceptor
        PWA.overrideFetch();

        // Check if there are queued requests to sync
        if (PWA.isOnline) {
            PWA.syncQueue();
        }
    },
    
    overrideFetch: () => {
        if (!window.originalFetch) {
            window.originalFetch = window.fetch;
            window.fetch = async (input, init) => {
                const method = init?.method || 'GET';
                if (method.toUpperCase() === 'GET') {
                    return window.originalFetch(input, init);
                }
                // Route all POST/PUT/DELETE through offline safeFetch
                return PWA.safeFetch(input, init);
            };
        }
    },

    initDB: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('DisciplinePWA', 1);
            request.onerror = (e) => reject('IndexedDB error');
            request.onsuccess = (e) => {
                PWA.db = e.target.result;
                resolve();
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('sync-queue')) {
                    db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    },
    
    updateOnlineStatus: () => {
        PWA.isOnline = window.navigator.onLine;
        const badge = document.getElementById('offline-badge');
        
        if (badge) {
            if (PWA.isOnline) {
                badge.style.display = 'none';
                badge.innerHTML = '<i class="bx bx-wifi"></i> Online';
                badge.style.background = '#4caf50';
                
                // Show a brief toast or keep hidden
                PWA.syncQueue(); // Attempt to sync when back online
            } else {
                badge.style.display = 'flex';
                badge.innerHTML = '<i class="bx bx-wifi-off"></i> Offline (Saving Locally)';
                badge.style.background = '#d32f2f';
            }
        }
    },
    
    // Core function to replace standard fetch() for POST/PUT/DELETE
    safeFetch: async (url, options = {}) => {
        try {
            // Try network first
            const response = await window.originalFetch(url, options);
            if (!response.ok) throw new Error('API Error');
            return response;
        } catch (error) {
            // If offline, or network fails, queue the request
            if (!PWA.isOnline || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.warn('Network offline or failed. Queuing request for:', url);
                
                // Save to IndexedDB
                await PWA.queueRequest(url, options);
                
                // Return a fake Response object to trick the frontend UI into thinking it saved
                return { 
                    ok: true, 
                    json: async () => ({ success: true, queued: true, warning: 'Saved locally for offline mode.' }) 
                };
            }
            throw error;
        }
    },
    
    queueRequest: (url, options) => {
        return new Promise((resolve, reject) => {
            if (!PWA.db) return reject('DB not initialized');
            const transaction = PWA.db.transaction(['sync-queue'], 'readwrite');
            const store = transaction.objectStore('sync-queue');
            
            // Extract useful JSON payload if possible
            let payload = options.body;
            if (typeof payload === 'string' && payload.startsWith('{')) {
                try { payload = JSON.parse(payload); } catch(e) {}
            }

            const reqStr = {
                url,
                method: options.method || 'GET',
                headers: options.headers || {},
                body: payload,
                timestamp: new Date().toISOString()
            };
            
            const request = store.add(reqStr);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject();
        });
    },
    
    syncQueue: async () => {
        if (!PWA.db || !PWA.isOnline) return;
        
        const transaction = PWA.db.transaction(['sync-queue'], 'readonly');
        const store = transaction.objectStore('sync-queue');
        const getAll = store.getAll();
        
        getAll.onsuccess = async (e) => {
            const queue = e.target.result;
            if (queue.length === 0) return;
            
            console.log(`🔄 Attempting to sync ${queue.length} offline requests...`);
            
            let syncedCount = 0;
            for (const item of queue) {
                try {
                    const ops = {
                        method: item.method,
                        headers: item.headers,
                    };
                    if (item.body) ops.body = JSON.stringify(item.body);
                    
                    const res = await fetch(item.url, ops);
                    if (res.ok) {
                        // Success - remove from queue
                        const delTx = PWA.db.transaction(['sync-queue'], 'readwrite');
                        delTx.objectStore('sync-queue').delete(item.id);
                        syncedCount++;
                    }
                } catch (err) {
                    console.error('Failed to sync item:', item, err);
                    break;
                }
            }
            
            if (syncedCount > 0) {
                // Refresh the views if we successfully synced items
                if (typeof App !== 'undefined' && App.renderView) {
                    const hash = window.location.hash.substring(1) || 'dashboard';
                    App.renderView(hash);
                }
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', PWA.init);
