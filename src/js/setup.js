"use strict";
/* setup.js: the parents' setup screen, opened with ?setup (e.g. index.html?setup).
   A plain form to make one specific game. "Start game" turns the choices into URL settings and
   reloads the page with them; the child then sees one big tile with a replay badge for that game.
   The link can be copied or bookmarked to come back to the same game later.
   Opening ?setup on a link that already has settings pre-fills the form, so it can be edited. */

const SETUP_THEMES = [
  ["numbers", "Numbers 1 2 3"], ["letters", "Letters A B C"], ["images", "Pictures 🐶🍎🐠"],
  ["shapes", "Shapes ▲"], ["colors", "Colors 🖍️"], ["custom", "My own cards"],
];
const CARD_COUNTS = [4, 6, 8, 10, 12, 16, 20];

function setupForm() {
  const own = list("items").join("\n");
  const ownArePictures = CFG.theme === "images" && own;
  const cur = ownArePictures ? "custom" : (THEME_GIVEN ? CFG.theme : "numbers");
  const opt = (v, label, sel) => `<option value="${v}"${sel ? " selected" : ""}>${label}</option>`;
  const checked = b => b ? " checked" : "";
  const shapesWanted = list("shapes").map(s => s.toLowerCase());
  return `<form autocomplete="off">
  <h1>Memoriter: set up a game</h1>
  <p class="lead">Choose what your child will play, then press <b>Start game</b>. Bookmark or copy the link to use the same game again.</p>

  <fieldset><legend>Game</legend><div class="row choices">
    ${SETUP_THEMES.map(([v, label]) => `<label><input type="radio" name="theme" value="${v}"${checked(v === cur)}><span>${label}</span></label>`).join("")}
  </div></fieldset>

  <fieldset data-for="numbers"><legend>Numbers</legend><div class="row">
    <label>From <input type="number" name="from" value="${escapeHTML(Q.get("from") || "1")}"></label>
    <label>to <input type="number" name="to" value="${escapeHTML(Q.get("to") || "")}" placeholder="auto"></label>
    <small>Leave “to” empty to use as many numbers as there are pairs.</small>
  </div></fieldset>

  <fieldset data-for="letters"><legend>Letters</legend><div class="row">
    <label>Which <input type="text" name="letters" value="${escapeHTML(Q.get("letters") || "")}" placeholder="abc"></label>
    <label><input type="checkbox" name="lower"${checked(Q.get("case") === "lower")}> lowercase</label>
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
    <label>Cards <select name="cards">${CARD_COUNTS.map(n => opt(n, `${n} (${n / 2} pairs)`, n === CFG.pairs * 2)).join("")}</select></label>
    <label>Language <select name="lang">${opt("en", "English", LANG === "en")}${opt("es", "Español", LANG === "es")}</select></label>
    <label>Voice <select name="voice">${["auto", "soft", "female", "male"].map(v => opt(v, v, v === VOICE_Q)).join("")}</select></label>
  </div><div class="row" style="margin-top:8px">
    <label><input type="checkbox" name="tts"${checked(CFG.tts)}> say each card out loud</label>
    <label><input type="checkbox" name="sound"${checked(CFG.sound)}> sounds</label>
    <label><input type="checkbox" name="fullscreen"${checked(CFG.fullscreen)}> full screen when the game starts</label>
  </div><div class="row" style="margin-top:8px">
    <label>Rest after <input type="number" name="rest" min="0" max="50" value="${CFG.rest}"> games</label>
    <small>A sleepy moon says it's time for a break; hold the moon 4 s to unlock. 0 = never.</small>
  </div></fieldset>

  <div class="actions">
    <button type="submit" class="start">Start game ▶</button>
    <button type="button" class="copy">Copy link</button>
    <button type="button" class="cancel">Cancel</button>
    <div class="link"></div>
  </div>
</form>
${defaultsForm()}`;
}

/* ---------- Defaults (this device) ----------
   What the child gets when picking a tile alone, e.g. numbers 10–20 once 1–8 are known. Saved on
   this device (localStorage), used whenever the address doesn't say otherwise. */
const DEFAULT_KEYS = ["from", "to", "letters", "case", "phonics", "shapes", "set", "emoji", "cards", "voice", "tts", "sound", "fullscreen", "rest"];
function defaultsForm() {
  const D = SAVED_DEFAULTS, has = Object.keys(D).length > 0;
  const opt = (v, label, sel) => `<option value="${v}"${sel ? " selected" : ""}>${label}</option>`;
  const checked = b => b ? " checked" : "";
  const dShapes = String(D.shapes || "").split(",").filter(Boolean);
  const dSets = String(D.set || "").split(",").filter(Boolean);
  const dCards = parseInt(D.cards || "8", 10), dPh = D.phonics || "0";
  return `<form class="defaults-form" autocomplete="off"><details${has ? " open" : ""}>
  <summary>Defaults (this device)${has ? " · custom" : ""}</summary>
  <p class="lead">What your child gets when choosing a game on their own. Change them as they learn,
    e.g. numbers 10 to 20 once 1 to 8 are known. Saved on this device only; a game made above still wins.</p>

  <fieldset><legend>Numbers</legend><div class="row">
    <label>From <input type="number" name="from" value="${escapeHTML(D.from || "1")}"></label>
    <label>to <input type="number" name="to" value="${escapeHTML(D.to || "")}" placeholder="auto"></label>
  </div></fieldset>

  <fieldset><legend>Letters</legend><div class="row">
    <label>Which <input type="text" name="letters" value="${escapeHTML(D.letters || "")}" placeholder="abc"></label>
    <label><input type="checkbox" name="lower"${checked(D.case === "lower")}> lowercase</label>
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
    <label>Rest after <input type="number" name="rest" min="0" max="50" value="${escapeHTML(D.rest ?? "6")}"> games</label>
  </div></fieldset>

  <div class="actions">
    <button type="submit" class="start">Save defaults</button>
    <button type="button" class="reset">Reset to original</button>
    <span class="saved" aria-live="polite"></span>
  </div>
  <p class="credits">Emoji graphics: <a href="https://openmoji.org" target="_blank" rel="noopener">OpenMoji</a>, the open-source emoji project, CC BY-SA 4.0.</p>
</details></form>`;
}
/* Defaults form → only what differs from the built-in defaults. */
function collectDefaults(form) {
  const f = new FormData(form), d = {};
  if (f.get("from") && f.get("from") !== "1") d.from = f.get("from");
  if (f.get("to")) d.to = f.get("to");
  if (String(f.get("letters") || "").trim()) d.letters = String(f.get("letters")).trim();
  if (f.get("lower")) d.case = "lower";
  if (f.get("phonics") !== "0") d.phonics = f.get("phonics");
  if (f.getAll("shape").length) d.shapes = f.getAll("shape").join(",");
  const sets = f.getAll("set");
  if (sets.length && sets.length < Object.keys(W.sets).length) d.set = sets.join(",");   // all or none ticked = all sets
  if (f.get("emoji") === "native") d.emoji = "native";
  if (f.get("cards") !== "8") d.cards = f.get("cards");
  if (f.get("voice") !== "auto") d.voice = f.get("voice");
  if (!f.get("tts")) d.tts = "0";
  if (!f.get("sound")) d.sound = "0";
  if (!f.get("fullscreen")) d.fullscreen = "0";
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
  }
  if (theme === "letters") {
    if (f.get("letters")) p.set("letters", f.get("letters"));
    if (f.get("lower")) p.set("case", "lower");
    if (f.get("phonics") !== "0") p.set("phonics", f.get("phonics"));
  }
  if (theme === "images" && f.get("set") !== "random") p.set("set", f.get("set"));
  if (theme === "shapes" && f.getAll("shape").length) p.set("shapes", f.getAll("shape").join(","));
  if (f.get("cards") !== "8") p.set("cards", f.get("cards"));
  if (f.get("lang") !== "en") p.set("lang", f.get("lang"));
  if (f.get("voice") !== "auto") p.set("voice", f.get("voice"));
  if (!f.get("tts")) p.set("tts", "0");
  if (!f.get("sound")) p.set("sound", "0");
  if (!f.get("fullscreen")) p.set("fullscreen", "0");
  if (String(f.get("rest")) !== "6") p.set("rest", String(Math.max(0, parseInt(f.get("rest"), 10) || 0)));
  // Keep the look-and-feel settings a link may already have (patterns, colours, timings …).
  for (const k of ["emoji", "grow", "colors", "back", "backcolor", "mark", "bg", "bgcolor", "delay", "vanish", "rate", "pitch", "win"]) if (URLQ.has(k)) p.set(k, URLQ.get(k));
  return p;
}

function initSetup() {
  if (!Q.has("setup") && !Q.has("parents")) return;
  const box = document.createElement("div"); box.id = "setup";
  box.innerHTML = setupForm();
  document.body.appendChild(box);
  const form = box.querySelector("form"), link = box.querySelector(".link");   // the first form: create a game
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
  box.querySelector(".copy").addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(urlFor()); e.target.textContent = "Copied ✓"; }
    catch { e.target.textContent = "Select the link below to copy"; }
  });
  refresh();
}
