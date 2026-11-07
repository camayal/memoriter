"use strict";
/* content.js: builds the list of card items for the chosen theme.
   Each item: { kind: "text" | "shape" | "swatch" | "img" | "emoji", show, say }
   "show" is what appears on the card, "say" is what the voice speaks (already in the game language). */

/* "shown|spoken" → item. Without "|", numbers and single letters are spoken as words (see spoken()). */
const parseItem = (raw, kind) => {
  const [show, say] = raw.split("|");
  return { kind, show: show.trim(), say: say !== undefined ? say.trim() : kind === "text" ? spoken(show) : show.trim() };
};

const THEMES = {
  numbers(n) {
    const from = Math.round(num("from", 1)), to = Math.round(num("to", from + n - 1));
    const lo = Math.min(from, to), hi = Math.max(from, to);
    const all = Array.from({ length: Math.min(hi - lo + 1, 1000) }, (_, i) => lo + i);
    return (all.length <= n ? all : pick(all, n)).map(v => ({ kind: "text", show: String(v), say: W.number(v) }));
  },

  letters(n) {
    const spec = (Q.get("letters") || "abc").toLowerCase();
    const abc = W.alphabet;
    let chars;
    if (["abc", "all", "a-z"].includes(spec)) chars = [...abc];
    else if (spec === "vowels" || spec === "vocales") chars = [..."aeiou"];
    else if (/^.-.$/u.test(spec)) { const a = abc.indexOf(spec[0]), b = abc.indexOf(spec[2]); chars = [...abc].slice(Math.min(a, b), Math.max(a, b) + 1); }
    else chars = [...new Set([...spec.replace(/[^\p{L}]/gu, "")])];
    return (chars.length <= n ? chars : pick(chars, n)).map(ch => ({ kind: "text", show: CFG.upper ? ch.toUpperCase() : ch, say: W.letter(ch) }));
  },

  shapes(n) {
    const want = list("shapes").map(s => s.toLowerCase()).filter(s => SHAPES[s]);
    return (want.length ? want.slice(0, n) : pick(Object.keys(SHAPES), n)).map(s => ({ kind: "shape", show: s, say: W.shapes[s] }));
  },

  /* Colour swatches, spoken as the colour's name. Every card keeps its own colour here. */
  colors(n) {
    return pick(Object.keys(W.colors), n).map(c => ({ kind: "swatch", show: c === "black" ? INK : NAMED[c], say: W.colors[c] }));
  },

  images(n) {
    // items= with emoji or image links (https://…, data:…, ./file.png); "shown|spoken" works here too.
    const custom = list("items").map(v => parseItem(v, /^(https?:|data:|\.{0,2}\/)/.test(v) ? "img" : "emoji"));
    return pick(custom.length ? custom : W.animals.map(v => parseItem(v, "emoji")), n);
  },

  custom(n) {
    const items = list("items").map(v => parseItem(v, "text"));
    if (!items.length) return THEMES.numbers(n);
    return items.length <= n ? items : pick(items, n);
  },
};

function buildItems() {
  return (THEMES[CFG.theme] || THEMES.numbers)(CFG.pairs);
}
