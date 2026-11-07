"""Bundle index.html + src/ into one self-contained file: dist/memoriter.html

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
OUT = ROOT / "dist" / "memoriter.html"


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

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"build: wrote {OUT.relative_to(ROOT)} ({len(html) // 1024} KB, {len(files)} scripts)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
