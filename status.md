# Memoriter: Status

A memory pairs game for toddlers. It is developed as separate source files and bundled into one embeddable HTML file.
Every setting comes from the URL. Add `?help=1` to see them on screen.

_Last updated: 2026-11-07_

## Current state: prototype

Works in a browser but has not been tested on real devices yet.

## Project structure

| Path | What it is |
|---|---|
| `index.html` | **Development page**: open it while working. It loads each source file separately, so errors point to the right file in dev tools. |
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
| `tests/check.py` | `python tests/check.py` checks 49 URL settings in headless Edge/Chrome (~5 s). `--dist` tests the built file. |
| `src/js/board.js` | Game logic: deal, flip, match, layout |
| `src/js/screens.js` | Start screen, play-again button, `?help=1`, `?voices=1` |
| `src/js/main.js` | Start-up |
| `build.py` | `python build.py` bundles everything into `dist/memoriter.html` |
| `dist/memoriter.html` | **The single file to embed or share.** Generated: don't edit it, edit `src/` and rebuild. |

The scripts are plain `<script>` files rather than ES modules, so `index.html` also works when opened straight from disk (`file://`). Load order matters and is set in `index.html`.

To add a language, copy the `en` block in `src/js/i18n.js`, translate it, and accept the new code in `config.js`.

## Original requirements

| Idea | Status | Notes |
|---|---|---|
| Pairs game in one embeddable HTML file | ✅ Done | `dist/memoriter.html`, built from `src/`. No dependencies except the Andika font (Google Fonts, with a system fallback). Works in an `<iframe>`. |
| All settings controlled from the URL | ✅ Done | See the parameter list below and `?help=1`. |
| 8 cards (4 pairs) by default | ✅ Done | `cards=` sets the number of cards (even). |
| Card back patterns, set from the URL | ✅ Done | Pattern and color are both **random by default** and change each game, never repeating the previous one. `back=` random, plain, dots, polka, stripes, diagonal, checks, grid, zigzag, waves, stars, hearts, bubbles. `backcolor=` (random, color name or hex). `mark=0` hides the center circle. |
| Page background pattern | ✅ Done | `bg=` (same patterns, drawn very faint), `bgcolor=`. Plain cream by default to keep focus on the cards. |
| Card contents can be changed | ✅ Done | `items=shown\|spoken`. The theme is guessed from it. With `theme=images`, items can be emoji or image links. |
| TTS reads the flipped card | ✅ Done | Browser Web Speech API (voices come from the OS and browser). Presets: `voice=auto` (most natural), `soft`, `female`, `male`, or part of a voice name. `?voices=1` lists the voices available and plays a sample. `lang`, `rate`, `pitch`. |
| Subtle flip animation | ✅ Done | 380 ms 3D turn, no bounce. Switches off with reduced motion. |
| Soft sound on tap, none on flip | ✅ Done | Generated with Web Audio, no audio files. |
| No score, fireworks at the end | ✅ Done | A short (~4 s) night-sky show: two rockets, a mirrored pair, a quick volley, then a big heart or smiley. Glowing trails, soft panned sounds, "Good job!" / "¡Muy bien!" (`win=`). "Play again" appears when the show ends (`again=` ms). `demo=end` jumps straight to it. (A clapping version was tried and removed.) |
| Soft, toddler-friendly palette with true colors | ✅ Done | Red, blue `#2F6FDB`, yellow, green, orange, purple, pink and brown on a cream background. |
| Matched pair vanishes with a pop sound and a small firework | ✅ Done | Pair stays visible for `vanish=` ms (default 900), then pops away. Its grid slot stays empty so nothing moves around. |
| Every card in a game shares one random color | ✅ Done | Default `colors=one`, so color is never a clue or a distraction. Also `pair`, a color name, a hex value, or `0`. Applies to numbers, letters, custom text and shapes. |
| Start screen: the toddler picks the game | ✅ Done | One big tile per game: numbers **1**, letters **A**, animals 🐶, shapes ▲, colors 🔴. Each tile shows a small fanned stack of three cards, so the child can choose by looking. Tapping says "Let's find pairs of numbers!" / "¡Vamos a buscar parejas de números!" (etc.), pops confetti and starts. The tap also unlocks sound and speech, so the first card is heard. `themes=` limits or orders the tiles. If the URL already picks the game (`theme=`, `letters=`, `shapes=`, `items=`), a single "Let's go!" / "¡Vamos!" button is shown instead (`starttext=`). `start=0` skips the screen. If the device has no voice for the language, a note for the grown-up appears. |
| Choose the next game after the fireworks | ✅ Done | The game just played appears as a big tile in the middle (most likely what the child wants again), with the other games as smaller tiles below. Tapping any tile starts that game. If the URL fixed the game, a single "play again" button appears instead. |
| Theme 5: colors | ✅ Done | Colour swatches (red, blue, yellow, green, orange, purple, pink, brown, black), spoken as their names in English or Spanish. |
| Theme 1: numbers (range from the URL) | ✅ Done | `from` / `to`. Picks at random when the range is bigger than `pairs`. Spoken as words in the game language. |
| Theme 2: letters (`abc`, `a-d`, `aeiou`) | ✅ Done | Also `vowels` / `vocales` and `case=lower`. Spanish adds ñ and speaks the Spanish letter names (be, ce, hache, jota…). |
| Bilingual (en / es) | ✅ Done | `lang=es` translates every spoken word: numbers as words ("veintidós"), Spanish letter names, shapes, animals, the Start and win phrases. Picks a Spanish voice, preferring the browser's own region. Tested headless in Edge, which chose a Spanish "Natural" voice. |
| Theme 3: shapes | ✅ Done | line, circle, oval, square, rectangle, triangle, diamond, pentagon, hexagon, heptagon, octagon, star, heart. |
| Theme 4: images | 🟡 Placeholder | Uses emoji animals for now. Image URLs work. **Where images come from is still to be decided** (see below). |

## URL parameters

`theme` · `themes` · `cards` · `from` · `to` · `letters` · `case` · `shapes` · `items` · `lang` · `voice` · `voices` ·
`rate` · `pitch` · `tts` · `sound` · `colors` · `delay` · `vanish` · `back` · `backcolor` · `mark` · `bg` · `bgcolor` · `seed` · `start` · `starttext` · `win` · `again` · `demo` · `help`

Removed as redundant: `pairs` (use `cards`), `img` (use `items` with `theme=images`), `theme=custom` (guessed from `items`), `vol` (use `sound=0`). Kept `rate` / `pitch` as fine-tuning on top of the `voice=` presets.

## Open decisions

- **Where images come from** (theme 4). Options:
  1. Hosted image links passed with `items=` (and `theme=images`). Flexible, but needs a network connection and someone has to host the images.
  2. Images embedded in the HTML as SVG or data URIs. Works offline and stays one file, but the file gets bigger.
  3. A free icon set (e.g. OpenMoji, CC BY-SA, which requires credit). Looks the same on every device, unlike emoji.
  4. A folder of image packs next to the HTML (`packs/animals/…`). This breaks the single-file goal.
- ~~Single file vs. multiple files~~: decided. Develop in `src/`, ship one file built with `build.py`.
- **Languages:** only `en` and `es` have built-in words today. Do we need more?

## Known issues / limits

- Browsers block sound and speech until the first tap. The Start button takes care of this.
- Voice quality depends on the device and browser. On Windows, only **Edge** has the natural "Online (Natural)" voices. Chrome has the "Google" voices. IDE preview browsers usually only have the older built-in Windows voices (David, Zira, Mark), which sound robotic. Gender is guessed from the voice name. Online voices can be slow to start: if a voice hasn't spoken within 1.2 s, the game retries, switching to a voice installed on the device in the same language if there is one.
- Spanish (or any language) only sounds right if the device or browser has a voice for it. Otherwise the default voice reads the Spanish words with a foreign accent, and the Start screen shows a note. `lang=` also accepts `spanish` / `español`.
- `python tests/check.py --dist` falls back to slower one-page-at-a-time loading (~20 s); the development page uses the fast path (~5 s).
- Emoji look different on each operating system.
- Not tested yet on iOS Safari, Android Chrome or inside third-party iframes. Iframe hosts may need `allow="autoplay"`.
- The font comes from Google Fonts, so it falls back to the system font when offline.

## Future development

### Near term
- [ ] Test on real devices: iPad, Android tablet, phone, desktop, and embedded in an iframe
- [ ] Decide where images come from and build theme 4 properly
- [x] ~~Optional soft chime on a match~~ (replaced by the pop and small firework)
- [ ] Bundle the font in the file so it works fully offline
- [x] ~~Pick a more predictable default voice~~ (voice presets + quality ranking)
- [ ] Consider recorded audio or a cloud TTS service if browser voices stay too robotic on the target devices

### Themes / content
- [x] ~~Colors theme~~ (done)
- [ ] Number words and quantities (dots or fingers matched to a digit)
- [ ] Matching uppercase to lowercase (A ↔ a)
- [ ] Mixed pairs: picture ↔ word, number ↔ quantity (the two cards of a pair look different)
- [ ] Ready-made packs: animals, fruit, vehicles, family, body parts

### Gameplay / UX
- [ ] Preview mode: show all cards for a few seconds at the start (`peek=3`)
- [ ] Difficulty presets (`level=1..3`) that set the pair count
- [x] ~~Card back styles~~ (done: `back=`, `backcolor=`)
- [ ] A parent settings panel (hidden behind a long press) that builds the URL
- [ ] Keyboard and switch access for accessibility

### Technical
- [ ] Message API so the hosting page can be notified when a game ends (`postMessage`)
- [ ] PWA / offline install
- [ ] Recorded voice clips as an alternative to TTS (`audio=url`)
- [x] ~~Split into modules~~ (`src/` + `build.py`)
- [x] ~~Automated checks~~ (`tests/check.py`)
