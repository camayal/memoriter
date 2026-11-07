"""Render app/icon.svg into the PNG icons the installed app needs (no packages needed).

Usage:  python app/make_icons.py

Uses headless Edge/Chrome (same lookup as tests/check.py) to draw the SVG, then crops and
re-encodes with plain zlib. Output (committed, copied into dist/ by build.py):
  app/icon-512.png           rounded corners, transparent outside (regular icon)
  app/icon-maskable-512.png  full square (Android crops it to its own shape)
  app/icon-192.png, app/apple-touch-icon.png (180)
Run it again only when icon.svg changes.
"""
import pathlib, struct, subprocess, sys, tempfile, zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tests"))
from check import BROWSER  # noqa: E402

APP = ROOT / "app"
SVG = (APP / "icon.svg").read_text(encoding="utf-8")


def shoot(html: str, w: int, h: int) -> bytes:
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="memoriter-icon-"))
    (tmp / "i.html").write_text(html, encoding="utf-8")
    out = tmp / "shot.png"
    subprocess.run([BROWSER, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--default-background-color=00000000", f"--user-data-dir={tmp / 'p'}",
                    f"--window-size={w},{h}", f"--screenshot={out}", (tmp / "i.html").as_uri()],
                   capture_output=True, timeout=60)
    return out.read_bytes()


def decode(png: bytes):
    i, idat, w = 8, b"", 0
    while i < len(png):
        n = struct.unpack(">I", png[i:i + 4])[0]; t = png[i + 4:i + 8]; c = png[i + 8:i + 8 + n]
        if t == b"IHDR": w, h, _, ct = struct.unpack(">IIBB", c[:10]); assert ct == 6, "expected RGBA"
        if t == b"IDAT": idat += c
        i += 12 + n
    raw, bpp, rows, prev = zlib.decompress(idat), 4, [], bytearray(w * 4)
    s = w * 4 + 1
    for y in range(h):
        f, line = raw[y * s], bytearray(raw[y * s + 1:(y + 1) * s])
        for x in range(len(line)):
            a = line[x - bpp] if x >= bpp else 0; b = prev[x]; c = prev[x - bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(bytes(line)); prev = line
    return w, h, rows


def encode(rows, w, h) -> bytes:
    chunk = lambda t, c: struct.pack(">I", len(c)) + t + c + struct.pack(">I", zlib.crc32(t + c) & 0xffffffff)
    data = b"".join(b"\x00" + r for r in rows)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(data, 9)) + chunk(b"IEND", b""))


def render(size: int, rounded: bool) -> bytes:
    radius = f"border-radius:{round(size * .22)}px;overflow:hidden;" if rounded else ""
    html = (f"<!doctype html><body style='margin:0;background:transparent'>"
            f"<div style='width:{size}px;height:{size}px;{radius}'>"
            f"{SVG.replace('<svg ', f'<svg width=\"{size}\" height=\"{size}\" ', 1)}</div>")
    w, h, rows = decode(shoot(html, max(size, 520), max(size, 520)))   # headless windows are ≥ 500 px wide
    return encode([r[:size * 4] for r in rows[:size]], size, size)


if __name__ == "__main__":
    (APP / "icon-512.png").write_bytes(render(512, True))
    (APP / "icon-maskable-512.png").write_bytes(render(512, False))
    (APP / "icon-192.png").write_bytes(render(192, True))
    (APP / "apple-touch-icon.png").write_bytes(render(180, False))   # iOS rounds the corners itself
    print("icons written to app/")
