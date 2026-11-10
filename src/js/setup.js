"use strict";
/* setup.js: the parents' setup screen, opened with ?setup or by holding the credit line 4 s.
   - Defaults (this device), always visible at the top: what the child gets when picking a tile alone.
     Saved on the device; "Back to the game" leaves without changing anything.
   - Create a game (link), collapsible below: one specific game. "Start game" turns the choices into
     URL settings and reloads with them (the child then sees one big tile with a replay badge); the
     link can be copied or bookmarked. Open by default when the current link is already such a game. */

const SETUP_THEMES = [
  ["numbers", "Numbers 1 2 3"], ["letters", "Letters A B C"], ["images", "Pictures 🐶🍎🐠"],
  ["shapes", "Shapes ▲"], ["colors", "Colors 🖍️"], ["custom", "My own cards"],
];
const CARD_COUNTS = [4, 6, 8, 10, 12, 16, 20];
/* Shared choices of both forms: how numbers and letters are paired, and the no-movement switch. */
const optHTML = (v, label, sel) => `<option value="${v}"${sel ? " selected" : ""}>${label}</option>`;
const countSelect = cur => `<label>Match to <select name="count">${optHTML("0", "the same number (3 ↔ 3)", !cur)}${optHTML("dots", "dots (3 ↔ ●●●)", cur === "dots")}${optHTML("fingers", "fingers (3 ↔ three fingers up)", cur === "fingers")}</select></label>`;
const caseSelect = cur => `<label>Case <select name="case">${optHTML("upper", "capitals (A B C)", cur !== "lower" && cur !== "pair")}${optHTML("lower", "small letters (a b c)", cur === "lower")}${optHTML("pair", "capital ↔ small (A ↔ a)", cur === "pair")}</select></label>`;
const normCase = v => { v = String(v || "").toLowerCase(); return ["pair", "both", "mixed", "match"].includes(v) ? "pair" : v === "lower" ? "lower" : "upper"; };
const MAX_CARDS = [8, 10, 12, 16, 20];
/* Grow with my child (both forms). */
const helpRows = (adapt, maxc) => `<div class="row" style="margin-top:8px">
    <label><input type="checkbox" name="adapt"${adapt ? " checked" : ""}> grow with my child</label>
    <label>up to <select name="maxcards">${MAX_CARDS.map(n => optHTML(n, `${n} cards`, n === maxc)).join("")}</select></label>
    <small>Starts at “Cards”. After two games where your child remembers well, one pair more; after a hard game, one pair less (never under 4 cards). Your child won't notice.</small>
  </div>`;
const stillRow = on => `<div class="row" style="margin-top:8px">
    <label><input type="checkbox" name="still"${on ? " checked" : ""}> no movement</label>
    <small>Cards change without turning, found pairs disappear, no fades, sparkles or fireworks, softer and fewer sounds.</small>
  </div>`;

function setupForm() {
  const own = list("items").join("\n");
  const ownArePictures = CFG.theme === "images" && own;
  const cur = ownArePictures ? "custom" : (THEME_GIVEN ? CFG.theme : "numbers");
  const opt = (v, label, sel) => `<option value="${v}"${sel ? " selected" : ""}>${label}</option>`;
  const checked = b => b ? " checked" : "";
  const shapesWanted = list("shapes").map(s => s.toLowerCase());
  return `<div class="setup-wrap">
  <h1>Memoriter: settings</h1>
${defaultsForm()}
${progressHTML()}
  <form class="create-form" autocomplete="off"><details${THEME_GIVEN ? " open" : ""}>
  <summary>Create a game (link)</summary>
  <p class="lead">Make one specific game, then press <b>Start game</b>. Bookmark or copy the link to use the same game again.</p>

  <fieldset><legend>Game</legend><div class="row choices">
    ${SETUP_THEMES.map(([v, label]) => `<label><input type="radio" name="theme" value="${v}"${checked(v === cur)}><span>${label}</span></label>`).join("")}
  </div></fieldset>

  <fieldset data-for="numbers"><legend>Numbers</legend><div class="row">
    <label>From <input type="number" name="from" value="${escapeHTML(Q.get("from") || "1")}"></label>
    <label>to <input type="number" name="to" value="${escapeHTML(Q.get("to") || "")}" placeholder="auto"></label>
    ${countSelect(CFG.count)}
    <small>Leave “to” empty to use as many numbers as there are pairs. With dots or fingers, numbers stay within 1 to 10.</small>
  </div></fieldset>

  <fieldset data-for="letters"><legend>Letters</legend><div class="row">
    <label>Which <input type="text" name="letters" value="${escapeHTML(Q.get("letters") || "")}" placeholder="abc"></label>
    ${caseSelect(normCase(Q.get("case")))}
    <label>Say <select name="phonics">${opt("0", "the letter name (bee)", CFG.phonics === "0")}${opt("1", "the letter sound (buh)", CFG.phonics === "1" || CFG.phonics === "sound")}${opt("both", "both (bee … buh)", CFG.phonics === "both")}</select></label>
    <small>abc = whole alphabet · a-d = a range · aeiou = exactly these · vowels</small>
  </div></fieldset>

  <fieldset data-for="shapes"><legend>Shapes</legend><div class="row">
    ${Object.keys(SHAPES).map(s => `<label><input type="checkbox" name="shape" value="${s}"${checked(shapesWanted.includes(s))}> ${s}</label>`).join("")}
    <small>None ticked = random shapes.</small>
  </div></fieldset>

  <fieldset data-for="images"><legend>Pictures</legend><div class="row">
    <label>Set <select name="set">${opt("random", "a different one each game", SET_WANTED.length !== 1)}${Object.keys(W.sets).map(k => opt(k, W.sets[k].items.slice(0, 3).map(v => v.split("|")[0]).join(" ") + " " + k, SET_WANTED.length === 1 && SET_WANTED[0] === k)).join("")}</select></label>
  </div></fieldset>

  <fieldset data-for="custom"><legend>My own cards</legend>
    <textarea name="items" placeholder="One card per line, e.g.&#10;cat&#10;A|Apple   (shows A, says Apple)&#10;🐶|dog">${escapeHTML(own)}</textarea>
    <div class="row"><label><input type="checkbox" name="pictures"${checked(ownArePictures)}> these are pictures (emoji or image links)</label></div>
  </fieldset>

  <fieldset><legend>Cards and voice</legend><div class="row">
    <label>Cards <select name="cards">${CARD_COUNTS.map(n => opt(n, `${n} (${n / 2} pairs)`, n === Math.floor(num("cards", 8) / 2) * 2)).join("")}</select></label>
    <label>Language <select name="lang">${opt("en", "English", LANG === "en")}${opt("es", "Español", LANG === "es")}</select></label>
    <label>Voice <select name="voice">${["auto", "soft", "female", "male"].map(v => opt(v, v, v === VOICE_Q)).join("")}</select></label>
  </div><div class="row" style="margin-top:8px">
    <label><input type="checkbox" name="tts"${checked(CFG.tts)}> say each card out loud</label>
    <label><input type="checkbox" name="sound"${checked(CFG.sound)}> sounds</label>
    <label><input type="checkbox" name="fullscreen"${checked(CFG.fullscreen)}> full screen when the game starts</label>
  </div><div class="row" style="margin-top:8px">
    <label><input type="checkbox" name="pace"${checked(CFG.fast)}> fast pace</label>
    <small>Off (calm): taps are ignored while two cards are open, so rushing does nothing. On: quick players can go on at once.</small>
  </div><div class="row" style="margin-top:8px">
    <label>Peek <input type="number" name="peek" min="0" max="30" value="${CFG.peek}"> seconds</label>
    <small>Shows every card face up for a moment when the game starts, then turns them over. 0 = off.</small>
  </div>${helpRows(CFG.adapt, adaptMax())}${stillRow(!CFG.motion)}<div class="row" style="margin-top:8px">
    <label>Rest after <input type="number" name="rest" min="0" max="50" value="${CFG.rest}"> games</label>
    <small>A sleepy moon says it's time for a break; a grown-up holds the small star at the top right 4 s to unlock. 0 = never.</small>
  </div></fieldset>

  <div class="actions">
    <button type="submit" class="start">Start game ▶</button>
    <button type="button" class="copy">Copy link</button>
    <div class="link"></div>
  </div>
  </details></form>
  <p class="credits">Emoji graphics: <a href="https://openmoji.org" target="_blank" rel="noopener">OpenMoji</a>, the open-source emoji project, CC BY-SA 4.0.</p>
</div>`;
}

/* ---------- Defaults (this device) ----------
   What the child gets when picking a tile alone, e.g. numbers 10–20 once 1–8 are known. Saved on
   this device (localStorage), used whenever the address doesn't say otherwise. */
const DEFAULT_KEYS = ["from", "to", "count", "letters", "case", "phonics", "shapes", "set", "emoji", "cards", "voice", "tts", "sound", "fullscreen", "pace", "peek", "animation", "rest", "adapt", "maxcards"];
function defaultsForm() {
  const D = SAVED_DEFAULTS, has = Object.keys(D).length > 0;
  const opt = (v, label, sel) => `<option value="${v}"${sel ? " selected" : ""}>${label}</option>`;
  const checked = b => b ? " checked" : "";
  const dShapes = String(D.shapes || "").split(",").filter(Boolean);
  const dSets = String(D.set || "").split(",").filter(Boolean);
  const dCards = parseInt(D.cards || "8", 10), dPh = D.phonics || "0";
  return `<form class="defaults-form" autocomplete="off">
  <h2>Defaults (this device)${has ? " · custom" : ""}</h2>
  <p class="lead">What your child gets when choosing a game on their own. Change them as they learn,
    e.g. numbers 10 to 20 once 1 to 8 are known. Saved on this device only; a game made below (a link) still wins.</p>

  <fieldset><legend>Numbers</legend><div class="row">
    <label>From <input type="number" name="from" value="${escapeHTML(D.from || "1")}"></label>
    <label>to <input type="number" name="to" value="${escapeHTML(D.to || "")}" placeholder="auto"></label>
    ${countSelect(D.count === "fingers" ? "fingers" : D.count && D.count !== "0" ? "dots" : "")}
  </div></fieldset>

  <fieldset><legend>Letters</legend><div class="row">
    <label>Which <input type="text" name="letters" value="${escapeHTML(D.letters || "")}" placeholder="abc"></label>
    ${caseSelect(normCase(D.case))}
    <label>Say <select name="phonics">${opt("0", "the letter name (bee)", dPh === "0")}${opt("1", "the letter sound (buh)", dPh === "1")}${opt("both", "both (bee … buh)", dPh === "both")}</select></label>
  </div></fieldset>

  <fieldset><legend>Shapes</legend><div class="row">
    ${Object.keys(SHAPES).map(s => `<label><input type="checkbox" name="shape" value="${s}"${checked(dShapes.includes(s))}> ${s}</label>`).join("")}
    <small>None ticked = all shapes.</small>
  </div></fieldset>

  <fieldset><legend>Pictures</legend><div class="row">
    <label>Emoji <select name="emoji">${opt("openmoji", "OpenMoji (same on every device)", D.emoji !== "native")}${opt("native", "this device's own emoji", D.emoji === "native")}</select></label>
  </div><div class="row" style="margin-top:8px">
    ${Object.keys(W.sets).map(k => `<label><input type="checkbox" name="set" value="${k}"${checked(dSets.includes(k))}> ${W.sets[k].items.slice(0, 3).map(v => v.split("|")[0]).join(" ")} ${k}</label>`).join("")}
    <small>Tick one set or several; each game uses one of them at random. None ticked = all sets.</small>
  </div></fieldset>

  <fieldset><legend>Cards and voice</legend><div class="row">
    <label>Cards <select name="cards">${CARD_COUNTS.map(n => opt(n, `${n} (${n / 2} pairs)`, n === dCards)).join("")}</select></label>
    <label>Voice <select name="voice">${["auto", "soft", "female", "male"].map(v => opt(v, v, v === (D.voice || "auto"))).join("")}</select></label>
  </div><div class="row" style="margin-top:8px">
    <label><input type="checkbox" name="tts"${checked(D.tts !== "0")}> say each card out loud</label>
    <label><input type="checkbox" name="sound"${checked(D.sound !== "0")}> sounds</label>
    <label><input type="checkbox" name="fullscreen"${checked(D.fullscreen !== "0")}> full screen</label>
  </div><div class="row" style="margin-top:8px">
    <label><input type="checkbox" name="pace"${checked(D.pace === "fast")}> fast pace</label>
    <small>Off (calm): taps are ignored while two cards are open, so rushing does nothing. On: quick players can go on at once.</small>
  </div><div class="row" style="margin-top:8px">
    <label>Peek <input type="number" name="peek" min="0" max="30" value="${escapeHTML(D.peek ?? "0")}"> seconds</label>
    <small>Shows every card face up for a moment when the game starts, then turns them over. 0 = off.</small>
  </div>${helpRows(D.adapt === "1", parseInt(D.maxcards || "16", 10))}${stillRow(D.animation === "0")}<div class="row" style="margin-top:8px">
    <label>Rest after <input type="number" name="rest" min="0" max="50" value="${escapeHTML(D.rest ?? "6")}"> games</label>
  </div></fieldset>

  <div class="actions">
    <button type="submit" class="start">Save defaults</button>
    <button type="button" class="cancel">Back to the game</button>
    <button type="button" class="reset">Reset to original</button>
    <span class="saved" aria-live="polite"></span>
  </div>
</form>`;
}
/* ---------- Progress (this device) ----------
   Little stats from stats.js: how much was played, how often the child remembered where a card's
   pair was, which cards are forgotten most, the grow-with-my-child level and the last games. */
const THEME_NAMES = { numbers: "Numbers", letters: "Letters", images: "Pictures", shapes: "Shapes", colors: "Colors", custom: "My own cards" };
const fmtTime = ms => { const s = Math.round(ms / 1000); return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`; };
const pct = (a, b) => b ? Math.round(100 * a / b) + " %" : "–";
const sumOf = (gs, k) => gs.reduce((n, g) => n + (g[k] || 0), 0);
/* Time per pair, so games with different numbers of cards can be compared (a 16-card game takes longer). */
const perPair = gs => { const ms = sumOf(gs.filter(g => g.ms), "ms"), pairs = sumOf(gs.filter(g => g.ms), "pairs"); return pairs ? fmtTime(ms / pairs) : "–"; };
function itemHTML(e) {
  if (e.kind === "emoji") return `<span class="pi">${emojiHTML(e.label)}</span>`;
  if (e.kind === "text") return `<span class="pi txt">${escapeHTML(e.label)}</span>`;
  return `<span class="pi">${escapeHTML(e.label)}</span>`;
}
function progressHTML() {
  const { games, items } = loadStats();
  const day = 864e5, now = Date.now(), today = new Date().setHours(0, 0, 0, 0);
  const last10 = games.slice(-10), prev10 = games.slice(-20, -10);
  const rem = gs => pct(sumOf(gs, "quick"), sumOf(gs, "quick") + sumOf(gs, "miss"));
  const lv = adaptLevel();
  const level = CFG.adapt || lv ? `<p><b>Grow with my child:</b> ${CFG.adapt ? "on" : "off"}, next game with <b>${lv ? lv.cards : CFG.pairs * 2} cards</b> (from 4 up to ${adaptMax()}).</p>` : "";
  // Cards forgotten most, per game: forgot / (forgot + remembered), only cards that were forgotten.
  const byTheme = {};
  for (const e of Object.values(items)) if (e.miss) (byTheme[e.theme] ||= []).push(e);
  const practise = Object.entries(byTheme).map(([t, es]) => {
    es.sort((a, b) => b.miss / (b.miss + b.quick) - a.miss / (a.miss + a.quick) || b.miss - a.miss);
    return `<div class="prow"><b>${THEME_NAMES[t] || t}</b> ${es.slice(0, 8).map(e => `<span class="pitem" title="${escapeHTML(e.say || "")}">${itemHTML(e)}<small>forgot ${e.miss} of ${e.miss + e.quick}</small></span>`).join("")}</div>`;
  }).join("");
  const perTheme = Object.entries(games.reduce((m, g) => (m[g.theme] = (m[g.theme] || 0) + 1, m), {}))
    .sort((a, b) => b[1] - a[1]).map(([t, n]) => `${THEME_NAMES[t] || t} ${n}`).join(" · ");
  const rows = games.slice(-10).reverse().map(g => `<tr><td>${new Date(g.t).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}</td><td>${THEME_NAMES[g.theme] || g.theme}</td><td>${g.pairs * 2}</td><td>${fmtTime(g.ms)} <small>(${perPair([g])} / pair)</small></td><td>${g.mism}</td><td>${g.quick} / ${g.miss}</td></tr>`).join("");
  return `<details class="progress"><summary>Progress (this device)</summary>
  <p class="lead">Kept on this device only. Times are given per pair, so games with more or fewer cards compare fairly. A memory game trains remembering <i>where</i> a card was, so “remembered” counts the times your child turned over a card whose pair had already been seen and then found it; “forgot” the times they picked another card instead. Guessing (the pair not seen yet) and the last pair (it can't be missed) don't count.</p>
  ${games.length ? `<div class="pstats">
    <div><b>${games.filter(g => g.t >= today).length}</b><small>games today</small></div>
    <div><b>${games.filter(g => g.t >= now - 7 * day).length}</b><small>last 7 days</small></div>
    <div><b>${games.length}</b><small>in all</small></div>
    <div><b>${perPair(last10)}</b><small>per pair (last 10)</small></div>
    ${prev10.length ? `<div><b>${perPair(prev10)}</b><small>per pair (10 before)</small></div>` : ""}
    <div><b>${rem(last10)}</b><small>remembered (last 10)</small></div>
    ${prev10.length ? `<div><b>${rem(prev10)}</b><small>remembered (10 before)</small></div>` : ""}
  </div>
  ${level}
  <p><b>Games played:</b> ${perTheme}</p>
  ${practise ? `<h3>Cards forgotten most</h3>${practise}` : `<p>No card has been forgotten yet.</p>`}
  <h3>Last games</h3>
  <table class="ptable"><tr><th>When</th><th>Game</th><th>Cards</th><th>Time</th><th>Mismatches</th><th>Remembered / forgot</th></tr>${rows}</table>`
  : `<p>No games yet on this device.</p>${level}`}
  <div class="actions"><button type="button" class="clearstats">Clear progress</button></div>
</details>`;
}
function initProgress(box) {
  box.querySelector(".clearstats")?.addEventListener("click", e => {
    if (!confirm("Delete the progress saved on this device?")) return;
    clearStats();
    const d = box.querySelector(".progress"); d.outerHTML = progressHTML(); box.querySelector(".progress").open = true; initProgress(box);
  });
}

/* Defaults form → only what differs from the built-in defaults. */
function collectDefaults(form) {
  const f = new FormData(form), d = {};
  if (f.get("from") && f.get("from") !== "1") d.from = f.get("from");
  if (f.get("to")) d.to = f.get("to");
  if (f.get("count") !== "0") d.count = f.get("count");
  if (String(f.get("letters") || "").trim()) d.letters = String(f.get("letters")).trim();
  if (f.get("case") !== "upper") d.case = f.get("case");
  if (f.get("phonics") !== "0") d.phonics = f.get("phonics");
  if (f.getAll("shape").length) d.shapes = f.getAll("shape").join(",");
  const sets = f.getAll("set");
  if (sets.length && sets.length < Object.keys(W.sets).length) d.set = sets.join(",");   // all or none ticked = all sets
  if (f.get("emoji") === "native") d.emoji = "native";
  if (f.get("cards") !== "8") d.cards = f.get("cards");
  if (f.get("adapt")) d.adapt = "1";
  if (f.get("maxcards") !== "16") d.maxcards = f.get("maxcards");
  if (f.get("voice") !== "auto") d.voice = f.get("voice");
  if (!f.get("tts")) d.tts = "0";
  if (!f.get("sound")) d.sound = "0";
  if (!f.get("fullscreen")) d.fullscreen = "0";
  if (f.get("pace")) d.pace = "fast";
  if (f.get("still")) d.animation = "0";
  const peek = String(Math.max(0, Math.min(30, parseFloat(f.get("peek")) || 0)));
  if (peek !== "0") d.peek = peek;
  const rest = String(Math.max(0, parseInt(f.get("rest"), 10) || 0));
  if (rest !== "6") d.rest = rest;
  return d;
}
function initDefaultsForm(box) {
  const form = box.querySelector(".defaults-form"), msg = form.querySelector(".saved");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = collectDefaults(form);
    try {
      if (Object.keys(d).length) localStorage.setItem("memoriter-defaults", JSON.stringify(d));
      else localStorage.removeItem("memoriter-defaults");
      msg.textContent = "Saved ✓ (used when your child picks a game on this device)";
    } catch { msg.textContent = "Couldn't save on this device (storage blocked)."; }
  });
  form.querySelector(".reset").addEventListener("click", () => {
    try { localStorage.removeItem("memoriter-defaults"); } catch { /* storage blocked */ }
    location.reload();                                   // redraw the form with the original values
  });
}

/* Form → URL settings. Only what differs from the defaults is written, to keep links short. */
function setupParams(form) {
  const f = new FormData(form), p = new URLSearchParams();
  const theme = f.get("theme");
  const own = String(f.get("items") || "").split("\n").map(s => s.trim()).filter(Boolean);
  if (theme === "custom") {
    if (f.get("pictures")) p.set("theme", "images");
    own.forEach(line => p.append("items", line));
    if (!own.length) p.set("theme", "numbers");
  } else p.set("theme", theme);
  if (theme === "numbers") {
    if (f.get("from") && f.get("from") !== "1") p.set("from", f.get("from"));
    if (f.get("to")) p.set("to", f.get("to"));
    if (f.get("count") !== "0") p.set("count", f.get("count"));
  }
  if (theme === "letters") {
    if (f.get("letters")) p.set("letters", f.get("letters"));
    if (f.get("case") !== "upper") p.set("case", f.get("case"));
    if (f.get("phonics") !== "0") p.set("phonics", f.get("phonics"));
  }
  if (theme === "images" && f.get("set") !== "random") p.set("set", f.get("set"));
  if (theme === "shapes" && f.getAll("shape").length) p.set("shapes", f.getAll("shape").join(","));
  if (f.get("cards") !== "8") p.set("cards", f.get("cards"));
  if (f.get("adapt")) { p.set("adapt", "1"); if (f.get("maxcards") !== "16") p.set("maxcards", f.get("maxcards")); }
  if (f.get("lang") !== "en") p.set("lang", f.get("lang"));
  if (f.get("voice") !== "auto") p.set("voice", f.get("voice"));
  if (!f.get("tts")) p.set("tts", "0");
  if (!f.get("sound")) p.set("sound", "0");
  if (!f.get("fullscreen")) p.set("fullscreen", "0");
  if (f.get("pace")) p.set("pace", "fast");
  if (f.get("still")) p.set("animation", "0");
  const peek = Math.max(0, Math.min(30, parseFloat(f.get("peek")) || 0));
  if (peek) p.set("peek", String(peek));
  if (String(f.get("rest")) !== "6") p.set("rest", String(Math.max(0, parseInt(f.get("rest"), 10) || 0)));
  // Keep the look-and-feel settings a link may already have (patterns, colours, timings …).
  for (const k of ["emoji", "grow", "dark", "colors", "back", "backcolor", "mark", "bg", "bgcolor", "delay", "vanish", "rate", "pitch", "win"]) if (URLQ.has(k)) p.set(k, URLQ.get(k));
  return p;
}

function initSetup() {
  if (!Q.has("setup") && !Q.has("parents")) return;
  const box = document.createElement("div"); box.id = "setup";
  box.innerHTML = setupForm();
  document.body.appendChild(box);
  const form = box.querySelector(".create-form"), link = box.querySelector(".link");
  const urlFor = () => location.href.split(/[?#]/)[0] + "?" + setupParams(form).toString();
  const refresh = () => {
    const theme = new FormData(form).get("theme");
    form.querySelectorAll("fieldset[data-for]").forEach(fs => fs.hidden = fs.dataset.for !== theme);
    link.textContent = urlFor();
  };
  form.addEventListener("input", refresh); form.addEventListener("change", refresh);
  form.addEventListener("submit", e => { e.preventDefault(); location.href = urlFor(); });
  // Cancel: back to the game exactly as it was (same address, just without the setup screen).
  box.querySelector(".cancel").addEventListener("click", () => {
    const p = new URLSearchParams(location.search); p.delete("setup"); p.delete("parents");
    const q = p.toString();
    location.href = location.pathname + (q ? "?" + q : "") + location.hash;
  });
  initDefaultsForm(box);
  initProgress(box);
  box.querySelector(".copy").addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(urlFor()); e.target.textContent = "Copied ✓"; }
    catch { e.target.textContent = "Select the link below to copy"; }
  });
  refresh();
}
