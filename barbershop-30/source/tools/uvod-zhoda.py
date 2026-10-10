#!/usr/bin/env python3
"""Zhoda zálohy s prvým snímkom filmu: dvojice zhoda-{zaloha,film}-<zariadenie>[-2].png z uvod-meranie.mjs.

Z oboch snímok sa odstráni jas (vysoký priepust), fázová korelácia dá posun v px a hrubé hľadanie mierku
(0,95 až 1,05). Rámovanie sedí, keď je posun do 8 px a mierka do 2,5 % (zvyšok je hĺbkový posun a nabiehajúci stály pohyb kamery).

Spustenie z koreňa barbershop-30: python3 -I source/tools/uvod-zhoda.py [adresár so snímkami]"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'docs', 'screenshots')

def hp(im):
    g = im.convert('L'); return np.asarray(g, dtype=np.float32) - np.asarray(g.filter(ImageFilter.GaussianBlur(12)), dtype=np.float32)

def shift(a, f):
    H, W = f.shape; y0, y1, x0, x1 = int(H * .1), int(H * .9), int(W * .1), int(W * .9)
    R = np.fft.fft2(a[y0:y1, x0:x1]) * np.conj(np.fft.fft2(f[y0:y1, x0:x1])); R /= np.abs(R) + 1e-6; r = np.fft.ifft2(R).real
    py, px = np.unravel_index(np.argmax(r), r.shape); h, w = r.shape
    return (px if px < w / 2 else px - w), (py if py < h / 2 else py - h), float(r.max())

bad = 0
for fp in sorted(glob.glob(os.path.join(D, 'zhoda-film-*.png'))):
    tag = os.path.basename(fp)[len('zhoda-film-'):-4]; zp = os.path.join(D, f'zhoda-zaloha-{tag}.png')
    if not os.path.exists(zp): continue
    film = Image.open(fp); zal = Image.open(zp); W, H = film.size; F = hp(film)
    dx, dy, _ = shift(hp(zal), F)
    best = None
    for s in np.arange(0.95, 1.051, 0.01):
        w2, h2 = round(W * s), round(H * s); im2 = zal.resize((w2, h2), Image.BILINEAR); ox, oy = (w2 - W) // 2, (h2 - H) // 2
        if ox < 0 or oy < 0: c = Image.new('RGB', (W, H)); c.paste(im2, (-ox, -oy)); im2 = c; ox = oy = 0
        pk = shift(hp(im2)[oy:oy + H, ox:ox + W], F)[2]
        if best is None or pk > best[0]: best = (pk, round(float(s), 2))
    ok = abs(dx) <= 8 * (W / 390 if W < 800 else 1) and abs(dy) <= 8 * (W / 390 if W < 800 else 1) and abs(best[1] - 1) <= 0.025
    bad += not ok
    print(f'{"OK  " if ok else "CHYBA"} {tag}: posun dx {dx:+d} dy {dy:+d} px (snímka {W}×{H}), mierka zálohy {best[1]}')
print('rámovanie zálohy sedí s filmom' if not bad else f'CHYBY: {bad}'); sys.exit(1 if bad else 0)
