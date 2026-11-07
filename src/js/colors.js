"use strict";
/* colors.js: the toddler palette and colour helpers. */

/* Unambiguous, named colours, softened just enough. */
const NAMED = { red: "#E04848", blue: "#2F6FDB", yellow: "#F2C230", green: "#3DAA5C", orange: "#F28C28", purple: "#8A4FC7", pink: "#E8649E", brown: "#8B5A3C" };
const PALETTE = Object.values(NAMED);
const INK = "#2F3A4A";

const darker = (hex, f = .72) => "#" + [1, 3, 5].map(i => Math.round(parseInt(hex.substr(i, 2), 16) * f).toString(16).padStart(2, "0")).join("");
const lighten = (hex, f) => "#" + [1, 3, 5].map(i => { const v = parseInt(hex.substr(i, 2), 16); return Math.round(v + (255 - v) * f).toString(16).padStart(2, "0"); }).join("");

/* A colour from the URL: a palette name (optionally softened towards white) or a 6-digit hex. */
const colorParam = (k, dflt, soften = 0) => {
  const v = (Q.get(k) || "").toLowerCase();
  if (NAMED[v]) return soften ? lighten(NAMED[v], soften) : NAMED[v];
  if (/^#?[0-9a-f]{6}$/.test(v)) return "#" + v.replace("#", "");
  return dflt;
};

/* Colour for every card in a game. Default: one random colour shared by all cards, so the
   child matches the item itself and colour is never a clue or a distraction. Yellow is skipped
   in random picks because it is hard to read on a white card. */
function gameColors(n) {
  const c = CFG.colors;
  if (c === "pair") return Array.from({ length: n }, (_, i) => PALETTE[i % PALETTE.length]);
  let one;
  if (c === "0" || c === "ink") one = INK;
  else if (NAMED[c]) one = NAMED[c];
  else if (/^#?[0-9a-f]{6}$/.test(c)) one = "#" + c.replace("#", "");
  else one = randOf(PALETTE.filter(p => p !== NAMED.yellow));
  return Array(n).fill(one);
}
