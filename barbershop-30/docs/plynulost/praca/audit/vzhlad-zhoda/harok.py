#!/usr/bin/env python3
"""Hárok snímok: python3 -I harok.py výstup.jpg šírka_náhľadu stĺpce snímky..."""
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, tw, cols = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); fs = sys.argv[4:]
ims = []
for f in fs:
    im = Image.open(f).convert('RGB'); h = round(im.height * tw / im.width); ims.append((os.path.basename(f), im.resize((tw, h), Image.LANCZOS)))
th = max(i.height for _, i in ims) + 18
rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (cols * (tw + 6), rows * th), (40, 40, 40)); d = ImageDraw.Draw(sh)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except Exception: font = None
for k, (n, i) in enumerate(ims):
    x, y = (k % cols) * (tw + 6), (k // cols) * th
    sh.paste(i, (x, y + 18)); d.text((x + 2, y + 2), n[:40], fill=(255, 200, 120), font=font)
sh.save(out, quality=85)
print(out, sh.size)
