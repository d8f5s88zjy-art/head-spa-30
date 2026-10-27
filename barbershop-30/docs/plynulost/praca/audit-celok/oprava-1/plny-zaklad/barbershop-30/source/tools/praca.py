#!/usr/bin/env python3
"""Fotky práce barberov pre rezerváciu (okno na webe aj rezervacia.html).

Vstup: source/praca/<barber>/*.jpg|jpeg|png|webp, priečinok = meno barbera ako na webe (adrian, nikolas, ...),
fotky od prevádzky (export z Instagramu alebo priamo z telefónu barbera). Klienti na fotkách len so súhlasom
alebo nerozpoznateľní (toolbox/skills-z-praxe/instagram-salon, Ľudia v zábere).
Voliteľne source/praca/<barber>/popis.txt: riadky „subor.jpg: popis fotky“ (alt pre čítačky).

Výstup: assets/img/praca/<barber>-<n>-480.webp a -960.webp (orez na 4:5 so stredom podľa --stred, bez metadát
a polohy GPS) a assets/praca.json {"barberi": {"adrian": [{"maly", "velky", "alt"}]}, "mena": {"adrian": "Adrian"}}.
Fotky sa netónujú ani neupravujú, len orežú a zmenšia.

  python3 -I source/tools/praca.py [--max 8] [--stred 0.5,0.42]
"""
import argparse, json, os, re, sys, unicodedata
from PIL import Image, ImageOps

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
VSTUP = os.path.join(SITE, 'source', 'praca')
VYSTUP = os.path.join(SITE, 'assets', 'img', 'praca')
JSON = os.path.join(SITE, 'assets', 'praca.json')


def slug(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def mena_z_webu():
    """mená barberov tak, ako ich píše web (index.html, .team-name)"""
    html = open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()
    return {slug(m): m for m in re.findall(r'<h3 class="team-name">([^<]+)</h3>', html)}


def orez(im, stred):
    """orez na pomer 4:5 okolo stredu (x, y v 0..1)"""
    w, h = im.size
    cw, ch = (w, round(w * 5 / 4)) if w * 5 / 4 <= h else (round(h * 4 / 5), h)
    x = min(max(round(w * stred[0] - cw / 2), 0), w - cw)
    y = min(max(round(h * stred[1] - ch / 2), 0), h - ch)
    return im.crop((x, y, x + cw, y + ch))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max', type=int, default=8, help='najviac fotiek na barbera')
    ap.add_argument('--stred', default='0.5,0.42', help='stred orezu x,y (0..1), predvolene trochu nad stredom')
    a = ap.parse_args()
    stred = tuple(float(v) for v in a.stred.split(','))
    if not os.path.isdir(VSTUP):
        print(f'chýba {VSTUP} (podpriečinok pre každého barbera)', file=sys.stderr)
        return 2
    mena = mena_z_webu()
    os.makedirs(VYSTUP, exist_ok=True)
    for f in os.listdir(VYSTUP):                     # staré výstupy preč, aby nezostali fotky, ktoré prevádzka vyradila
        if f.endswith('.webp'):
            os.remove(os.path.join(VYSTUP, f))
    data = {'barberi': {}, 'mena': {}}
    for priecinok in sorted(os.listdir(VSTUP)):
        cesta = os.path.join(VSTUP, priecinok)
        if not os.path.isdir(cesta):
            continue
        k = slug(priecinok)
        if k not in mena:
            print(f'POZOR {priecinok}: na webe taký barber nie je (mená: {", ".join(sorted(mena))}), preskakujem')
            continue
        popisy = {}
        if os.path.isfile(os.path.join(cesta, 'popis.txt')):
            for r in open(os.path.join(cesta, 'popis.txt'), encoding='utf-8'):
                if ':' in r:
                    s, t = r.split(':', 1)
                    popisy[s.strip()] = t.strip()
        subory = sorted(f for f in os.listdir(cesta) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))[: a.max]
        polozky = []
        for n, f in enumerate(subory, 1):
            im = ImageOps.exif_transpose(Image.open(os.path.join(cesta, f))).convert('RGB')   # otočenie podľa telefónu
            if min(im.size) < 480:
                print(f'POZOR {priecinok}/{f}: malé rozlíšenie {im.size}, preskakujem')
                continue
            im = orez(im, stred)
            for sirka in (480, 960):
                v = im.resize((sirka, round(sirka * 5 / 4)), Image.LANCZOS)
                v.save(os.path.join(VYSTUP, f'{k}-{n}-{sirka}.webp'), 'WEBP', quality=82, method=6)   # bez EXIF a GPS
            polozky.append({'maly': f'img/praca/{k}-{n}-480.webp', 'velky': f'img/praca/{k}-{n}-960.webp',
                            'alt': popisy.get(f, f'Ukážka práce: {mena[k]}')})
        if polozky:
            data['barberi'][k] = polozky
            data['mena'][k] = mena[k]
            print(f'{mena[k]}: {len(polozky)} fotiek')
    with open(JSON, 'w', encoding='utf-8') as o:
        json.dump(data, o, ensure_ascii=False, separators=(',', ':'))
        o.write('\n')
    print('assets/praca.json:', sum(len(v) for v in data['barberi'].values()), 'fotiek')
    return 0


if __name__ == '__main__':
    sys.exit(main())
