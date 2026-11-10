"use strict";
/* stats.js: progress kept on this device for the parents' setup screen, and the "grow with my child"
   level. Nothing leaves the device (localStorage only); "Clear progress" in setup deletes it.

   What a game teaches is remembering WHERE a card was. So the useful measure is what happens when
   the child turns over a card whose pair was already seen earlier in the game (its place was "known"):
   - remembered: the next card is that pair
   - forgot:     the next card is a different one
   Mismatches where the pair was never seen are just guessing and are not held against any card. */

const STATS_KEY = "memoriter-stats", LEVEL_KEY = "memoriter-level";
const STATS_MAX_GAMES = 300;
const loadJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch { return d; } };
const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

/* { games: [{ t, theme, pairs, ms, flips, mism, quick, miss }], items: { key: { label, kind, say, theme, games, quick, miss } } } */
function loadStats() {
  const s = loadJSON(STATS_KEY, {});
  return { games: Array.isArray(s.games) ? s.games : [], items: s.items && typeof s.items === "object" ? s.items : {} };
}
function clearStats() {
  try { localStorage.removeItem(STATS_KEY); localStorage.removeItem(LEVEL_KEY); } catch { /* storage blocked */ }
}

/* One card's entry. Pictures and words are kept by what they show; shapes and colours by their name. */
const statKey = c => `${CFG.theme}|${c.kind}|${c.show}`;
const statLabel = c => c.kind === "shape" || c.kind === "swatch" || c.kind === "img" ? c.say : c.show;

/* Called by board.js at the end of a game. `items` = the main card of every pair; `marks` = per pair
   id: { quick, miss } counts from this game. */
function recordGame(game, items, marks) {
  const s = loadStats();
  s.games.push({ t: Date.now(), ...game });
  if (s.games.length > STATS_MAX_GAMES) s.games = s.games.slice(-STATS_MAX_GAMES);
  for (const it of items) {
    const k = statKey(it), m = marks[it.id] || {};
    const e = s.items[k] ||= { label: statLabel(it), kind: it.kind, say: it.say, theme: CFG.theme, games: 0, quick: 0, miss: 0 };
    e.games++; e.quick += m.quick || 0; e.miss += m.miss || 0; e.say = it.say;
  }
  saveJSON(STATS_KEY, s);
}

/* ---------- Grow with my child (adapt=1) ----------
   The number of cards follows how well the child remembers, without the child noticing:
   - two good games in a row (forgot at most a quarter as often as there are pairs, and at least
     one card remembered) → one pair more, up to maxcards= (default 16)
   - one hard game (forgot as often as there are pairs, or more) → one pair less, down to 4 cards
   It starts from the "Cards" setting (cards=, from setup) and goes up or down from there. The level is
   kept on this device (memoriter-level) together with the setting it started from: when a parent
   changes "Cards", the level starts again from the new value. */
const ADAPT_MIN = 4;
const adaptStart = () => Math.max(ADAPT_MIN, Math.min(30, Math.floor(num("cards", 8) / 2) * 2));
// "up to" never lowers the chosen start: cards=20 with maxcards=16 starts (and stays at most) at 20.
const adaptMax = () => Math.max(adaptStart(), Math.min(30, Math.round(num("maxcards", 16) / 2) * 2));
function adaptLevel() {
  const lv = loadJSON(LEVEL_KEY, null);
  return lv && lv.cards && lv.start === adaptStart() ? lv : null;   // started from another "Cards" setting: start again
}
function applyAdaptLevel() {
  if (!CFG.adapt) return;
  const lv = adaptLevel();
  CFG.pairs = Math.max(ADAPT_MIN, Math.min(adaptMax(), lv ? lv.cards : adaptStart())) / 2;
}
function adaptAfterGame(g) {
  if (!CFG.adapt) return;
  const lv = adaptLevel();
  let cards = CFG.pairs * 2, good = lv ? lv.good || 0 : 0;
  if (g.miss >= g.pairs) { cards -= 2; good = 0; }
  else if (g.miss <= g.pairs / 4 && g.quick > 0) { good++; if (good >= 2) { cards += 2; good = 0; } }
  else good = 0;
  cards = Math.max(ADAPT_MIN, Math.min(adaptMax(), cards));
  saveJSON(LEVEL_KEY, { cards, good, start: adaptStart() });
  CFG.pairs = cards / 2;                            // the next game uses it
}
