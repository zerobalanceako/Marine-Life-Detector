const CACHE_NAME = "marine-life-cache-v1";
const BASE_PATH = "/Marine-Life-Detector/";

// Core files that exist in your repo
const ASSETS = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json",

  BASE_PATH + "model.json",
  BASE_PATH + "metadata.json",
  BASE_PATH + "weights.bin",

  BASE_PATH + "web-app-manifest-192.png",
  BASE_PATH + "web-app-manifest-512.png"
];

// INSTALL: cache assets safely (no crash on missing file)
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      for (const url of ASSETS) {
        try {
          const response = await fetch(url);

          if (!response.ok) {
            console.warn("[SW] Missing:", url);
            continue;
          }

          await cache.put(url, response.clone());
          console.log("[SW] Cached:", url);

        } catch (err) {
          console.warn("[SW] Failed:", url, err);
        }
      }
    })()
  );

  self.skipWaiting();
});

// ACTIVATE: remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH: cache-first strategy
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // only cache valid responses
          if (!response || response.status !== 200) {
            return response;
          }

          const clone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });

          return response;
        })
        .catch(() => {
          // fallback for navigation
          if (event.request.mode === "navigate") {
            return caches.match(BASE_PATH + "index.html");
          }
        });
    })
  );
});
