"use strict";
/* screens.js: everything around the board: Start screen, "play again" button,
   ?help=1 (settings list) and ?voices=1 (voice list). */

const HELP = `MEMORITER: a memory pairs game for toddlers. Every setting comes from the URL.

theme    numbers | letters | shapes | images | colors   (default: the child picks a tile on the Start screen;
         also guessed from letters=, shapes=, items=)
themes   which tiles the Start screen offers, in order, e.g. themes=numbers,colors (default: all five)
cards    number of cards on the board, even number               (default: 8 = 4 pairs)
from,to  numbers range, e.g. from=1&to=20 (random pick if the range has more numbers than pairs)
letters  abc (whole alphabet) | a-d (range) | aeiou (exact list) | vowels
case     upper | lower                                           (default: upper)
shapes   comma list: line,circle,oval,square,rectangle,triangle,diamond,
         pentagon,hexagon,heptagon,octagon,star,heart          (default: random pick)
items    your own cards, comma list or repeated; "shown|spoken" to say something else
         e.g. items=A|Apple,B|Ball      with theme=images: emoji or image links, e.g. items=https://…/cat.png|cat
lang     language of every spoken/shown word: en | es (also es-MX, spanish, español)  (default: en)
voice    auto (default: most natural voice) | soft | female | male | part of a voice name (e.g. voice=Jenny)
voices   1 = list the voices this browser has (tap one to hear it)
rate     TTS speed (default from the voice preset, ~1)    pitch   TTS pitch (default from preset, ~1)
tts      0 = mute speech            sound   0 = mute sound effects
colors   one = one random colour for all cards, new each game (default)
         pair = each pair its own colour
         red|blue|green|orange|purple|pink|brown|yellow or a hex like 2F6FDB = fixed colour
         0 = dark ink
delay    ms before a non-matching pair flips back (default 1200)
vanish   ms a matched pair stays visible before it pops away (default 900)
back     card back pattern (default: random, new each game, never plain)
         random | plain | dots | polka | stripes | diagonal | checks | grid | zigzag | waves | stars | hearts | bubbles
backcolor card back colour: random | a colour name (softened) | hex like 7FB2F0   (default: random)
mark     0 = hide the white circle in the middle of the card back
bg       page background pattern, same list as "back", drawn very faint (default: plain)
bgcolor  page colour: a colour name (very light tint) or hex like FFF7EA   (default: cream)
seed     number = same shuffle every time
start    0 = skip the Start screen (plays numbers; first card may be silent: browsers need a tap to unlock sound)
starttext text of the "Let's go!" button, shown instead of the tiles when the URL already picks the game
win      phrase spoken at the end (default "Good job!" / "¡Muy bien!")
demo     end = skip the game and show the end fireworks (to try them, or win=)
again    ms after the end before the game tiles (or "play again") show (default: when the fireworks end)

(tap to close)`;

/* ---------- Game tiles ----------
   One tile per game (numbers, letters, animals, shapes, colors). Each tile shows a small fanned
   stack of three cards with the game's symbols, so a toddler can choose by looking.
   Tapping says e.g. "Let's find pairs of numbers!" and starts that game.
   themes= limits/orders the tiles, e.g. themes=numbers,colors. */
const THEME_TILES = {
  numbers: { tint: NAMED.blue,   faces: ["1", "2", "3"] },
  letters: { tint: NAMED.red,    faces: ["A", "B", "C"] },
  images:  { tint: NAMED.orange, faces: ["🐶", "🐱", "🐮"], emoji: true },
  shapes:  { tint: NAMED.green,  faces: ["triangle", "circle", "square"], shape: true },
  colors:  { tint: NAMED.purple, faces: [NAMED.red, NAMED.blue, NAMED.yellow], swatch: true },
};
const tileThemes = () => {
  const wanted = list("themes").map(t => THEME_ALIASES[t.toLowerCase()] || t.toLowerCase()).filter(t => THEME_TILES[t]);
  return wanted.length ? wanted : Object.keys(THEME_TILES);
};
const startEl = document.getElementById("start"), endEl = document.getElementById("end");
const again = document.getElementById("again");

/* A crayon, drawn diagonally: rounded end, paper wrapper with two stripes, pointed tip.
   Used on the colors tile so it doesn't look like the shapes tile. */
function crayonSVG(c) {
  const dk = darker(c, .78), lt = lighten(c, .45);
  return `<svg class="crayon" viewBox="0 0 100 100"><g transform="rotate(-38 50 50)" stroke-linejoin="round">
    <polygon points="70,34 97,46 97,54 70,66" fill="${c}" stroke="${dk}" stroke-width="3.5"/>
    <rect x="2" y="33" width="71" height="34" rx="9" fill="${c}" stroke="${dk}" stroke-width="3.5"/>
    <rect x="18" y="33" width="40" height="34" fill="${dk}"/>
    <path d="M25 33v34M51 33v34" stroke="${c}" stroke-width="4"/>
    <path d="M8 42h60" stroke="${lt}" stroke-width="4" stroke-linecap="round" opacity=".8"/>
  </g></svg>`;
}

function miniFace(tile, f) {
  if (tile.shape) return `<svg viewBox="0 0 100 100">${SHAPES[f](tile.tint, darker(tile.tint, .85))}</svg>`;
  if (tile.swatch) return crayonSVG(f);
  return `<span class="${tile.emoji ? "emo" : "sym"}" style="color:${tile.tint}">${f}</span>`;
}

/* A tile button for game t. Tapping it starts that game. */
function makeTile(t, i, extraClass = "") {
  const tile = THEME_TILES[t], b = document.createElement("button");
  b.type = "button"; b.className = ("tile " + extraClass).trim(); b.dataset.theme = t;
  b.setAttribute("aria-label", W.themes[t]);
  b.style.setProperty("--tint", lighten(tile.tint, .82)); b.style.animationDelay = (i * .25) + "s";
  // Drawn back to front, so the first symbol (1, A, 🐶 …) sits on top.
  b.innerHTML = [2, 1, 0].map(k => `<span class="mini m${k}">${miniFace(tile, tile.faces[k])}</span>`).join("");
  b.addEventListener("click", () => { hideEnd(); CFG.theme = t; newGame(); beginGame(b, W.themes[t]); });
  return b;
}

function beginGame(fromEl, label) {
  audio(); sfx.pop(); say(label);
  const r = fromEl.getBoundingClientRect();         // festive confetti pop from what was tapped
  sparkle(r.left + r.width * .3, r.top + r.height / 2, Math.max(r.width, r.height) * 1.2, null);
  sparkle(r.left + r.width * .7, r.top + r.height / 2, Math.max(r.width, r.height) * 1.2, null);
  startEl.classList.add("hide");
}

/* ---------- Start screen ----------
   Browsers only allow sound and speech after a tap, and the speech engine is slow to wake up, so
   the game always begins with a tap here: the game tiles, or one "Let's go!" button when the URL
   already chooses the game (theme=, letters=, shapes=, items=). */
/* Tiles are sized to the screen, as big as possible for little hands (like the cards).
   Start screen: try every column count and keep the one giving the biggest tiles.
   End screen: the current game takes ~half the height, the others share one row below. */
const TILE_GAP = () => Math.max(14, Math.min(32, Math.min(innerWidth, innerHeight) * .035));
function bestGrid(n, W, H, gap, max) {
  let best = 0;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    best = Math.max(best, Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows));
  }
  return Math.floor(Math.min(best, max));
}
function fitTiles() {
  const gap = TILE_GAP(), W = innerWidth - 32, H = innerHeight - 32;
  const n = startEl.querySelectorAll(".tile").length;
  if (n) {
    const note = document.getElementById("langnote");
    const noteH = note && note.textContent ? note.offsetHeight + 24 : 0;
    startEl.style.setProperty("--tile", bestGrid(n, W, H - noteH, gap, 420) + "px");
    startEl.style.setProperty("--tile-gap", gap + "px");
  }
  // Other games: one row on wide screens, wrapping (e.g. 2×2 on a phone) when that makes them bigger.
  const m = Math.max(1, endEl.querySelectorAll(".tile.small").length);
  const small = bestGrid(m, W, H * .4, gap, 220);
  const cols = Math.max(1, Math.min(m, Math.floor((W + gap) / (small + gap))));
  const rows = Math.ceil(m / cols), othersH = rows * small + (rows - 1) * gap;
  const big = Math.floor(Math.min(H - othersH - gap * 1.5, W * .8, 440));
  endEl.style.setProperty("--others-w", (cols * small + (cols - 1) * gap) + "px");
  endEl.style.setProperty("--big", big + "px");
  endEl.style.setProperty("--small", small + "px");
  endEl.style.setProperty("--tile-gap", gap + "px");
}

function initStartScreen() {
  addEventListener("resize", fitTiles);
  if (Q.get("start") === "0") { startEl.remove(); return; }
  const go = startEl.querySelector(".go"), tiles = startEl.querySelector(".themes");
  if (THEME_GIVEN) {
    tiles.remove();
    const label = Q.get("starttext") || W.start;
    go.querySelector("span").textContent = label;
    go.setAttribute("aria-label", label);
    go.addEventListener("click", () => beginGame(go, label));
  } else {
    go.remove();
    tileThemes().forEach((t, i) => tiles.appendChild(makeTile(t, i)));
  }
  updateLangNotice();
  fitTiles();
}

/* ---------- After the fireworks ----------
   The game just played as a big tile in the middle (most likely what the child wants again),
   with the other games as smaller tiles underneath. When the URL fixed the game (or it is a
   custom game with no tile), a single "play again" button instead. */
function showAgain() {
  const current = THEME_TILES[CFG.theme] && !THEME_GIVEN ? CFG.theme : null;
  if (!current) { again.classList.add("show"); requestAnimationFrame(() => again.style.opacity = 1); return; }
  endEl.innerHTML = "";
  endEl.appendChild(makeTile(current, 0, "big"));
  const others = document.createElement("div"); others.className = "others";
  tileThemes().filter(t => t !== current).forEach((t, i) => others.appendChild(makeTile(t, i + 1, "small")));
  endEl.appendChild(others);
  fitTiles();
  endEl.classList.add("show");
}
function hideEnd() {
  stopFireworks();
  endEl.classList.remove("show");
  again.style.opacity = 0; again.classList.remove("show");
}

function initAgainButton() {
  again.addEventListener("click", () => { sfx.tap(); hideEnd(); newGame(); });
}

function overlay() {
  const box = document.createElement("div"); box.className = "overlay";
  document.body.appendChild(box); return box;
}

function initHelp() {
  if (Q.get("help") !== "1") return;
  const box = overlay(); box.textContent = HELP; box.onclick = () => box.remove();
}

/* ?voices=1: what this browser offers; tap a row to hear it. */
function initVoiceList() {
  if (Q.get("voices") !== "1") return;
  const box = overlay();
  const render = () => {
    const vs = synth ? synth.getVoices() : [];
    box.innerHTML = "";
    const head = document.createElement("div");
    head.textContent = !synth ? "Speech is not available (or tts=0)." :
      `${vs.length} voices in this browser. ★ = the one the game uses now (lang=${LANG_TAG}, voice=${VOICE_Q}).\n` +
      `Tap a voice to hear it. Use its name in the URL: voice=<part of the name>.  Tap here to close.\n\n`;
    head.onclick = () => box.remove(); box.appendChild(head);
    vs.slice().sort((a, b) => a.lang.localeCompare(b.lang) || quality(b) - quality(a)).forEach(v => {
      const row = document.createElement("div"); row.className = "voice";
      row.textContent = `${v === voice ? "★" : " "} ${v.lang.padEnd(6)} ${v.name}  [${genderOf(v) || "?"}, ${v.localService ? "local" : "online"}, quality ${quality(v)}]`;
      row.onclick = () => { synth.cancel(); const u = new SpeechSynthesisUtterance(speaksLang(v) ? W.sample : "Hello, one, two, three"); u.voice = v; u.lang = v.lang; synth.speak(u); };
      box.appendChild(row);
    });
  };
  render(); synth?.addEventListener?.("voiceschanged", render);
}
