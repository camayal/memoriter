"use strict";
/* setup.js: the parents' setup screen, opened with ?setup or by holding the credit line 4 s.
   - Defaults (this device), always visible at the top: what the child gets when picking a tile alone.
     Saved on the device; "Back to the game" leaves without changing anything.
   - Create a game (link), collapsible below: one specific game. "Start game" turns the choices into
     URL settings and reloads with them (the child then sees one big tile with a replay badge); the
     link can be copied or bookmarked. Open by default when the current link is already such a game. */

const SETUP_THEMES = [
  ["numbers", "Numbers 1 2 3"], ["letters", "Letters A B C"], ["images", "Pictures", "🐶 🍎 🐠"],
  ["shapes", "Shapes ▲"], ["colors", "Colors", "🖍️"], ["custom", "My own cards"],
];
const CARD_COUNTS = [4, 6, 8, 10, 12, 16, 20];
/* Layout of both forms: one setting per line, like a phone's settings list. The name (and a short
   hint under it, always inside the same line) on the left, its control on the right. The whole line
   is a <label>, so tapping anywhere on it works the switch or opens the list. */
const optHTML = (v, label, sel) => `<option value="${v}"${sel ? " selected" : ""}>${label}</option>`;
const optText = (title, hint) => `<span class="opt-text"><span class="opt-title">${title}</span>${hint ? `<small>${hint}</small>` : ""}</span>`;
const optRow = (title, ctl, hint = "") => `<label class="opt">${optText(title, hint)}<span class="opt-ctl">${ctl}</span></label>`;
/* Several choices that can be ticked together (shapes, picture sets): the chips go under the name. */
const optChips = (title, hint, chips) => `<div class="opt block">${optText(title, hint)}<div class="chips">${chips}</div></div>`;
const chip = (name, value, label, on) => `<label><input type="checkbox" name="${name}" value="${value}"${on ? " checked" : ""}> ${label}</label>`;
const toggle = (name, on) => `<input type="checkbox" class="switch" name="${name}"${on ? " checked" : ""}>`;
const selectHTML = (name, opts) => `<select name="${name}">${opts.map(([v, label, sel]) => optHTML(v, label, sel)).join("")}</select>`;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
/* Emoji in setup are drawn like in the game: OpenMoji, or this device's own when Emoji says so. Each
   one remembers its character (data-e), so changing the Emoji list redraws them at once (see redrawEmoji). */
const emo = (e, style = CFG.emoji) => `<span class="emo" data-e="${escapeHTML(e)}">${style === "native" ? escapeHTML(e) : `<img class="emoji" src="${openmojiURL(e)}" alt="${escapeHTML(e)}" draggable="false" onerror="this.replaceWith(this.alt)">`}</span>`;
const emos = s => s.split(" ").map(e => emo(e)).join("");
const redrawEmoji = (box, style) => box.querySelectorAll(".emo").forEach(el => el.outerHTML = emo(el.dataset.e, style));
const setLabel = k => `${emos(W.sets[k].items.slice(0, 3).map(v => v.split("|")[0]).join(" "))} ${cap(k)}`;

/* Shared rows of both forms. */
const fromToRows = (from, to) => optRow("From", `<input type="number" name="from" value="${escapeHTML(from)}">`)
  + optRow("To", `<input type="number" name="to" value="${escapeHTML(to)}" placeholder="auto">`, "Empty: as many numbers as pairs.");
const countRow = cur => optRow("Match to", selectHTML("count", [["0", "The same number (3 ↔ 3)", !cur], ["dots", "Dots (3 ↔ ●●●)", cur === "dots"], ["fingers", "Fingers (3 ↔ three fingers)", cur === "fingers"]]), "Dots and fingers use 1 to 10.");
const lettersRow = v => optRow("Which letters", `<input type="text" name="letters" value="${escapeHTML(v)}" placeholder="abc">`, "abc · a-d · aeiou · vowels");
const caseRow = cur => optRow("Case", selectHTML("case", [["upper", "Capitals (A B C)", cur !== "lower" && cur !== "pair"], ["lower", "Small (a b c)", cur === "lower"], ["pair", "Capital ↔ small (A ↔ a)", cur === "pair"]]));
const phonicsRow = ph => optRow("Say", selectHTML("phonics", [["0", "The name (bee)", ph === "0"], ["1", "The sound (buh)", ph === "1" || ph === "sound"], ["both", "Both (bee … buh)", ph === "both"]]));
const normCase = v => { v = String(v || "").toLowerCase(); return ["pair", "both", "mixed", "match"].includes(v) ? "pair" : v === "lower" ? "lower" : "upper"; };
const CARD_LABEL = n => `${n} (${n / 2} pairs)`;
const MAX_CARDS = [8, 10, 12, 16, 20];
const VOICES = v => ["auto", "soft", "female", "male"].map(k => [k, cap(k), k === v]);
/* The "Cards", "Sound" and "Pace and screen" groups, the same in both forms. */
const cardsGroup = (cards, adapt, maxc, peek) => `<fieldset><legend>Cards</legend>
    ${optRow("Cards", selectHTML("cards", CARD_COUNTS.map(n => [n, CARD_LABEL(n), n === cards])))}
    ${optRow("Grow with my child", toggle("adapt", adapt), "Starts at Cards. One pair more after 3 good games, one less after a hard one.")}
    ${optRow("Up to", selectHTML("maxcards", MAX_CARDS.map(n => [n, `${n} cards`, n === maxc])), "Most cards Grow with my child can reach.")}
    ${optRow("Peek", `<input type="number" name="peek" min="0" max="30" value="${escapeHTML(String(peek))}"> s`, "All cards face up at the start. 0 = off.")}
  </fieldset>`;
const soundGroup = (extra, voice, tts, sound) => `<fieldset><legend>Voice and sound</legend>
    ${extra}${optRow("Voice", selectHTML("voice", VOICES(voice)))}
    ${optRow("Say each card out loud", toggle("tts", tts))}
    ${optRow("Sounds", toggle("sound", sound), "Taps, pops and fireworks.")}
  </fieldset>`;
const paceGroup = (fast, still, full, rest) => `<fieldset><legend>Pace and screen</legend>
    ${optRow("Fast pace", toggle("pace", fast), "Off: taps wait while two cards are open.")}
    ${optRow("No movement", toggle("still", still), "No turning, fades or fireworks. Quieter sounds.")}
    ${optRow("Full screen", toggle("fullscreen", full), "When the game starts.")}
    ${optRow("Rest after", `<input type="number" name="rest" min="0" max="50" value="${escapeHTML(String(rest))}"> games`, "A sleepy moon asks for a break. To unlock, hold the star at the top right 4 s. 0 = never.")}
  </fieldset>`;

function setupForm() {
  const own = list("items").join("\n");
  const ownArePictures = CFG.theme === "images" && own;
  const cur = ownArePictures ? "custom" : (THEME_GIVEN ? CFG.theme : "numbers");
  const checked = b => b ? " checked" : "";
  const shapesWanted = list("shapes").map(s => s.toLowerCase());
  return `<div class="setup-wrap">
  <h1>Memoriter settings</h1>
${defaultsForm()}
${progressHTML()}
  <form class="create-form" autocomplete="off"><details${THEME_GIVEN ? " open" : ""}>
  <summary>Create a game (link)</summary>
  <p class="lead">One specific game. Press <b>Start game</b>, then bookmark or copy the link.</p>

  <fieldset><legend>Game</legend><div class="chips choices">
    ${SETUP_THEMES.map(([v, label, pics]) => `<label><input type="radio" name="theme" value="${v}"${checked(v === cur)}><span>${label}</span>${pics ? emos(pics) : ""}</label>`).join("")}
  </div></fieldset>

  <fieldset data-for="numbers"><legend>Numbers</legend>
    ${fromToRows(Q.get("from") || "1", Q.get("to") || "")}
    ${countRow(CFG.count)}
  </fieldset>

  <fieldset data-for="letters"><legend>Letters</legend>
    ${lettersRow(Q.get("letters") || "")}
    ${caseRow(normCase(Q.get("case")))}
    ${phonicsRow(CFG.phonics)}
  </fieldset>

  <fieldset data-for="shapes"><legend>Shapes</legend>
    ${optChips("Which shapes", "None ticked: random shapes.", Object.keys(SHAPES).map(s => chip("shape", s, cap(s), shapesWanted.includes(s))).join(""))}
  </fieldset>

  <fieldset data-for="images"><legend>Pictures</legend>
    ${optChips("Set", "", [["random", "A different one each game", SET_WANTED.length !== 1], ...Object.keys(W.sets).map(k => [k, setLabel(k), SET_WANTED.length === 1 && SET_WANTED[0] === k])]
      .map(([v, label, on]) => `<label><input type="radio" name="set" value="${v}"${checked(on)}> ${label}</label>`).join(""))}
  </fieldset>

  <fieldset data-for="custom"><legend>My own cards</legend>
    <textarea name="items" placeholder="One card per line, e.g.&#10;cat&#10;A|Apple   (shows A, says Apple)&#10;🐶|dog">${escapeHTML(own)}</textarea>
    ${optRow("These are pictures", toggle("pictures", ownArePictures), "Emoji or image links.")}
  </fieldset>

  ${cardsGroup(Math.floor(num("cards", 8) / 2) * 2, CFG.adapt, adaptMax(), CFG.peek)}
  ${soundGroup(optRow("Language", selectHTML("lang", [["en", "English", LANG === "en"], ["es", "Español", LANG === "es"]])), VOICE_Q, CFG.tts, CFG.sound)}
  ${paceGroup(CFG.fast, !CFG.motion, CFG.fullscreen, CFG.rest)}

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
  const dShapes = String(D.shapes || "").split(",").filter(Boolean);
  const dSets = String(D.set || "").split(",").filter(Boolean);
  return `<form class="defaults-form" autocomplete="off">
  <h2>Defaults (this device)${has ? " · custom" : ""}</h2>
  <p class="lead">What your child gets when picking a game alone. Change it as they learn (e.g. numbers 10 to 20).
    Saved on this device; a game link (below) wins.</p>

  <fieldset><legend>Numbers</legend>
    ${fromToRows(D.from || "1", D.to || "")}
    ${countRow(D.count === "fingers" ? "fingers" : D.count && D.count !== "0" ? "dots" : "")}
  </fieldset>

  <fieldset><legend>Letters</legend>
    ${lettersRow(D.letters || "")}
    ${caseRow(normCase(D.case))}
    ${phonicsRow(D.phonics || "0")}
  </fieldset>

  <fieldset><legend>Shapes</legend>
    ${optChips("Which shapes", "None ticked: all shapes.", Object.keys(SHAPES).map(s => chip("shape", s, cap(s), dShapes.includes(s))).join(""))}
  </fieldset>

  <fieldset><legend>Pictures</legend>
    ${optRow("Emoji", selectHTML("emoji", [["openmoji", "OpenMoji (same everywhere)", D.emoji !== "native"], ["native", "This device's emoji", D.emoji === "native"]]))}
    ${optChips("Sets", "Each game uses one at random. None ticked: all sets.", Object.keys(W.sets).map(k => chip("set", k, setLabel(k), dSets.includes(k))).join(""))}
  </fieldset>

  ${cardsGroup(parseInt(D.cards || "8", 10), D.adapt === "1", parseInt(D.maxcards || "16", 10), D.peek ?? "0")}
  ${soundGroup("", D.voice || "auto", D.tts !== "0", D.sound !== "0")}
  ${paceGroup(D.pace === "fast", D.animation === "0", D.fullscreen !== "0", D.rest ?? "6")}

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
  if (e.kind === "emoji") return `<span class="pi">${emo(e.label)}</span>`;
  if (e.kind === "text") return `<span class="pi txt">${escapeHTML(e.label)}</span>`;
  return `<span class="pi">${escapeHTML(e.label)}</span>`;
}
function progressHTML() {
  const { games, items } = loadStats();
  const day = 864e5, now = Date.now(), today = new Date().setHours(0, 0, 0, 0);
  const last10 = games.slice(-10), prev10 = games.slice(-20, -10);
  const rem = gs => pct(sumOf(gs, "quick"), sumOf(gs, "quick") + sumOf(gs, "miss"));
  const lv = adaptLevel();
  const level = CFG.adapt || lv ? `<p><b>Grow with my child:</b> ${CFG.adapt ? "on" : "off"}, next game with <b>${lv ? lv.cards : adaptStart()} cards</b> (started at ${adaptStart()}, can go from 4 up to ${adaptMax()}).</p>` : "";
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
  form.elements.emoji.addEventListener("change", e => redrawEmoji(box, e.target.value));   // preview the chosen emoji at once
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
