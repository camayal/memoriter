"use strict";
/* i18n.js: every word the game shows or speaks, per language.
   Numbers and letters are turned into words here ("1" → "uno", "B" → "be"), so they are spoken in
   the chosen language even when the device falls back to a voice of another language.
   To add a language: copy the "en" block, translate it, and add the code to LANG in config.js. */

const TEXT = {
  en: {
    start: "Let's go!",
    rest: "Time for a break. See you soon!",
    win: "Good job!",
    wins: ["Yay! Good job!", "You did it!", "Great job!", "Well done!", "Hooray! Good job!"],   // cheerful end phrases, rotated
    sample: "Hello, one, two, three",
    noVoice: "No English voice on this device/browser.",
    shapes: { circle: "circle", oval: "oval", square: "square", rectangle: "rectangle", triangle: "triangle", diamond: "diamond", pentagon: "pentagon", hexagon: "hexagon", heptagon: "heptagon", octagon: "octagon", star: "star", heart: "heart", semicircle: "semicircle" },
    // Picture sets (emoji). Only simple, everyday things a toddler knows. "emoji|spoken word".
    sets: {
      farm:     { name: "farm animals",  items: ["🐄|cow", "🐖|pig", "🐎|horse", "🐑|sheep", "🐐|goat", "🐓|rooster", "🐥|chick", "🦆|duck", "🐇|rabbit", "🐕|dog", "🐈|cat", "🦃|turkey", "🐁|mouse"] },
      wild:     { name: "wild animals",  items: ["🦁|lion", "🐅|tiger", "🐘|elephant", "🦒|giraffe", "🦓|zebra", "🦛|hippo", "🦏|rhino", "🐒|monkey", "🦍|gorilla", "🐊|crocodile", "🐻|bear", "🐼|panda", "🦎|lizard", "🐍|snake", "🐢|turtle", "🦨|skunk"] },
      bugs:     { name: "bugs",          items: ["🐝|bee", "🐞|ladybug", "🦋|butterfly", "🐛|caterpillar", "🐜|ant", "🐌|snail", "🕷️|spider", "🦗|cricket", "🪲|beetle", "🪰|fly", "🦟|mosquito", "🪱|worm"] },
      birds:    { name: "birds",         items: ["🐧|penguin", "🦉|owl", "🦜|parrot", "🦩|flamingo", "🦅|eagle", "🦢|swan", "🕊️|dove", "🦚|peacock", "🐓|rooster"] },
      sea:      { name: "sea animals",   items: ["🐟|fish", "🐡|pufferfish", "🐙|octopus", "🦀|crab", "🐬|dolphin", "🐳|whale", "🦈|shark", "🦑|squid", "🦞|lobster", "🦭|seal"] },
      fruits:   { name: "fruits",   items: ["🍎|apple", "🍌|banana", "🍇|grapes", "🍓|strawberry", "🍊|orange", "🍉|watermelon", "🍐|pear", "🍒|cherries", "🍍|pineapple", "🍋|lemon", "🥝|kiwi", "🍑|peach"] },
      // Vehicles: turned off for now (didn't fit with the other sets). Uncomment to bring it back.
      // vehicles: { name: "vehicles", items: ["🚗|car", "🚌|bus", "🚒|fire truck", "🚓|police car", "🚑|ambulance", "🚜|tractor", "🚂|train", "✈️|airplane", "🚁|helicopter", "🚀|rocket", "🚢|boat", "🚲|bike"] },
      nature:   { name: "things in nature",   items: ["☀️|sun", "🌙|moon", "⭐|star", "☁️|cloud", "🌈|rainbow", "🌸|flower", "🌳|tree", "🍄|mushroom", "🍂|leaf", "❄️|snowflake", "🌊|wave", "🌵|cactus", "🌧️|rain", "⚡|lightning"] },
    },
    findPairs: what => `Let's find pairs of ${what}!`,
    alphabet: "abcdefghijklmnopqrstuvwxyz",
    colors: { red: "red", blue: "blue", yellow: "yellow", green: "green", orange: "orange", purple: "purple", pink: "pink", brown: "brown", black: "black" },
    // Spoken when the child taps a game tile on the Start screen.
    themes: { numbers: "Let's find pairs of numbers!", letters: "Let's find pairs of letters!", shapes: "Let's find pairs of shapes!", colors: "Let's find pairs of colors!" },
    // English voices read a single capital letter as its name, so letters are spoken as "A", "B" …
    letter: ch => ch.toUpperCase(),
    phonics: ch => PHONICS_EN[ch],
    number: n => numberEN(n),
  },
  es: {
    start: "¡Vamos!",
    rest: "¡Hora de descansar! Hasta pronto.",
    win: "¡Muy bien!",
    wins: ["¡Bravo! ¡Muy bien!", "¡Lo lograste!", "¡Excelente!", "¡Bien hecho!", "¡Yupi! ¡Muy bien!"],
    sample: "Hola, uno, dos, tres",
    noVoice: "No hay voz en español en este dispositivo/navegador.",
    shapes: { circle: "círculo", oval: "óvalo", square: "cuadrado", rectangle: "rectángulo", triangle: "triángulo", diamond: "rombo", pentagon: "pentágono", hexagon: "hexágono", heptagon: "heptágono", octagon: "octágono", star: "estrella", heart: "corazón", semicircle: "semicírculo" },
    sets: {
      farm:     { name: "animales de la granja", items: ["🐄|vaca", "🐖|cerdo", "🐎|caballo", "🐑|oveja", "🐐|cabra", "🐓|gallo", "🐥|pollito", "🦆|pato", "🐇|conejo", "🐕|perro", "🐈|gato", "🦃|pavo", "🐁|ratón"] },
      wild:     { name: "animales salvajes",     items: ["🦁|león", "🐅|tigre", "🐘|elefante", "🦒|jirafa", "🦓|cebra", "🦛|hipopótamo", "🦏|rinoceronte", "🐒|mono", "🦍|gorila", "🐊|cocodrilo", "🐻|oso", "🐼|panda", "🦎|lagartija", "🐍|culebra", "🐢|tortuga", "🦨|zorrillo"] },
      bugs:     { name: "bichos",                items: ["🐝|abeja", "🐞|mariquita", "🦋|mariposa", "🐛|oruga", "🐜|hormiga", "🐌|caracol", "🕷️|araña", "🦗|grillo", "🪲|escarabajo", "🪰|mosca", "🦟|zancudo", "🪱|gusano"] },
      birds:    { name: "pájaros",               items: ["🐧|pingüino", "🦉|búho", "🦜|loro", "🦩|flamenco", "🦅|águila", "🦢|cisne", "🕊️|paloma", "🦚|pavo real", "🐓|gallo"] },
      sea:      { name: "animales del mar",      items: ["🐟|pez", "🐡|pez globo", "🐙|pulpo", "🦀|cangrejo", "🐬|delfín", "🐳|ballena", "🦈|tiburón", "🦑|calamar", "🦞|langosta", "🦭|foca"] },
      fruits:   { name: "frutas",     items: ["🍎|manzana", "🍌|banano", "🍇|uvas", "🍓|fresa", "🍊|naranja", "🍉|sandía", "🍐|pera", "🍒|cerezas", "🍍|piña", "🍋|limón", "🥝|kiwi", "🍑|durazno"] },
      // Vehicles: turned off for now (didn't fit with the other sets). Uncomment to bring it back.
      // vehicles: { name: "vehículos",  items: ["🚗|carro", "🚌|bus", "🚒|carro de bomberos", "🚓|carro de policía", "🚑|ambulancia", "🚜|tractor", "🚂|tren", "✈️|avión", "🚁|helicóptero", "🚀|cohete", "🚢|barco", "🚲|bicicleta"] },
      nature:   { name: "cosas de la naturaleza", items: ["☀️|sol", "🌙|luna", "⭐|estrella", "☁️|nube", "🌈|arcoíris", "🌸|flor", "🌳|árbol", "🍄|hongo", "🍂|hoja", "❄️|copo de nieve", "🌊|ola", "🌵|cactus", "🌧️|lluvia", "⚡|rayo"] },
    },
    findPairs: what => `¡Vamos a buscar parejas de ${what}!`,
    alphabet: "abcdefghijklmnñopqrstuvwxyz",
    colors: { red: "rojo", blue: "azul", yellow: "amarillo", green: "verde", orange: "naranja", purple: "morado", pink: "rosado", brown: "café", black: "negro" },
    themes: { numbers: "¡Vamos a buscar parejas de números!", letters: "¡Vamos a buscar parejas de letras!", shapes: "¡Vamos a buscar parejas de figuras!", colors: "¡Vamos a buscar parejas de colores!" },
    letter: ch => LETTERS_ES[ch.toLowerCase()] || ch,
    phonics: ch => PHONICS_ES[ch],
    number: n => numberES(n),
  },
};
let W = TEXT[LANG];                                 // current language's words (changes with the EN · ES switch)

/* Letter SOUNDS (phonics). Browsers can't be told "say the sound /b/", so each sound is spelled the
   way a voice will read it. Sounds you can hold (m, s, f …) are stretched ("mmm"); short ones get a
   tiny vowel ("buh"). Voices differ, so test them and adjust here if one sounds wrong.
   A single card can also be changed from the URL: items=B|buh shows B and says "buh". */
const PHONICS_EN = { a: "ah", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fff", g: "guh", h: "huh", i: "ih", j: "juh", k: "kuh", l: "lll", m: "mmm", n: "nnn", o: "aw", p: "puh", q: "kwuh", r: "rrr", s: "sss", t: "tuh", u: "uh", v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz" };
const PHONICS_ES = { a: "a", b: "b", c: "k", d: "d", e: "e", f: "fff", g: "g", h: "", i: "i", j: "jjj", k: "k", l: "lll", m: "mmm", n: "nnn", "ñ": "ñ", o: "o", p: "p", q: "k", r: "rrr", s: "sss", t: "t", u: "u", v: "b", w: "u", x: "ks", y: "i", z: "sss" };
// Spanish voices read a lone consonant oddly, so stops get a short "u"/"e" like teachers say them.
Object.assign(PHONICS_ES, { b: "bu", c: "ku", d: "du", g: "gu", k: "ku", p: "pu", q: "ku", t: "tu", v: "bu", "ñ": "ñe", h: "(muda)" });

/* What a letter card says, following phonics=: 0 = name, 1 = sound, both = name then sound.
   (Spanish h is silent: in sound mode it says "muda", silent.) */
function letterSpeech(ch) {
  const name = W.letter(ch), sound = W.phonics(ch.toLowerCase()) ?? name;
  if (CFG.phonics === "1" || CFG.phonics === "sound") return sound === "(muda)" ? "muda" : sound;
  if (CFG.phonics === "both") return sound === "(muda)" ? `${name}, muda` : `${name}, ${sound}`;
  return name;
}

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
  if ([...t].length === 1 && /\p{L}/u.test(t)) return letterSpeech(t);
  return t;
}
