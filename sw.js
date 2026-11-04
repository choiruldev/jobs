/**
 * JobSearch Service Worker v4
 * Advanced caching, offline fallback screen, and instant update lifecycle.
 */

const CACHE_NAME = "jobsearch-cache-v12";

const STATIC_ASSETS = [
  "./",
  "index.html",
  "404.html",
  "manifest.json",
  "data/jobs.json",
  "favicon.svg",
  "favicon.ico",
  "apple-touch-icon.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable.png",
  "assets/icons/apple-touch-icon.png",
  "css/main.css",
  "css/components.css",
  "js/pageview.js",
  "js/pwa-prompt.js",
  "js/beta-feedback.js",
  "js/data.js",
  "js/providers.js",
  "js/search.js",
  "js/apply.js",
  "js/bookmark.js",
  "js/schema.js",
  "js/storage-db.js",
  "js/backup-sync.js",
  "js/share.js",
  "pages/offline.html",
  "pages/search.html",
  "pages/bookmarks.html",
  "pages/apply.html",
  "pages/insights.html",
  "pages/companies.html",
  "pages/resume-builder.html",
  "pages/interview-prep.html",
  "pages/salary-benchmark.html",
  "pages/contract-guide.html",
  "pages/invoice-generator.html",
  "pages/portfolio-card.html",
  "pages/alerts.html",
  "pages/skills-roadmap.html",
  "pages/code-sandbox.html",
  "pages/salary-submit.html",
  "pages/privacy-policy.html",
  "pages/terms.html",
  "pages/detail.html"
];

// Install Event: Precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Sebagian aset statis gagal di-precache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches & claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Listen for messages from client (e.g. skipWaiting trigger)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch Event: Smart routing strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jangan sentuh API pihak ketiga atau request selain GET
  if (event.request.method !== "GET" || url.origin !== location.origin) {
    return;
  }

  // 1. Data Feeds Dinamis (data/jobs.json dsb): Network-First dengan Cache Fallback
  if (url.pathname.includes("/data/") || url.pathname.endsWith(".json")) {
    if (url.pathname.endsWith("manifest.json")) {
      // Manifest gunakan Stale-While-Revalidate agar selalu sinkron
    } else {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const cloned = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }
  }

  // 2. Navigasi Halaman HTML: Network-First with Stale Cache Fallback -> Offline Screen Fallback
  const isHtmlRequest = event.request.mode === "navigate" || 
                        event.request.headers.get("accept")?.includes("text/html");

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(async () => {
          // Cari di cache terlebih dahulu
          const cached = await caches.match(event.request);
          if (cached) return cached;

          // Jika benar-benar offline dan halaman belum dicache, sajikan halaman offline
          const offlinePage = await caches.match("pages/offline.html") || 
                              await caches.match("/pages/offline.html");
          if (offlinePage) return offlinePage;

          // Terakhir, fallback ke index
          return caches.match("index.html") || caches.match("./");
        })
    );
    return;
  }

  // 3. Aset Statis (CSS, JS, Gambar): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => null);

      return cached || fetchPromise;
    })
  );
});
