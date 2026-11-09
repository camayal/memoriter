# Memoriter: Status

Memoriter is a memory pairs game I'm making for toddlers. I write it as separate source files and bundle it into one embeddable HTML file.
Every setting comes from the URL. I add `?help=1` to see them on screen.

_Last updated: 2026-11-08_

## Project structure

| Path | What it is |
|---|---|
| `index.html` | **Development page**: I open it while working. It loads each source file separately, so errors point to the right file in dev tools. |
| `src/styles.css` | All styles |
| `src/js/config.js` | URL settings (`CFG`, `LANG`), random/shuffle helpers |
| `src/js/i18n.js` | Every word per language: Start/win phrases, shape and animal names, **numbers and letters as words** (`1` → "uno", `B` → "be") |
| `src/js/colors.js` | Palette and colour helpers |
| `src/js/patterns.js` | Card back and page background patterns |
| `src/js/shapes.js` | SVG shapes |
| `src/js/content.js` | Builds the cards for each theme |
| `src/js/audio.js` | Sound effects (Web Audio) |
| `src/js/speech.js` | Text-to-speech, voice choice and presets |
| `src/js/fireworks.js` | Sparkle particles and the end fireworks show |
| `site/wa/pairs/` | My copies of the website's shell files for `camayal.info/wa/pairs` (iframe page, manifest, offline `sw.js`) |
| `tests/check.py` | `python tests/check.py` checks 72 URL settings in headless Edge/Chrome (~5 s). `--dist` tests the built file. |
| `src/js/board.js` | Game logic: deal, flip, match, layout |
| `src/js/screens.js` | Game tiles, Start screen, end screen, `?help=1`, `?voices=1` |
| `src/js/setup.js` | Parents' setup screen (`?setup`) |
| `src/js/main.js` | Start-up |
| `app/` | Installable-app sources: `manifest.webmanifest`, `sw.js` (offline), `icon.svg` and the PNG icons I make from it with `python app/make_icons.py` |
| `assets/fonts/` | The Andika Bold font (`andika-700-latin.woff2`, 19 KB, Latin subset: English and Spanish) with its license `OFL.txt` |
| `assets/openmoji/` | OpenMoji drawings (SVG) for every emoji the game uses (88 files, ~250 KB), with `LICENSE.txt`. I refresh them with `python app/fetch_openmoji.py` after adding emoji to a set. |
| `screenshots/` | The two screenshots used in `README.md` |
| `build.py` | `python build.py` builds `dist/` |
| `dist/` | **The published build** (generated: I edit `src/` / `app/` and rebuild): `index.html` (the whole game in one file) + manifest, icons, `sw.js`. Served by this repo's GitHub Pages at `/memoriter/dist/` and shown by the iframe at `camayal.info/wa/pairs`. |

I kept the scripts as plain `<script>` files rather than ES modules, so `index.html` also works when I open it straight from disk (`file://`). Load order matters and is set in `index.html`.

To add a language, I copy the `en` block in `src/js/i18n.js`, translate it, and accept the new code in `config.js`.

## Main ideas

| Idea | Status | Notes |
|---|---|---|
| Pairs game in one embeddable HTML file | ✅ Done | `dist/index.html`, built from `src/`. No outside dependencies: the Andika font is stored in the project (`assets/fonts/`, preloaded). Works in an `<iframe>`. |
| All settings controlled from the URL | ✅ Done | See the parameter list below and `?help=1`. |
| 8 cards (4 pairs) by default | ✅ Done | `cards=` sets the number of cards (even). |
| Card back patterns, set from the URL | ✅ Done | I made pattern and color **random by default**: they change each game and never repeat the previous one. `back=` random, plain, dots, polka, stripes, diagonal, checks, grid, zigzag, waves, stars, hearts, bubbles. `backcolor=` (random, color name or hex). `mark=0` hides the center circle. |
| Page background pattern | ✅ Done | `bg=` (same patterns, drawn very faint), `bgcolor=`. I left it plain cream by default to keep the focus on the cards. |
| Card contents can be changed | ✅ Done | `items=shown\|spoken`. The theme is guessed from it. With `theme=images`, items can be emoji or image links. |
| TTS reads the flipped card | ✅ Done | I use the browser's Web Speech API (voices come from the OS and browser). Presets: `voice=auto` (most natural), `soft`, `female`, `male`, or part of a voice name. `?voices=1` lists the voices available and plays a sample. `lang`, `rate`, `pitch`. |
| Subtle flip animation | ✅ Done | 380 ms 3D turn, no bounce. It switches off with reduced motion. |
| Soft sound on tap, none on flip | ✅ Done | I generate the sounds with Web Audio, so there are no audio files. |
| No score, fireworks at the end | ✅ Done | A short (~4 s) night-sky show: two rockets, a mirrored pair, a quick volley, then a big heart or smiley. Glowing trails, soft panned sounds, "Good job!" / "¡Muy bien!" (`win=`). "Play again" appears when the show ends (`again=` ms). I tried a clapping version and removed it. |
| Cheerful end phrase | ✅ Done | "Good job!" varies each round, never twice in a row ("Yay! Good job!", "You did it!", "Great job!", "Well done!", "Hooray! Good job!" / "¡Bravo! ¡Muy bien!", "¡Lo lograste!", "¡Excelente!", "¡Bien hecho!", "¡Yupi! ¡Muy bien!"). I have it spoken a little higher and slower, for a happier sing-song tone. `win=` sets a fixed phrase. How cheerful it sounds still depends on the device's voice. |
| Soft, toddler-friendly palette with true colors | ✅ Done | Red, blue `#2F6FDB`, yellow, green, orange, purple, pink and brown on a cream background. |
| Matched pair vanishes with a pop sound and a small firework | ✅ Done | The pair stays visible for `vanish=` ms (default 900), then pops away. I keep its grid slot empty so nothing moves around. |
| Every card in a game shares one random color | ✅ Done | Default `colors=one`, so color is never a clue or a distraction. Also `pair`, a color name, a hex value, or `0`. Applies to numbers, letters, custom text and shapes. |
| Start screen: the toddler picks the game | ✅ Done | One big tile per game: numbers **1**, letters **A**, animals 🐶, shapes ▲, colors (crayons). Each tile shows a small fanned stack of three cards, so the child can choose by looking. Tapping says "Let's find pairs of numbers!" / "¡Vamos a buscar parejas de números!" (etc.), pops confetti and starts. The tap also unlocks sound and speech, so the first card is heard. I size the tiles to fill the screen: the layout picks the column count that gives the biggest tiles, preferring even rows (3 + 2). `themes=` limits or orders the tiles. `start=0` skips the screen. If the device has no voice for the language, a note for the grown-up appears. |
| Parents' setup screen | ✅ Done | I open `index.html?setup`, or on the tablet I hold the faint "…" in the bottom-left corner of the start or end screen for 4 s (it mirrors EN · ES on the right and darkens slowly while held; a short touch does nothing). A plain form: game (numbers, letters, animals, shapes, colors, own cards), its options (number range, which letters / lowercase, which shapes, own cards one per line with `shown\|spoken`, "these are pictures"), number of cards, language, voice, speech and sound on/off. **Start game** reloads the page with those settings; **Copy link** copies them for a bookmark; **Cancel** goes back to the game as it was. Opening `?setup` on an existing link pre-fills the form. |
| Defaults (this device) | ✅ Done | The main, always-visible section at the top of the setup screen ("Create a game (link)" is collapsible below it): numbers from/to, which letters / lowercase / name or sound, which shapes, picture sets (tick one or several; each game uses one of them at random), cards, voice, speech, sounds, full screen, rest after N games. **Save defaults** stores them on the device (localStorage); **Back to the game** leaves without changes; **Reset to original** clears them. They shape what each tile plays when the child picks alone (e.g. numbers 10–20 once 1–8 are known) without locking the game; a parent-made link or `theme=`… in the address still wins. |
| Parent-made game: one big tile | ✅ Done | When the link picks the game (from setup, or `theme=` / `letters=` / `shapes=` / `items=`), the child sees one big tile previewing that exact game (e.g. A E I O U), with a green replay badge, at the start and again after the fireworks. |
| Grown-up lock by long press | ✅ Done | Holding a game tile ~1 s (soft click, tile sinks, replay badge appears) locks that game: it starts on release, and the end screen offers only that game. The lock survives a reload (`theme=` is added to the address). A child's short tap is unaffected. |
| Calmer pacing: fireworks grow each game | ✅ Done | The first show stays short (~4 s); each finished game in the session adds one slow extra rocket before the finale, up to 10 (~13 s total), so the wait before the next game grows. Counted per browser tab. `grow=0` keeps it always short, `grow=N` changes the maximum. |
| Rest screen (sleepy moon) | ✅ Done | After 6 finished games (`rest=6`, `rest=0` = never, also in setup) the fireworks end on a quiet night sky with a sleeping crescent moon, slowly rising "Z z z" and softly twinkling stars; the voice says "Time for a break. See you soon!" / "¡Hora de descansar! Hasta pronto." Nothing for the child to tap. To unlock, I hold one small star near the top-right corner ~4 s (it looks like the other stars and brightens slowly while held). I made sure the moon itself doesn't react, so a child touching it can't unlock. Reloading the page doesn't skip it. |
| Theme symbol in the final firework | ✅ Done | The big final burst draws the **outline** of one of the cards just matched in evenly spaced sparks: a letter, number or word as itself, a shape as its outline; the colors game ends with a rainbow arc of coloured sparks (red outside → purple inside). Pictures use their outline when it reads clearly (cat, rabbit, fish, elephant, duck, apple, banana, pear, cherries, car, airplane, bike, helicopter, moon, star, cloud, flower, tree); the rest (round heads like dog/pig/frog, boxes like bus/train) get the happy-face firework (list in `CLEAR_OUTLINES`, `fireworks.js`). The other bursts (flowers, rings…) stay. |
| No idle animations | ✅ Done | I stopped the tiles from "breathing": nothing moves on screen until it is touched (the rest screen's slow moon and stars are the only gentle motion). |
| Full screen | ✅ Done | Tapping a game tile switches to full screen (no address bar or browser buttons) on Android, desktop and iPad, also inside a same-site iframe. Not available on iPhone Safari. `fullscreen=0` or the setup screen turns it off. |
| Install as an app (PWA) | ✅ Done (I still need to test it on a phone) | `dist/` includes an app manifest (full-screen display, cream theme), icons (four cards: two OpenMoji dog faces face up, the same dog as the pictures tile, and two star backs face down) and a service worker, so the installed app opens instantly from the saved copy (also offline) and picks up updates in the background, shown on the next open. It installs from `camayal.info/wa/pairs` with the browser's "Install app" / "Add to Home screen" (needs the shell's manifest, see Publishing). Only works over https (GitHub Pages), not from disk. |
| No pull-to-refresh, no zoom | ✅ Done | `overscroll-behavior:none` stops pull-down refresh and rubber-banding; `touch-action:none`, `maximum-scale=1` and blocked pinch / ctrl+wheel gestures stop zoom. The setup screen can still scroll. |
| Cards react to every small tap | ✅ Done | I made cards react on touch-down instead of "click" (which got cancelled when a small finger slid or held), and blocked long-press menus. (A tap while two cards are open is handled by the pace setting, below.) |
| Calm pace: rushing does nothing | ✅ Done | My child sometimes tapped wildly. Now, while two cards are open, every tap is **ignored completely** (no sound, no movement, no word, nothing saved for later) until the wrong pair has turned back (`delay=`, 1.2 s) or the found pair has fully popped away (~1.4 s). I chose to ignore rather than react: any reaction (a sink, a sound, a "slow down" phrase) would reward fast tapping, while nothing happening takes the fun out of it, and the child learns to watch the cards. A short burst of harder tapping at first is normal. **Fast pace** (`pace=fast`, or "fast pace" in setup, both in Defaults and in a link) brings back the quick behaviour for children with a good memory, since speed is a good skill too: a tap turns a wrong pair back at once and goes on. |
| Choose the next game after the fireworks | ✅ Done | The game just played appears as a big tile in the middle (most likely what the child wants again), with the other games as smaller tiles below (one row on wide screens, 2×2 on phones). Tapping any tile starts that game. For a parent-made game, only its tile. |
| Theme 5: colors | ✅ Done | Colour swatches (red, blue, yellow, green, orange, purple, pink, brown, black), spoken as their names in English or Spanish. |
| Theme 1: numbers (range from the URL) | ✅ Done | `from` / `to`. Picks at random when the range is bigger than the number of pairs. Spoken as words in the game language. |
| Theme 2: letters (`abc`, `a-d`, `aeiou`) | ✅ Done | Also `vowels` / `vocales` and `case=lower`. Spanish adds ñ and speaks the Spanish letter names (be, ce, hache, jota…). |
| Phonics (letter sounds) | ✅ Done (I still need to tune it by ear) | `phonics=1` says the letter's sound instead of its name (B → "buh", M → "mmm"); `phonics=both` says both ("B, buh"). English and Spanish (Spanish h says "muda"). Also in the setup screen under Letters, and for single-letter own cards. Browsers can't pronounce raw phonemes, so I spell the sounds for the voice to read, and some may need adjusting per voice: I edit `PHONICS_EN` / `PHONICS_ES` in `src/js/i18n.js`, or override one card with `items=B\|buh`. |
| Bilingual (en / es) | ✅ Done | `lang=es` translates every spoken word: numbers as words ("veintidós"), Spanish letter names, shapes, animals, the Start and win phrases. It picks a Spanish voice, preferring the browser's own region. I tested it headless in Edge, which chose a Spanish "Natural" voice. |
| Colombian Spanish | ✅ Done | I use Colombian terms for the Spanish words (carro, carro de policía, carro de bomberos, bus, banano, durazno, rosado, café…). With `lang=es` the voice prefers Colombian Spanish (es-CO, e.g. Edge's Salome / Gonzalo), then US Spanish (es-US), then any Spanish; `lang=es-MX` etc. still picks that region. |
| EN · ES switch | ✅ Done | A tiny, faint switch in the bottom-right corner of the start and end screens (never during play). It switches on the spot, with no reload: tile phrases, card words, voice and the waiting board change immediately. The choice is remembered on the device (and written into the address): opening without `lang=` uses the last choice, else English; a `lang=` in the address always wins. |
| Theme 3: shapes | ✅ Done | circle, oval, square, rectangle, triangle, diamond, pentagon, hexagon, heptagon, octagon, star, heart, semicircle (es: semicírculo). I drew the arch (doorway/tunnel piece) but left it commented out in `shapes.js` for later. |
| Theme 4: pictures | ✅ Done | Seven toddler-easy picture sets, words in English and Colombian Spanish: **farm animals** (full body: cow, pig, horse, sheep, goat, chicken, chick, duck, rabbit, dog, cat, turkey, mouse), **wild animals** (classic safari/zoo: lion, tiger (full body), elephant, giraffe, zebra, hippo, rhino, monkey (full body), gorilla, crocodile, bear, panda, lizard, snake, turtle, skunk), **bugs** / bichos (bee, ladybug/mariquita, butterfly, caterpillar, ant, snail, spider, cricket, beetle, fly, mosquito/zancudo, worm), **birds** / pájaros (penguin, owl, parrot, flamingo, eagle, swan, dove, peacock, rooster), **sea animals** (fish, pufferfish, octopus, crab, dolphin, whale, shark, squid, lobster, seal), **fruits**, **things in nature** (sun, moon, star, cloud, rainbow, flower, tree, mushroom, leaf, snowflake, wave, cactus, rain, lightning). I left vehicles commented out in `i18n.js`. The pictures tile shows 🐶 🍎 🐠. Each game uses one set, chosen at random (never twice in a row), and the voice names it. `set=farm|wild|bugs|birds|sea|fruits|nature` (or the setup screen) fixes one, `set=farm,wild,sea` allows several (one per game, at random); Spanish names work too (`set=bichos`), and the old `set=animals` now means farm. |
| OpenMoji pictures | ✅ Done | Picture cards, tiles and final-firework outlines use **OpenMoji** drawings by default (open-source, identical on every device, works offline: stored in the project and saved by the offline helper). `emoji=native` or Defaults → Emoji switches to the device's own emoji. If a drawing is missing, the device emoji is shown. License CC BY-SA 4.0: credit in the setup screen, `?help=1` and `README.md`. |

## URL parameters

`setup` · `pace` · `peek` · `theme` · `themes` · `cards` · `from` · `to` · `letters` · `case` · `phonics` · `shapes` · `set` · `items` · `lang` · `voice` · `voices` ·
`rate` · `pitch` · `tts` · `sound` · `colors` · `delay` · `vanish` · `back` · `backcolor` · `mark` · `bg` · `bgcolor` · `fullscreen` · `grow` · `rest` · `emoji` · `seed` · `start` · `win` · `again` · `help`

I removed `demo` (the tests now play the round for real) and `starttext` (the "Let's go!" button became the big tile). I also removed some as redundant: `pairs` (use `cards`), `img` (use `items` with `theme=images`), `theme=custom` (guessed from `items`), `vol` (use `sound=0`). I kept `rate` / `pitch` as fine-tuning on top of the `voice=` presets.

## Publishing

People play at **https://camayal.info/wa/pairs** (my GitHub Pages site with the custom domain).

- I keep the website's files here too, in **`site/wa/pairs/`** (`index.html`, `manifest.webmanifest`, `sw.js`), and copy them to the website's `wa/pairs/` whenever they change (rarely).
- In the **website** repository, `wa/pairs/index.html` is only a full-screen iframe showing this repository's build at `/memoriter/dist/` (GitHub Pages of this repo), passing along any settings in the address (`?lang=es`, `?set=fruits`, `?setup`). Next to it, `wa/pairs/manifest.webmanifest` makes `camayal.info/wa/pairs` installable as an app (it reuses the icons from `/memoriter/dist/`). The shell also turns off pull-to-refresh and zoom, since the outer page handles those gestures. `wa/pairs/sw.js` saves the shell, manifest and icons for offline use; the game in the iframe saves itself with `dist/sw.js`. After one visit online, the installed app opens with no connection (I tested this by stopping a local server, including settings never opened online).
- To update the game, I change `src/`, run `python build.py` (and `python tests/check.py`), then commit and push this repository. Nothing needs copying: the iframe shows the new version.
- The shell and its manifest only change if the game's address or the install details change.

## Open decisions

- ~~Where images come from~~: decided. I use OpenMoji drawings stored in the project (CC BY-SA, credited). Image links with `items=` and `theme=images` still work for own cards.
- ~~Single file vs. multiple files~~: decided. I develop in `src/` and ship one file built with `build.py`. I checked load time (2026-11-08): the built page is only 40 KB compressed, so splitting it wouldn't help; the slow part was the offline helper waiting for the network and the Google Fonts request (both fixed).
- **Languages:** only `en` and `es` have built-in words today. Do I need more?

## Known issues / limits

- Browsers block sound and speech until the first tap. The game tiles take care of this.
- Voice quality depends on the device and browser. On Windows, only **Edge** has the natural "Online (Natural)" voices. Chrome has the "Google" voices. IDE preview browsers usually only have the older built-in Windows voices (David, Zira, Mark), which sound robotic. I guess the gender from the voice name. Online voices can be slow to start: if a voice hasn't spoken within 1.2 s, the game retries, switching to a voice installed on the device in the same language if there is one.
- Spanish (or any language) only sounds right if the device or browser has a voice for it. Otherwise the default voice reads the Spanish words with a foreign accent, and the Start screen shows a note. `lang=` also accepts `spanish` / `español`.
- `python tests/check.py --dist` falls back to slower one-page-at-a-time loading (~20 s); the development page uses the fast path (~5 s).
- Phonics sounds are approximations I spelled for the voice ("sss", "buh"). Some voices may read a stretched sound letter by letter ("ess ess ess"). Recorded clips would sound best.
- Android tip for parents: Settings → Security → App pinning (screen pinning) keeps the toddler inside the browser/app.
- With `emoji=native`, emoji look different on each operating system (OpenMoji, the default, looks the same everywhere).
- I've tested it on desktop, an Android tablet and an Android phone. I haven't tested it yet on iPad / iPhone (Safari) or inside third-party iframes. Iframe hosts may need `allow="autoplay"`.

## Future development

### Near term
- [x] ~~Test on real devices: desktop, Android tablet, Android phone~~ (done)
- [ ] Test on iPad / iPhone (Safari) and embedded in a third-party iframe
- [x] ~~Decide where images come from and build theme 4 properly~~ (OpenMoji)
- [x] ~~Optional soft chime on a match~~ (I replaced it with the pop and small firework)
- [x] ~~Bundle the font so it works fully offline~~ (stored in `assets/fonts/`, no Google Fonts)
- [x] ~~Pick a more predictable default voice~~ (voice presets + quality ranking)
- [ ] Consider recorded audio or a cloud TTS service if browser voices stay too robotic on my target devices

### Themes / content
- [ ] Better phonics: recorded letter-sound clips (one short recording per sound, en + es) instead of spelled approximations; until then, I tune `PHONICS_EN` / `PHONICS_ES` by ear per voice
- [ ] More picture sets if needed (food, clothes, toys, body parts), keeping only words toddlers know (done so far: farm, wild, bugs, birds, sea)
- [x] ~~Colors theme~~ (done)
- [ ] Number words and quantities (dots or fingers matched to a digit)
- [ ] Matching uppercase to lowercase (A ↔ a)
- [ ] Mixed pairs: picture ↔ word, number ↔ quantity (the two cards of a pair look different)
- [x] ~~Ready-made packs~~: animals, fruits, vehicles, nature (`set=`)

### Lower stimulation (ideas I want to build later)
- [ ] No movement mode (`animation=0`, also in setup): remove animation, quieter and fewer sounds, no sparkles, no fireworks
- [ ] Quiet transition between games: the screen dims and a slow "breathing" circle grows and shrinks three times before the tiles appear
- [ ] Fewer rewards per match: matched pairs fade away softly (no sparkle or pop); excitement kept for the end only
- [x] ~~Slower pace in the game~~: calm pace ignores taps while two cards are open (default). If needed, `delay=` makes wrong pairs stay longer.
- [ ] Gentle cooldown on the end tiles: they fade in slowly and ignore taps for the first 2 seconds
- [ ] Session limits for parents in setup: rest length in minutes (auto-unlock after the break) and a daily maximum of games

### Gameplay / UX
- [x] ~~Preview mode~~: `peek=N` (or Peek in setup, Defaults and link) shows every card face up for N seconds when a game starts, silently, then turns them over; taps are ignored meanwhile. Off by default (`peek=0`).
- [ ] Difficulty presets (`level=1..3`) that set the pair count
- [x] ~~Card back styles~~ (done: `back=`, `backcolor=`)
- [x] ~~A parent settings panel~~ (`?setup`)
- [ ] Keyboard and switch access for accessibility

### Technical
- [ ] Message API so the hosting page can be notified when a game ends (`postMessage`)
- [x] ~~Install as an app (PWA)~~, with offline play
- [x] ~~Faster start~~: the offline helpers (`app/sw.js` and the shell's `sw.js`) open everything from the saved copy straight away and refresh it in the background, instead of waiting for the network first (which was slow on a weak signal). An update now shows on the **next** open. On the first visit, the pictures are saved after the first screen, not before.
- [x] ~~Offline play for the installed app from `camayal.info/wa/pairs`~~ (`site/wa/pairs/sw.js`)
- [ ] Recorded voice clips as an alternative to TTS (`audio=url`)
- [x] ~~Split into modules~~ (`src/` + `build.py`)
- [x] ~~Automated checks~~ (`tests/check.py`)



AI development supported