"use strict";
/* fireworks.js: canvas particles. Two uses:
   - sparkle(): small bursts (matched cards, Start button)
   - fireworksShow(): the short end show (about 4 seconds). The page dims to a soft night sky, then rockets with spark trails
     burst as peony, ring, double ring, willow, glitter, crossette (splits again), star, heart and
     smiley. Bursts glow (additive blending) and leave short trails; sounds pan with the burst. */

const fx = document.getElementById("fx"), ctx = fx.getContext("2d");
const night = document.getElementById("night");
const NIGHT_COLORS = PALETTE.map(c => lighten(c, .25)).concat(["#FFD86B", "#FFFFFF", "#7FE3FF"]);
const GOLD = "#FFCF6B";
const MAX_PARTS = 3500;
const BURSTS = ["peony", "ring", "double", "willow", "glitter", "crossette", "star", "peony", "ring"];

let parts = [], rockets = [], running = false, animating = false;
let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const fxScale = () => Math.min(innerWidth, innerHeight) / 700;

function fitFx() { const r = devicePixelRatio || 1; fx.width = innerWidth * r; fx.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0); }
function kick() { if (!animating) { animating = true; requestAnimationFrame(frame); } }

function spark(o) {
  if (parts.length >= MAX_PARTS) return;
  parts.push({ px: o.x, py: o.y, life: 1, fade: .012, drag: .975, grav: .045, size: 2.4, glow: true, ...o });
}

/* Small burst at (x, y). color = null → mixed palette colours. */
function sparkle(x, y, size, color) {
  const n = 26, sp = size / 34;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * .2, v = sp * (.5 + Math.random() * .7);
    const col = color ? (Math.random() < .25 ? "#FFFFFF" : color) : randOf(PALETTE);
    spark({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, fade: .028, drag: .97, grav: .06, glow: false, color: col, size: 2.5 + Math.random() * 2.5 });
  }
  kick();
}

function launch(kind, x, ty) {
  const Wd = innerWidth, H = innerHeight;
  x = x ?? Wd * (.15 + Math.random() * .7);
  ty = ty ?? H * (.14 + Math.random() * .28);
  const vy = -Math.sqrt(H + 10 - ty) * .52;              // roughly tops out near the target height
  const r = { x, y: H + 10, vx: (Wd / 2 - x) * .0015 * Math.random(), vy, ty, kind: kind || randOf(BURSTS), color: randOf(NIGHT_COLORS), color2: randOf(NIGHT_COLORS) };
  rockets.push(r);
  sfx.whoosh(x / Wd * 2 - 1);
  return r;
}

function explode(r) {
  const S = fxScale() * (r.big ? 1.45 : 1), { x, y, color, color2 } = r, k = r.kind;
  const ring = (n, speed, col, extra = {}) => { const off = Math.random() * 7; for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2; spark({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color: col, ...extra }); } };
  const shape = (n, fn, speed, col) => { for (let i = 0; i < n; i++) { const [dx, dy] = fn(i / n * Math.PI * 2); spark({ x, y, vx: dx * speed, vy: dy * speed, color: col, grav: .02, fade: .011 }); } };
  const sphere = (n, vMin, vMax, extra) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = S * (vMin + Math.random() * (vMax - vMin)); spark({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ...extra() }); } };

  if (k === "peony") sphere(110, 1.5, 4.8, () => ({ color: Math.random() < .15 ? "#FFFFFF" : color }));
  else if (k === "ring") { ring(70, S * 4.2, color, { size: 2.8 }); ring(24, S * 1.6, "#FFFFFF", { size: 1.8, fade: .02 }); }
  else if (k === "double") { ring(64, S * 4.6, color, { size: 2.6 }); ring(44, S * 2.8, color2, { size: 2.6 }); }
  else if (k === "willow") sphere(120, 1, 4, () => ({ color: GOLD, fade: .0065, drag: .955, grav: .03, size: 2 }));
  else if (k === "glitter") sphere(100, 1.2, 4.6, () => ({ color: Math.random() < .5 ? "#FFFFFF" : color, twinkle: true, fade: .009 }));
  else if (k === "crossette") ring(18, S * 3.6, color, { size: 3.2, fade: .02, split: .55, splitColor: color2 });
  else if (k === "star") shape(120, a => { const q = 1 + .45 * Math.cos(5 * a); return [Math.cos(a - Math.PI / 2) * q, Math.sin(a - Math.PI / 2) * q]; }, S * 3, color);
  else if (k === "heart") {
    shape(130, t => [Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16], S * 4.4, lighten(NAMED.pink, .2));
    ring(30, S * 1.4, "#FFFFFF", { size: 1.8, fade: .02 });
  } else if (k === "smile") {
    const yellow = "#FFD86B", v = S * 4.4, o = { color: yellow, grav: .02, fade: .011 };
    ring(80, v, yellow, { grav: .02, fade: .011 });
    for (const ex of [-.38, .38]) for (let i = 0; i < 10; i++) { const a = i / 10 * 7; spark({ x, y, vx: (ex + Math.cos(a) * .07) * v, vy: (-.32 + Math.sin(a) * .07) * v, ...o }); }
    for (let i = 0; i < 26; i++) { const a = Math.PI * (.2 + .6 * i / 25); spark({ x, y, vx: Math.cos(a) * .6 * v, vy: Math.sin(a) * .6 * v, ...o }); }
  }
  // Flash of light at the burst centre.
  parts.push({ x, y, px: x, py: y, vx: 0, vy: 0, life: 1, fade: .09, drag: 1, grav: 0, size: 26 * S, flash: true, glow: true, color: "#FFFFFF" });
  sfx.burst(k, x / innerWidth * 2 - 1, r.big);
}

function frame() {
  // Fade what is already drawn instead of clearing: this leaves soft trails.
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,.24)"; ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.lineCap = "round";

  rockets = rockets.filter(r => {
    const px = r.x, py = r.y;
    r.x += r.vx; r.y += r.vy; r.vy *= .985; r.vy += .02;
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(r.x, r.y); ctx.stroke();
    if (Math.random() < .7) spark({ x: r.x, y: r.y, vx: (Math.random() - .5) * .8, vy: Math.random() * 1.2, color: GOLD, fade: .05, size: 1.6 });
    if (r.y <= r.ty || r.vy >= -.5) { explode(r); return false; }
    return true;
  });

  const born = [];
  parts = parts.filter(p => {
    p.px = p.x; p.py = p.y;
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav; p.x += p.vx; p.y += p.vy; p.life -= p.fade;
    if (p.split && p.life < p.split) {                     // crossette: break into a little cross
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, v = fxScale() * 2.2; born.push({ x: p.x, y: p.y, px: p.x, py: p.y, vx: Math.cos(a) * v + p.vx, vy: Math.sin(a) * v + p.vy, life: .8, fade: .02, drag: .96, grav: .04, size: 2, glow: true, twinkle: true, color: p.splitColor }); }
      return false;
    }
    let a = Math.max(0, p.life);
    if (p.twinkle && Math.random() < .35) a *= .2;
    ctx.globalCompositeOperation = p.glow && running ? "lighter" : "source-over";
    ctx.globalAlpha = a;
    if (p.flash) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    } else {
      ctx.strokeStyle = p.color; ctx.lineWidth = p.size * (.5 + a * .5);
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    return p.life > 0 && p.y < innerHeight + 40;
  });
  parts.push(...born);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

  if (running || rockets.length || parts.length) requestAnimationFrame(frame);
  else { animating = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

/* Fireworks end show. onReady fires when the "play again" button may appear (to practise patience). */
function fireworksShow(onReady, round = 1) {
  running = true; night.classList.add("on"); say(Q.get("win") || W.win);
  const Wd = innerWidth, H = innerHeight, reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = 400;
  // 1. Two single rockets.
  for (let i = 0; i < 2; i++) { later(() => launch(), t); t += 550; }
  // 2. One mirrored pair, left and right.
  if (!reduced) {
    const k = randOf(BURSTS), x = Wd * (.2 + Math.random() * .1), y = H * (.2 + Math.random() * .15);
    later(() => { launch(k, x, y); launch(k, Wd - x, y); }, t); t += 700;
  }
  // 3. A quick volley.
  if (!reduced) for (let i = 0; i < 4; i++) { later(() => launch(), t); t += 180; }
  // 3b. Calm part that grows with each finished game: one slow rocket more per game, up to
  //     CFG.calmMax (default 10, about 9 s more). grow=0 turns it off.
  const extra = Math.min(Math.max(0, round - 1), CFG.calmMax);
  for (let i = 0; i < extra; i++) { t += 900; later(() => launch(randOf(["peony", "ring", "willow"])), t); }
  // 4. Big heart or smiley in the middle.
  t += 300;
  later(() => { launch(Math.random() < .5 ? "heart" : "smile", Wd / 2, H * .3).big = true; }, t);
  later(() => { running = false; }, t + 1800);
  later(onReady, num("again", t + 1500));
  kick();
}

function stopFireworks() {
  timers.forEach(clearTimeout); timers = []; rockets = []; running = false;
  night.classList.remove("on");
}

function initFireworks() {
  fitFx();
  addEventListener("resize", fitFx);
}
