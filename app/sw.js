/* sw.js: makes the game open fast and work offline.
   Everything, the game page included, is served from the saved copy straight away and refreshed in
   the background. So opening never waits for the network (a weak signal can't slow it down), and a
   pushed update shows up on the next open. The first visit, with nothing saved yet, uses the network.
   build.py replaces __BUILD__ with a hash of the game, so each new build replaces the old cache. */
const CACHE = "memoriter-__BUILD__";
const FONT_FILES = [];       // filled by build.py: the font (assets/fonts/)
const OPENMOJI_FILES = [];   // filled by build.py: every OpenMoji drawing, so pictures work offline
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", ...FONT_FILES];

self.addEventListener("install", e => {
  // Only what the first screen needs blocks the install; the pictures are saved afterwards.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("memoriter-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
  // Not waited on, so requests are never held up: the pictures are saved quietly in the background
  // (any picture shown before then is saved when it is used).
  caches.open(CACHE).then(c => c.addAll(OPENMOJI_FILES)).catch(() => {});
});

// Saved copy first (if any), with a background refresh that updates it for next time.
function fromCache(e, req, key) {
  const net = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return res;
  });
  e.respondWith(caches.match(key).then(hit => {
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/index.html");
  // Every address of the page (whatever the ?settings) shares one saved copy.
  fromCache(e, req, isPage ? "./" : req);
});
