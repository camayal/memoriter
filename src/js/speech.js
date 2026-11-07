"use strict";
/* speech.js: text-to-speech with the browser's Web Speech API.
   The voices come from the browser + operating system, so what is available differs per device
   (Edge: natural Microsoft voices, Chrome: Google voices, IDE previews: older Windows voices).
   Presets pick the most natural voice of the wanted kind. Browsers don't expose a voice's
   gender, so it is guessed from well-known voice names. */

const synth = CFG.tts && "speechSynthesis" in window ? window.speechSynthesis : null;

const VOICE_PRESETS = {
  auto:   { gender: null,     rate: 1,   pitch: 1    },
  soft:   { gender: "female", rate: .92, pitch: 1.05 },
  female: { gender: "female", rate: 1,   pitch: 1    },
  male:   { gender: "male",   rate: 1,   pitch: .95  },
};
const FEMALE = /aria|jenny|ana\b|michelle|emma|ava|sonia|libby|maisie|natasha|clara|zira|hazel|susan|samantha|karen|moira|tessa|victoria|allison|serena|fiona|catherine|nicky|joanna|salli|kimberly|ivy|elvira|dalia|paloma|helena|laura|sabina|monica|mónica|paulina|marisol|esperanza|elena|lucia|lucía|camila|valentina|ximena|larissa|female|mujer/i;
const MALE   = /guy|davis|tony|jason|brian|andrew|christopher|eric|roger|steffan|ryan|thomas|george|david|mark|james|daniel|alex\b|fred|tom\b|arthur|aaron|oliver|rishi|gordon|matthew|joey|justin|alvaro|álvaro|jorge|pablo|raul|raúl|gerardo|liberto|diego|tomas|tomás|juan|carlos|male|hombre/i;
const VOICE_Q = (Q.get("voice") || "auto").toLowerCase();
const PRESET = VOICE_PRESETS[VOICE_Q] || VOICE_PRESETS.auto;

/* Higher = more natural sounding. */
const quality = v => {
  const n = v.name.toLowerCase(); let s = 0;
  if (/natural|neural/.test(n)) s += 50;                  // Edge "… Online (Natural)" voices
  if (/premium|enhanced|siri/.test(n)) s += 40;           // Apple downloadable voices
  if (/google/.test(n)) s += 30;                          // Chrome network voices
  if (/online/.test(n)) s += 10;
  if (/espeak|robot|compact/.test(n)) s -= 40;
  if (!v.localService) s += 5;
  return s;
};
const genderOf = v => MALE.test(v.name) && !/female|mujer/i.test(v.name) ? "male" : FEMALE.test(v.name) ? "female" : null;
const voiceLang = v => v.lang.toLowerCase().replace("_", "-");
const speaksLang = v => voiceLang(v).startsWith(LANG_TAG.toLowerCase()) || voiceLang(v).startsWith(LANG);

let voice = null, onlineFailed = false, noLangVoice = false;

function chooseVoice() {
  if (!synth) return;
  const all = synth.getVoices();
  // Voices that speak the game language. After an online voice failed to start in time, prefer
  // voices installed on the device, but never switch to another language just for that.
  let pool = all.filter(speaksLang);
  if (onlineFailed && pool.some(v => v.localService)) pool = pool.filter(v => v.localService);
  noLangVoice = all.length > 0 && !pool.length;
  if (noLangVoice) pool = all.filter(v => v.default).concat(all);   // better a foreign accent than silence
  updateLangNotice();
  if (!VOICE_PRESETS[VOICE_Q]) {                                      // voice=<part of a name>
    const named = pool.find(v => v.name.toLowerCase().includes(VOICE_Q)) || all.find(v => v.name.toLowerCase().includes(VOICE_Q));
    if (named) { voice = named; return; }
  }
  const score = v => quality(v) + (PRESET.gender ? (genderOf(v) === PRESET.gender ? 100 : genderOf(v) ? -100 : 0) : 0)
                   + (voiceLang(v).startsWith(LANG_TAG.toLowerCase()) ? 20 : 0)    // exact region match (lang=es-MX)
                   + ((navigator.languages || []).some(l => l.toLowerCase() === voiceLang(v)) ? 10 : 0);   // the browser's own locale
  voice = pool.slice().sort((a, b) => score(b) - score(a))[0] || null;
}

/* Note for the grown-up on the Start screen when the device has no voice for the language. */
function updateLangNotice() {
  const el = document.getElementById("langnote"); if (!el) return;
  el.textContent = noLangVoice ? `${W.noVoice} Try Edge or Chrome, or add the language's speech pack in Windows Settings → Time & language → Speech. (?voices=1 lists the voices)` : "";
}

/* Speak right away: cut off anything still talking (a queue makes the voice lag behind the cards).
   If a voice doesn't start within 1.2 s, retry once (with an installed voice if it was an online one). */
let current = null;                                       // kept referenced: Chrome can drop utterances that get garbage-collected
function say(text, retry = true) {
  if (!synth || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  // Always tag the utterance with the game language, so the engine pronounces it that way.
  u.lang = voice && speaksLang(voice) ? voice.lang : LANG_TAG;
  if (voice) u.voice = voice;
  u.rate = CFG.rate ?? PRESET.rate; u.pitch = CFG.pitch ?? PRESET.pitch;
  let started = false;
  u.onstart = () => { started = true; };
  current = u;
  // Chrome/Edge can silently drop an utterance spoken in the same instant as cancel(),
  // so only cancel when something is actually talking, and give it a moment.
  const busy = synth.speaking || synth.pending;
  if (busy) synth.cancel();
  synth.resume();                                         // un-sticks Chrome's occasionally paused queue
  setTimeout(() => { if (current === u) synth.speak(u); }, busy ? 60 : 0);
  if (retry) setTimeout(() => {
    if (started || current !== u) return;
    if (voice && !voice.localService) { onlineFailed = true; chooseVoice(); }
    synth.cancel(); say(text, false);
  }, 1200);
}

function initSpeech() {
  if (!synth) return;
  chooseVoice();
  synth.addEventListener?.("voiceschanged", chooseVoice);
}
