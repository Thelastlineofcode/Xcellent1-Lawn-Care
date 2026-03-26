// Service Worker for Xcellent1 Lawn Care PWA
// Provides offline support and caching for static assets

const CACHE_NAME = "xcellent1-v1.0.0";
const STATIC_ASSETS = [
  "/",
  "index.html",
  "dashboard.html",
  "styles.clean.css",
  "app.js",
  "manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API requests
  if (url.pathname.startsWith("/api/")) {
    return event.respondWith(fetch(request));
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        console.log("[SW] Serving from cache:", url.pathname);
        return cached;
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch((err) => {
          console.error("[SW] Fetch failed:", err);
          // Return offline page if available
          return caches.match("offline.html");
        });
    }),
  );
});

// Background sync for failed form submissions (future enhancement)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-leads") {
    console.log("[SW] Syncing leads...");
    event.waitUntil(
      // Implement retry logic for cached form submissions
      Promise.resolve(),
    );
  }
});
