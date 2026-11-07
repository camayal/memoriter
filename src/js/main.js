"use strict";
/* main.js: start-up. Loaded last, after every other file has defined its functions. */

document.documentElement.lang = LANG_TAG;
/* Block zoom gestures the viewport setting doesn't stop (iOS Safari pinch, ctrl+wheel on desktop). */
for (const ev of ["gesturestart", "gesturechange"]) document.addEventListener(ev, e => e.preventDefault());
document.addEventListener("touchmove", e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
addEventListener("wheel", e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
initSpeech();
initFireworks();
initBoard();
initStartScreen();
initHelp();
initVoiceList();
newGame();
initSetup();

/* demo=end: skip the game and show the end celebration (to try it out, or win=). */
if (Q.get("demo") === "end") { cards.forEach(c => { c.done = true; c.el.classList.add("gone"); }); setTimeout(finale, 300); }
