"""Jemné ladenie a exporty panorám pre web.

Ladenie je zámerne mierne: čierny a biely bod podľa percentilov, slabá S-krivka,
sýtosť +4 %. Farby, svetlo ani materiály sa nemenia.
Výstupy: media/pano-ID-full.webp (plné rozlíšenie zo 4K videa), -1280.webp/.jpg
(mobil, ľahšia verzia, záloha bez WebGL) a -240.webp (okamžitý náhľad).
python3 tools/pano_export.py VSTUP.jpg ID
"""
import sys, json, numpy as np
from PIL import Image, ImageFilter
src, pid = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.float32) / 255
lum = a @ np.array([.2126, .7152, .0722], np.float32)
lo, hi = np.percentile(lum, .4), np.percentile(lum, 99.6)
lo = min(lo, .04); hi = max(hi, .975)          # svetlá sa nezosilňujú, len tiene
a = ((a - lo) / (hi - lo)).clip(0, 1)
a = a + .06 * np.sin(np.pi * (a - .5)) / np.pi * 2 * (a * (1 - a)) * 4     # jemná S-krivka
g = (a @ np.array([.2126, .7152, .0722], np.float32))[..., None]
a = (g + (a - g) * 1.04).clip(0, 1)
out = Image.fromarray((a * 255 + .5).astype(np.uint8))
W, H = out.size
out.save(f'media/pano-{pid}-full.webp', quality=84, method=6)
for h, q in ((1280, 80), (240, 60)):
    r = out.resize((round(W * h / H), h), Image.LANCZOS)
    if h == 1280: r = r.filter(ImageFilter.UnsharpMask(1.1, 40, 2))
    r.save(f'media/pano-{pid}-{h}.webp', quality=q, method=6)
    if h == 1280: r.save(f'media/pano-{pid}-1280.jpg', quality=82, optimize=True, progressive=True)
print(json.dumps({'id': pid, 'w': W, 'h': H}))
