#!/usr/bin/env python3
"""Zloží snímky vedľa seba s popisom (súbor) do jedného JPG.  python3 montaz.py out.jpg a.jpg b.jpg ... [--h=600]"""
import sys, os
from PIL import Image, ImageDraw
args = [a for a in sys.argv[1:] if not a.startswith('--')]
H = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--h=')), 600))
out, files = args[0], args[1:]
ims = []
for f in files:
    im = Image.open(f).convert('RGB'); w = round(im.width * H / im.height); im = im.resize((w, H))
    c = Image.new('RGB', (w + 6, H + 18), (255, 0, 255)); c.paste(im, (3, 18))
    ImageDraw.Draw(c).text((4, 3), os.path.basename(f)[:60], fill=(0, 0, 0))
    ims.append(c)
W = sum(i.width for i in ims); M = Image.new('RGB', (W, H + 18), (255, 255, 255)); x = 0
for i in ims: M.paste(i, (x, 0)); x += i.width
M.save(out, quality=85)
