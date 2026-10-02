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

                // Request Push Subscription if user is logged in
                const user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
                if (user) {
                    PWA.subscribeToPush(reg, user.id);
                }
            } catch (err) {
                console.error('❌ ServiceWorker registration failed:', err);
            }
        }
        
        // 3. Monitor Network Status
        window.addEventListener('online', PWA.updateOnlineStatus);
        window.addEventListener('offline', PWA.updateOnlineStatus);
        
        // Initial setup
        PWA.updateOnlineStatus();
        PWA.overrideFetch();

        if (PWA.isOnline) {
            PWA.syncQueue();
        }
    },
    
    overrideFetch: () => {
        if (!window.originalFetch) {
            window.originalFetch = window.fetch;
            window.fetch = async (input, init) => {
                const method = init?.method || 'GET';
                let response;
                
                if (method.toUpperCase() === 'GET') {
                    response = await window.originalFetch(input, init);
                } else {
                    response = await PWA.safeFetch(input, init);
                }

                if (response && response.status === 401 && typeof Auth !== 'undefined') {
                    const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
                    if (!urlStr.includes('/api/login') && !urlStr.includes('/api/notifications')) {
                        Auth.logout();
                    }
                }
                return response;
            };
        }
    },

    initDB: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('DisciplinePWA', 1);
            request.onerror = () => reject('IndexedDB error');
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
                PWA.syncQueue();
            } else {
                badge.style.display = 'flex';
                badge.innerHTML = '<i class="bx bx-wifi-off"></i> Offline Mode';
            }
        }
    },
    
    safeFetch: async (url, options = {}) => {
        try {
            const response = await window.originalFetch(url, options);
            if (!response.ok && response.status !== 401) throw new Error('API Error');
            return response;
        } catch (error) {
            if (!PWA.isOnline || error.message.includes('Failed to fetch')) {
                await PWA.queueRequest(url, options);
                return { 
                    ok: true, 
                    json: async () => ({ success: true, queued: true, message: 'Stored offline.' }) 
                };
            }
            throw error;
        }
    },
    
    queueRequest: (url, options) => {
        return new Promise((resolve, reject) => {
            const transaction = PWA.db.transaction(['sync-queue'], 'readwrite');
            const store = transaction.objectStore('sync-queue');
            const reqStr = {
                url,
                method: options.method || 'POST',
                headers: options.headers || {},
                body: options.body,
                timestamp: new Date().toISOString()
            };
            const request = store.add(reqStr);
            request.onsuccess = () => resolve();
            request.onerror = () => reject();
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
            for (const item of queue) {
                try {
                    const res = await fetch(item.url, {
                        method: item.method,
                        headers: item.headers,
                        body: item.body
                    });
                    if (res.ok) {
                        const delTx = PWA.db.transaction(['sync-queue'], 'readwrite');
                        delTx.objectStore('sync-queue').delete(item.id);
                    }
                } catch (err) { break; }
            }
        };
    },

    subscribeToPush: async (registration, userId) => {
        try {
            // 1. Fetch the public key from the server (instead of hardcoding)
            const keyRes = await fetch('/api/push/key');
            const { publicKey } = await keyRes.json();
            
            if (!publicKey) throw new Error("Public key not found");

            // 2. Check existing subscription
            let subscription = await registration.pushManager.getSubscription();
            
            // 3. If no subscription, or it's different, re-subscribe
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: PWA.urlBase64ToUint8Array(publicKey)
                });
                console.log('✨ New Push Subscription created');
            }

            // 4. Always sync with server to ensure user_id is up to date for this device
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription,
                    user_id: userId
                })
            });

        } catch (err) {
            console.warn('⚠️ Push subscription issue:', err.message);
        }
    },

    urlBase64ToUint8Array: (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};

document.addEventListener('DOMContentLoaded', PWA.init);
