#!/usr/bin/env python3
"""VZ-02 (beh 2): jas snímok odovzdania zálohy filmu zo zmrazených prechodov (odovzdanie-over.mjs, súbory .png).
Pás fotky bez textu (y0..y1 ako podiel výšky, x 8–92 %) a celé okno bez lišty: priemerný jas Rec.709, pomer k snímke
pred filmom a podiel okna s jasom < 20 (kritérium čierneho okna zo zadania: > 20 % plochy).
python3 -I jas-odovzdania.py priečinok y0 y1"""
import sys, os, json
import numpy as np
from PIL import Image
d = sys.argv[1]; y0, y1 = float(sys.argv[2]), float(sys.argv[3])
def L(f):
    a = np.asarray(Image.open(os.path.join(d, f)).convert('RGB'), dtype=np.float64)
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
def stat(f):
    l = L(f); H, W = l.shape
    pas = l[int(H * y0):int(H * y1), int(W * .08):int(W * .92)].mean()
    okno = l[int(H * .08):]
    return pas, okno.mean(), (okno < 20).mean()
J = json.load(open(os.path.join(d, 'odovzdanie.json')))
p0 = stat('pred.png'); pk = stat('po.png')
print(f'pred filmom: pás {p0[0]:.1f}, okno {p0[1]:.1f}, tmavé {p0[2]:.2f} | po dobehnutí: pás {pk[0]:.1f}, okno {pk[1]:.1f}, tmavé {pk[2]:.2f}')
print('t_ms\tzáloha\tplátno\tkrytie\tjas_pásu\tpomer\tjas_okna\tpomer\tpodiel<20')
for r in J['rows']:
    s = stat(r['file'])
    print(f"{r['t']}\t{r['still']:.2f}\t{r['canvas']:.2f}\t{r['cover']:.3f}\t{s[0]:.1f}\t{s[0]/p0[0]:.2f}\t{s[1]:.1f}\t{s[1]/p0[1]:.2f}\t{s[2]:.2f}")
