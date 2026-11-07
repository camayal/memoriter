"use strict";
/* patterns.js: card back and page background patterns.
   Pure CSS gradients for the geometric ones, tiny inline SVG tiles for the picture ones.
   Tile size comes from a CSS variable so the pattern scales with the cards. */

const svgTile = body => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>${body}</svg>`)}")`;
const heartPath = (x, y, s) => `<path transform='translate(${x} ${y}) scale(${s})' d='M0 7 C-7 2 -9 -1 -9 -4 C-9 -7 -6.5 -9 -4.5 -9 C-2.5 -9 -1 -8 0 -6 C1 -8 2.5 -9 4.5 -9 C6.5 -9 9 -7 9 -4 C9 -1 7 2 0 7Z'/>`;
const starPts = (cx, cy, R) => Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? R * .45 : R, a = (-90 + i * 36) * Math.PI / 180; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");

/* Each pattern returns a list of CSS background layers. f = pattern colour, t = tile size. */
const PATTERNS = {
  plain:    () => [],
  dots:     (f, t) => [`radial-gradient(circle, ${f} 13%, transparent 15%) 0 0/${t} ${t}`],
  polka:    (f, t) => [`radial-gradient(circle, ${f} 16%, transparent 18%) 0 0/${t} ${t}`,
                       `radial-gradient(circle, ${f} 16%, transparent 18%) calc(${t}/2) calc(${t}/2)/${t} ${t}`],
  stripes:  (f, t) => [`repeating-linear-gradient(90deg, ${f} 0 calc(${t}/4), transparent 0 calc(${t}/2))`],
  diagonal: (f, t) => [`repeating-linear-gradient(45deg, ${f} 0 calc(${t}/5), transparent 0 calc(${t}/2.5))`],
  checks:   (f, t) => [`conic-gradient(${f} 25%, transparent 0 50%, ${f} 0 75%, transparent 0) 0 0/${t} ${t}`],
  grid:     (f, t) => [`linear-gradient(${f} 2px, transparent 0) -1px -1px/${t} ${t}`, `linear-gradient(90deg, ${f} 2px, transparent 0) -1px -1px/${t} ${t}`],
  zigzag:   (f, t) => [`${svgTile(`<polyline points='0,25 10,15 20,25 30,15 40,25' fill='none' stroke='${f}' stroke-width='4' stroke-linejoin='round' stroke-linecap='round'/>`)} 0 0/${t} ${t}`],
  waves:    (f, t) => [`${svgTile(`<path d='M0 20 Q10 10 20 20 T40 20' fill='none' stroke='${f}' stroke-width='4' stroke-linecap='round'/>`)} 0 0/${t} ${t}`],
  stars:    (f, t) => [`${svgTile(`<g fill='${f}'><polygon points='${starPts(10, 11, 7)}'/><polygon points='${starPts(30, 31, 7)}'/></g>`)} 0 0/${t} ${t}`],
  hearts:   (f, t) => [`${svgTile(`<g fill='${f}'>${heartPath(10, 11, .75)}${heartPath(30, 31, .75)}</g>`)} 0 0/${t} ${t}`],
  bubbles:  (f, t) => [`${svgTile(`<g fill='none' stroke='${f}' stroke-width='2.5'><circle cx='10' cy='10' r='6'/><circle cx='29' cy='25' r='8'/><circle cx='12' cy='32' r='3'/></g>`)} 0 0/${t} ${t}`],
};

/* Random pick that never repeats the previous game's choice. */
const lastPick = {};
function freshPick(key, pool) {
  const options = pool.length > 1 ? pool.filter(v => v !== lastPick[key]) : pool;
  return (lastPick[key] = randOf(options));
}
const BACK_COLORS = Object.keys(NAMED).filter(k => k !== "brown");   // soft brown looks muddy

/* Called at the start of every game: card back pattern + colour (random by default) and page background. */
function applyPatterns() {
  const root = document.documentElement.style;
  const bc = (Q.get("backcolor") || "random").toLowerCase();
  const back = bc === "random" ? lighten(NAMED[freshPick("color", BACK_COLORS)], .35) : colorParam("backcolor", "#7FB2F0", .35);
  const bp = (Q.get("back") || "random").toLowerCase();
  const backPat = PATTERNS[bp === "random" ? freshPick("pattern", Object.keys(PATTERNS).filter(k => k !== "plain")) : bp] || PATTERNS.dots;
  root.setProperty("--back-bg", [...backPat("rgba(255,255,255,.38)", "var(--tile)"), `linear-gradient(160deg, ${back}, ${darker(back, .92)})`].join(","));
  if (Q.get("mark") === "0") root.setProperty("--mark", "none");
  // Page: plain by default; a very faint tone-on-tone pattern if asked.
  const bg = colorParam("bgcolor", "#FFF7EA", .82);
  const bgPat = PATTERNS[(Q.get("bg") || "plain").toLowerCase()] || PATTERNS.plain;
  root.setProperty("--page-bg", [...bgPat(darker(bg, .94), "var(--bgtile)"), bg].join(","));
}
