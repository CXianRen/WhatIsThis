// Bump this version whenever publishing changed application files.
const VERSION = "0.2.0";
const BASE = new URL("./", self.location.href);
const CACHE_PREFIX = `aidict-shell:${encodeURIComponent(BASE.href)}:`;
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const SHELL_FILES = [
  "index.html",
  "manifest.webmanifest",
  "static/css/app.css",
  "static/js/app.js",
  "static/js/youglish.js",
  "static/js/wordbook-store.js",
  "static/js/wordbook.js",
  "static/js/pwa.js",
  "static/favicon.svg",
  "static/flags/gb.svg",
  "static/flags/se.svg",
  "static/flags/nl.svg",
  "static/flags/fr.svg",
  "static/flags/cn.svg",
  "static/icons/icon-192.png",
  "static/icons/icon-512.png",
  "static/icons/maskable-512.png",
  "static/icons/apple-touch-icon.png",
];
const SHELL_URLS = new Set(SHELL_FILES.map((path) => new URL(path, BASE).href));
const INDEX_URL = new URL("index.html", BASE).href;

self.addEventListener("install", (event) => {
  // addAll commits the complete shell together. A failed download leaves the
  // previous worker active. Third-party scripts, captions and videos stay online.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(
    [...SHELL_URLS].map((url) => new Request(url, { cache: "reload" })),
  )));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    // Claim the first opened page too, so it can reload offline after caching.
    // IndexedDB and caches belonging to other GitHub Pages projects are untouched.
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== BASE.origin) return;
  url.search = "";
  url.hash = "";

  const isAppPage = request.mode === "navigate"
    && (url.href === BASE.href || url.href === INDEX_URL);
  if (!isAppPage && !SHELL_URLS.has(url.href)) return;

  // Keep HTML and modules from the same installed version until the user updates.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(isAppPage ? INDEX_URL : url.href);
    return cached || fetch(request);
  })());
});
