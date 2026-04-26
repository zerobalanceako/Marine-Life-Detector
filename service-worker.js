const CACHE_NAME = "marine-life-cache-v2";
const BASE_PATH = "/Marine-Life-Detector/";

// Core stable files ONLY
const ASSETS = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json",

  BASE_PATH + "model.json",
  BASE_PATH + "metadata.json",
  BASE_PATH + "weights.bin",
  BASE_PATH + "icon192.png",
  BASE_PATH + "icon512.png",
];

// INSTALL
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

// ACTIVATE
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

// FETCH
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) return response;

          const clone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });

          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match(BASE_PATH + "index.html");
          }
        });
    })
  );
});
