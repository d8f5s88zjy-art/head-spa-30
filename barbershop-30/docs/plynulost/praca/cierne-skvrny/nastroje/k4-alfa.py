# K4: alfa plátna filmu z dvoch snímok (pozadie stránky magenta a čierna, film zastavený) a simulácia
# „prehliadač zobrazí takmer nulovú alfu (<= PRAH_SIM/255) ako dieru“ (farba stránky --ink) nad bežnou snímkou z Chromia.
# Použitie: k4-alfa.py <reprodukcia-dir> <výstup.json>
#   <dir>/alfa/<id>-bg1.png (pozadie BG1, napr. 48,48,48), <id>-bg0.png (pozadie #000), <dir>/chromium/<id>.jpg
# Výstup: <dir>/alfa/<id>-alfa.jpg (mapa alfy), <id>-sim.jpg (bežná snímka, alfa 0 -> #0e0d0c), JSON so štatistikou.
import sys, os, json, glob
import numpy as np
from PIL import Image
d, outj = sys.argv[1], sys.argv[2]
INK = np.array([14, 13, 12], np.uint8)
T = int(os.environ.get('PRAH_SIM', 8))
BG1 = [int(v) for v in os.environ.get('BG1', '255,0,255').split(',')]   # farba pozadia snímky -bg1   # simulácia: alfa <= T/255 sa zobrazí ako diera
res = []
for f1 in sorted(glob.glob(os.path.join(d, 'alfa', '*-bg1.png'))):
    i = os.path.basename(f1)[:-8]
    b1 = np.asarray(Image.open(f1).convert('RGB')).astype(np.int32)
    b0 = np.asarray(Image.open(f1.replace('-bg1.png', '-bg0.png')).convert('RGB')).astype(np.int32)
    # Chromium skladá plátno ako premultiplikované: výsledok = c + pozadie·(1−a) (orezané na 255; overené na
    # pixeli diery: G = c_G pri oboch pozadiach). Rozdiel snímok = pozadie·(1−a); kanály orezané na 255 sa vynechajú.
    bg = np.array(BG1, np.float64)
    ok = (b1 < 255) & (bg > 0)
    num = ((b1 - b0) * ok).sum(-1).astype(np.float64)
    den = (bg * ok).sum(-1)
    a = np.clip(1 - np.where(den > 0, num / np.maximum(den, 1), 0), 0, 1)
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
            im[a8 <= T] = INK
            Image.fromarray(im).save(os.path.join(d, 'alfa', i + '-sim.jpg'), quality=85)
    res.append(st)
    print(json.dumps(st, ensure_ascii=False))
json.dump(res, open(outj, 'w'), ensure_ascii=False, indent=1)
