"""Z vykreslených poukážok (png/) urobí obrázky pre obchod Booqme a pre rad poukazov na webe.
Booqme: 16:9 s tmavým okrajom hore a dole, aby obchod nič neodrezal; čísla v názve = poradie v obchode.
Web: pomer 2592/1260 (ako v style.css pri .gift .vch img), veľkosti 480/800/1290 v AVIF a WebP, 800 aj JPG."""
import json, os, re, unicodedata
import numpy as np
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.normpath(os.path.join(D, '..', '..', '..', 'assets', 'img', 'poukaz'))
R = json.load(open(os.path.join(D, 'ritualy.json'), encoding='utf-8'))
os.makedirs(os.path.join(D, 'booqme'), exist_ok=True)


def ascii_(s):
    return re.sub(r'[^A-Za-z0-9]+', '-', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()).strip('-')


for r in R:
    im1 = Image.open(os.path.join(D, 'png', r['subor'] + '.png')).convert('RGB')
    # Booqme: celý obrázok 2× väčší (šablóna aj text rovnako), okraj hore a dole predĺži
    # krajné riadky šablóny, aby stuha a tmavé pozadie plynulo pokračovali
    im = im1.resize((im1.width * 2, im1.height * 2), Image.LANCZOS)
    W, H = im.size
    H9 = round(W * 9 / 16)
    hore = (H9 - H) // 2
    a = np.asarray(im)
    can = Image.fromarray(np.concatenate([np.repeat(a[:1], hore, axis=0), a, np.repeat(a[-1:], H9 - H - hore, axis=0)]))
    meno = f"{r['poradie']:02d}-{ascii_(r['nazov'])}.jpg"
    can.save(os.path.join(D, 'booqme', meno), quality=90, optimize=True, progressive=True)
    # web: orez na pomer 2592/1260 rovnomerne hore a dole (len tmavý okraj šablóny)
    W1, H1 = im1.size
    h = round(W1 * 1260 / 2592)
    w = im1.crop((0, (H1 - h) // 2, W1, (H1 - h) // 2 + h))
    for S in (480, 800, 1290):
        x = w.resize((S, round(S * 1260 / 2592)), Image.LANCZOS)
        x.save(os.path.join(WEB, f"{r['subor']}-{S}.webp"), quality=82, method=6)
        x.save(os.path.join(WEB, f"{r['subor']}-{S}.avif"), quality=60)
        if S == 800:
            x.save(os.path.join(WEB, f"{r['subor']}-800.jpg"), quality=84, optimize=True, progressive=True)
    print(meno, r['cena'], '€')
