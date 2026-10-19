#!/usr/bin/env python3
"""Ostrosť tak, ako ju vidí oko: snímky bez textu (-ciste.png) sa prevzorkujú na spoločnú uhlovú mriežku
(1 pixel = uhol jedného css px počítača 1440 pri 110 ppi a 60 cm; telefón 3x pri 460 ppi a 30 cm má css px
1,43× väčší uhol, preto sa jeho snímka zmenší na 390 · 1,43 = 558 px šírky) a v strednom výreze 60 % × 50 %
sa zmeria:
  HF  = rozptyl Laplaciánu / rozptyl Laplaciánu po zmenšení na polovicu (podiel energie v najjemnejšej
        oktáve; ostrá fotka 0,3 až 0,5, zväčšená 1,5× pod 0,2, 2× pod 0,12),
  LN  = rozptyl Laplaciánu / rozptyl jasu (detail na jednotku kontrastu, menej závislé od obsahu).
python3 -I ostrost3.py priečinok... > merania/ostrost-oko.tsv"""
import sys, os, json
import numpy as np
from PIL import Image

# css px na šírku pri zmenšení na uhlovú mriežku (telefón 1,43× väčší uhol na css px)
ANG = {'p390': 390 * 1.43, 'p360': 360 * 1.43, 'd1440': 1440, 'd1920': 1920}


def lap(a):
    return (-4 * a[1:-1, 1:-1] + a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:]).var()


print('zariadenie\tmód\tkarta\tHF\tLN\tzdroj')
for d in sys.argv[1:]:
    J = json.load(open(os.path.join(d, 'beats.json')))
    dev = J['dev']
    for b in J['beats']:
        if not b.get('ciste'):
            continue
        im = Image.open(os.path.join(d, b['ciste'])).convert('L')
        W, H = im.size
        tw = round(ANG[dev])
        im = im.resize((tw, round(H * tw / W)), Image.LANCZOS) if tw < W else im
        W, H = im.size
        c = im.crop((int(W * .2), int(H * .18), int(W * .8), int(H * .68)))
        a = np.asarray(c, dtype=np.float64)
        h = np.asarray(c.resize((c.width // 2, c.height // 2), Image.BOX), dtype=np.float64)
        L, L2 = lap(a), lap(h)
        f = b.get('film')
        m = b['imgs'][0] if b['imgs'] else None
        src = (f'{f["cur"]} tex{f["size"]} dpr{f["dpr"]}' if f else (m['src'].split('/')[-1] if m else '-'))
        print(f"{dev}\t{J['mode']}\t{b['name']}\t{L / max(L2, 1e-6):.3f}\t{L / max(a.var(), 1e-6):.4f}\t{src}")
