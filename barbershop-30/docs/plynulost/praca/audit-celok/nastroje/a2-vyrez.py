#!/usr/bin/env python3
"""A2 – výrezy snímok do jedného hárku na overenie nálezov okom.
  python3 -I a2-vyrez.py <výstup.jpg> <popis>=<súbor>[@x,y,w,h][*zväčšenie] ...
"""
import sys
from PIL import Image, ImageDraw, ImageFont
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
except OSError:
    F = ImageFont.load_default()
out = sys.argv[1]
ims, labels = [], []
for a in sys.argv[2:]:
    lab, spec = a.split('=', 1)
    z = 1.0
    if '*' in spec:
        spec, zz = spec.rsplit('*', 1); z = float(zz)
    box = None
    if '@' in spec:
        spec, b = spec.split('@', 1); box = [int(v) for v in b.split(',')]
    im = Image.open(spec).convert('RGB')
    if box:
        im = im.crop((box[0], box[1], box[0] + box[2], box[1] + box[3]))
    if z != 1:
        im = im.resize((max(1, round(im.width * z)), max(1, round(im.height * z))), Image.LANCZOS)
    ims.append(im); labels.append(lab)
W = sum(i.width for i in ims) + 10 * (len(ims) + 1)
H = max(i.height for i in ims) + 50
c = Image.new('RGB', (W, H), (235, 235, 235)); d = ImageDraw.Draw(c)
x = 10
for im, lab in zip(ims, labels):
    c.paste(im, (x, 30)); d.text((x, 8), lab, fill=(120, 0, 0), font=F); x += im.width + 10
c.save(out, quality=82)
print(out, c.size)
