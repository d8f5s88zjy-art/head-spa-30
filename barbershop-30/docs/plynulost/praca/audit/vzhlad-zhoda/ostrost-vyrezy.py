#!/usr/bin/env python3
"""Výrezy pre oko: telefón (390, DPR 3) a počítač (1440, DPR 1) v rovnakom uhle zorného poľa (telefón zmenšený
na 558 px šírky, pozri ostrost3.py), stredný výrez 300 × 300 px, zväčšený 2× (bez vyhladenia), vedľa seba.
python3 -I ostrost-vyrezy.py <mód on|off> výstup.jpg karty..."""
import sys, os, json, glob
from PIL import Image, ImageDraw, ImageFont
mode, out, names = sys.argv[1], sys.argv[2], sys.argv[3:]
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception: font = None
def crop(dev, k, tw):
    f = glob.glob(f'shots/{dev}-{mode}/*-{k}-ciste.png')[0]
    im = Image.open(f).convert('RGB')
    if tw < im.width: im = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
    W, H = im.size; cx, cy = W // 2, int(H * .45)
    c = im.crop((cx - 150, cy - 150, cx + 150, cy + 150))
    return c.resize((600, 600), Image.NEAREST)
rows = []
for k in names:
    a, b = crop('p390', k, 558), crop('d1440', k, 1440)
    t = Image.new('RGB', (1212, 640), (30, 30, 30)); t.paste(a, (0, 40)); t.paste(b, (612, 40))
    d = ImageDraw.Draw(t); d.text((6, 8), f'{k}: telefón 390 (DPR 3)', fill=(255, 210, 140), font=font); d.text((618, 8), 'počítač 1440 (DPR 1)', fill=(255, 210, 140), font=font)
    rows.append(t)
sh = Image.new('RGB', (1212 * 2 + 12, ((len(rows) + 1) // 2) * 646), (20, 20, 20))
for i, r in enumerate(rows): sh.paste(r, ((i % 2) * 1224, (i // 2) * 646))
sh.save(out, quality=88); print(out, sh.size)
