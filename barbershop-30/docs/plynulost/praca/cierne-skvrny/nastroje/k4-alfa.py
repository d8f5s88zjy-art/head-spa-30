# K4: alfa plátna filmu z dvoch snímok (pozadie stránky magenta a čierna, film zastavený) a simulácia
# „prehliadač zobrazí alfu 0 ako dieru“ (farba stránky --ink) nad bežnou snímkou z Chromia.
# Použitie: k4-alfa.py <reprodukcia-dir> <výstup.json>
#   <dir>/alfa/<id>-bg1.png (pozadie #ff00ff), <id>-bg0.png (pozadie #000), <dir>/chromium/<id>.jpg
# Výstup: <dir>/alfa/<id>-alfa.jpg (mapa alfy), <id>-sim.jpg (bežná snímka, alfa 0 -> #0e0d0c), JSON so štatistikou.
import sys, os, json, glob
import numpy as np
from PIL import Image
d, outj = sys.argv[1], sys.argv[2]
INK = np.array([14, 13, 12], np.uint8)
res = []
for f1 in sorted(glob.glob(os.path.join(d, 'alfa', '*-bg1.png'))):
    i = os.path.basename(f1)[:-8]
    b1 = np.asarray(Image.open(f1).convert('RGB')).astype(np.int32)
    b0 = np.asarray(Image.open(f1.replace('-bg1.png', '-bg0.png')).convert('RGB')).astype(np.int32)
    # kompozícia bez premultiplikácie: výsledok = c·a + pozadie·(1−a); rozdiel v R a B = 255·(1−a)
    diff = ((b1[..., 0] - b0[..., 0]) + (b1[..., 2] - b0[..., 2])) / 2.0
    a = np.clip(1 - diff / 255.0, 0, 1)
    a8 = np.rint(a * 255).astype(np.int32)
    H, W = a8.shape
    z = a8 == 0
    ys, xs = np.nonzero(z)
    st = {'id': i, 'okno': [W, H],
          'alfa0_pct': round(100 * z.mean(), 2), 'alfa_do2_pct': round(100 * (a8 <= 2).mean(), 2),
          'alfa_do8_pct': round(100 * (a8 <= 8).mean(), 2), 'alfa_do32_pct': round(100 * (a8 <= 32).mean(), 2),
          'alfa_pod1_pct': round(100 * (a8 < 255).mean(), 2),
          'alfa0_box': [round(xs.min() / W, 3), round(ys.min() / H, 3), round(xs.max() / W, 3), round(ys.max() / H, 3)] if xs.size else None}
    Image.fromarray((a * 255).astype(np.uint8)).save(os.path.join(d, 'alfa', i + '-alfa.jpg'), quality=85)
    n = os.path.join(d, 'chromium', i + '.jpg')
    if os.path.exists(n):
        im = np.asarray(Image.open(n).convert('RGB')).copy()
        if im.shape[:2] == z.shape:
            im[z] = INK
            Image.fromarray(im).save(os.path.join(d, 'alfa', i + '-sim.jpg'), quality=85)
    res.append(st)
    print(json.dumps(st, ensure_ascii=False))
json.dump(res, open(outj, 'w'), ensure_ascii=False, indent=1)
