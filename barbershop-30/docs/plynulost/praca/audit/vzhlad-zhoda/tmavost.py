#!/usr/bin/env python3
"""Tmavé plochy na zábere karty (celá snímka obrazovky s textom, vinetáciami a stmavením karty, ako ju vidí návštevník):
podiel plochy okna s jasom < 20/255 (takmer čierna) a priemerný jas spodných 40 % a horných 60 %.
python3 -I tmavost.py priečinok... > merania/tmavost.tsv"""
import sys, os, json
import numpy as np
from PIL import Image
print('zariadenie\tmód\tkarta\tčierna<20\tjas_spodok40\tjas_hore60')
for d in sys.argv[1:]:
    J = json.load(open(os.path.join(d, 'beats.json')))
    for b in J['beats']:
        if b['kind'] != 'karta': continue
        a = np.asarray(Image.open(os.path.join(d, b['file'])).convert('L'), dtype=np.float32)
        H = a.shape[0]; top = int(H * 0.075)          # bez lišty
        a = a[top:]; H = a.shape[0]
        print(f"{J['dev']}\t{J['mode']}\t{b['name']}\t{(a < 20).mean():.2f}\t{a[int(H * .6):].mean():.0f}\t{a[:int(H * .6)].mean():.0f}")
