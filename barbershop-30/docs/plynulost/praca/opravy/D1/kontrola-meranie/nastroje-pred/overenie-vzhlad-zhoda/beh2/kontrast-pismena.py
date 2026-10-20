#!/usr/bin/env python3
"""Kontrast pod samotnými písmenami (VZ-11): maska = pixely, kde sa snímka s bielym textom líši od snímky bez textu
(rozšírená o 1 px displeja); pozadie sa berie zo snímky bez textu. Medián, p95 a p99 jasu pozadia → kontrast WCAG
farby textu (#F1E9DD). python3 -I kontrast-pismena.py merania/kontrast-*.json"""
import sys, json, re
import numpy as np
from PIL import Image, ImageFilter
def lin(c):
    c = c / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def L(rgb): return 0.2126 * lin(rgb[..., 0]) + 0.7152 * lin(rgb[..., 1]) + 0.0722 * lin(rgb[..., 2])
Lt = float(L(np.array([[[241., 233., 221.]]]))[0, 0])
for j in sys.argv[1:]:
    J = json.load(open(j)); k = J['dsf']
    B = np.asarray(Image.open(J['file']).convert('RGB'), dtype=np.float64)
    A = np.asarray(Image.open(J['file'].replace('-pozadie.png', '-biely.png')).convert('RGB'), dtype=np.float64)
    diff = (np.abs(A - B).sum(-1) > 60).astype(np.uint8) * 255
    mask = np.asarray(Image.fromarray(diff).filter(ImageFilter.MaxFilter(3))) > 0
    for r in J['rects']:
        y0, y1, x0, x1 = int(r['y'] * k), int((r['y'] + r['h']) * k), int(r['x'] * k), int((r['x'] + r['w']) * k)
        m = mask[y0:y1, x0:x1]; b = L(B[y0:y1, x0:x1])[m]
        if b.size < 10: print(j, r['cls'], 'maska prázdna'); continue
        c = lambda q: (Lt + 0.05) / (np.quantile(b, q) + 0.05)
        print(f"{j.split('/')[-1]}\t{r['cls']}\t{r['fs']}\tpixelov {b.size}\tmedián {c(0.5):.1f}:1\tp95 {c(0.95):.1f}:1\tp99 {c(0.99):.1f}:1")
