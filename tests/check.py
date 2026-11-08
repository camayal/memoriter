"""Automated checks: load the game with many URL settings in headless Edge/Chrome and verify the result.

Usage:   python tests/check.py            (tests index.html, the development page)
         python tests/check.py --dist     (tests dist/index.html, the built file)

No packages needed. It looks for Edge or Chrome in the usual Windows/macOS/Linux places;
set BROWSER=/path/to/browser to choose one. Nothing is shown on screen (headless).
"""
import html
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / ("dist/index.html" if "--dist" in sys.argv else "index.html")

CANDIDATES = [
    os.environ.get("BROWSER", ""),
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    shutil.which("google-chrome") or "", shutil.which("chromium") or "", shutil.which("msedge") or "",
]
BROWSER = next((c for c in CANDIDATES if c and pathlib.Path(c).exists()), None)
# Kept between runs (in the system temp folder): a warm profile makes the browser start much faster.
PROFILE_ROOT = pathlib.Path(tempfile.gettempdir()) / "memoriter-test-profiles"
WORKERS = 8                      # pages loaded in parallel (each page gets its own browser profile)


_slot = threading.local()
_slots = iter(range(1000))


def load(query: str) -> str:
    # One browser profile per worker thread, reused for every page that worker loads:
    # creating a fresh profile is the slow part of starting the browser.
    if not hasattr(_slot, "n"): _slot.n = next(_slots)
    slot = _slot.n
    url = PAGE.as_uri() + ("?" + query if query else "")
    cmd = [BROWSER, "--headless=new", "--disable-gpu", "--no-first-run", "--mute-audio",
           "--disable-extensions", "--no-default-browser-check", "--disable-component-update",
           f"--user-data-dir={PROFILE_ROOT}/p{slot}", "--virtual-time-budget=600", "--dump-dom", url]
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=60).stdout


BATCH = 8                        # pages per browser start in the fast path


def load_all(queries: list) -> list:
    """Fast path: a few browser starts (batches run in parallel); tests/harness.html loads
    each query of a batch in a frame. Returns None if this browser blocks reading the frames."""
    batches = [queries[i:i + BATCH] for i in range(0, len(queries), BATCH)]
    with ThreadPoolExecutor(len(batches)) as pool:
        results = list(pool.map(lambda ib: _load_batch(ib[1], ib[0]), enumerate(batches)))
    doms = [d for r in results for d in r]
    missing = [i for i, d in enumerate(doms) if d is None]
    # Pages that play a round (_play=1) need the harness (it taps the cards): retry them there, one each.
    play = [i for i in missing if "_play=1" in queries[i]]
    if play:
        with ThreadPoolExecutor(min(WORKERS, len(play))) as pool:
            for i, r in zip(play, pool.map(lambda iq: _load_batch([queries[iq[1]]], 100 + iq[0]), enumerate(play))): doms[i] = r[0]
    missing = [i for i, d in enumerate(doms) if d is None and "_play=1" not in queries[i]]
    if missing:                            # other pages the harness didn't finish: load them one by one
        with ThreadPoolExecutor(WORKERS) as pool:
            for i, d in zip(missing, pool.map(load, [queries[i] for i in missing])): doms[i] = d
        print(f"({len(missing)} pages loaded separately)")
    return [d if d is not None else "" for d in doms]


def _load_batch(queries: list, n: int) -> list:
    import json, urllib.parse
    spec = urllib.parse.quote(json.dumps({"page": PAGE.as_uri(), "queries": queries}))
    url = (ROOT / "tests" / "harness.html").as_uri() + "#" + spec
    cmd = [BROWSER, "--headless=new", "--disable-gpu", "--no-first-run", "--mute-audio",
           "--disable-extensions", "--no-default-browser-check", "--disable-component-update",
           "--allow-file-access-from-files", f"--user-data-dir={PROFILE_ROOT}/harness{n}",
           f"--virtual-time-budget={len(queries) * 15000}", "--dump-dom", url]
    dom = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=300).stdout
    import base64
    out = dom.split('<pre id="out">')[-1].split("</pre>")[0].strip() if '<pre id="out">' in dom else ""
    done = json.loads(base64.b64decode(out).decode("utf-8")) if out else []
    done = [None if d.startswith("ERROR") else d for d in done]
    return done + [None] * (len(queries) - len(done))


class Page:
    def __init__(self, dom: str):
        self.dom = dom
        cards = re.findall(r'<button class="card"[^>]*data-say="([^"]*)"[^>]*>(.*?)</button>', dom, re.S)
        self.say = [html.unescape(s) for s, _ in cards]
        self.faces = [html.unescape(m.group(1)) if (m := re.search(r'<img class="emoji"[^>]*alt="([^"]*)"', body)) else
                      html.unescape(m.group(1)) if (m := re.search(r'class="txt"[^>]*>([^<]*)<', body)) else
                      ("svg" if "<svg" in body else "img" if "<img" in body else "?") for _, body in cards]
        bodies = "".join(body for _, body in cards)          # only the cards, not the Start screen tiles
        self.colors = set(re.findall(r'class="txt" style="[^"]*color:(#[0-9a-fA-F]{6})', bodies)) | \
                      set(re.findall(r'<svg viewBox="0 0 100 100"[^>]*>.*?fill="(#[0-9a-fA-F]{6})"', bodies, re.S))
        root = re.search(r'<html[^>]*style="([^"]*)"', dom)
        self.root_style = html.unescape(root.group(1)) if root else ""

    @property
    def n(self): return len(self.say)


def subset(values, allowed): return set(values) <= set(allowed)


# Emoji of each picture set (from src/js/i18n.js), to check a game uses exactly one set.
_i18n = (ROOT / "src/js/i18n.js").read_text(encoding="utf-8")
_en = "\n".join(l for l in _i18n.split("sets: {")[1].split("findPairs")[0].splitlines() if not l.strip().startswith("//"))
SETS = {name: re.findall(r'"([^"|]+)\|', body) for name, body in re.findall(r"(\w+):\s*\{ name: [^,]+,\s*items: \[(.*?)\] \}", _en)}


# (url query, description, check(page) -> bool)
CASES = [
    ("", "default: 8 cards, numbers 1-4", lambda p: p.n == 8 and subset(p.faces, "1234")),
    ("cards=12", "cards=12", lambda p: p.n == 12),
    ("cards=7", "odd cards rounds down", lambda p: p.n == 6),
    ("theme=numbers&from=5&to=20", "numbers range 5-20", lambda p: p.n == 8 and all(5 <= int(f) <= 20 for f in p.faces)),
    ("from=10&to=12", "range smaller than pairs → 3 pairs", lambda p: p.n == 6 and subset(p.faces, ["10", "11", "12"])),
    ("letters=vowels", "letters=vowels without theme", lambda p: p.n == 8 and subset(p.faces, "AEIOU")),
    ("theme=letters&letters=vowels", "theme=letters&letters=vowels", lambda p: p.n == 8 and subset(p.faces, "AEIOU")),
    ("letters=aeiou&case=lower", "exact list, lower case", lambda p: subset(p.faces, "aeiou")),
    ("theme=letters&letters=a-d", "letters range a-d", lambda p: sorted(set(p.faces)) == list("ABCD")),
    ("theme=letters", "whole alphabet", lambda p: p.n == 8 and all(f.isalpha() and f.isupper() for f in p.faces)),
    ("lang=es&letters=vocales", "Spanish vowels", lambda p: subset(p.faces, "AEIOU")),
    ("lang=es&letters=bhj", "Spanish letter names", lambda p: subset(p.say, ["be", "hache", "jota"])),
    ("letters=bms&phonics=1", "phonics: letter sounds", lambda p: subset(p.say, ["buh", "mmm", "sss"]) and subset(p.faces, "BMS")),
    ("letters=bm&phonics=both", "phonics=both: name then sound", lambda p: subset(p.say, ["B, buh", "M, mmm"])),
    ("lang=es&letters=mph&phonics=1", "Spanish phonics (h is silent)", lambda p: subset(p.say, ["mmm", "pu", "muda"])),
    ("items=A,B&phonics=1", "phonics also for single-letter own cards", lambda p: subset(p.say, ["ah", "buh"])),
    ("setup&theme=letters&phonics=both", "setup shows the phonics choice", lambda p: re.search(r'<option value="both" selected', p.dom)),
    ("lang=es&from=21&to=22", "Spanish number words", lambda p: subset(p.say, ["veintiuno", "veintidós"])),
    ("lang=spanish&from=1&to=2", "lang=spanish alias", lambda p: subset(p.say, ["uno", "dos"])),
    ("lang=en&from=21&to=22", "English number words", lambda p: subset(p.say, ["twenty-one", "twenty-two"])),
    ("theme=shapes", "shapes theme", lambda p: p.n == 8 and all(f == "svg" for f in p.faces)),
    ("theme=shapes&cards=24", "no line shape (all 12 shapes)", lambda p: p.n == 24 and "line" not in p.say),
    ("shapes=line,circle", "line is ignored if asked for", lambda p: set(p.say) == {"circle"}),
    ("shapes=semicircle&lang=es", "semicircle shape (es: semicírculo)", lambda p: p.n == 2 and set(p.say) == {"semicírculo"}),
    ("lang=es", "EN·ES switch on start screen, ES active", lambda p: re.search(r'class="langsw".*?<button[^>]*class="on"[^>]*>ES<', p.dom, re.S)),
    ("start=0&_play=1&again=0&rest=0", "EN·ES switch on end screen", lambda p: 'class="langsw"' in p.dom.split('id="end"')[1].split('id="rest"')[0]),
    ("shapes=circle,triangle", "shapes list without theme", lambda p: p.n == 4 and subset(p.say, ["circle", "triangle"])),
    ("shapes=circle,triangle&lang=es", "Spanish shape names", lambda p: subset(p.say, ["círculo", "triángulo"])),
    ("theme=images", "pictures: one random set per game", lambda p: p.n == 8 and any(subset(p.faces, s) for s in SETS.values())),
    ("set=fruits", "pictures use OpenMoji drawings by default", lambda p: p.dom.count('<img class="emoji"') >= 8 and "openmoji/" in p.dom),
    ("set=fruits&emoji=native", "emoji=native uses the device's emoji", lambda p: '<img class="emoji"' not in p.dom.split('id="grid"')[1].split('id="start"')[0] and subset(p.faces, SETS["fruits"])),
    ("set=fruits", "set=fruits (theme guessed)", lambda p: p.n == 8 and subset(p.faces, SETS["fruits"])),
    ("theme=images&set=sea&lang=es", "Spanish sea animals + phrase", lambda p: subset(p.faces, SETS["sea"]) and "¡Vamos a buscar parejas de animales del mar!" in p.dom),
    ("set=bichos&lang=es", "bugs set by its Spanish name", lambda p: subset(p.faces, SETS["bugs"])),
    ("set=farm,sea", "several sets: each game uses one of them", lambda p: subset(p.faces, SETS["farm"]) or subset(p.faces, SETS["sea"])),
    ("setup&set=farm,sea", "Defaults shows set checkboxes", lambda p: p.dom.count('name="set" value=') >= 7),
    ("set=animals", "old set=animals still works (farm)", lambda p: subset(p.faces, SETS["farm"])),
    ("set=nature&cards=20", "nature set, 10 pairs", lambda p: p.n == 20 and subset(p.faces, SETS["nature"])),
    ("", "pictures tile shows mixed sets", lambda p: all(e in p.dom for e in ["🐶", "🍎", "🐠"])),
    ("setup&set=fruits", "setup: pictures with one set", lambda p: re.search(r'value="images" checked', p.dom) and re.search(r'<option value="fruits" selected', p.dom)),
    ("items=A|Apple,B|Ball", "custom items with spoken text", lambda p: p.n == 4 and subset(p.faces, "AB") and subset(p.say, ["Apple", "Ball"])),
    ("items=cat,dog", "items without theme", lambda p: subset(p.faces, ["cat", "dog"])),
    ("theme=images&items=./a.png|cat,./b.png|dog", "image links in items=", lambda p: p.n == 4 and all(f == "img" for f in p.faces)),
    ("colors=pair", "colors=pair: several colours", lambda p: len(p.colors) > 1),
    ("colors=blue", "colors=blue", lambda p: p.colors == {"#2F6FDB"}),
    ("colors=0", "colors=0: ink", lambda p: p.colors == {"#2F3A4A"}),
    ("colors=ff0000", "colors=hex", lambda p: {c.lower() for c in p.colors} == {"#ff0000"}),
    ("", "default: one colour for all cards", lambda p: len(p.colors) == 1),
    ("back=stars", "back=stars", lambda p: "svg" in p.root_style and "polygon" in p.root_style),
    ("back=checks&backcolor=green", "back=checks + backcolor", lambda p: "conic-gradient" in p.root_style),
    ("mark=0", "mark=0", lambda p: "--mark: none" in p.root_style),
    ("bg=dots", "bg=dots", lambda p: re.search(r"--page-bg:[^;]*radial-gradient", p.root_style) is not None),
    ("bgcolor=blue", "bgcolor=blue (light tint)", lambda p: re.search(r"--page-bg:\s*#[0-9a-f]{6}", p.root_style) is not None and "#fff7ea" not in p.root_style.lower()),
    ("_play=1&start=0&again=0&rest=1", "rest screen after N games (sleepy moon)",
     lambda p: re.search(r'id="rest"[^>]*class="show"', p.dom) and not re.search(r'id="end" class="show"', p.dom)),
    ("start=0&_play=1&again=0&rest=0", "rest=0: game tiles, no moon",
     lambda p: re.search(r'id="end" class="show"', p.dom) and not re.search(r'id="rest"[^>]*class="show"', p.dom)),
    ("setup&rest=3", "setup: rest field pre-filled", lambda p: re.search(r'name="rest"[^>]*value="3"', p.dom)),
    ("_play=1&start=0&rest=0", "end fireworks (night sky on)", lambda p: 'id="night" class="on"' in p.dom),
    ("start=0&_play=1&again=0&rest=0", "end screen: current game big, others small",
     lambda p: re.search(r'id="end" class="show"', p.dom) and re.findall(r'class="tile big" data-theme="(\w+)"', p.dom) == ["numbers"]
               and len(re.findall(r'class="tile small"', p.dom)) == 4),
    ("_play=1&start=0&again=0&themes=letters,shapes&rest=0", "end screen respects themes=",
     lambda p: re.findall(r'class="tile (?:big|small)" data-theme="(\w+)"', p.dom) == ["numbers", "letters", "shapes"]),
    ("_play=1&theme=letters&again=0&rest=0", "parent-made game end: only its big tile",
     lambda p: re.findall(r'class="tile (?:big|small)" data-theme="(\w+)"', p.dom.split('id="end"')[1]) == ["letters"]
               and 'class="replay"' in p.dom.split('id="end"')[1]),
    ("start=0", "start=0 removes Start screen", lambda p: 'id="start"' not in p.dom),
    ("", "Start screen: 5 game tiles", lambda p: p.dom.count('class="tile"') == 5 and 'class="go"' not in p.dom),
    ("themes=numbers,colors", "themes= limits the tiles", lambda p: re.findall(r'data-theme="(\w+)"', p.dom) == ["numbers", "colors"]),
    ("lang=es", "Spanish tile phrase", lambda p: "¡Vamos a buscar parejas de números!" in p.dom),
    ("", "English tile phrase", lambda p: "Let's find pairs of numbers!" in html.unescape(p.dom)),
    ("theme=letters&letters=aeiou", "parent-made game: one big tile + replay badge, previewing its letters",
     lambda p: 'class="tile big"' in p.dom and 'class="replay"' in p.dom and p.dom.count('class="tile') == 1
               and subset(re.findall(r'class="sym"[^>]*>([^<]*)<', p.dom.split('id="start"')[1].split('id="night"')[0]), "AEIOU")),
    ("items=cat,dog,fish", "own words: tile previews them", lambda p: subset(re.findall(r'class="sym"[^>]*>([^<]*)<', p.dom.split('id="start"')[1].split('id="night"')[0]), ["cat", "dog", "fish"])),
    ("theme=numbers&lang=es", "Spanish phrase on parent-made tile", lambda p: "¡Vamos a buscar parejas de números!" in p.dom),
    ("", "grown-up door (…) on start screen", lambda p: 'class="setupdoor"' in p.dom.split('id="start"')[1].split('id="night"')[0]),
    ("setup&theme=letters", "setup has a Cancel button", lambda p: 'class="cancel"' in p.dom),
    ("setup", "setup has the Defaults section", lambda p: 'class="defaults-form"' in p.dom and "Defaults (this device)" in p.dom),
    ("setup", "?setup opens the parents' form", lambda p: 'id="setup"' in p.dom and 'name="theme"' in p.dom),
    ("setup&theme=shapes&shapes=circle,star&cards=12&lang=es", "setup form is pre-filled from the link",
     lambda p: re.search(r'value="shapes" checked', p.dom) and re.search(r'value="circle" checked', p.dom)
               and re.search(r'value="star" checked', p.dom) and re.search(r'<option value="12" selected', p.dom)
               and re.search(r'<option value="es" selected', p.dom)),
    ("theme=colors", "colors theme: swatches", lambda p: p.n == 8 and all(f == "svg" for f in p.faces) and subset(p.say, ["red", "blue", "yellow", "green", "orange", "purple", "pink", "brown", "black"])),
    ("theme=colores&lang=es", "Spanish colour names", lambda p: subset(p.say, ["rojo", "azul", "amarillo", "verde", "naranja", "morado", "rosado", "café", "negro"])),
    ("help=1", "help overlay", lambda p: 'class="overlay"' in p.dom and "MEMORITER" in p.dom),
    ("voices=1", "voices overlay", lambda p: 'class="overlay"' in p.dom and "voices in this browser" in p.dom),
]


def main() -> int:
    if not BROWSER:
        print("No Edge/Chrome found. Set BROWSER=/path/to/browser."); return 2
    print(f"Testing {PAGE.relative_to(ROOT)} with {pathlib.Path(BROWSER).name}\n")
    t0 = time.time()
    queries = [q for q, _, _ in CASES] + ["seed=7&cards=12", "seed=7&cards=12"]
    if "--dist" in sys.argv: queries = [q if "_play=1" not in q else "" for q in queries]
    doms = load_all(queries)
    failed = 0
    skipped = 0
    for (query, desc, check), dom in zip(CASES, doms):
        # Round-playing checks need the frame harness, which only runs reliably on the development
        # page; the built file is made from the same sources, so they're skipped with --dist.
        if "--dist" in sys.argv and "_play=1" in query:
            skipped += 1; continue
        p = Page(dom)
        try: ok = check(p)
        except Exception as e: ok = False; desc += f" (error: {e})"
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {desc:42}  ?{query}")
        if not ok: print(f"      cards={p.n} faces={p.faces} say={p.say} colors={p.colors}")
    # Same seed → same deal.
    a, b = Page(doms[-2]), Page(doms[-1])
    ok = a.faces == b.faces and a.n == 12; failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {'seed= gives the same deal twice':42}  ?seed=7&cards=12")
    note = f", {skipped} round-playing checks skipped (development page only)" if skipped else ""
    print(f"\n{len(CASES) + 1 - failed - skipped} passed, {failed} failed{note}  ({time.time() - t0:.0f} s)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
