/* sw.js: lets the installed app open offline.
   The game page is fetched from the network first (so updates arrive as soon as they are pushed)
   and falls back to the saved copy when offline. Icons and the font are served from the cache.
   build.py replaces __BUILD__ with a hash of the game, so each new build replaces the old cache. */
const CACHE = "memoriter-__BUILD__";
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("memoriter-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/index.html");
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (isPage) {
    // Network first, so a pushed update shows up; offline → the saved copy (whatever the ?settings).
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put("./", copy)); return res;
    }).catch(() => caches.match("./")));
  } else if (isFont || url.origin === location.origin) {
    // Cache first, refreshed in the background.
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") caches.open(CACHE).then(c => c.put(req, res.clone())); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
