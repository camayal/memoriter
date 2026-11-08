"""Download the OpenMoji drawings for every emoji the game uses into assets/openmoji/.

Usage:  python app/fetch_openmoji.py

OpenMoji (https://openmoji.org) is an open-source emoji set, the same on every device.
License: CC BY-SA 4.0. Credit is shown in the setup screen and in ?help=1.

It collects the emoji from the picture sets in src/js/i18n.js (lines that are not commented out)
and the tiles in src/js/screens.js, then fetches each one from the openmoji npm package on
jsDelivr. Run it again after adding emoji to a set. build.py copies the folder into dist/.
"""
import pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "openmoji"
VERSION = "17.0.0"
CDN = f"https://cdn.jsdelivr.net/npm/openmoji@{VERSION}/color/svg/"


def used_emoji() -> set:
    found = set()
    i18n = (ROOT / "src/js/i18n.js").read_text(encoding="utf-8")
    sets = "\n".join(l for l in i18n.split("sets: {", 1)[1].split("findPairs")[0].splitlines()
                     if not l.strip().startswith("//"))
    i18n_es = i18n.split("sets: {")[2].split("findPairs")[0]
    for block in (sets, "\n".join(l for l in i18n_es.splitlines() if not l.strip().startswith("//"))):
        found |= set(re.findall(r'"([^"|]+)\|', block))
    screens = (ROOT / "src/js/screens.js").read_text(encoding="utf-8")
    found |= set(re.findall(r'face\("([^"]+)", "emoji"\)', screens))
    return found


def code(e: str) -> str:
    """Emoji → OpenMoji file name: uppercase hex codepoints joined by '-', without the FE0F marker."""
    return "-".join(f"{ord(c):X}" for c in e if ord(c) != 0xFE0F)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    emoji = sorted(used_emoji())
    missing = []
    for e in emoji:
        name = code(e) + ".svg"
        dest = OUT / name
        if dest.exists():
            continue
        try:
            with urllib.request.urlopen(CDN + name, timeout=30) as r:
                dest.write_bytes(r.read())
        except Exception as err:   # noqa: BLE001
            missing.append(f"{e} ({name}): {err}")
    (OUT / "LICENSE.txt").write_text(
        "Emoji graphics by OpenMoji, the open-source emoji and icon project (https://openmoji.org).\n"
        f"Version {VERSION}. License: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).\n",
        encoding="utf-8")
    print(f"openmoji: {len(emoji)} emoji used, {len(list(OUT.glob('*.svg')))} files in assets/openmoji/")
    for m in missing:
        print("  missing:", m)
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
