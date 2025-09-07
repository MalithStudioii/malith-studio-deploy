const CACHE_NAME = 'malith-studio-cache-v1';
const URLS_TO_CACHE = [
  '/Malith-Studio/',
  '/Malith-Studio/index.html',
  '/Malith-Studio/blog.html',
  '/Malith-Studio/voicetype.html',
  '/Malith-Studio/imagetotext.html',
  '/Malith-Studio/textsummarizer.html',
  '/Malith-Studio/todolist.html',
  '/Malith-Studio/qrcodegenerator.html',
  '/Malith-Studio/passwordgenerator.html',
  '/Malith-Studio/presentationideagenerator.html',
  '/Malith-Studio/fontconverter.html',
  '/Malith-Studio/socialpostgenerator.html',
  '/Malith-Studio/resume-builder.html',
  '/Malith-Studio/privacy.html',
  '/Malith-Studio/logo.jpg',
  '/Malith-Studio/logo-192.png',
  '/Malith-Studio/logo-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
