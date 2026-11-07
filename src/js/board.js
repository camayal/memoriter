"use strict";
/* board.js: the game itself: dealing cards, flipping, matching, layout. */

const grid = document.getElementById("grid"), board = document.getElementById("board");
let cards = [], openCards = [], locked = false, matched = 0, total = 0;

function faceHTML(item, color) {
  if (item.kind === "shape") return `<svg viewBox="0 0 100 100" aria-hidden="true">${SHAPES[item.show](color, darker(color, .85))}</svg>`;
  if (item.kind === "swatch") return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="${item.show}" stroke="${darker(item.show, .85)}" stroke-width="4"/></svg>`;
  if (item.kind === "img") return `<img src="${encodeURI(item.show)}" alt="" draggable="false">`;
  const len = [...item.show].length;
  const size = item.kind === "emoji" ? 66 : Math.min(64, 150 / len);
  return `<span class="txt" style="font-size:${size}cqmin;color:${color}">${escapeHTML(item.show)}</span>`;
}

function newGame() {
  applyPatterns();                                  // new random card back each game
  const items = buildItems();
  total = items.length; matched = 0; openCards = []; locked = false;
  const colors = gameColors(items.length);
  const deck = shuffle(items.flatMap((it, i) => [{ ...it, id: i, color: colors[i] }, { ...it, id: i, color: colors[i] }]));
  grid.innerHTML = "";
  cards = deck.map((d, idx) => {
    const el = document.createElement("button");
    el.className = "card"; el.setAttribute("aria-label", "card " + (idx + 1));
    el.dataset.say = d.say;                         // what this card speaks (used by tests/check.py)
    el.innerHTML = `<div class="inner"><div class="face back"></div><div class="face front">${faceHTML(d, d.color)}</div></div>`;
    el.addEventListener("click", () => onTap(idx));
    grid.appendChild(el);
    return { ...d, el, up: false, done: false };
  });
  layout();
}

function onTap(i) {
  const c = cards[i];
  audio();                                          // make sure audio is unlocked
  if (c.done || c.up || locked) return;
  sfx.tap();
  c.up = true; c.el.classList.add("up"); c.el.setAttribute("aria-label", c.say);
  say(c.say);
  openCards.push(c);
  if (openCards.length < 2) return;
  const [a, b] = openCards; openCards = [];
  if (a.id === b.id) {
    a.done = b.done = true;
    const last = ++matched === total;
    // Let the child see and hear the pair, then pop them away one after the other.
    setTimeout(() => vanish(a), CFG.vanish);
    setTimeout(() => vanish(b), CFG.vanish + 160);
    if (last) setTimeout(finale, CFG.vanish + 900);
  } else {
    locked = true;
    setTimeout(() => {
      for (const x of [a, b]) { x.up = false; x.el.classList.remove("up"); x.el.setAttribute("aria-label", "card"); }
      locked = false;
    }, CFG.delay);
  }
}

/* End of the game: a short fireworks show. */
function finale() {
  fireworksShow(showAgain);
}

function vanish(c) {
  const r = c.el.getBoundingClientRect();
  sfx.pop();
  sparkle(r.left + r.width / 2, r.top + r.height / 2, r.width, c.color === INK ? null : c.color);
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
