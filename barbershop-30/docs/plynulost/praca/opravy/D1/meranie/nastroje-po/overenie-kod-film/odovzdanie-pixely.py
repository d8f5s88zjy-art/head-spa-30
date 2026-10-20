#!/usr/bin/env python3
"""Overenie KF-10: jas obrazu pri odovzdaní zo zálohy do filmu (z behu over-film.mjs --pomaly=0.1).
Faktor obrazu = medián (jas − pozadie) / (jas pred world-in − pozadie) na pixeloch fotky (bez textu a lišty).
python3 odovzdanie-pixely.py <beh-priečinok> [--pomaly=0.1]"""
import json, glob, os, sys
import numpy as np
from PIL import Image
d = sys.argv[1]; k = 0.1
for a in sys.argv[2:]:
    if a.startswith('--pomaly='): k = float(a[9:])
v = json.load(open(os.path.join(d, 'vysledok.json')))
wi = [c[0] for c in v['sonda']['cls'] if 'world-in' in c[1]][0]
fs = sorted(glob.glob(os.path.join(d, 'odovzdanie', '*.jpg')))
ts = [int(os.path.basename(f)[:-4]) - wi for f in fs]
L = lambda f: (lambda im: 0.2126 * im[..., 0] + 0.7152 * im[..., 1] + 0.0722 * im[..., 2])(np.asarray(Image.open(f).convert('RGB')).astype(np.float32) / 255)
B = L([f for f, t in zip(fs, ts) if t < 0][-1]); A = L([f for f, t in zip(fs, ts) if t > 2000 / k][0])
bg = 14 / 255 * 0.95
m = np.zeros_like(B, bool); m[80:700, :] = True; m &= (B > 0.12) & (A > 0.12) & (np.abs(A - B) < 0.08)
res = [(t * k, float(np.median(((L(f) - bg) / (B - bg))[m]))) for f, t in zip(fs, ts) if -500 < t < 16000]
mn = min(res, key=lambda r: r[1]); pod = [r for r in res if r[1] < 0.6]
print('minimum faktora obrazu %.2f pri %.0f ms (čas 1×); pod 0,6 od %.0f do %.0f ms' % (mn[1], mn[0], pod[0][0], pod[-1][0]) if pod else 'minimum %.2f' % mn[1])
