"""Vyreže poukážky zo snímok obrazovky iPhonu (obrázok otvorený v prehliadači fotiek na čiernom pozadí).

Salón posiela poukážky ako snímky obrazovky 1290 × 2796 px; samotná poukážka je v nich na celú šírku
(1290 × 645, 2 : 1) a nad ňou aj pod ňou je čisto čierne pozadie prehliadača. Skript nájde súvislý
blok nečiernych riadkov okolo stredu, skontroluje pomer strán a uloží výrez bez akejkoľvek úpravy.

Použitie:
  python3 orez-poukazky.py <výstupný-priečinok> snimka.png:nazov-suboru [snimka2.png:nazov2 ...]
Príklad:
  python3 toolbox/head-spa-30/scripts/orez-poukazky.py docs/poukazky/salon IMG_1.png:head-spa-relax
Potom v docs/poukazky/sablona/ritualy.json dať rituálu "salon": true a spustiť sablona/export.py.
"""
import os
import sys

import numpy as np
from PIL import Image


def hranice(a, prah=3):
    """Prvý a posledný riadok súvislého nečierneho bloku, ktorý obsahuje stred obrázka."""
    riadok = (a.max(axis=2) > prah).sum(axis=1)
    stred = a.shape[0] // 2
    if riadok[stred] == 0:
        # stred je čierny: vezmi najdlhší súvislý blok
        bloky, s = [], None
        for i, v in enumerate(list(riadok) + [0]):
            if v and s is None:
                s = i
            if not v and s is not None:
                bloky.append((s, i - 1)); s = None
        if not bloky:
            raise SystemExit('na snímke nie je žiadna poukážka')
        return max(bloky, key=lambda b: b[1] - b[0])
    y0 = stred
    while y0 > 0 and riadok[y0 - 1] > 0:
        y0 -= 1
    y1 = stred
    while y1 < len(riadok) - 1 and riadok[y1 + 1] > 0:
        y1 += 1
    return y0, y1


if len(sys.argv) < 3:
    raise SystemExit(__doc__)
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
zle = 0
for arg in sys.argv[2:]:
    cesta, _, meno = arg.rpartition(':')
    meno = meno[:-4] if meno.lower().endswith('.png') else meno
    if not cesta or not meno:
        raise SystemExit(f'chýba názov: {arg} (tvar snimka.png:nazov)')
    if not os.path.isfile(cesta):
        raise SystemExit(f'súbor neexistuje: {cesta}')
    im = Image.open(cesta).convert('RGB')
    a = np.asarray(im).astype(int)
    y0, y1 = hranice(a)
    v = im.crop((0, y0, im.width, y1 + 1))
    pomer = v.width / v.height
    if abs(pomer - 2) >= 0.02:
        # zlý výrez neukladať: v docs/poukazky/salon by prepísal dobrú poukážku
        print(f'NEULOŽENÉ {meno}: pomer {pomer:.3f} (riadky {y0}–{y1}), skontroluj snímku', file=sys.stderr)
        zle += 1
        continue
    ciel = os.path.join(out, meno + '.png')
    os.makedirs(os.path.dirname(ciel), exist_ok=True)
    v.save(ciel, optimize=True)
    print(f'{meno}.png  {v.width}×{v.height}  riadky {y0}–{y1}  OK')
sys.exit(1 if zle else 0)
