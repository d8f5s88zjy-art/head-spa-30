#!/usr/bin/env python3
"""Podiel okna s jasom < 20 (z 255, Rec.709) na snímkach záberov (VZ-03, VZ-07). Bez lišty (horných 8 %).
python3 -I tmavost.py priečinok ..."""
import sys, os, json
import numpy as np
from PIL import Image
print('zar\tmód\tkarta\tso_textom\tciste')
for d in sys.argv[1:]:
    J = json.load(open(os.path.join(d, 'zabery.json')))
    for r in J['res']:
        v = []
        for suf in ('.jpg', '-ciste.png'):
            f = os.path.join(d, r['file'] + suf)
            a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float64); H = a.shape[0]
            a = a[int(H * .08):]
            L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
            v.append((L < 20).mean())
        print(f"{J['dev']}\t{J['mode']}\t{r['shot']}\t{v[0]:.2f}\t{v[1]:.2f}")
