// medbasha - TaskMaster Service Worker v3.5.0
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Configuración de Firebase propia de TU PROYECTO TaskMaster
firebase.initializeApp({
  apiKey: "AIzaSyAelzQOy8KFQ5OZkctKJS2DZUaxvaLMfRE",
  authDomain: "taskmastercalendar-a779e.firebaseapp.com",
  databaseURL: "https://taskmastercalendar-a779e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taskmastercalendar-a779e",
  storageBucket: "taskmastercalendar-a779e.firebasestorage.app",
  messagingSenderId: "628005433300",
  appId: "1:628005433300:web:b6a39ed06922a34de07041"
});

const messaging = firebase.messaging();

// Handler para recibir notificaciones Push con la app cerrada / en segundo plano
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Aviso de TaskMaster';
  const options = {
    body: payload.notification?.body || 'Tienes una nueva tarea o recordatorio.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});

const CACHE_NAME = 'taskmaster-v3-5-0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a Firebase / CDNs externas para no interferir con la nube
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        return client.focus();
      }
      return clients.openWindow('./index.html');
    })
  );
});
