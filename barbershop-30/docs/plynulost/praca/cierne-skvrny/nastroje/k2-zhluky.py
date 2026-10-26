# K2: počet súvislých škvŕn (purpurová = alfa 0 v obrázkoch z k2-pokusy.mjs alfa) na snímku
# použitie: python3 -I k2-zhluky.py <priečinok> [min_px]
import sys, glob, os
from PIL import Image
import numpy as np
d = sys.argv[1]; mn = int(sys.argv[2]) if len(sys.argv) > 2 else 400
def comps(m):
    h, w = m.shape; lab = np.zeros((h, w), np.int32); n = 0; sizes = []; boxes = []
    for y0 in range(h):
        row = m[y0]
        for x0 in np.nonzero(row & (lab[y0] == 0))[0]:
            if lab[y0, x0]: continue
            n += 1; st = [(y0, x0)]; lab[y0, x0] = n; c = 0; ys = []; xs = []
            while st:
                y, x = st.pop(); c += 1; ys.append(y); xs.append(x)
                for yy, xx in ((y+1, x), (y-1, x), (y, x+1), (y, x-1)):
                    if 0 <= yy < h and 0 <= xx < w and m[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; st.append((yy, xx))
            sizes.append(c); boxes.append((min(xs), min(ys), max(xs), max(ys)))
    return sizes, boxes
for f in sorted(glob.glob(os.path.join(d, '*.jpg'))):
    if 'napodobenina' in f: continue
    a = np.asarray(Image.open(f).convert('RGB')).astype(int)
    m = (a[..., 0] > 200) & (a[..., 1] < 70) & (a[..., 2] > 200)
    if not m.any(): continue
    s, b = comps(m)
    big = [(si, bi) for si, bi in zip(s, b) if si >= mn]
    print(os.path.basename(f), 'škvŕn', len(big), ' '.join('%dpx@x%d-%d,y%d-%d' % (si, bi[0], bi[2], bi[1], bi[3]) for si, bi in big))
