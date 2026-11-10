"use strict";
/* board.js: the game itself: dealing cards, flipping, matching, layout. */

const grid = document.getElementById("grid"), board = document.getElementById("board");
let cards = [], openCards = [], locked = false, matched = 0, total = 0, peeking = false, peekTimer = null;
let mismatch = null;                                // { a, b, timer } while two different cards are showing
/* This game, for progress (stats.js) and adapt=1: the cards turned over so far (their place is
   known), and per pair whether the child remembered or forgot where its other card was. */
let seen = new Set(), marks = {}, play = null;

/* Emoji as HTML. Default: the OpenMoji drawing (https://openmoji.org, CC BY-SA 4.0), identical on
   every device, from assets/openmoji/ (dist/openmoji/ once built). emoji=native uses the device's
   own emoji. If a drawing is missing, the device emoji is shown instead. */
const OPENMOJI_DIR = "assets/openmoji/";
const openmojiCode = e => [...e].filter(c => c !== "\uFE0F").map(c => c.codePointAt(0).toString(16).toUpperCase()).join("-");
const openmojiURL = e => OPENMOJI_DIR + openmojiCode(e) + ".svg";
function emojiHTML(e) {
  if (CFG.emoji === "native") return escapeHTML(e);
  return `<img class="emoji" src="${openmojiURL(e)}" alt="${escapeHTML(e)}" draggable="false" onerror="this.replaceWith(this.alt)">`;
}

function faceHTML(item, color) {
  if (item.kind === "shape") return `<svg viewBox="0 0 100 100" aria-hidden="true">${SHAPES[item.show](color, darker(color, .85))}</svg>`;
  if (item.kind === "swatch") return crayonSVG(item.show);      // colours: a crayon in that colour (same drawing as the tile)
  if (item.kind === "dots") return dotsSVG(item.show, color);   // count=dots
  if (item.kind === "fingers") return fingersSVG(item.show);     // count=fingers
  if (item.kind === "img") return `<img src="${encodeURI(item.show)}" alt="" draggable="false">`;
  const len = [...item.show].length;
  const size = item.kind === "emoji" ? 66 : Math.min(64, 150 / len);
  const inner = item.kind === "emoji" ? emojiHTML(item.show) : escapeHTML(item.show);
  return `<span class="txt" style="font-size:${size}cqmin;color:${color}">${inner}</span>`;
}

/* Sparkle colour of a card: the colour of what it shows.
   Letters, numbers, words, shapes: their own colour (black ink gets mixed colours instead).
   Crayons: the crayon's colour. Pictures (emoji, own images): their main colour, read from the
   drawing itself (pictureColor). Until that is known, or if a picture has no clear colour, mixed. */
function sparkColor(item, color) {
  if (item.kind === "swatch") return item.show;
  if (item.kind === "fingers") return HAND_COLOR;
  if (item.kind === "emoji" || item.kind === "img") return null;
  return color === INK ? null : color;
}

/* Main colour of a picture: drawn small on a hidden canvas, then the pixels are sorted into hue
   groups, leaving out see-through, near-black (outlines), and white or grey ones (eyes, shine).
   The biggest group wins, and its average colour is the answer (darkened a little if it is very
   pale, so it shows on the cream background). Null when almost nothing colourful is left
   (🐼, ⚽) or the picture can't be read (another website's image). Each picture is read once. */
const pictureColors = new Map();
function pictureColor(item) {
  const key = item.kind + ":" + item.show;
  if (!pictureColors.has(key)) pictureColors.set(key, new Promise(resolve => {
    const N = 40, cv = document.createElement("canvas"); cv.width = cv.height = N;
    const g = cv.getContext("2d", { willReadFrequently: true });
    const read = () => {
      let d;
      try { d = g.getImageData(0, 0, N, N).data; } catch { return resolve(null); }   // image from another site
      const bins = Array.from({ length: 24 }, () => ({ n: 0, r: 0, g: 0, b: 0 }));
      let solid = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue;
        solid++;
        const r = d[i], gr = d[i + 1], b = d[i + 2], max = Math.max(r, gr, b), min = Math.min(r, gr, b);
        if (max < 70 || max - min < 45) continue;                 // outline, white, grey
        let h = max === r ? (gr - b) / (max - min) : max === gr ? 2 + (b - r) / (max - min) : 4 + (r - gr) / (max - min);
        h = ((h * 60) + 360) % 360;
        const bin = bins[Math.floor(h / 15) % 24];
        bin.n++; bin.r += r; bin.g += gr; bin.b += b;
      }
      const best = bins.reduce((a, c) => c.n > a.n ? c : a);
      if (!solid || best.n < solid * .06) return resolve(null);
      let hex = "#" + [best.r, best.g, best.b].map(v => Math.round(v / best.n).toString(16).padStart(2, "0")).join("");
      const [r, gr, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16));
      if (.299 * r + .587 * gr + .114 * b > 225) hex = darker(hex, .9);    // very pale: a touch darker
      resolve(hex);
    };
    if (item.kind === "emoji" && CFG.emoji === "native") {
      g.font = `${N * .8}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(item.show, N / 2, N / 2 + N * .04); read();
    } else {
      const img = new Image();
      img.onload = () => { g.drawImage(img, 0, 0, N, N); read(); };
      img.onerror = () => resolve(null);
      img.src = item.kind === "emoji" ? openmojiURL(item.show) : encodeURI(item.show);
    }
  }));
  return pictureColors.get(key);
}

function newGame() {
  applyPatterns();                                  // new random card back each game
  const items = buildItems();
  if (mismatch) clearTimeout(mismatch.timer);
  clearTimeout(peekTimer); peeking = false;
  total = items.length; matched = 0; openCards = []; locked = false; mismatch = null;
  seen = new Set(); marks = {}; play = { start: 0, flips: 0, mism: 0, quick: 0, miss: 0 };
  const colors = gameColors(items.length);
  // Two cards per item. With an "alt" (3 ↔ dots, A ↔ a) the second card shows the alt instead.
  const deck = shuffle(items.flatMap((it, i) => [{ ...it, id: i, color: colors[i] }, { ...it, ...it.alt, id: i, color: colors[i], isAlt: !!it.alt }]));
  grid.innerHTML = "";
  cards = deck.map((d, idx) => {
    const el = document.createElement("button");
    el.className = "card"; el.setAttribute("aria-label", "card " + (idx + 1));
    el.dataset.say = d.say;                         // what this card speaks (used by tests/check.py)
    el.innerHTML = `<div class="inner"><div class="face back"></div><div class="face front">${faceHTML(d, d.color)}</div></div>`;
    /* React the instant a finger touches the card. A "click" only fires if the finger lifts without
       sliding or holding, which small fingers often don't manage, so some taps were lost. */
    el.addEventListener("pointerdown", e => { if (e.button > 0) return; e.preventDefault(); onTap(idx); });
    el.addEventListener("click", e => { if (e.detail === 0) onTap(idx); });   // keyboard (Enter/Space)
    el.addEventListener("contextmenu", e => e.preventDefault());             // long press: no menu
    grid.appendChild(el);
    const spark = sparkColor(d, d.color);
    if (spark) el.dataset.spark = spark;            // the sparkle colour (also read by tests/check.py)
    return { ...d, el, up: false, done: false, spark };
  });
  // Pictures: read each one's main colour in the background (both cards of the pair get it).
  for (const c of cards) if (c.kind === "emoji" || c.kind === "img")
    pictureColor(c).then(hex => { if (hex) { c.spark = hex; c.el.dataset.spark = hex; } });
  layout();
}

function onTap(i) {
  const c = cards[i];
  audio();                                          // make sure audio is unlocked
  if (peeking || c.done || c.up) return;
  // Two cards still open. Calm pace (default): the tap is ignored completely (no sound, no movement),
  // so tapping fast gets nothing and the child learns to watch the cards. pace=fast: a tap turns the
  // wrong pair back right away and goes on.
  if (locked) { if (!CFG.fast) return; flipBack(); }
  sfx.tap();
  c.up = true; c.el.classList.add("up"); c.el.setAttribute("aria-label", c.say);
  if (!play.start) play.start = Date.now();
  play.flips++;
  // First card of a turn whose other card was already seen: the child can know where it is.
  // The last pair doesn't count: with two cards left it can't be missed.
  const partner = cards.findIndex((x, j) => j !== i && x.id === c.id);
  c.knew = openCards.length === 0 && seen.has(partner) && matched < total - 1;
  seen.add(i);
  // The second card of a pair found right away isn't spoken again: the word was just said.
  const sameAsOpen = openCards.length === 1 && openCards[0].id === c.id;
  if (!sameAsOpen) say(c.say);
  openCards.push(c);
  if (openCards.length < 2) return;
  const [a, b] = openCards; openCards = [];
  const mark = marks[a.id] ||= { quick: 0, miss: 0 };
  if (a.id === b.id) {
    if (a.knew) { mark.quick++; play.quick++; }      // remembered where its pair was
    a.done = b.done = true;
    const last = ++matched === total;
    // Let the child see and hear the pair, then pop them away one after the other.
    setTimeout(() => vanish(a), CFG.vanish);
    setTimeout(() => vanish(b), CFG.vanish + 160);
    // Calm pace: wait until both cards have popped away (pop animation .3 s) before taking taps again.
    if (!CFG.fast) { locked = true; setTimeout(() => { if (!mismatch) locked = false; }, CFG.vanish + 160 + 300); }
    if (last) setTimeout(finale, CFG.vanish + 900);
  } else {
    play.mism++;
    if (a.knew) { mark.miss++; play.miss++; }        // its pair had been seen, but another card was chosen
    locked = true;
    mismatch = { a, b, timer: setTimeout(flipBack, CFG.delay) };
  }
}

/* Peek (peek=N, off by default): when the game starts, every card is shown face up for N seconds,
   silently, then they all turn over and play begins. Taps are ignored until then.
   `after` waits for the start screen to fade first. */
function peekCards(after = 0) {
  if (!(CFG.peek > 0)) return;
  clearTimeout(peekTimer); peeking = true;
  const show = up => { for (const c of cards) { c.up = up; c.el.classList.toggle("up", up); } };
  peekTimer = setTimeout(() => {
    show(true);
    peekTimer = setTimeout(() => { show(false); peeking = false; }, CFG.peek * 1000);
  }, after);
}

function flipBack() {
  if (!mismatch) return;
  clearTimeout(mismatch.timer);
  for (const x of [mismatch.a, mismatch.b]) { x.up = false; x.el.classList.remove("up"); x.el.setAttribute("aria-label", "card"); }
  mismatch = null; locked = false;
}

/* End of the game: a short fireworks show. */
/* Games finished in this session (kept across reloads of the same tab). Each one makes the next
   fireworks a little longer, so the wait before the next game grows: calmer, less rushing. */
let gamesDone = 0;
try { gamesDone = +sessionStorage.getItem("memoriter-games") || 0; } catch { /* storage blocked */ }
function resetGames() {
  gamesDone = 0;
  try { sessionStorage.setItem("memoriter-games", 0); } catch { /* storage blocked */ }
}
const restDue = () => CFG.rest > 0 && gamesDone >= CFG.rest;

function finale() {
  // Progress for the parents (setup → Progress) and the grow-with-my-child level for the next game.
  const game = { theme: CFG.theme, pairs: total, ms: play.start ? Date.now() - play.start : 0, flips: play.flips, mism: play.mism, quick: play.quick, miss: play.miss };
  const mains = [...new Map(cards.filter(c => !c.isAlt).map(c => [c.id, c])).values()];   // one card per pair, never the dots / word
  recordGame(game, mains, marks);
  adaptAfterGame(game);
  gamesDone++;
  try { sessionStorage.setItem("memoriter-games", gamesDone); } catch { /* storage blocked */ }
  // One of the cards just matched becomes the shape of the final firework (light colour for the night sky).
  const main = cards.filter(c => !c.isAlt);          // the number or capital, not its dots / small letter
  const c = main.length ? randOf(main) : null;
  if (c) prepareSymbol(c, c.kind === "swatch" ? lighten(c.show, .15) : c.kind === "emoji" ? (c.spark ? lighten(c.spark, .25) : "#FFD86B") : lighten(c.color === INK ? "#7FB2F0" : c.color, .3));
  fireworksShow(showAgain, gamesDone);
}

function vanish(c) {
  const r = c.el.getBoundingClientRect();
  if (CFG.motion) sfx.pop();                         // no-movement mode: a silent, soft fade
  sparkle(r.left + r.width / 2, r.top + r.height / 2, r.width, c.spark);
  c.el.classList.add("gone");                       // the grid slot stays, so nothing moves around
  c.el.setAttribute("aria-hidden", "true"); c.el.tabIndex = -1;
}

/* Fit the grid: pick the column count that gives the biggest square cards. */
function layout() {
  const n = cards.length; if (!n) return;
  const cs = getComputedStyle(board);
  const Wd = board.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const Ht = board.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const gap = Math.max(6, Math.min(16, Math.min(Wd, Ht) / 40));
  let best = { size: 0, cols: 1 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const size = Math.min((Wd - gap * (cols - 1)) / cols, (Ht - gap * (rows - 1)) / rows);
    if (size > best.size + .5 || (Math.abs(size - best.size) <= .5 && n % cols === 0)) best = { size, cols };
  }
  const size = Math.floor(Math.min(best.size, 240));
  const root = document.documentElement.style;
  grid.style.gridTemplateColumns = `repeat(${best.cols}, ${size}px)`;
  root.setProperty("--size", size + "px");
  root.setProperty("--gap", gap + "px");
  root.setProperty("--radius", Math.round(size * .14) + "px");
  root.setProperty("--tile", Math.max(12, Math.round(size / 4.5)) + "px");
}

function initBoard() {
  addEventListener("resize", layout);
}
