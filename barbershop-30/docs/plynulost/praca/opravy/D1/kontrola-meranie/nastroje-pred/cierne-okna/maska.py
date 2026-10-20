#!/usr/bin/env python3
"""Ladenie detektora: vykreslí na snímok dlaždice označené ako tmavé prázdne (červené) a mimo masky obrazu (modré)."""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
run, out, files = sys.argv[1], sys.argv[2], sys.argv[3:]
DARK, FLAT = 0.14, 0.007
ims = []
for fn in files:
    p = os.path.join(run, 'frames', fn)
    im = Image.open(p).convert('RGB'); a = np.asarray(im.convert('L'), dtype=np.float32) / 255
    fh, fw = a.shape; ts = max(8, int(round(fw / 30))); nx, ny = fw // ts, fh // ts
    a2 = a[:ny*ts, :nx*ts].reshape(ny, ts, nx, ts); mean = a2.mean(axis=(1, 3)); std = a2.std(axis=(1, 3))
    ov = im.copy(); d = ImageDraw.Draw(ov, 'RGBA')
    for j in range(ny):
        for i in range(nx):
            if mean[j, i] < DARK and std[j, i] < FLAT:
                d.rectangle([i*ts, j*ts, i*ts+ts-1, j*ts+ts-1], fill=(255, 0, 0, 90))
            d.text((i*ts+1, j*ts+1), f"{int(std[j,i]*1000)}", fill=(255, 255, 0, 160)) if (i % 4 == 0 and j % 4 == 0) else None
    ims.append(ov)
W = sum(i.width for i in ims) + 6*len(ims); H = max(i.height for i in ims)
s = Image.new('RGB', (W, H), (255, 0, 255)); x = 0
for i in ims: s.paste(i, (x, 0)); x += i.width + 6
s.save(out, quality=85)
