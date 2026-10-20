#!/usr/bin/env python3
"""Šírka hrán (VZ-01, VZ-08): odhad rozmazania hrany σ v pixeloch displeja, odolný voči šumu kompresie a doostreniu.
Na silných hranách (horné 1 % gradientu po rozmazaní σ=2 px) sa porovná špička gradientu ostrého obrazu G1 s gradientom
po rozmazaní G2. Pri hrane s rozmazaním σe platí G1/G2 = sqrt(σe² + 4) / σe, teda σe = 2 / sqrt(R² − 1) (medián R).
Výsledok aj v css px (σe / DPR); menšie = ostrejšie. Stredný výrez x 15–85 %, y 12–62 % snímky bez textu.
python3 -I sirka-hran.py priečinok ..."""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter
def grad(a):
    gy, gx = np.gradient(a)
    return np.hypot(gx, gy)
print('zar\tmód\tkarta\tzdroj\tsigma_dev_px\tsigma_css_px')
for d in sys.argv[1:]:
    J = json.load(open(os.path.join(d, 'zabery.json'))); dpr = J['dsf']
    for r in J['res']:
        f = os.path.join(d, r['file'] + '-ciste.png')
        if not os.path.exists(f): continue
        im = Image.open(f).convert('L'); W, H = im.size
        im = im.crop((int(W * .15), int(H * .12), int(W * .85), int(H * .62)))
        a = np.asarray(im, dtype=np.float64)
        b = np.asarray(im.filter(ImageFilter.GaussianBlur(2)), dtype=np.float64)
        G1, G2 = grad(a), grad(b)
        m = 8; G1, G2 = G1[m:-m, m:-m], G2[m:-m, m:-m]
        thr = np.quantile(G2, 0.99)
        sel = G2 >= thr
        # lokálne maximum G1 v okolí 1 px (špička hrany nemusí byť presne na tom istom pixeli)
        from numpy.lib.stride_tricks import sliding_window_view
        G1m = np.pad(sliding_window_view(np.pad(G1, 1, mode='edge'), (3, 3)).max(axis=(2, 3)), 0)
        R = np.median(G1m[sel] / np.maximum(G2[sel], 1e-6))
        se = 2 / np.sqrt(max(R * R - 1, 1e-6))
        fl = r.get('film')
        src = (f"{fl['cur']}" if fl else (r['still'][0]['src'].split('/')[-1] if r.get('still') else '-'))
        print(f"{J['dev']}\t{J['mode']}\t{r['shot']}\t{src}\t{se:.2f}\t{se/dpr:.2f}")
