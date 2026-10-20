#!/usr/bin/env python3
"""Podiel fialových pixelov (kamera vidí za okraj fotky) na snímkach presah-over.mjs. Fialová = R a B výrazne nad G
(aj po vinetácii a rozmazaní strihu). python3 -I fialova.py snimky/presah-0.06 snimky/presah-0.12"""
import sys, os, json
import numpy as np
from PIL import Image
for d in sys.argv[1:]:
    rows = json.load(open(os.path.join(d, 'presah.json'))) if os.path.exists(os.path.join(d, 'presah.json')) else [{'file': os.path.join(d, f), 'name': f.rsplit('-', 1)[0], 'm': int(f.rsplit('-', 1)[1][:3]) / 100} for f in sorted(os.listdir(d)) if f.endswith('.png')]
    worst = {}
    for r in rows:
        a = np.asarray(Image.open(r['file']).convert('RGB'), dtype=np.int32)
        R, G, B = a[..., 0], a[..., 1], a[..., 2]
        mag = (R - G > 40) & (B - G > 40) & (np.abs(R - B) < 90)
        p = mag.mean()
        if p > 0:
            ys, xs = np.nonzero(mag); kde = f"y {ys.min()}–{ys.max()}, x {xs.min()}–{xs.max()}"
        else: kde = ''
        print(f"{os.path.basename(d)}\t{r['name']}\tmix {r['m']:.2f}\tfialová {p*100:.2f} %\t{kde}")
        worst[r['name']] = max(worst.get(r['name'], 0), p)
    print('# najhoršie:', {k: round(v * 100, 2) for k, v in worst.items()})
