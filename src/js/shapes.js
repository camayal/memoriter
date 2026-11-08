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
  heart:     (c, s) => `<path d="M50 86 C20 64 8 48 8 32 C8 18 19 9 31 9 C40 9 46 14 50 21 C54 14 60 9 69 9 C81 9 92 18 92 32 C92 48 80 64 50 86Z" fill="${c}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>`,
};
