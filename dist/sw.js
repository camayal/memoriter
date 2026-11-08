/* sw.js: lets the installed app open offline.
   The game page is fetched from the network first (so updates arrive as soon as they are pushed)
   and falls back to the saved copy when offline. Icons and the font are served from the cache.
   build.py replaces 8b57f79031 with a hash of the game, so each new build replaces the old cache. */
const CACHE = "memoriter-8b57f79031";
const OPENMOJI_FILES = ["./openmoji/1F308.svg", "./openmoji/1F30A.svg", "./openmoji/1F319.svg", "./openmoji/1F327.svg", "./openmoji/1F333.svg", "./openmoji/1F335.svg", "./openmoji/1F338.svg", "./openmoji/1F342.svg", "./openmoji/1F344.svg", "./openmoji/1F347.svg", "./openmoji/1F349.svg", "./openmoji/1F34A.svg", "./openmoji/1F34B.svg", "./openmoji/1F34C.svg", "./openmoji/1F34D.svg", "./openmoji/1F34E.svg", "./openmoji/1F350.svg", "./openmoji/1F351.svg", "./openmoji/1F352.svg", "./openmoji/1F353.svg", "./openmoji/1F401.svg", "./openmoji/1F404.svg", "./openmoji/1F407.svg", "./openmoji/1F408.svg", "./openmoji/1F40A.svg", "./openmoji/1F40C.svg", "./openmoji/1F40D.svg", "./openmoji/1F40E.svg", "./openmoji/1F410.svg", "./openmoji/1F411.svg", "./openmoji/1F413.svg", "./openmoji/1F414.svg", "./openmoji/1F415.svg", "./openmoji/1F416.svg", "./openmoji/1F418.svg", "./openmoji/1F419.svg", "./openmoji/1F41B.svg", "./openmoji/1F41C.svg", "./openmoji/1F41D.svg", "./openmoji/1F41E.svg", "./openmoji/1F41F.svg", "./openmoji/1F420.svg", "./openmoji/1F421.svg", "./openmoji/1F422.svg", "./openmoji/1F424.svg", "./openmoji/1F427.svg", "./openmoji/1F42C.svg", "./openmoji/1F42F.svg", "./openmoji/1F433.svg", "./openmoji/1F435.svg", "./openmoji/1F436.svg", "./openmoji/1F43B.svg", "./openmoji/1F43C.svg", "./openmoji/1F54A.svg", "./openmoji/1F577.svg", "./openmoji/1F95D.svg", "./openmoji/1F980.svg", "./openmoji/1F981.svg", "./openmoji/1F983.svg", "./openmoji/1F985.svg", "./openmoji/1F986.svg", "./openmoji/1F988.svg", "./openmoji/1F989.svg", "./openmoji/1F98B.svg", "./openmoji/1F98D.svg", "./openmoji/1F98E.svg", "./openmoji/1F98F.svg", "./openmoji/1F991.svg", "./openmoji/1F992.svg", "./openmoji/1F993.svg", "./openmoji/1F997.svg", "./openmoji/1F99A.svg", "./openmoji/1F99B.svg", "./openmoji/1F99C.svg", "./openmoji/1F99E.svg", "./openmoji/1F99F.svg", "./openmoji/1F9A2.svg", "./openmoji/1F9A8.svg", "./openmoji/1F9A9.svg", "./openmoji/1F9AD.svg", "./openmoji/1FAB0.svg", "./openmoji/1FAB1.svg", "./openmoji/1FAB2.svg", "./openmoji/2600.svg", "./openmoji/2601.svg", "./openmoji/26A1.svg", "./openmoji/2744.svg", "./openmoji/2B50.svg"];   // filled by build.py: every OpenMoji drawing, so pictures work offline
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", ...OPENMOJI_FILES];

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
