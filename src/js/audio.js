"use strict";
/* audio.js: all sound effects, synthesised with Web Audio (no sound files).
   Sounds stay soft on purpose: the audience is toddlers. */

let AC = null, master = null, noiseBuf = null;

/* Creates/resumes the audio engine. Browsers only allow this after a tap. */
function audio() {
  if (!CFG.sound) return null;
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C(); master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 1.5, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (AC.state === "suspended") AC.resume();
  return AC;
}

function env(g, t, peak, attack, decay) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay); }

/* pan: -1 (left) … 1 (right), so a firework on the left is heard on the left. */
function out(pan) {
  if (!pan || !AC.createStereoPanner) return master;
  const p = AC.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(master); return p;
}
function tone(freq, t, { type = "sine", peak = .15, attack = .005, decay = .12, to = null, pan = 0 } = {}) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + decay * .6);
  env(g, t, peak, attack, decay); o.connect(g).connect(out(pan)); o.start(t); o.stop(t + attack + decay + .05);
}
function noise(t, { dur = .4, peak = .2, filter = "lowpass", f0 = 1200, f1 = null, q = .7, attack = .005, pan = 0 } = {}) {
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = filter; f.Q.value = q; f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, peak, attack, dur); s.connect(f).connect(g).connect(out(pan));
  s.start(t, Math.random()); s.stop(t + attack + dur + .05);
}

const sfx = {
  /* Soft "bloop" when a card is touched (the flip itself is silent). */
  tap() { if (!audio()) return; tone(720, AC.currentTime, { type: "sine", peak: .18, decay: .09, to: 480 }); },
  /* Bubble pop when a matched card vanishes. */
  pop() {
    if (!audio()) return; const t = AC.currentTime;
    tone(260, t, { type: "sine", peak: .22, attack: .003, decay: .11, to: 1100 });
    noise(t, { dur: .03, peak: .05, filter: "highpass", f0: 2500 });
    tone(1568, t + .06, { type: "triangle", peak: .035, decay: .25 });
  },
  whoosh(pan) { if (!audio()) return; noise(AC.currentTime, { dur: .8, peak: .045, filter: "bandpass", f0: 300, f1: 2600, q: 1.4, attack: .3, pan }); },
  /* Toddler-safe bangs: a muffled thump plus a texture that matches the burst type. */
  burst(kind, pan, big = false) {
    if (!audio()) return; const t = AC.currentTime;
    noise(t, { dur: big ? .9 : .6, peak: big ? .2 : .14, f0: 700, f1: 120, pan });
    const penta = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637];                          // C major pentatonic, high
    if (kind === "heart" || kind === "smile" || kind === "symbol") {                                              // happy arpeggio C-E-G-C
      [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, t + .08 + i * .09, { type: "triangle", peak: .06, decay: .7, pan }));
    } else if (kind === "willow") {                                                           // long soft shimmer
      noise(t + .1, { dur: 2, peak: .035, filter: "highpass", f0: 5000, attack: .25, pan });
    } else if (kind === "glitter" || kind === "crossette") {                                  // gentle crackle
      for (let i = 0; i < 22; i++) noise(t + .35 + Math.random() * 1.1, { dur: .018, peak: .03 + Math.random() * .03, filter: "highpass", f0: 2500 + Math.random() * 3000, pan: pan + (Math.random() - .5) * .6 });
    } else {                                                                                  // twinkly notes
      for (let i = 0; i < 5; i++) tone(randOf(penta), t + .05 + i * .07 + Math.random() * .05, { type: "triangle", peak: .045, decay: .6, pan });
    }
  },
};
