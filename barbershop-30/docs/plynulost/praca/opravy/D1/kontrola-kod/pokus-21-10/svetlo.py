# porovnanie snímok svetla okraja pred/po: pás okraja karty (6 css px) a celá karta; podiel pixelov s rozdielom > 30
import sys, glob, os, json
import numpy as np
from PIL import Image
d = os.path.dirname(os.path.abspath(__file__)) + '/svetlo/'
for zar in sys.argv[1:]:
    dpr = 1 if zar == 'pc' else 2
    print('==', zar)
    for f in sorted(glob.glob(d + f'8402-{zar}-[0-9]*.png')):
        ph = f.split('-')[-1][:-4]
        g = f.replace('8402', '8400')
        if not os.path.exists(g): continue
        a = np.asarray(Image.open(f).convert('RGB')).astype(int); b = np.asarray(Image.open(g).convert('RGB')).astype(int)
        if a.shape != b.shape: print(ph, 'rôzny rozmer', a.shape, b.shape); continue
        diff = np.abs(a - b).max(axis=2) > 30
        pad = 4 * dpr; band = 6 * dpr
        h, w = diff.shape
        ring = np.zeros_like(diff); ring[pad:h - pad, pad:w - pad] = True
        inner = np.zeros_like(diff); inner[pad + band:h - pad - band, pad + band:w - pad - band] = True
        ringmask = ring & ~inner
        print(ph, 'pás okraja: %.3f %% (%d px z %d)' % (100 * diff[ringmask].mean(), diff[ringmask].sum(), ringmask.sum()), '| celá karta %.2f %%' % (100 * diff.mean()))
