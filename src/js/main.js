"use strict";
/* main.js: start-up. Loaded last, after every other file has defined its functions. */

document.documentElement.lang = LANG_TAG;
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
