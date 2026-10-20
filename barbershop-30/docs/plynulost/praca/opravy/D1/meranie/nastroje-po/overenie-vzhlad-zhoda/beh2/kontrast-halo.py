#!/usr/bin/env python3
"""VZ-11 (beh 2): kontrast textu úvodu dvoma spôsobmi.
(a) WCAG bez tieňa: jas fotky pod samotnými písmenami (snímka s priehľadným textom bez tieňa), p50/p95/p99.
(b) s tieňom halo: jas prstenca 1–3 px css tesne za hranou písma na bežnej snímke (to, od čoho sa písmeno naozaj
    odráža), p50/p95/p99. Farba textu #F1E9DD. python3 -I kontrast-halo.py merania/kontrast-*.json"""
import sys, json
import numpy as np
from PIL import Image, ImageFilter
def lin(c):
    c = c / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def L(rgb): return 0.2126 * lin(rgb[..., 0]) + 0.7152 * lin(rgb[..., 1]) + 0.0722 * lin(rgb[..., 2])
Lt = float(L(np.array([[[241., 233., 221.]]]))[0, 0])
cr = lambda b, q: (Lt + 0.05) / (np.quantile(b, q) + 0.05)
for j in sys.argv[1:]:
    J = json.load(open(j)); k = J['dsf']
    T = np.asarray(Image.open(J['file']).convert('RGB'), dtype=np.float64)
    W = np.asarray(Image.open(J['file'].replace('-pozadie.png', '-biely.png')).convert('RGB'), dtype=np.float64)
    A = np.asarray(Image.open(J['file'].replace('-pozadie.png', '-bezne.png')).convert('RGB'), dtype=np.float64)
    m0 = ((np.abs(W - T).sum(-1) > 60).astype(np.uint8) * 255)
    im = Image.fromarray(m0)
    inner = np.asarray(im.filter(ImageFilter.MaxFilter(2 * k - 1 if k > 1 else 3))) > 0      # písmeno + 1 px css (antialias)
    outer = np.asarray(im.filter(ImageFilter.MaxFilter(6 * k + 1))) > 0                       # do 3 px css od hrany
    ring = outer & ~inner
    LT, LA = L(T), L(A)
    for r in J['rects']:
        y0, y1, x0, x1 = int(r['y'] * k), int((r['y'] + r['h']) * k), int(r['x'] * k), int((r['x'] + r['w']) * k)
        m = (m0[y0:y1, x0:x1] > 0); rg = ring[y0:y1, x0:x1]
        b = LT[y0:y1, x0:x1][m]; h = LA[y0:y1, x0:x1][rg]
        if b.size < 10 or h.size < 10: print(j, r['cls'], 'maska prázdna'); continue
        print(f"{j.split('/')[-1]}\t{r['cls']}\t{r['fs']}\tbez tieňa (WCAG) p50 {cr(b,.5):.1f} p95 {cr(b,.95):.1f} p99 {cr(b,.99):.1f}\t| s halo, prstenec za hranou p50 {cr(h,.5):.1f} p95 {cr(h,.95):.1f} p99 {cr(h,.99):.1f}")
