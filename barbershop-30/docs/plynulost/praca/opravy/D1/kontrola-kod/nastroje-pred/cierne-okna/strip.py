#!/usr/bin/env python3
"""Pás snímok vedľa seba s časom (na prezretie): python3 strip.py runs/X out.jpg f1 f2 ... (mená súborov z frames/ alebo kluc/)"""
import sys, os, json
from PIL import Image, ImageDraw
run, out, names = sys.argv[1], sys.argv[2], sys.argv[3:]
meta = json.load(open(os.path.join(run, 'meta.json')))
t0 = meta['tNav']; ft = {f['file']: f for f in meta['frames']}
ims = []
for n in names:
    p = os.path.join(run, 'frames', n) if os.path.exists(os.path.join(run, 'frames', n)) else os.path.join(run, 'kluc', n)
    im = Image.open(p).convert('RGB')
    if im.width > 400: im = im.resize((400, int(im.height * 400 / im.width)))
    lab = n
    if n in ft: lab = f"{n} {round(ft[n]['t'] - t0)} ms y={ft[n]['sy']}"
    c = Image.new('RGB', (im.width, im.height + 18), (255, 255, 255)); c.paste(im, (0, 18))
    ImageDraw.Draw(c).text((3, 3), lab, fill=(0, 0, 0)); ims.append(c)
W = sum(i.width for i in ims) + 6 * len(ims); H = max(i.height for i in ims)
s = Image.new('RGB', (W, H), (255, 0, 255)); x = 0
for i in ims: s.paste(i, (x, 0)); x += i.width + 6
s.save(out, quality=85)
