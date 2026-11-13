/**
 * JobSearch Service Worker v5
 * Network-first for HTML/CSS/JS/JSON so UI updates apply immediately, with full offline fallback.
 */

const CACHE_NAME = "jobsearch-cache-v30";

const STATIC_ASSETS = [
  "./",
  "index.html",
  "404.html",
  "manifest.json",
  "favicon.svg",
  "favicon.ico",
  "apple-touch-icon.png",
  "assets/logo-field-19jt.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable.png",
  "assets/icons/apple-touch-icon.png",
  "css/main.css",
  "css/components.css",
  "js/pageview.js",
  "js/theme-engine.js",
  "js/auth-quota.js",
  "js/auto-email-apply.js",
  "js/job-comparator.js",
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

  // 1. Data Feeds Dinamis & Code Assets (.json, .css, .js): Network-First dengan Cache Fallback
  const isCodeOrFeed =
    url.pathname.includes("/data/") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (isCodeOrFeed && !url.pathname.endsWith("manifest.json")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  // 2. Navigasi Halaman HTML: Network-First with Stale Cache Fallback -> Offline Screen Fallback
  const isHtmlRequest =
    event.request.mode === "navigate" ||
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
          const cached = await caches.match(event.request, { ignoreSearch: true });
          if (cached) return cached;

          const offlinePage =
            (await caches.match("pages/offline.html")) ||
            (await caches.match("/pages/offline.html"));
          if (offlinePage) return offlinePage;

          return caches.match("index.html") || caches.match("./");
        })
    );
    return;
  }

  // 3. Aset Media/Font/Ikon: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
