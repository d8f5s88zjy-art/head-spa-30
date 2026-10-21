# Kontrola kódu D1: porovnanie snímok svetla okraja kontaktnej karty pred/po v rovnakých fázach animácie
# (svetlo-fazy.mjs). Pre každú fázu a zariadenie: podiel pixelov s rozdielom > 30 úrovní a najväčší rozdiel.
#   python3 -I svetlo-fazy.py <priečinok so snímkami>
import sys, glob, os
from PIL import Image, ImageChops
import numpy as np
d = sys.argv[1]
for dev in ('p390', 'd1440'):
    for T in (0, 900, 1750, 2600, 3500, 4400, 5250, 6100):
        a = os.path.join(d, f'pred-{dev}-{T}.png'); b = os.path.join(d, f'po-{dev}-{T}.png')
        if not (os.path.exists(a) and os.path.exists(b)): continue
        A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB')
        if A.size != B.size:
            print(f'{dev} T={T}: rozmer pred {A.size} po {B.size}'); continue
        D = np.asarray(ImageChops.difference(A, B)).max(axis=2)
        nad30 = (D > 30).mean() * 100
        ys, xs = np.nonzero(D > 30)
        obl = f'x {xs.min()}–{xs.max()} y {ys.min()}–{ys.max()}' if len(xs) else '-'
        print(f'{dev} T={T:4d}: {A.size[0]}x{A.size[1]} px, rozdiel > 30: {nad30:.3f} %, max {D.max()}, oblasť {obl}')
