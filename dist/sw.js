/* sw.js: makes the game open fast and work offline.
   Everything, the game page included, is served from the saved copy straight away and refreshed in
   the background. So opening never waits for the network (a weak signal can't slow it down), and a
   pushed update shows up on the next open. The first visit, with nothing saved yet, uses the network.
   build.py replaces 7fa389008c with a hash of the game, so each new build replaces the old cache. */
const CACHE = "memoriter-7fa389008c";
const FONT_FILES = ["./fonts/andika-700-latin.woff2"];       // filled by build.py: the font (assets/fonts/)
const OPENMOJI_FILES = ["./openmoji/1F308.svg", "./openmoji/1F30A.svg", "./openmoji/1F319.svg", "./openmoji/1F327.svg", "./openmoji/1F333.svg", "./openmoji/1F335.svg", "./openmoji/1F338.svg", "./openmoji/1F342.svg", "./openmoji/1F344.svg", "./openmoji/1F347.svg", "./openmoji/1F349.svg", "./openmoji/1F34A.svg", "./openmoji/1F34B.svg", "./openmoji/1F34C.svg", "./openmoji/1F34D.svg", "./openmoji/1F34E.svg", "./openmoji/1F350.svg", "./openmoji/1F351.svg", "./openmoji/1F352.svg", "./openmoji/1F353.svg", "./openmoji/1F401.svg", "./openmoji/1F404.svg", "./openmoji/1F405.svg", "./openmoji/1F407.svg", "./openmoji/1F408.svg", "./openmoji/1F40A.svg", "./openmoji/1F40C.svg", "./openmoji/1F40D.svg", "./openmoji/1F40E.svg", "./openmoji/1F410.svg", "./openmoji/1F411.svg", "./openmoji/1F412.svg", "./openmoji/1F413.svg", "./openmoji/1F415.svg", "./openmoji/1F416.svg", "./openmoji/1F418.svg", "./openmoji/1F419.svg", "./openmoji/1F41B.svg", "./openmoji/1F41C.svg", "./openmoji/1F41D.svg", "./openmoji/1F41E.svg", "./openmoji/1F41F.svg", "./openmoji/1F420.svg", "./openmoji/1F421.svg", "./openmoji/1F422.svg", "./openmoji/1F425.svg", "./openmoji/1F427.svg", "./openmoji/1F42C.svg", "./openmoji/1F433.svg", "./openmoji/1F436.svg", "./openmoji/1F43B.svg", "./openmoji/1F43C.svg", "./openmoji/1F54A.svg", "./openmoji/1F577.svg", "./openmoji/1F95D.svg", "./openmoji/1F980.svg", "./openmoji/1F981.svg", "./openmoji/1F983.svg", "./openmoji/1F985.svg", "./openmoji/1F986.svg", "./openmoji/1F988.svg", "./openmoji/1F989.svg", "./openmoji/1F98B.svg", "./openmoji/1F98D.svg", "./openmoji/1F98E.svg", "./openmoji/1F98F.svg", "./openmoji/1F991.svg", "./openmoji/1F992.svg", "./openmoji/1F993.svg", "./openmoji/1F997.svg", "./openmoji/1F99A.svg", "./openmoji/1F99B.svg", "./openmoji/1F99C.svg", "./openmoji/1F99E.svg", "./openmoji/1F99F.svg", "./openmoji/1F9A2.svg", "./openmoji/1F9A8.svg", "./openmoji/1F9A9.svg", "./openmoji/1F9AD.svg", "./openmoji/1FAB0.svg", "./openmoji/1FAB1.svg", "./openmoji/1FAB2.svg", "./openmoji/2600.svg", "./openmoji/2601.svg", "./openmoji/26A1.svg", "./openmoji/2744.svg", "./openmoji/2B50.svg"];   // filled by build.py: every OpenMoji drawing, so pictures work offline
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
