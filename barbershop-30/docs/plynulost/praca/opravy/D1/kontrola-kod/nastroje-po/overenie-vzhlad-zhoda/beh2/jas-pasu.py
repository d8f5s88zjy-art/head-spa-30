#!/usr/bin/env python3
"""Jas pásu fotky na snímkach odovzdania (VZ-02): priemerný jas (Rec.709) v páse bez textu, relatívne k snímke pred filmom.
python3 -I jas-pasu.py snimky/odovzdanie-p390 y0 y1   (y0, y1 = podiel výšky)"""
import sys, os, json
import numpy as np
from PIL import Image
d = sys.argv[1]; y0, y1 = float(sys.argv[2]), float(sys.argv[3])
def jas(f):
    a = np.asarray(Image.open(os.path.join(d, f)).convert('RGB'), dtype=np.float64)
    H, W, _ = a.shape
    b = a[int(H*y0):int(H*y1), int(W*.08):int(W*.92)]
    return float((0.2126*b[...,0] + 0.7152*b[...,1] + 0.0722*b[...,2]).mean())
J = json.load(open(os.path.join(d, 'odovzdanie.json')))
p0 = jas('pred.jpg' if os.path.exists(os.path.join(d,'pred.jpg')) else 'pred.png'); pk = jas('po.jpg' if os.path.exists(os.path.join(d,'po.jpg')) else 'po.png')
print(f'pred filmom {p0:.1f}  po dobehnutí {pk:.1f}')
print('t_ms\tkrytie\tjas\tpomer_k_pred')
for r in J['rows']:
    j = jas(r['file'])
    print(f"{r['t']}\t{r['cover']:.3f}\t{j:.1f}\t{j/p0:.2f}")
