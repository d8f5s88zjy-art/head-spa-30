#!/usr/bin/env python3
"""Kontrast textu titulných kariet voči pozadiu (fotka + stmavenie karty, bez tieňa textu):
99. percentil jasu pozadia v obdĺžniku textu (najsvetlejšie miesto pod písmom) a pomer WCAG k farbe textu.
python3 -I kontrast.py priečinok..."""
import sys, os, json, re
import numpy as np
from PIL import Image
def lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def L(rgb):
    r, g, b = lin(rgb[..., 0]), lin(rgb[..., 1]), lin(rgb[..., 2])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
for d in sys.argv[1:]:
    J = json.load(open(os.path.join(d, 'beats.json'))); K = J.get('kontrast') or {}
    for nm, k in sorted(K.items()):
        im = np.asarray(Image.open(os.path.join(d, k['file'])).convert('RGB'), dtype=np.float64)
        dpr = im.shape[1] / (390 if 'p390' in d else 360 if 'p360' in d else 1440 if 'd1440' in d else 1920)
        out = []
        for r in k['rects']:
            x0, y0 = max(0, int(r['x'] * dpr)), max(0, int(r['y'] * dpr)); x1, y1 = int((r['x'] + r['w']) * dpr), int((r['y'] + r['h']) * dpr)
            if x1 <= x0 or y1 <= y0: continue
            crop = im[y0:y1, x0:x1]
            Lc = L(crop); lb = np.percentile(Lc, 99); lm = np.percentile(Lc, 50)
            m = re.findall(r'[\d.]+', r['color'])[:3]
            lt = float(L(np.array([[list(map(float, m))]]))[0, 0])
            c = (max(lt, lb) + 0.05) / (min(lt, lb) + 0.05); cm = (max(lt, lm) + 0.05) / (min(lt, lm) + 0.05)
            need = 3.0 if r['fs'] >= 24 or (r['fs'] >= 18.66 and int(r['fw']) >= 700) else 4.5
            out.append(f"{r['cls']}({r['fs']:.0f}px) p99 {c:.1f}{'' if c >= need else '!'} p50 {cm:.1f}")
        print(f"{os.path.basename(d):10s} {nm:26s} " + ' | '.join(out))
