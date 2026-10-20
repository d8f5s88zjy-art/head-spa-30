# D1 – porovnanie snímok vzhlad/pred a vzhlad/po (vzhlad.mjs): podiel pixelov s rozdielom > 30 úrovní (max. kanál),
# hárky pred | po | rozdiel (zvýraznený) pre telefón a počítač. Kritérium PLAN D1: ≤ 0,5 % pixelov.
#   python3 -I vzhlad.py
import os, glob
import numpy as np
from PIL import Image
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vzhlad')
riadky = []
for dev in ('p390', 'd1440'):
    trojice = []
    for f in sorted(glob.glob(f'{D}/pred/{dev}-*.png')):
        n = os.path.basename(f); g = f'{D}/po/{n}'
        if not os.path.exists(g): riadky.append((n, None)); continue
        a = np.asarray(Image.open(f).convert('RGB'), dtype=np.int16); b = np.asarray(Image.open(g).convert('RGB'), dtype=np.int16)
        if a.shape != b.shape: riadky.append((n, 'iný rozmer')); continue
        d = np.abs(a - b).max(axis=2)
        podiel = float((d > 30).mean() * 100)
        riadky.append((n, round(podiel, 3), int(d.max()), round(float(d.mean()), 3)))
        m = Image.fromarray(np.where(d[..., None] > 30, np.array([255, 40, 40], np.uint8), (a // 3).astype(np.uint8)))
        trojice.append([Image.open(f).convert('RGB'), Image.open(g).convert('RGB'), m])
    if not trojice: continue
    w = 260 if dev == 'p390' else 480
    th = []
    for t in trojice:
        r = []
        for im in t:
            im = im.copy(); im.thumbnail((w, 2000)); r.append(im)
        th.append(r)
    h = max(r[0].height for r in th)
    sheet = Image.new('RGB', (3 * (w + 6), len(th) * (h + 6)), 'black')
    for i, r in enumerate(th):
        for j, im in enumerate(r): sheet.paste(im, (j * (w + 6), i * (h + 6)))
    sheet.save(f'{D}/harok-{dev}.jpg', quality=82)
print('| snímka | pixely s rozdielom > 30 (%) | max. rozdiel | priemerný rozdiel |')
print('| --- | --- | --- | --- |')
for r in riadky: print('| ' + ' | '.join(str(x) for x in r) + ' |')
