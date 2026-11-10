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
applyAdaptLevel();                                  // adapt=1: start at the level reached last time
initStartScreen();
initRest();
initHelp();
initVoiceList();
newGame();
if (!startEl.isConnected) peekCards(300);           // start=0: the board shows straight away
initSetup();
