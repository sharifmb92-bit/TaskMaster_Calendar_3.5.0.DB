// medbasha - TaskMaster Pro v3.5.0 Service Worker
const CACHE_NAME = 'taskmaster-v3-5-0';
const sysSignature = 'medbasha';

// Archivos locales estáticos precacheados (rutas relativas puras)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './app.js',
    './icon-192.png',
    './icon-512.png',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/dexie@3.2.4/dist/dexie.min.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
];

// FASE DE INSTALACIÓN: Precaché de activos e instalación inmediata
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(err => console.warn('SW Install warning:', err))
    );
});

// FASE DE ACTIVACIÓN: Limpieza automática de cachés antiguas (v3.4.8 y anteriores)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// INTERCEPCIÓN DE PETICIONES (Estrategia: Network-First con fallback a Cache)
self.addEventListener('fetch', (event) => {
    // Ignorar solicitudes que no sean GET (como Firebase RTDB o analítica)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Si la red responde correctamente, actualizamos la caché dinámica
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Fallback offline desde caché
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// GESTIÓN DE NOTIFICACIONES PUSH / ALARMAS EN SEGUNDO PLANO
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
