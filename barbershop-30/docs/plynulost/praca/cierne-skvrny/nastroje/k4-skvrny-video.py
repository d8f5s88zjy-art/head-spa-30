# Čierne škvrny v zázname: pre každú snímku súvislé oblasti s jasom <= PRAH (bez dotyku okraja snímky),
# plocha >= MIN px. Výstup: JSON so zoznamom oblastí na snímku. Použitie: k4-skvrny-video.py <priečinok snímok> <výstup.json>
import sys, os, json
import cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
PRAH, MIN = int(os.environ.get('PRAH', 22)), int(os.environ.get('MIN', 250))
files = sorted(f for f in os.listdir(src) if f.endswith('.jpg'))
res = []
for f in files:
    i = int(f[1:5])
    im = cv2.imread(os.path.join(src, f))
    y = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    m = (y <= PRAH).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    H, W = y.shape
    comps = []
    for k in range(1, n):
        x, yy, w, h, a = st[k]
        if a < MIN: continue
        if x <= 1 or yy <= 1 or x + w >= W - 1 or yy + h >= H - 1: continue
        fill = a / float(w * h)
        comps.append({'x': int(x), 'y': int(yy), 'w': int(w), 'h': int(h), 'plocha': int(a), 'vypln': round(fill, 2),
                      'jas': round(float(y[lab == k].mean()), 1)})
    comps.sort(key=lambda c: -c['plocha'])
    res.append({'snimka': i, 't': round((i - 1) / 30, 3), 'oblasti': comps})
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=0)
for r in res:
    if r['oblasti'] and (r['snimka'] % 6 == 1 or r['oblasti'][0]['plocha'] > 2000):
        c = r['oblasti'][0]
        print(r['snimka'], r['t'], len(r['oblasti']), c)
