"""Z vykreslených poukážok (png/) urobí obrázky pre obchod Booqme a ukážky na web.
Booqme: 1600 × 1200 (4 : 3). Obchod ukazuje obrázok vo výreze 200 px vysokom a 192 až 318 px širokom
(object-fit: cover), pri 4 : 3 je na mobile aj na počítači vidieť celú poukážku. Poukážka je na celú šírku,
hore a dole tmavý pás: krajný riadok šablóny vodorovne rozmazaný plynulo prejde do tmavej farby.
Číslo v názve súboru = poradie v obchode.
Web: len rituály s "web": true v ritualy.json, pomer 2592/1260 (ako v style.css pri .gift .vch img),
veľkosti 480/800/1290 v AVIF a WebP, 800 aj JPG.
Rituály so "salon": true majú vlastnú poukážku od salónu (HEAD SPA 30, fotka rituálu, dĺžka namiesto ceny)
v docs/poukazky/salon/<súbor>.png, 1290 × 645; pre tie sa šablóna nepoužije."""
import json, os, re, unicodedata
import numpy as np
from PIL import Image, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
SALON = os.path.normpath(os.path.join(D, '..', 'salon'))
WEB = os.path.normpath(os.path.join(D, '..', '..', '..', 'assets', 'img', 'poukaz'))
R = json.load(open(os.path.join(D, 'ritualy.json'), encoding='utf-8'))
os.makedirs(os.path.join(D, 'booqme'), exist_ok=True)
BW, BH = 1600, 1200


def ascii_(s):
    return re.sub(r'[^A-Za-z0-9]+', '-', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()).strip('-')


def pas(okraj, vyska, smer, plny=False):
    """Tmavý pás nad poukážkou (smer -1) alebo pod ňou (+1) z jej krajných riadkov okraj (k, šírka, 3).
    plny: len tmavá farba bez rozmazaného okraja (poukážky od salónu majú fotku a stuhu až po okraj)."""
    riadok = okraj.mean(axis=0)
    rozm = np.asarray(Image.fromarray(np.clip(np.repeat(riadok[None], 8, 0), 0, 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(60)), dtype=np.float32)[4]
    tmava = np.percentile(okraj.reshape(-1, 3), 30, axis=0) * 0.85
    if plny:
        return np.broadcast_to(tmava, (vyska, okraj.shape[1], 3)).astype(np.float32)
    d = np.arange(1, vyska + 1, dtype=np.float32)[:, None, None]
    t = np.clip(d / 90.0, 0, 1)
    t = t * t * (3 - 2 * t)
    blok = rozm[None] * (1 - t) + tmava[None, None] * t
    return blok if smer > 0 else blok[::-1]


for r in R:
    zdroj = os.path.join(SALON, r['subor'] + '.png') if r.get('salon') else os.path.join(D, 'png', r['subor'] + '.png')
    if not os.path.exists(zdroj):
        print('chýba', os.path.relpath(zdroj, D), '(najprv node docs/poukazky/sablona/vyrob.mjs), preskočené')
        continue
    im1 = Image.open(zdroj).convert('RGB')
    # Booqme
    vh = round(BW * im1.height / im1.width)
    v = np.asarray(im1.resize((BW, vh), Image.LANCZOS), dtype=np.float32)
    hore = (BH - vh) // 2
    can = np.concatenate([pas(v[:3], hore, -1, r.get('salon')), v, pas(v[-3:], BH - vh - hore, +1, r.get('salon'))]).round().clip(0, 255).astype(np.uint8)
    meno = f"{r['poradie']:02d}-{ascii_(r['nazov'])}.jpg"
    Image.fromarray(can).save(os.path.join(D, 'booqme', meno), quality=90, subsampling=0, optimize=True, progressive=True)
    # web: orez na pomer 2592/1260 rovnomerne hore a dole (len tmavý okraj šablóny)
    if r.get('web'):
        W1, H1 = im1.size
        h = round(W1 * 1260 / 2592)
        w = im1.crop((0, (H1 - h) // 2, W1, (H1 - h) // 2 + h))
        for S in (480, 800, 1290):
            x = w.resize((S, round(S * 1260 / 2592)), Image.LANCZOS)
            x.save(os.path.join(WEB, f"{r['subor']}-{S}.webp"), quality=82, method=6)
            x.save(os.path.join(WEB, f"{r['subor']}-{S}.avif"), quality=60)
            if S == 800:
                x.save(os.path.join(WEB, f"{r['subor']}-800.jpg"), quality=84, optimize=True, progressive=True)
    print(meno, r['cena'], '€', 'od salónu' if r.get('salon') else '', 'aj web' if r.get('web') else '')
