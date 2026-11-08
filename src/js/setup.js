"use strict";
/* setup.js: the parents' setup screen, opened with ?setup (e.g. index.html?setup).
   A plain form to make one specific game. "Start game" turns the choices into URL settings and
   reloads the page with them; the child then sees one big tile with a replay badge for that game.
   The link can be copied or bookmarked to come back to the same game later.
   Opening ?setup on a link that already has settings pre-fills the form, so it can be edited. */

const SETUP_THEMES = [
  ["numbers", "Numbers 1 2 3"], ["letters", "Letters A B C"], ["images", "Pictures 🐶🍎🚗"],
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
    <label>Set <select name="set">${opt("random", "a different one each game", !Q.has("set") || SET_WANTED === "random")}${Object.keys(W.sets).map(k => opt(k, W.sets[k].items.slice(0, 3).map(v => v.split("|")[0]).join(" ") + " " + k, SET_WANTED === k)).join("")}</select></label>
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
    <div class="link"></div>
  </div>
</form>`;
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
  for (const k of ["grow", "colors", "back", "backcolor", "mark", "bg", "bgcolor", "delay", "vanish", "rate", "pitch", "win"]) if (Q.has(k)) p.set(k, Q.get(k));
  return p;
}

function initSetup() {
  if (!Q.has("setup") && !Q.has("parents")) return;
  const box = document.createElement("div"); box.id = "setup";
  box.innerHTML = setupForm();
  document.body.appendChild(box);
  const form = box.querySelector("form"), link = box.querySelector(".link");
  const urlFor = () => location.href.split(/[?#]/)[0] + "?" + setupParams(form).toString();
  const refresh = () => {
    const theme = new FormData(form).get("theme");
    form.querySelectorAll("fieldset[data-for]").forEach(fs => fs.hidden = fs.dataset.for !== theme);
    link.textContent = urlFor();
  };
  form.addEventListener("input", refresh); form.addEventListener("change", refresh);
  form.addEventListener("submit", e => { e.preventDefault(); location.href = urlFor(); });
  box.querySelector(".copy").addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(urlFor()); e.target.textContent = "Copied ✓"; }
    catch { e.target.textContent = "Select the link below to copy"; }
  });
  refresh();
}
