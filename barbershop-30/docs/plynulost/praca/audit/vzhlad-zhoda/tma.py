#!/usr/bin/env python3
"""Prázdne tmavé plochy na snímke: podiel blokov 24×24 css px, ktoré sú tmavé (priemer jasu < 34) a bez
obsahu (smerodajná odchýlka < 3), a najväčší súvislý pás takých riadkov (podiel výšky okna).
python3 -I tma.py priečinok [vzor]"""
import sys, os, json, re
import numpy as np
from PIL import Image
d = sys.argv[1]; pat = re.compile(sys.argv[2]) if len(sys.argv) > 2 else None
J = json.load(open(os.path.join(d, 'beats.json')))
for b in J['beats']:
    if pat and not pat.search(b['name']): continue
    im = Image.open(os.path.join(d, b['file'])).convert('L')
    W, H = im.size; css = W / (390 if W in (1170,) else (360 if W == 1080 else W))
    bs = max(8, int(24 * css))
    a = np.asarray(im, dtype=np.float32)
    top = int(64 * css)   # bez lišty
    a = a[top:, :]
    hb, wb = a.shape[0] // bs, a.shape[1] // bs
    blk = a[:hb * bs, :wb * bs].reshape(hb, bs, wb, bs)
    mean = blk.mean(axis=(1, 3)); sd = blk.std(axis=(1, 3))
    empty = (mean < 34) & (sd < 3)
    frac = empty.mean()
    rows = empty.mean(axis=1) > 0.9
    run = best = 0
    for r in rows:
        run = run + 1 if r else 0; best = max(best, run)
    print(f"{b['name']:28s} y{b['scrollY']:6d} prazdne_tmave={frac:.2f} najdlhsi_pas={best * bs / a.shape[0]:.2f}")
