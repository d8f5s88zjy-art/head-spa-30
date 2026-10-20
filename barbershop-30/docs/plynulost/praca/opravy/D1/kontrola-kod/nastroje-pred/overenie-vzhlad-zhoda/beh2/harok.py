#!/usr/bin/env python3
"""Hárok snímok vedľa seba s popisom. python3 -I harok.py výstup.jpg výška_px 'popis=súbor' ..."""
import sys
from PIL import Image, ImageDraw, ImageFont
out, H = sys.argv[1], int(sys.argv[2])
items = [a.split('=', 1) for a in sys.argv[3:]]
ims = []
for lab, f in items:
    im = Image.open(f).convert('RGB'); im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS); ims.append((lab, im))
W = sum(i.width for _, i in ims) + 8 * (len(ims) - 1)
sheet = Image.new('RGB', (W, H + 28), (40, 40, 40)); d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except Exception: font = ImageFont.load_default()
x = 0
for lab, im in ims:
    sheet.paste(im, (x, 28)); d.text((x + 4, 5), lab, fill=(255, 255, 255), font=font); x += im.width + 8
sheet.save(out, quality=88)
