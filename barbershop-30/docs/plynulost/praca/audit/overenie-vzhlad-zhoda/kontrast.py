#!/usr/bin/env python3
"""Kontrast (WCAG) farby textu voči pozadiu v obdĺžniku textu: medián a 99. percentil jasu pozadia (najsvetlejšie miesta).
python3 -I kontrast.py merania/kontrast-*.json"""
import sys, json, re
import numpy as np
from PIL import Image
def lin(c):
    c = c / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def L(rgb): r, g, b = lin(rgb[..., 0]), lin(rgb[..., 1]), lin(rgb[..., 2]); return 0.2126 * r + 0.7152 * g + 0.0722 * b
for j in sys.argv[1:]:
    J = json.load(open(j)); a = np.asarray(Image.open(J['file']).convert('RGB'), dtype=np.float64); k = J['dsf']
    for r in J['rects']:
        rgb = np.array([float(x) for x in re.findall(r'[\d.]+', r['color'])[:3]])
        Lt = float(L(rgb[None, None, :])[0, 0])
        b = a[int(r['y'] * k):int((r['y'] + r['h']) * k), int(r['x'] * k):int((r['x'] + r['w']) * k)]
        Lb = L(b).ravel()
        c50 = (Lt + 0.05) / (np.median(Lb) + 0.05); c99 = (Lt + 0.05) / (np.quantile(Lb, 0.99) + 0.05)
        print(f"{j.split('/')[-1]}\t{r['cls']}\t{r['fs']}\tmedián {c50:.1f}:1\tp99 {c99:.1f}:1")
