const CACHE_NAME = 'homework-counter-cache-v1';
const urlsToCache = [
  '.index.html',
  '.style.css',
  '.app.js',
  '.manifest.json',
  'httpscdn.jsdelivr.netnpm@tensorflowtfjs@3.3.0',
  'httpscdn.jsdelivr.netnpm@tensorflow-modelscoco-ssd'
];

self.addEventListener('install', event = {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache = {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event = {
  event.respondWith(
    caches.match(event.request)
      .then(response = {
        return response  fetch(event.request);
      })
  );
});
