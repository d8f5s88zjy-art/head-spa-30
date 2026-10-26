# K2: zelená farba čistenia (pokus „diery“) vo viditeľnej časti telefónu: pás fotky je horných 56 % plátna,
# pod ním je atrament (style.css P16); od 45 % do 56 % výšky je prechod. Použitie: python3 -I k2-pas-telefon.py <priečinok>...
import sys, glob, os
from PIL import Image
import numpy as np
for d in sys.argv[1:]:
    for f in sorted(glob.glob(os.path.join(d, 'strih*.jpg')) + glob.glob(os.path.join(d, '*-t*.jpg'))):
        if '-rt' in f: continue
        a = np.asarray(Image.open(f).convert('RGB')).astype(int); H, W = a.shape[:2]
        y1, y2 = int(0.45 * H), int(0.56 * H)
        g = (a[..., 1] > 110) & (a[..., 0] < 70) & (a[..., 2] < 70) & (a[..., 1] > 2 * (a[..., 0] + a[..., 2]))
        n1, n2 = int(g[:y1].sum()), int(g[y1:y2].sum())
        if n1 or n2:
            ys, xs = np.nonzero(g[:y2])
            print('%-24s %-38s pás=%6d (%.2f %%)  prechod=%5d  x%d-%d y%d-%d' % (os.path.basename(d), os.path.basename(f), n1, 100 * n1 / (W * y1), n2, xs.min(), xs.max(), ys.min(), ys.max()))
