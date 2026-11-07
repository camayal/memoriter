"use strict";
/* config.js: everything read from the URL, plus small shared helpers.
   Loaded first; every other file may use these names. */

const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };
const list = k => Q.getAll(k).flatMap(v => v.split(",")).map(s => s.trim()).filter(Boolean);

/* Language: "es", "es-MX", "spanish", "español" … all work. LANG is the 2-letter code used for
   built-in words; LANG_TAG is the full tag used to pick a voice. */
const LANG_ALIASES = { spanish: "es", espanol: "es", "español": "es", english: "en", ingles: "en", "inglés": "en" };
const LANG_TAG = (() => { const v = (Q.get("lang") || "en").trim().replace("_", "-"); return LANG_ALIASES[v.toLowerCase()] || v; })();
const LANG = LANG_TAG.slice(0, 2).toLowerCase() === "es" ? "es" : "en";

/* Theme: given with theme=…, or guessed from the other settings, so "?letters=vowels" alone
   already means the letters theme. */
const THEME_ALIASES = { number: "numbers", numeros: "numbers", "números": "numbers", letter: "letters", letras: "letters", shape: "shapes", formas: "shapes", figuras: "shapes", image: "images", imagenes: "images", "imágenes": "images", animals: "images", animales: "images", animal: "images", color: "colors", colores: "colors" };
/* True when the URL already chooses the game, so the Start screen shows one "Let's go!" button
   instead of the theme tiles. */
const THEME_GIVEN = ["theme", "letters", "shapes", "items"].some(k => Q.has(k));
function guessTheme() {
  const t = (Q.get("theme") || "").trim().toLowerCase();
  if (t) return THEME_ALIASES[t] || t;
  if (Q.has("letters")) return "letters";
  if (Q.has("shapes")) return "shapes";
  if (Q.has("items")) return "custom";
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
  upper: (Q.get("case") || "upper").toLowerCase() !== "lower",
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
