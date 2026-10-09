#!/usr/bin/env python3
"""Číslo ostrosti snímky: rozptyl Laplaciánu (jas) v strednej časti obrazu (60 % × 60 %), bez lišty
a dosiek by bolo presnejšie, no rovnaký výrez pre obe verzie stačí na porovnanie. Väčšie = ostrejšie.
python3 -I source/tools/ostrost.py snímka.png ..."""
import sys
import numpy as np
from PIL import Image
for p in sys.argv[1:]:
    im = Image.open(p).convert('L'); W, H = im.size
    a = np.asarray(im.crop((int(W * .2), int(H * .2), int(W * .8), int(H * .8))), dtype=np.float64)
    lap = -4 * a[1:-1, 1:-1] + a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:]
    print(f'{p}\t{lap.var():.1f}')
