"""Obrázky webu VISIONARY LIVING: z originálov klienta (stiahnuté z visionaryliving.sk, priečinok ZDROJ)
vyrobí stupne šírok vo formátoch AVIF a WebP do assets/img/. Nikdy nezväčšuje; stupeň vznikne len vtedy,
keď je originál aspoň taký široký (alebo je to posledný, najväčší stupeň pod šírkou originálu).

Spustenie: ZDROJ=/cesta/k/originalom python3 source/obrazky.py
Výstup: assets/img/<meno>-<šírka>.avif a .webp, assets/img/obrazky.json (rozmery pre srcset a width/height).
"""
import json
import os
import sys

from PIL import Image, ImageDraw

ZDROJ = os.environ.get('ZDROJ') or sys.exit('chýba ZDROJ=/priečinok/s/originálmi')
KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(KOREN, 'assets', 'img')
os.makedirs(OUT, exist_ok=True)
AVIF_Q, WEBP_Q = 64, 82
IKONA_POZADIE = (31, 41, 36)                      # tmavá zelená značky (theme-color #1f2924)
# meno na webe: (súbor originálu, stupne šírok, voliteľný výrez (l, t, r, b) v pomere 0..1, kvalita AVIF)
OBRAZKY = {
    # úvod: loggia s výhľadom do dvora (najväčší originál 2440 × 1373)
    'uvod-loggia': ('2025_03_visiomary-living.jpg', [2400, 1600, 1200, 800], None, 60),
    'uvod-loggia-m': ('2025_03_visiomary-living.jpg', [1080, 720], (0.30, 0.0, 0.86, 1.0), 58),
    # vizualizácie exteriéru
    'exterier-01': ('2025_04_01-1024x576-3.jpg', [1024, 720, 480], None, None),
    'exterier-02': ('2025_04_02-1024x576-2.jpg', [1024, 720, 480], None, None),
    'exterier-03': ('2025_04_03-1024x576-2.jpg', [1024, 720, 480], None, None),
    'exterier-04': ('2025_04_04-1024x576-2.jpg', [1024, 720, 480], None, None),
    'exterier-05': ('2025_04_05-1024x576-2.jpg', [1024, 720, 480], None, None),
    'dron': ('2025_04_dron-1-1024x576-2.jpg', [1024, 720, 480], None, None),
    'bytovky': ('2025_04_vyberovnik-1024x576-1.jpg', [1024, 720, 480], None, None),
    # spojený obrázok dvoch pohľadov: spodná polovica je samostatný pohľad zo zadnej strany
    'dron-dvor': ('2025_03_download.jpg', [1600, 1100, 720], (0.0, 0.53, 1.0, 1.0), None),
    'dron-predok': ('2025_03_download.jpg', [1600, 1100, 720], (0.0, 0.0, 1.0, 0.50), None),
    # interiéry
    'interier-obyvacka-1': ('2025_04_byt-a1-1024x768-2.jpg', [1024, 720, 480], None, None),
    'interier-obyvacka-2': ('2025_04_byt-a1-1-1024x768-2.jpg', [1024, 720, 480], None, None),
    'interier-kuchyna': ('2025_04_byt-a1-2-1024x768-2.jpg', [1024, 720, 480], None, None),
    'interier-spalna-1': ('2025_04_byt-a1-3-768x1024-2.jpg', [768, 480], None, None),
    'interier-kupelna-1': ('2025_04_byt-a1-4-768x1024-2.jpg', [768, 480], None, None),
    'interier-chodba': ('2025_04_8a-1024x768-2.jpg', [1024, 720, 480], None, None),
    'interier-jedalen': ('2025_04_8a-1-1024x768-2.jpg', [1024, 720, 480], None, None),
    'interier-spalna-2': ('2025_03_8-600x450-2.jpg', [600, 480], None, None),
    'interier-detska': ('2025_03_10-600x450-2.jpg', [600, 480], None, None),
    'interier-vstup': ('2025_03_11-600x800-3.jpg', [600, 480], None, None),
    'interier-sedacka-1': ('2025_03_14-650x400-1.jpg', [650, 480], None, None),
    'interier-sedacka-2': ('2025_03_17-600x450-3.jpg', [600, 480], None, None),
    'interier-kuchyna-2': ('2025_03_19-600x450-2.jpg', [600, 480], None, None),
    'interier-kupelna-2': ('2025_03_31-600x800-2.jpg', [600, 480], None, None),
}
# pôdorysy: výkres (ľavá časť) a legenda (pravá časť) z jedného obrázka 2560 × 1440
PODORYSY = ['a1', 'b1', 'c1', 'd1', 'e2', 'f2', 'g2', 'h2', 'i3', 'j3', 'k3', 'l3']
# výrez samotného bytu z pôdorysu (zvýraznená plocha nájdená podľa zlatej farby, s okrajom); rovnaké podlažia
# majú rovnaké rozloženie: A/E/I vľavo hore, B/F/J vľavo dole, C/G/K vpravo dole, D/H/L vpravo hore
VYREZ_BYTU = {'a': (170, 190, 960, 900), 'b': (160, 500, 960, 1240), 'c': (870, 500, 1900, 1240), 'd': (1000, 190, 1900, 720)}
for p in PODORYSY:
    v = VYREZ_BYTU[p[0] if p[0] in VYREZ_BYTU else {'e': 'a', 'f': 'b', 'g': 'c', 'h': 'd', 'i': 'a', 'j': 'b', 'k': 'c', 'l': 'd'}[p[0]]]
    OBRAZKY[f'byt-{p}'] = (f'2025_03_{p}-scaled.jpg', [1100, 720, 480], tuple(x / (2560 if i % 2 == 0 else 1440) for i, x in enumerate(v)), 68)
for p in PODORYSY:
    OBRAZKY[f'podorys-{p}'] = (f'2025_03_{p}-scaled.jpg', [1600, 1100, 720], (0.03, 0.06, 0.775, 0.98), 70)
    OBRAZKY[f'legenda-{p}'] = (f'2025_03_{p}-scaled.jpg', [520], (0.80, 0.28, 0.97, 0.94), 72)


def vyrob(meno, subor, sirky, vyrez, aq):
    im = Image.open(os.path.join(ZDROJ, subor))
    im = im.convert('RGB') if im.mode != 'RGB' else im
    if vyrez:
        W, H = im.size
        im = im.crop((round(vyrez[0] * W), round(vyrez[1] * H), round(vyrez[2] * W), round(vyrez[3] * H)))
    W, H = im.size
    stupne = {}
    for w in sorted(sirky, reverse=True):
        if w > W:
            if stupne or w != max(sirky):
                continue
            w = W                                    # najväčší stupeň najviac v šírke originálu
        r = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        r.save(f'{OUT}/{meno}-{w}.avif', quality=aq or AVIF_Q, speed=5)
        r.save(f'{OUT}/{meno}-{w}.webp', quality=WEBP_Q, method=5)
        stupne[w] = {'w': r.width, 'h': r.height, 'avif': os.path.getsize(f'{OUT}/{meno}-{w}.avif'), 'webp': os.path.getsize(f'{OUT}/{meno}-{w}.webp')}
    return {'w': W, 'h': H, 'stupne': stupne}


def logo():
    """Logo z originálu klienta (biele písmo so zátvorkami na priehľadnom pozadí, vl.png); tmavá verzia vznikne
    prefarbením tej istej kresby (priehľadnosť ostáva). Ikony z fav2.png, ktoré má pôvodný web ako favicon."""
    out = {}
    im = Image.open(os.path.join(ZDROJ, '2025_03_vl.png')).convert('RGBA')
    im = im.crop(im.getbbox())
    for meno, farba in (('logo-biele', (255, 255, 255)), ('logo-tmave', (31, 41, 36))):
        r = im.resize((560, round(im.height * 560 / im.width)), Image.LANCZOS)
        a = r.getchannel('A')
        r = Image.new('RGBA', r.size, farba + (0,))
        r.putalpha(a)
        r.save(f'{OUT}/{meno}.png', optimize=True)
        r.save(f'{OUT}/{meno}.webp', quality=92, method=6)
        out[meno] = {'w': r.width, 'h': r.height}
    # ikona: kresba z fav2.png (čierna na priehľadnom) prefarbená na bielo na tmavozelenom štvorci so zaoblením,
    # aby bola čitateľná na svetlej aj tmavej lište prehliadača
    ik = Image.open(os.path.join(ZDROJ, '2025_03_fav2.png')).convert('RGBA')
    ik = ik.crop(ik.getbbox())
    s = round(max(ik.size) * 1.5)
    biela = Image.new('RGBA', ik.size, (255, 255, 255, 0)); biela.putalpha(ik.getchannel('A'))
    sq = Image.new('RGBA', (s, s), IKONA_POZADIE + (255,))
    sq.alpha_composite(biela, ((s - ik.width) // 2, (s - ik.height) // 2))
    maska = Image.new('L', (s, s), 0)
    ImageDraw.Draw(maska).rounded_rectangle((0, 0, s - 1, s - 1), radius=round(s * 0.18), fill=255)
    sq.putalpha(maska)
    for n in (32, 180, 512):
        r = sq.resize((n, n), Image.LANCZOS)
        if n == 180:                                   # apple-touch-icon nemá priehľadnosť: plný štvorec
            r = Image.alpha_composite(Image.new('RGBA', (n, n), IKONA_POZADIE + (255,)), r)
        r.save(f'{OUT}/ikona-{n}.png', optimize=True)
    return out


if __name__ == '__main__':
    if '--logo' in sys.argv:                           # len logo a ikony (rýchle), obrazky.json ostáva
        j = json.load(open(f'{OUT}/obrazky.json'))
        j['_logo'] = logo(); json.dump(j, open(f'{OUT}/obrazky.json', 'w'), ensure_ascii=False, indent=0)
        print('logo', j['_logo']); sys.exit()
    vysledok = {}
    for meno, (subor, sirky, vyrez, aq) in OBRAZKY.items():
        vysledok[meno] = vyrob(meno, subor, sirky, vyrez, aq)
        print(meno, vysledok[meno]['w'], 'x', vysledok[meno]['h'], {w: f"{t['avif'] // 1024} kB" for w, t in vysledok[meno]['stupne'].items()}, flush=True)
    vysledok['_logo'] = logo()
    print('logo', vysledok['_logo'])
    json.dump(vysledok, open(f'{OUT}/obrazky.json', 'w'), ensure_ascii=False, indent=0)
    print('spolu', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'kB v', OUT)
