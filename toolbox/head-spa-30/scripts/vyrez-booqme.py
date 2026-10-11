"""Ukáže, ako obchod Booqme oreže obrázky poukazov (bez prihlásenia, bez nahrávania).

Obchod Booqme (booqme.app/sk/eshop/...) zobrazuje obrázok poukazu v ráme vysokom 200 px
s object-fit: cover. Šírka rámu závisí od zariadenia (namerané 11. 10. 2026):
  mobil 318 px, počítač 263 px, tablet 192 px (aj 1024 px a 992 px okno).
Pri 16 : 9 sa na počítači odreže stuha, pečať a pole PRE, na tablete aj nápisy.
Pri 4 : 3 (1600 × 1200) je na mobile aj počítači vidieť celú poukážku 2 : 1.

Použitie:
  python3 vyrez-booqme.py <výstupný-priečinok> obrazok1.jpg [obrazok2.jpg ...]
Vytvorí tri hárky (mobil, pocitac, tablet) so všetkými obrázkami tak, ako ich obchod ukáže.
"""
import os
import sys

from PIL import Image

RAMY = {'mobil-318x200': (318, 200, 3), 'pocitac-263x200': (263, 200, 2), 'tablet-192x200': (192, 200, 2)}

if len(sys.argv) < 3:
    raise SystemExit(__doc__)
out, subory = sys.argv[1], sys.argv[2:]
os.makedirs(out, exist_ok=True)
for meno, (bw, bh, dpr) in RAMY.items():
    W, H = bw * dpr, bh * dpr
    dlazdice = []
    for f in subory:
        im = Image.open(f).convert('RGB')
        s = max(W / im.width, H / im.height)          # object-fit: cover
        r = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        x, y = (r.width - W) // 2, (r.height - H) // 2  # stred, ako v prehliadači
        dlazdice.append(r.crop((x, y, x + W, y + H)))
    st = 3 if bw > 250 else 4
    ri = -(-len(dlazdice) // st)
    m = 16
    harok = Image.new('RGB', (st * W + (st + 1) * m, ri * H + (ri + 1) * m), (245, 245, 247))
    for i, t in enumerate(dlazdice):
        harok.paste(t, (m + (i % st) * (W + m), m + (i // st) * (H + m)))
    cesta = os.path.join(out, meno + '.jpg')
    harok.save(cesta, quality=88)
    print(cesta)
