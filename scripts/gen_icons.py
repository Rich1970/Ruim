#!/usr/bin/env python3
"""Genereert de Ruim-iconen: een zachte warme cirkel op bijna-zwart.
Pure Python, geen dependencies (PNG met de hand geëncodeerd)."""
import struct, zlib, math, os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
os.makedirs(OUT, exist_ok=True)

BG = (10, 10, 10)          # #0a0a0a
GLOW = (196, 150, 110)     # warme amber

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

def make_png(size, path, safe=1.0):
    """safe = fractie van halve breedte die de glow mag beslaan (maskable < 1)."""
    cx = cy = (size - 1) / 2.0
    max_r = (size / 2.0) * safe
    core_r = max_r * 0.42
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        for x in range(size):
            dx, dy = x - cx, y - cy
            d = math.sqrt(dx * dx + dy * dy)
            if d <= core_r:
                col = lerp((236, 216, 190), GLOW, (d / core_r) ** 1.4)
                a = 255
            elif d <= max_r:
                t = (d - core_r) / (max_r - core_r)
                col = lerp(GLOW, BG, t ** 0.9)
                a = 255
            else:
                col = BG
                a = 255
            raw += bytes((col[0], col[1], col[2], a))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        crc = zlib.crc32(tag + data) & 0xffffffff
        return c + struct.pack(">I", crc)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(os.path.join(OUT, path), "wb") as f:
        f.write(png)
    print("wrote", path, size)

make_png(192, "icon-192.png", safe=1.0)
make_png(512, "icon-512.png", safe=1.0)
make_png(192, "icon-192-maskable.png", safe=0.80)
make_png(512, "icon-512-maskable.png", safe=0.80)
make_png(180, "apple-touch-icon.png", safe=1.0)
