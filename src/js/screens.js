"use strict";
/* screens.js: everything around the board: Start screen, "play again" button,
   ?help=1 (settings list) and ?voices=1 (voice list). */

const HELP = `MEMORITER: a memory pairs game for toddlers. Every setting comes from the URL.

setup    open the parents' setup screen (…/index.html?setup), or hold the faint “…” (bottom-left of the start/end screen) 4 s
theme    numbers | letters | shapes | images (pictures) | colors   (default: the child picks a tile on the Start screen;
         also guessed from letters=, shapes=, items=; then one big tile with a replay badge)
themes   which tiles the Start screen offers, in order, e.g. themes=numbers,colors (default: all five)
cards    number of cards on the board, even number               (default: 8 = 4 pairs)
from,to  numbers range, e.g. from=1&to=20 (random pick if the range has more numbers than pairs)
letters  abc (whole alphabet) | a-d (range) | aeiou (exact list) | vowels
case     upper | lower                                           (default: upper)
phonics  letters say their name (0, default) | their sound, e.g. "buh" (1) | both, "bee … buh" (both)
shapes   comma list: circle,oval,square,rectangle,triangle,diamond,
         pentagon,hexagon,heptagon,octagon,star,heart,semicircle (default: random pick)
emoji    openmoji (default: OpenMoji drawings, same on every device; CC BY-SA 4.0, openmoji.org) | native (the device's own emoji)
set      pictures game: farm | wild | bugs | birds | sea | fruits | nature (things in nature), one or several
         (set=farm,wild,sea: each game picks one of them); random / none = all sets (default: random, a new set each game)
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
peek     seconds every card is shown face up when a game starts (default 0 = off)
pace     fast = a tap while two cards are open moves on at once (for quick players).
         Default (calm): those taps are ignored until the wrong pair turns back or the pair pops away.
back     card back pattern (default: random, new each game, never plain)
         random | plain | dots | polka | stripes | diagonal | checks | grid | zigzag | waves | stars | hearts | bubbles
backcolor card back colour: random | a colour name (softened) | hex like 7FB2F0   (default: random)
mark     0 = hide the white circle in the middle of the card back
bg       page background pattern, same list as "back", drawn very faint (default: plain)
bgcolor  page colour: a colour name (very light tint) or hex like FFF7EA   (default: cream)
(install: open the game on the web, e.g. camayal.info/wa/pairs/, then "Install app" / "Add to Home screen")
fullscreen 0 = don't go full screen when a game tile is tapped (default: full screen where the browser allows it)
seed     number = same shuffle every time
start    0 = skip the Start screen (first card may be silent: browsers need a tap to unlock sound)
win      phrase spoken at the end (default "Good job!" / "¡Muy bien!")
rest     games before the sleepy-moon rest screen (default 6; 0 = never). A grown-up holds the small star at the top right ~4 s to unlock.
grow     longer fireworks after each finished game: max extra slow rockets (default 10, ~9 s more); 0 = always short
(grown-ups: hold a game tile ~1 s to lock that game; only it is offered at the end, and the lock survives a reload)
again    ms after the end before the game tiles show (default: once the last firework has completely faded)

(tap to close)`;

/* ---------- Game tiles ----------
   A tile shows a small fanned stack of three cards with the game's symbols, so a toddler can
   choose by looking. Tapping says e.g. "Let's find pairs of numbers!" and starts that game.
   - Child picks: one tile per game (themes= limits/orders them, e.g. themes=numbers,colors).
   - Parent-made game (the URL sets theme=, letters=, shapes= or items=, e.g. from ?setup):
     one big tile previewing that exact game, with a replay badge. */
const face = (show, kind = "text") => ({ kind, show });
const THEME_TILES = {
  numbers: { tint: NAMED.blue,   faces: [face("1"), face("2"), face("3")] },
  letters: { tint: NAMED.red,    faces: [face("A"), face("B"), face("C")] },
  images:  { tint: NAMED.orange, faces: [face("🐶", "emoji"), face("🍎", "emoji"), face("🐠", "emoji")] },   // pictures: animals, fruits, sea …
  shapes:  { tint: NAMED.green,  faces: [face("triangle", "shape"), face("circle", "shape"), face("square", "shape")] },
  colors:  { tint: NAMED.purple, faces: [face(NAMED.red, "swatch"), face(NAMED.blue, "swatch"), face(NAMED.yellow, "swatch")] },
};
const tileThemes = () => {
  const wanted = list("themes").map(x => THEME_ALIASES[x.toLowerCase()] || x.toLowerCase()).filter(x => THEME_TILES[x]);
  return wanted.length ? wanted : Object.keys(THEME_TILES);
};
const startEl = document.getElementById("start"), endEl = document.getElementById("end");

/* The tile for a parent-made game: previews its first three cards. */
function customTile() {
  const base = THEME_TILES[CFG.theme] || { tint: NAMED.pink };
  const items = buildItems().slice(0, 3);
  while (items.length < 3) items.push(items[items.length - 1] || face("?"));
  return { tint: base.tint, faces: items };
}
/* A grown-up can lock the game from the tiles: hold a tile ~1 s (a soft click and the replay badge
   confirm it), and the game starts when the finger lifts. From then on only that game is offered at
   the end, like a game made in ?setup, and the lock survives a reload (theme= is added to the address).
   A child's short tap is unaffected. */
let lockedTheme = null;
const isLocked = () => THEME_GIVEN || !!lockedTheme;
const LONG_PRESS_MS = 1000;
function lockTheme(theme) {
  lockedTheme = theme;
  try {                                               // keep it on reload: same as a parent-made link
    const p = new URLSearchParams(location.search); p.set("theme", theme);
    history.replaceState(null, "", location.pathname + "?" + p.toString() + location.hash);
  } catch { /* address can't be changed here: the lock still holds until the page closes */ }
}

const tileFor = theme => THEME_GIVEN ? customTile() : THEME_TILES[theme];
const tileLabel = theme => theme === "images" && !list("items").length ? W.findPairs(W.sets[currentSet()].name) : W.themes[theme] || W.start;

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

/* What one mini card on a tile shows. */
function miniFace(tint, f) {
  if (f.kind === "shape") return `<svg viewBox="0 0 100 100">${SHAPES[f.show](tint, darker(tint, .85))}</svg>`;
  if (f.kind === "swatch") return crayonSVG(f.show);
  if (f.kind === "img") return `<img src="${encodeURI(f.show)}" alt="">`;
  if (f.kind === "emoji") return `<span class="emo">${emojiHTML(f.show)}</span>`;
  const len = [...f.show].length;
  return `<span class="sym" style="color:${tint};font-size:${Math.min(72, 160 / len)}cqmin">${escapeHTML(f.show)}</span>`;
}

const REPLAY_ICON = `<span class="replay" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg></span>`;

/* A tile button for game `theme`. Tapping it starts that game. */
function makeTile(theme, i, extraClass = "") {
  const tile = tileFor(theme), b = document.createElement("button");
  b.type = "button"; b.className = ("tile " + extraClass).trim(); b.dataset.theme = theme;
  b.setAttribute("aria-label", tileLabel(theme));
  b.style.setProperty("--tint", lighten(tile.tint, .82));
  // Drawn back to front, so the first symbol (1, A, 🐶 …) sits on top.
  b.innerHTML = [2, 1, 0].map(k => `<span class="mini m${k}">${miniFace(tile.tint, tile.faces[k])}</span>`).join("")
              + (isLocked() ? REPLAY_ICON : "");
  const start = () => {
    // Child-picked pictures game: a fresh set each time (a parent-made or locked game keeps its set).
    if (theme === "images" && !isLocked()) chooseSet();
    hideEnd(); CFG.theme = theme; newGame(); beginGame(b, tileLabel(theme));
  };
  // Long press = grown-up lock (see lockTheme). The game then starts on release, because browsers
  // only allow sound and full screen right after a finger lifts.
  let timer = null, armed = false;
  const cancel = () => { clearTimeout(timer); timer = null; b.classList.remove("holding"); };
  b.addEventListener("pointerdown", e => {
    if (e.button > 0 || isLocked()) return;
    armed = false; b.classList.add("holding");
    timer = setTimeout(() => {
      armed = true; timer = null; b.classList.remove("holding"); b.classList.add("armed");
      if (!b.querySelector(".replay")) b.insertAdjacentHTML("beforeend", REPLAY_ICON);
      if (audio()) tone(880, AC.currentTime, { type: "sine", peak: .12, decay: .08 });
      navigator.vibrate?.(30);
    }, LONG_PRESS_MS);
  });
  // After a long hold, touch screens often send no "click" when the finger lifts (and some cancel
  // the pointer), so the locked game starts on the lift itself: pointerup, or touchend as a backup.
  // Both still count as a real touch, so sound and full screen are allowed.
  let suppressClick = false;
  const releaseArmed = e => {
    if (!armed) return;
    armed = false; suppressClick = true; setTimeout(() => { suppressClick = false; }, 600);
    if (e.cancelable) e.preventDefault();
    lockTheme(theme); start();
  };
  b.addEventListener("pointerup", e => { if (armed) releaseArmed(e); else if (timer) cancel(); });
  b.addEventListener("touchend", releaseArmed);
  b.addEventListener("pointerleave", () => { if (!armed) cancel(); });
  b.addEventListener("pointercancel", () => { if (!armed) cancel(); });   // armed: wait for touchend
  b.addEventListener("contextmenu", e => e.preventDefault());
  b.addEventListener("click", () => {
    if (suppressClick) { suppressClick = false; return; }   // the locked game already started
    if (timer) cancel();
    if (armed) { armed = false; lockTheme(theme); }
    start();
  });
  return b;
}

/* Full screen on the child's tap, so the browser's address bar and buttons can't be pressed by
   accident. Browsers only allow this right after a tap. Works on Android, desktop and iPad
   (and inside a same-site iframe that allows fullscreen); iPhone Safari doesn't support it.
   fullscreen=0 turns it off. On Android, the back gesture leaves full screen. */
function goFullscreen() {
  if (!CFG.fullscreen || document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch { /* not allowed here: keep playing normally */ }
}

function beginGame(fromEl, label) {
  goFullscreen();
  audio(); sfx.pop(); say(label);
  const r = fromEl.getBoundingClientRect();         // festive confetti pop from what was tapped
  sparkle(r.left + r.width * .3, r.top + r.height / 2, Math.max(r.width, r.height) * 1.2, null);
  sparkle(r.left + r.width * .7, r.top + r.height / 2, Math.max(r.width, r.height) * 1.2, null);
  startEl.classList.add("hide");
  peekCards(500);                                   // peek=N: once the start screen has faded
}

/* Tiles are sized to the screen, as big as possible for little hands (like the cards).
   Start screen: try every column count and keep the one giving the biggest tiles.
   End screen: the current game takes ~half the height, the others below (wrapping on phones). */
const CREDIT_H = 26;                                // strip kept free at the bottom for the credit line
const TILE_GAP = () => Math.max(14, Math.min(32, Math.min(innerWidth, innerHeight) * .035));
/* Best square size for n tiles in W×H: tries every column count. Ties (e.g. when the size is
   capped) go to the more even layout. Returns { size, cols, width } where width is the
   exact row width, so the browser wraps the tiles into exactly that many columns. */
function bestGrid(n, W, H, gap, max) {
  let best = { size: 0, cols: 1, empty: Infinity };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols), empty = cols * rows - n;
    const size = Math.floor(Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows, max));
    // Bigger wins; on a tie (size capped) the more even layout wins: 3 + 2 rather than 4 + 1.
    if (size > best.size || (size === best.size && empty <= best.empty)) best = { size, cols, empty };
  }
  return { ...best, width: best.cols * best.size + (best.cols - 1) * gap };
}
function fitTiles() {
  const gap = TILE_GAP(), W = innerWidth - 32, H = innerHeight - 32 - CREDIT_H;
  const n = startEl.querySelectorAll(".tile").length;
  if (n) {
    const note = document.getElementById("langnote");
    const noteH = note && note.textContent ? note.offsetHeight + 24 : 0;
    const g = bestGrid(n, W, H - noteH, gap, n === 1 ? 440 : 420);
    startEl.style.setProperty("--tile", g.size + "px");
    startEl.style.setProperty("--themes-w", g.width + "px");
    startEl.style.setProperty("--tile-gap", gap + "px");
  }
  // End screen: the other games get up to 40% of the height; the big tile takes the rest.
  const m = endEl.querySelectorAll(".tile.small").length;
  const o = m ? bestGrid(m, W, H * .4, gap, 220) : { size: 0, cols: 1, width: 0 };
  const rows = m ? Math.ceil(m / o.cols) : 0, othersH = rows ? rows * o.size + (rows - 1) * gap + gap * 1.5 : 0;
  endEl.style.setProperty("--big", Math.floor(Math.min(H - othersH, W * .8, 440)) + "px");
  endEl.style.setProperty("--small", o.size + "px");
  endEl.style.setProperty("--others-w", o.width + "px");
  endEl.style.setProperty("--tile-gap", gap + "px");
}

/* ---------- Start screen ----------
   Browsers only allow sound and speech after a tap, and the speech engine is slow to wake up, so
   the game always begins with a tap on a tile. */
/* ---------- Rest screen ----------
   After CFG.rest finished games (default 6) a sleepy moon replaces the game tiles: "Time for a
   break". Nothing to tap for the child; a grown-up holds one small star near the top-right corner
   ~4 s to unlock (fresh count). It looks like the other stars and brightens slowly while held.
   It also comes back after a reload, so reloading doesn't skip the rest. rest=0 turns it off. */
const restEl = document.getElementById("rest");
function showRest() {
  hideEndTilesOnly();
  stopFireworks();                                  // no more rockets: quiet from here
  night.classList.add("on");
  restEl.classList.add("show");
  say(W.rest);
}
function hideEndTilesOnly() { endEl.classList.remove("show"); }
function initRest() {
  const moon = restEl.querySelector(".unlock-star");   // the hidden grown-up star (not the moon)
  let timer = null;
  const cancel = () => { clearTimeout(timer); timer = null; moon.classList.remove("holding"); };
  moon.addEventListener("pointerdown", e => {
    if (e.button > 0) return;
    moon.classList.add("holding");
    timer = setTimeout(() => {
      timer = null; moon.classList.remove("holding");
      resetGames();
      restEl.classList.remove("show"); night.classList.remove("on");
      audio(); if (AC) tone(660, AC.currentTime, { type: "sine", peak: .1, decay: .15 });
      if (startEl.isConnected && !startEl.classList.contains("hide")) return;   // came from a reload: tiles are already there
      showAgain();
    }, 4000);
  });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) moon.addEventListener(ev, cancel);
  moon.addEventListener("contextmenu", e => e.preventDefault());
  // Rest already due when the page opens (e.g. after a reload): show the moon over the Start screen.
  if (restDue()) { night.classList.add("on"); restEl.classList.add("show"); }
}

/* Small, faint EN · ES switch in the bottom-right corner of the start and end screens (never during
   play). It switches on the spot (no reload): words, voice, tiles and the waiting board all change.
   The choice is remembered on this device and written into the address (lang=), so a reload or a
   copied link keeps it. */
function switchLanguage(code) {
  if (!TEXT[code] || code === LANG) return;
  LANG = code; LANG_TAG = code; W = TEXT[code];
  document.documentElement.lang = code;
  try { localStorage.setItem("memoriter-lang", code); } catch { /* storage blocked: just this session */ }
  try {
    const p = new URLSearchParams(location.search); p.set("lang", code);
    history.replaceState(null, "", location.pathname + "?" + p.toString() + location.hash);
  } catch { /* address can't be changed here */ }
  chooseVoice();
  // Redraw whatever is on screen in the new language.
  if (startEl.isConnected && !startEl.classList.contains("hide")) { newGame(); renderStartTiles(); }
  if (endEl.classList.contains("show")) showAgain();
}
function langSwitch() {
  const el = document.createElement("div"); el.className = "langsw";
  for (const code of ["en", "es"]) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = code.toUpperCase(); b.lang = code;
    b.setAttribute("aria-label", code === "en" ? "English" : "Español");
    if (code === LANG) b.className = "on";
    b.addEventListener("click", e => {
      e.stopPropagation();
      switchLanguage(code);
    });
    el.appendChild(b);
    if (code === "en") el.insertAdjacentHTML("beforeend", "<span>·</span>");
  }
  return el;
}

function initStartScreen() {
  addEventListener("resize", fitTiles);
  if (Q.get("start") === "0") { startEl.remove(); return; }
  renderStartTiles();
}
/* Grown-up door to the setup screen: a faint "…" in the bottom-left corner of the start and end
   screens (mirroring EN · ES on the right). Hold it 4 s (it darkens slowly while held); a short
   touch does nothing. Opens ?setup with the current settings. */
function setupDoor(container) {
  container.querySelector(".setupdoor")?.remove();
  const el = document.createElement("div"); el.className = "setupdoor"; el.textContent = "…";
  el.setAttribute("aria-label", "Settings (hold)");
  let timer = null;
  const cancel = () => { clearTimeout(timer); timer = null; el.classList.remove("holding"); };
  el.addEventListener("pointerdown", e => {
    if (e.button > 0) return;
    e.preventDefault(); e.stopPropagation();
    el.classList.add("holding");
    timer = setTimeout(() => {
      const p = new URLSearchParams(location.search); p.set("setup", "");
      location.href = location.pathname + "?" + p.toString().replace(/setup=(&|$)/, "setup$1");
    }, 4000);
  });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) el.addEventListener(ev, cancel);
  el.addEventListener("contextmenu", e => e.preventDefault());
  container.appendChild(el);
}

/* Start screen tiles + EN · ES switch (also redrawn when the language changes). */
function renderStartTiles() {
  const tiles = startEl.querySelector(".themes");
  tiles.innerHTML = "";
  if (THEME_GIVEN) tiles.appendChild(makeTile(CFG.theme, 0, "big"));
  else tileThemes().forEach((theme, i) => tiles.appendChild(makeTile(theme, i)));
  startEl.querySelector(".langsw")?.remove();
  startEl.appendChild(langSwitch());
  setupDoor(startEl);
  updateLangNotice();
  fitTiles();
}

/* ---------- After the fireworks ----------
   The game just played as a big tile in the middle (most likely what the child wants again),
   with the other games as smaller tiles underneath. For a parent-made game: only its big tile. */
function showAgain() {
  if (restDue()) { showRest(); return; }
  endEl.querySelector(".langsw")?.remove();
  const current = CFG.theme;
  if (current === "images" && isLocked()) chooseSet();   // random set: the tile previews the next one
  endEl.innerHTML = "";
  endEl.appendChild(makeTile(current, 0, "big"));
  if (!isLocked()) {
    const others = document.createElement("div"); others.className = "others";
    tileThemes().filter(x => x !== current).forEach((x, i) => others.appendChild(makeTile(x, i + 1, "small")));
    endEl.appendChild(others);
  }
  endEl.appendChild(langSwitch());
  setupDoor(endEl);
  fitTiles();
  endEl.classList.add("show");
}
function hideEnd() {
  stopFireworks();
  endEl.classList.remove("show");
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
