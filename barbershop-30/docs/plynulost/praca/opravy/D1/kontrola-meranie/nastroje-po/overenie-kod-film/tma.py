#!/usr/bin/env python3
"""Overenie kod-film: podiel tmavej jednoliatej plochy v snímkach screencastu (390×844).
Dlaždica 10×10 px je „tmavá bez obsahu“, keď priemerný jas < 0,07 a smerodajná odchýlka < 0,02 (0..1).
Podiel sa počíta z celej plochy aj z pásu 64–760 px (bez lišty a spodného tlačidla).
python3 tma.py <priečinok so snímkami> [--od=ms]  -> riadky: čas, podiel celý, podiel stred, priemerný jas"""
import sys, os, glob
import numpy as np
from PIL import Image

def analyza(p):
    im = np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255.0
    y = 0.2126 * im[..., 0] + 0.7152 * im[..., 1] + 0.0722 * im[..., 2]
    h, w = y.shape
    th, tw = h // 10, w // 10
    t = y[:th * 10, :tw * 10].reshape(th, 10, tw, 10).swapaxes(1, 2).reshape(th, tw, 100)
    m, s = t.mean(2), t.std(2)
    dark = (m < 0.07) & (s < 0.02)
    r0, r1 = int(64 * th / 844), int(760 * th / 844)
    return dark.mean(), dark[r0:r1].mean(), y.mean()

def main():
    d = sys.argv[1]
    od = 0
    for a in sys.argv[2:]:
        if a.startswith('--od='): od = float(a[5:])
    fs = sorted(glob.glob(os.path.join(d, '*.jpg')))
    rows = []
    for f in fs:
        t = int(os.path.basename(f)[:-4])
        a, b, j = analyza(f)
        rows.append((t, a, b, j))
    for t, a, b, j in rows:
        print(f"{t - od:8.0f} ms  tma celá {a:5.2f}  stred {b:5.2f}  jas {j:5.3f}")
    # úseky so stredom > 0,2 tmavý
    run = None; useky = []
    for i, (t, a, b, j) in enumerate(rows):
        if b > 0.2:
            if run is None: run = t
        elif run is not None:
            useky.append((run - od, t - run)); run = None
    if run is not None: useky.append((run - od, None))
    print('úseky (začiatok od značky, trvanie ms; None = trvá do konca záznamu):', useky)

if __name__ == '__main__':
    main()
