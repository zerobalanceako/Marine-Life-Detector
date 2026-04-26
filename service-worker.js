const CACHE_NAME = "marine-ai-cache-v1";
const BASE_PATH = "/Marine-Life-Detector/";

// Files to cache
const ASSETS = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json",
  BASE_PATH + "model.json",
  BASE_PATH + "metadata.json",
  BASE_PATH + "weights.bin",

  // your real icons
  BASE_PATH + "web-app-manifest-192.png",
  BASE_PATH + "web-app-manifest-512.png"
];

// Install: cache essential files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[SW] Caching core assets");
        return cache.addAll(ASSETS);
      })
      .catch(err => {
        console.error("[SW] Cache failed:", err);
      })
  );
  self.skipWaiting(); // activate immediately
});

// Activate: clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first strategy
self.addEventListener("fetch", event => {
  const request = event.request;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          // Optionally cache new requests (like images)
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Optional fallback (only if you add one)
          if (request.mode === "navigate") {
            return caches.match(BASE_PATH + "index.html");
          }
        });
    })
  );
});
