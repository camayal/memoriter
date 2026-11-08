"use strict";
/* config.js: everything read from the URL, plus small shared helpers.
   Loaded first; every other file may use these names. */

/* Settings = the address (URLQ) on top of the defaults saved on this device in the setup screen
   (localStorage "memoriter-defaults"). Everything reads Q, so a saved default such as from=10 applies
   whenever the address doesn't say otherwise. Whether the game is fixed (THEME_GIVEN) is decided by
   the address only: saved defaults never lock the game, they only shape what each tile plays. */
const URLQ = new URLSearchParams(location.search);
const SAVED_DEFAULTS = (() => { try { return JSON.parse(localStorage.getItem("memoriter-defaults") || "{}") || {}; } catch { return {}; } })();
const Q = (() => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(SAVED_DEFAULTS)) if (v !== "" && v != null) q.set(k, String(v));
  for (const k of new Set(URLQ.keys())) { q.delete(k); for (const v of URLQ.getAll(k)) q.append(k, v); }
  return q;
})();
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };
const list = k => Q.getAll(k).flatMap(v => v.split(",")).map(s => s.trim()).filter(Boolean);

/* Language: "es", "es-MX", "spanish", "español" … all work. LANG is the 2-letter code used for
   built-in words; LANG_TAG is the full tag used to pick a voice. */
const LANG_ALIASES = { spanish: "es", espanol: "es", "español": "es", english: "en", ingles: "en", "inglés": "en" };
/* Language: lang= in the address wins (parent-made links); otherwise the language last chosen with
   the EN · ES switch on this device; otherwise English. It can change while the game runs
   (switchLanguage in screens.js), so these are variables. */
const normLang = v => { v = String(v || "").trim().replace("_", "-"); return LANG_ALIASES[v.toLowerCase()] || v; };
const savedLang = (() => { try { return localStorage.getItem("memoriter-lang"); } catch { return null; } })();
let LANG_TAG = normLang(Q.get("lang") || savedLang || "en") || "en";
let LANG = LANG_TAG.slice(0, 2).toLowerCase() === "es" ? "es" : "en";

/* Theme: given with theme=…, or guessed from the other settings, so "?letters=vowels" alone
   already means the letters theme. */
const THEME_ALIASES = { number: "numbers", numeros: "numbers", "números": "numbers", letter: "letters", letras: "letters", shape: "shapes", formas: "shapes", figuras: "shapes", image: "images", imagenes: "images", "imágenes": "images", animals: "images", animales: "images", animal: "images", pictures: "images", dibujos: "images", color: "colors", colores: "colors" };
/* True when the URL already chooses the game, so the Start screen shows one "Let's go!" button
   instead of the theme tiles. */
const THEME_GIVEN = ["theme", "letters", "shapes", "items", "set"].some(k => URLQ.has(k));
function guessTheme() {
  const t = (URLQ.get("theme") || "").trim().toLowerCase();
  if (t) return THEME_ALIASES[t] || t;
  if (URLQ.has("letters")) return "letters";
  if (URLQ.has("shapes")) return "shapes";
  if (URLQ.has("items")) return "custom";
  if (URLQ.has("set")) return "images";
  return "numbers";
}

const CFG = {
  theme: guessTheme(),
  pairs: Math.max(1, Math.min(30, Math.floor(num("cards", 8) / 2))),   // cards=8 (default) → 4 pairs
  tts: Q.get("tts") !== "0",
  sound: Q.get("sound") !== "0",
  rate: num("rate", null),                            // null = use the voice preset's value
  pitch: num("pitch", null),
  colors: (Q.get("colors") || "one").toLowerCase(),   // one | pair | 0 | <name> | <hex>
  delay: num("delay", 1200),
  vanish: num("vanish", 900),
  // Pace: calm (default) ignores taps while two cards are open, until the wrong pair has turned back or
  // the found pair has popped away, so rushing does nothing. pace=fast lets a tap move on at once.
  fast: (Q.get("pace") || "").trim().toLowerCase() === "fast",
  // Peek: seconds every card is shown face up when a game starts (0 = off, the default; max 30).
  peek: Math.max(0, Math.min(30, num("peek", 0))),
  upper: (Q.get("case") || "upper").toLowerCase() !== "lower",
  // Letters: say the name ("bee"), the sound ("buh", phonics=1) or both ("B … buh", phonics=both).
  phonics: (Q.get("phonics") || "0").toLowerCase(),
  fullscreen: Q.get("fullscreen") !== "0",
  // Picture emoji: OpenMoji drawings (same on every device, default) or the device's own emoji.
  emoji: (Q.get("emoji") || "").toLowerCase() === "native" ? "native" : "openmoji",
  rest: Q.get("rest") === "0" ? 0 : Math.max(0, Math.round(num("rest", 6))),   // games before the rest screen (0 = never)
  calmMax: Q.get("grow") === "0" ? 0 : Math.max(0, Math.round(num("grow", 10))),   // extra calm rockets, max            // go full screen when a game tile is tapped
};

/* Random numbers: optionally seeded (seed=…) so the same shuffle repeats. */
let rnd = Math.random;
if (Q.has("seed")) {
  let a = num("seed", 1) >>> 0;
  rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const pick = (pool, n) => shuffle(pool.slice()).slice(0, n);
const randOf = a => a[Math.floor(Math.random() * a.length)];
const escapeHTML = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
