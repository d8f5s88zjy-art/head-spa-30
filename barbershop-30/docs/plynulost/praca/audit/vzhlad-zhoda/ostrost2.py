#!/usr/bin/env python3
"""Ostrosť snímok bez textu (-ciste.png): python3 -I ostrost2.py priečinok...
Pre každú kartu: L = rozptyl Laplaciánu v strednom výreze 60 % × 50 % (v pixeloch zariadenia),
L2 = to isté po zmenšení na polovicu, HF = L / L2 (podiel energie v najvyššej oktáve; fotka bod na bod
asi 0,25 až 0,5, fotka zväčšená 1,5× pod 0,15, 2× pod 0,08). Plus zdroj/px z beats.json (pixely súboru
na pixel displeja; pod 1 = zväčšené)."""
import sys, os, json
import numpy as np
from PIL import Image
def lap(a):
    return (-4 * a[1:-1, 1:-1] + a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:]).var()
rows = []
for d in sys.argv[1:]:
    J = json.load(open(os.path.join(d, 'beats.json')))
    for b in J['beats']:
        if not b.get('ciste'): continue
        im = Image.open(os.path.join(d, b['ciste'])).convert('L'); W, H = im.size
        c = im.crop((int(W * .2), int(H * .18), int(W * .8), int(H * .68)))
        a = np.asarray(c, dtype=np.float64)
        h = np.asarray(c.resize((c.width // 2, c.height // 2), Image.BOX), dtype=np.float64)
        L, L2 = lap(a), lap(h)
        m = b['imgs'][0] if b['imgs'] else None
        f = b.get('film')
        rows.append((os.path.basename(d), b['name'], round(L, 1), round(L / max(L2, 1e-6), 3), m['src'].split('/')[-1] if m else '-', m['zdroj_na_px'] if m else None, (f'{f["cur"]} tex{f["size"]} dpr{f["dpr"]}' if f else '')))
for r in rows: print('\t'.join(str(x) for x in r))
