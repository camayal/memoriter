"use strict";
/* i18n.js: every word the game shows or speaks, per language.
   Numbers and letters are turned into words here ("1" → "uno", "B" → "be"), so they are spoken in
   the chosen language even when the device falls back to a voice of another language.
   To add a language: copy the "en" block, translate it, and add the code to LANG in config.js. */

const TEXT = {
  en: {
    start: "Let's go!",
    win: "Good job!",
    sample: "Hello, one, two, three",
    noVoice: "No English voice on this device/browser.",
    shapes: { line: "line", circle: "circle", oval: "oval", square: "square", rectangle: "rectangle", triangle: "triangle", diamond: "diamond", pentagon: "pentagon", hexagon: "hexagon", heptagon: "heptagon", octagon: "octagon", star: "star", heart: "heart" },
    animals: ["🐶|dog", "🐱|cat", "🐮|cow", "🐷|pig", "🐸|frog", "🦁|lion", "🐵|monkey", "🐤|chick", "🦆|duck", "🐻|bear", "🐰|rabbit", "🐟|fish", "🐘|elephant", "🐴|horse"],
    alphabet: "abcdefghijklmnopqrstuvwxyz",
    // English voices read a single capital letter as its name, so letters are spoken as "A", "B" …
    letter: ch => ch.toUpperCase(),
    number: n => numberEN(n),
  },
  es: {
    start: "¡Vamos!",
    win: "¡Muy bien!",
    sample: "Hola, uno, dos, tres",
    noVoice: "No hay voz en español en este dispositivo/navegador.",
    shapes: { line: "línea", circle: "círculo", oval: "óvalo", square: "cuadrado", rectangle: "rectángulo", triangle: "triángulo", diamond: "rombo", pentagon: "pentágono", hexagon: "hexágono", heptagon: "heptágono", octagon: "octágono", star: "estrella", heart: "corazón" },
    animals: ["🐶|perro", "🐱|gato", "🐮|vaca", "🐷|cerdo", "🐸|rana", "🦁|león", "🐵|mono", "🐤|pollito", "🦆|pato", "🐻|oso", "🐰|conejo", "🐟|pez", "🐘|elefante", "🐴|caballo"],
    alphabet: "abcdefghijklmnñopqrstuvwxyz",
    letter: ch => LETTERS_ES[ch.toLowerCase()] || ch,
    number: n => numberES(n),
  },
};
const W = TEXT[LANG];

const LETTERS_ES = { a: "a", b: "be", c: "ce", d: "de", e: "e", f: "efe", g: "ge", h: "hache", i: "i", j: "jota", k: "ka", l: "ele", m: "eme", n: "ene", "ñ": "eñe", o: "o", p: "pe", q: "cu", r: "erre", s: "ese", t: "te", u: "u", v: "uve", w: "uve doble", x: "equis", y: "ye", z: "zeta" };

function numberES(n) {
  if (n < 0) return "menos " + numberES(-n);
  const U = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const T = { 3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa" };
  const H = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  const below1000 = x => {
    if (x < 30) return U[x];
    if (x < 100) { const r = x % 10; return T[Math.floor(x / 10)] + (r ? " y " + U[r] : ""); }
    if (x === 100) return "cien";
    const r = x % 100; return H[Math.floor(x / 100)] + (r ? " " + below1000(r) : "");
  };
  if (n < 1000) return below1000(n);
  if (n < 1e6) { const k = Math.floor(n / 1000), r = n % 1000; return (k === 1 ? "mil" : below1000(k).replace(/uno$/, "un") + " mil") + (r ? " " + below1000(r) : ""); }
  return String(n);
}

function numberEN(n) {
  if (n < 0) return "minus " + numberEN(-n);
  const U = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const T = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const below1000 = x => {
    if (x < 20) return U[x];
    if (x < 100) { const r = x % 10; return T[Math.floor(x / 10)] + (r ? "-" + U[r] : ""); }
    const r = x % 100; return U[Math.floor(x / 100)] + " hundred" + (r ? " " + below1000(r) : "");
  };
  if (n < 1000) return below1000(n);
  if (n < 1e6) { const r = n % 1000; return below1000(Math.floor(n / 1000)) + " thousand" + (r ? " " + below1000(r) : ""); }
  return String(n);
}

/* What to speak for a card's text: whole numbers and single letters become words in the
   current language; anything else is spoken as written. */
function spoken(text) {
  const t = String(text).trim();
  if (/^-?\d+$/.test(t)) return W.number(parseInt(t, 10));
  if ([...t].length === 1 && /\p{L}/u.test(t)) return W.letter(t);
  return t;
}
