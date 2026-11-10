"use strict";
/* shapes.js: SVG drawings for the shapes theme (viewBox 0 0 100 100).
   Each function takes a fill colour (c) and an outline colour (s). Names are translated in i18n.js. */

const poly = (n, r = 42, cy = 50, rot = -90) => Array.from({ length: n }, (_, i) => {
  const a = (rot + i * 360 / n) * Math.PI / 180; return `${(50 + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
const starPoly = () => Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 19 : 44, a = (-90 + i * 36) * Math.PI / 180; return `${(50 + r * Math.cos(a)).toFixed(1)},${(53 + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
const polygon = (pts, c, s) => `<polygon points="${pts}" fill="${c}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>`;

const SHAPES = {
  circle:    (c, s) => `<circle cx="50" cy="50" r="40" fill="${c}" stroke="${s}" stroke-width="4"/>`,
  oval:      (c, s) => `<ellipse cx="50" cy="50" rx="44" ry="28" fill="${c}" stroke="${s}" stroke-width="4"/>`,
  square:    (c, s) => `<rect x="15" y="15" width="70" height="70" rx="4" fill="${c}" stroke="${s}" stroke-width="4"/>`,
  rectangle: (c, s) => `<rect x="6" y="26" width="88" height="48" rx="4" fill="${c}" stroke="${s}" stroke-width="4"/>`,
  triangle:  (c, s) => polygon(poly(3, 46, 58), c, s),
  diamond:   (c, s) => polygon("50,6 84,50 50,94 16,50", c, s),
  pentagon:  (c, s) => polygon(poly(5, 44, 53), c, s),
  hexagon:   (c, s) => polygon(poly(6, 44, 50, 0), c, s),
  heptagon:  (c, s) => polygon(poly(7, 44, 52), c, s),
  octagon:   (c, s) => polygon(poly(8, 44, 50, -67.5), c, s),
  star:      (c, s) => polygon(starPoly(), c, s),
  // Semicircle: a half disk with a flat bottom.
  semicircle: (c, s) => `<path d="M8 70 A42 42 0 0 1 92 70 Z" fill="${c}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>`,
  // Arch (doorway with a tunnel cut out), turned off for now; to bring it back, uncomment it here
  // and add arch: "arch" / arch: "arco" to the shape names in i18n.js.
  // arch:      (c, s) => `<path d="M10 90 V48 A40 40 0 0 1 90 48 V90 H66 V64 A16 16 0 0 0 34 64 V90 Z" fill="${c}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>`,
  heart:     (c, s) => `<path d="M50 86 C20 64 8 48 8 32 C8 18 19 9 31 9 C40 9 46 14 50 21 C54 14 60 9 69 9 C81 9 92 18 92 32 C92 48 80 64 50 86Z" fill="${c}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>`,
};

/* ---------- Quantities (numbers game, count=dots | count=fingers) ----------
   The second card of a number pair shows that many dots or fingers (1 to 10).
   Dots: in the card's colour, dice patterns, so small amounts are seen at a glance without counting.
   Fingers: OpenMoji hands (hands.js): one hand for 1 to 5; for 6 to 10 a whole hand 🖐 on the left
   (turned so its thumb points out) and the hand for the rest on the right. */
const DOTS = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[29, 29], [71, 29], [29, 71], [71, 71]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
  7: [[26, 22], [74, 22], [26, 50], [50, 50], [74, 50], [26, 78], [74, 78]],
  8: [[30, 17], [70, 17], [30, 39], [70, 39], [30, 61], [70, 61], [30, 83], [70, 83]],
  9: [[22, 22], [50, 22], [78, 22], [22, 50], [50, 50], [78, 50], [22, 78], [50, 78], [78, 78]],
  10: [[17, 24], [39, 24], [61, 24], [83, 24], [35, 50], [65, 50], [17, 76], [39, 76], [61, 76], [83, 76]],
};
const QTY_MAX = 10;
function dotsSVG(n, c) {
  const pts = DOTS[n] || [], r = n <= 2 ? 13 : n <= 5 ? 11.5 : n <= 7 ? 10 : 8.8, s = darker(c, .8);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${s}" stroke-width="3"/>`).join("")}</svg>`;
}
const handAt = (n, x, y, size, mirror) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 72 72" overflow="visible">${mirror ? `<g transform="matrix(-1 0 0 1 72 0)">${HANDS[n]}</g>` : HANDS[n]}</svg>`;
function fingersSVG(n) {
  // 🖐 fills its 72×72 box more than ☝ ✌ and the 3 and 4 hands, so alone it is drawn a little smaller.
  // Two hands (6 to 10): both drawn at exactly the same size, side by side.
  const body = n === 5 ? handAt(5, 6, 6, 88) : n < 5 ? handAt(n, 0, 0, 100)
    : handAt(5, -9, 19, 62, true) + handAt(n - 5, 47, 19, 62);
  return `<svg viewBox="0 0 100 100" overflow="visible" aria-hidden="true">${body}</svg>`;
}
const HAND_COLOR = "#F2C230";                      // sparkles of a hand card: OpenMoji's skin yellow, a touch deeper
