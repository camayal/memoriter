"""Build the ready-to-publish folder dist/: the whole game in one self-contained dist/index.html,
plus the installable-app files from app/ (manifest, icons, sw.js).
GitHub Pages serves dist/ at /memoriter/dist/; camayal.info/wa/pairs shows it in an iframe.

Usage:  python build.py

- The stylesheet link to src/styles.css is replaced by an inline <style>.
- The <script src> tags between <!-- build:js --> and <!-- endbuild --> are joined, in the same
  order, into one inline <script> wrapped in a function, so nothing leaks into the host page.
No third-party packages needed.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC_HTML = ROOT / "index.html"
OUT = ROOT / "dist" / "index.html"


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def main() -> int:
    html = SRC_HTML.read_text(encoding="utf-8")

    # 1. Inline the stylesheet.
    css_link = re.compile(r'<link rel="stylesheet" href="(src/[^"]+\.css)">')
    html = css_link.sub(lambda m: "<style>\n" + read(m.group(1)) + "</style>", html)

    # 2. Inline the scripts, in order, inside one function scope.
    block = re.search(r"<!-- build:js.*?-->(.*?)<!-- endbuild -->", html, re.S)
    if not block:
        print("build: <!-- build:js --> block not found in index.html", file=sys.stderr)
        return 1
    files = re.findall(r'<script src="([^"]+)"></script>', block.group(1))
    parts = []
    for f in files:
        code = read(f).replace('"use strict";', "", 1)
        if "</script" in code.lower():
            print(f"build: {f} contains '</script', which would break the inline script", file=sys.stderr)
            return 1
        parts.append(f"/* ===== {f} ===== */\n{code.strip()}\n")
    script = '<script>\n(() => {\n"use strict";\n' + "\n".join(parts) + "})();\n</script>"
    html = html[: block.start()] + script + html[block.end():]

    # 3. Embed assets referenced as "assets/…" strings (e.g. the clapping GIF) as data URIs.
    import base64, mimetypes
    def embed(m):
        path = ROOT / m.group(1)
        if not path.exists(): return m.group(0)
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        return '"data:%s;base64,%s"' % (mime, base64.b64encode(path.read_bytes()).decode())
    html = re.sub(r'"(assets/[^"]+)"', embed, html)

    # 4. Drop the development-only comment.
    html = re.sub(r"<!-- Development page:.*?-->\n", "", html, flags=re.S)

    # 5. Installable app (PWA): manifest, icons and the offline helper go next to the built page.
    #    The service worker is only registered when served over http(s) (e.g. GitHub Pages), not from disk.
    html = html.replace("</head>", PWA_HEAD + "</head>", 1)
    import hashlib, shutil
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    build_id = hashlib.sha1(html.encode("utf-8")).hexdigest()[:10]
    for f in APP_FILES:
        shutil.copyfile(ROOT / "app" / f, OUT.parent / f)
    sw = (ROOT / "app" / "sw.js").read_text(encoding="utf-8").replace("__BUILD__", build_id)
    (OUT.parent / "sw.js").write_text(sw, encoding="utf-8")
    print(f"build: wrote {OUT.relative_to(ROOT)} ({len(html) // 1024} KB, {len(files)} scripts) + app files (build {build_id})")
    return 0


APP_FILES = ["manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]
PWA_HEAD = """<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#FFF7EA">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Memoriter">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<script>
  if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
</script>
"""


if __name__ == "__main__":
    sys.exit(main())
