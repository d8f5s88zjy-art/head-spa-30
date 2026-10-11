# Tri všeobecné poukážky HEAD SPA 30 z poukážok od salónu: žena, muž, chodidlá (zadanie salónu 11. 10. 2026).
# Z pôvodnej poukážky sa odstráni názov rituálu a dĺžka (mramor sa dopočíta z okolia), veta
# „Darujte chvíľu pokoja.“ sa posunie do stredu uvoľneného miesta a pole „PRE:“ sa zmení na „RITUÁL:“,
# rituál dopíše salón ručne. Písmo popisu je Cormorant Garamond SemiBold (najbližšie k popisom
# na poukážkach salónu, OFL); ak nie je v ~/.cache/headspa30, stiahne sa z Google Fonts.
# Spustenie z koreňa repozitára: python3 -I docs/poukazky/vseobecne/vyrob.py [--tlac]
#   výstup: docs/poukazky/vseobecne/poukazka-{zena,muz,chodidla}.png (1290 × 645, ako poukážky salónu);
#   s --tlac aj tlac/poukazka-*-2580.png (2× zväčšené, 300 dpi, asi 218 × 109 mm; ostrejšie len so
#   zdrojom vo vyššom rozlíšení od salónu)
import os
import re
import sys
import urllib.request

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

TU = os.path.dirname(os.path.abspath(__file__))
KOREN = os.path.normpath(os.path.join(TU, '..', '..', '..'))
CIEL = TU
SALON = os.path.join(KOREN, 'docs', 'poukazky', 'salon')


def pismo():
    cesta = os.path.join(os.path.expanduser('~'), '.cache', 'headspa30', 'CormorantGaramond-SemiBold.ttf')
    if not os.path.exists(cesta):
        os.makedirs(os.path.dirname(cesta), exist_ok=True)
        css = urllib.request.urlopen(urllib.request.Request(
            'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&subset=latin-ext',
            headers={'User-Agent': 'Mozilla/4.0'}), timeout=60).read().decode()
        url = re.search(r'url\((https://[^)]+\.ttf)\)', css).group(1)
        with open(cesta, 'wb') as f:
            f.write(urllib.request.urlopen(url, timeout=60).read())
    return cesta


PISMO = pismo()

# zdroj, zóna názvu a dĺžky (y od, y do), zóna vety (y od, y do)
POUKAZKY = {
    'zena': ('hlbkovy-ritual-pre-pokozku-hlavy.png', (345, 463), (465, 502)),
    'muz': ('gentlemen-harmony-ritual.png', (352, 453), (458, 496)),
    'chodidla': ('klasicky-ritual-pre-chodidla.png', (334, 451), (458, 496)),
}
X0, X1 = 240, 605              # textový stĺpec (bez mašle a oblúka fotky)
RIADOK = (520, 560)            # riadok polí PRE, OD, PLATNOSŤ DO, KÓD
FARBA_POPISU = (227, 215, 154)  # farba popisov polí v originále
POPIS = 'RITUÁL:'


def jas(a):
    return a[..., :3].astype(np.float32).mean(axis=2)


def komponenty(maska):
    n, lab, st, _ = cv2.connectedComponentsWithStats(maska.astype(np.uint8), connectivity=8)
    return n, lab, st


def text_v_zone(a, y0, y1, x0=X0, x1=X1, prah=118):
    """Maska textu, ktorého komponenty ležia celé v zóne (zostupy slova „poukážka“ zhora sa nevezmú)."""
    L = jas(a)
    svetle = np.zeros(L.shape, bool)
    svetle[:, x0:x1] = L[:, x0:x1] > prah
    n, lab, st = komponenty(svetle)
    m = np.zeros(L.shape, bool)
    for i in range(1, n):
        x, y, w, h, plocha = st[i]
        if y >= y0 and y + h <= y1 and plocha >= 2:
            m |= lab == i
    return m


def vymaz(bgr, maska, polomer=5, rozsir=3):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * rozsir + 1, 2 * rozsir + 1))
    m = cv2.dilate(maska.astype(np.uint8) * 255, k)
    return cv2.inpaint(bgr, m, polomer, cv2.INPAINT_TELEA), m > 0


def vymaz_blok(rgb, maska_textu, chran, okraj=12, seed=1):
    """Vymaže celý obdĺžnik okolo textu aj s jeho tieňom; chránené pixely (nápis nad ním) ostanú.
    Mramor sa dopočíta z okolia a dostane zrnitosť ako okolitý mramor."""
    ys, xs = np.where(maska_textu)
    y0, y1 = max(0, ys.min() - okraj), ys.max() + 1 + okraj
    x0, x1 = max(0, xs.min() - okraj), xs.max() + 1 + okraj
    m = np.zeros(maska_textu.shape, np.uint8)
    m[y0:y1, x0:x1] = 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    ch = cv2.dilate(chran.astype(np.uint8), k) > 0
    m[ch] = 0
    src = rgb.copy()
    # chránený nápis na chvíľu stmaviť, aby sa jeho zlato nerozlialo do výplne
    tmave = np.percentile(rgb[y0:y1, x0:x1].reshape(-1, 3), 20, axis=0)
    src[ch] = tmave
    # okraj výplne len z tmavého mramoru: svetlé žilky a zvyšky písma na hrane by sa rozliali do celej plochy
    hrana = cv2.dilate(m, np.ones((5, 5), np.uint8)) > 0
    strop = np.percentile(rgb[hrana & (m == 0)].reshape(-1, 3), 55, axis=0)
    src = np.where(hrana[..., None], np.minimum(src, strop), src).astype(np.uint8)
    bgr = cv2.cvtColor(src, cv2.COLOR_RGB2BGR)
    vypln = cv2.cvtColor(cv2.inpaint(bgr, m, 9, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB).astype(np.float32)
    # zrnitosť: jemná štruktúra tmavého mramoru v prstenci okolo bloku (bez žiliek a textu)
    Y0, Y1, X0_, X1_ = max(0, y0 - 14), y1 + 14, max(0, x0 - 14), x1 + 14
    okno = rgb[Y0:Y1, X0_:X1_].astype(np.float32)
    jemne = okno - cv2.GaussianBlur(okno, (0, 0), 1.2)
    prsten = np.ones(okno.shape[:2], bool)
    prsten[y0 - Y0:y1 - Y0, x0 - X0_:x1 - X0_] = False
    prsten &= okno.mean(2) < 45
    sd = jemne[prsten].std(0) * 0.45
    rng = np.random.default_rng(seed)
    sum_ = rng.normal(0, 1, vypln.shape[:2])[..., None] * sd[None, None, :]
    # mäkký okraj výplne (6 px), aby obdĺžnik nebolo vidieť
    mm = cv2.GaussianBlur((m > 0).astype(np.float32), (0, 0), 2.5)
    mm = np.maximum(mm, cv2.erode((m > 0).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(np.float32))[..., None]
    out = rgb.astype(np.float32)
    out = out * (1 - mm) + (vypln + sum_) * mm
    out[ch] = rgb[ch]
    return np.clip(out, 0, 255).astype(np.uint8)


def nad_zonou(a, y0):
    """Komponenty nápisu „poukážka“, ktoré začínajú nad zónou a zasahujú do nej (zostupy)."""
    L = jas(a)
    svetle = np.zeros(L.shape, bool)
    svetle[:, X0:X1] = L[:, X0:X1] > 60
    n, lab, st = komponenty(svetle)
    m = np.zeros(L.shape, bool)
    for i in range(1, n):
        x, y, w, h, plocha = st[i]
        if y < y0 and y + h > y0 - 30 and plocha > 20:
            m |= lab == i
    return m


def spodok_poukazky(a, y0):
    """Najnižší svetlý pixel nápisu nad zónou (koniec slova „poukážka“ so zostupmi)."""
    L = jas(a)
    svetle = np.zeros(L.shape, bool)
    svetle[:, X0:X1] = L[:, X0:X1] > 118
    n, lab, st = komponenty(svetle)
    dno = 0
    for i in range(1, n):
        x, y, w, h, plocha = st[i]
        if y < y0 and y + h > 250 and plocha > 30:
            dno = max(dno, y + h)
    return dno


def urob(meno, subor, zona, veta):
    rgb = np.asarray(Image.open(os.path.join(SALON, subor)).convert('RGB'))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    H, W = rgb.shape[:2]

    # 1) názov rituálu, dĺžka a veta preč, pozadie dopočítané z okolitého mramoru
    m_nazov = text_v_zone(rgb, *zona)
    m_veta = text_v_zone(rgb, *veta)
    chran = nad_zonou(rgb, zona[0])
    cisty = vymaz_blok(rgb, m_nazov, chran, seed=1)
    cisty = vymaz_blok(cisty, m_veta, chran, seed=2)
    cisty_rgb = cisty.astype(np.float32)

    # 2) veta ako vrstva s priehľadnosťou: alfa z rozdielu jasu oproti vyčistenému pozadiu
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    okolie = cv2.dilate(m_veta.astype(np.uint8), k) > 0
    I = rgb.astype(np.float32)
    jadro = I[m_veta]
    farba = jadro[jadro.mean(1) > np.percentile(jadro.mean(1), 70)].mean(0)
    Lb = cisty_rgb.mean(2)
    alfa = np.clip((I.mean(2) - Lb) / np.maximum(farba.mean() - Lb, 1.0), 0, 1) * okolie
    ys, xs = np.where(alfa > 0.02)
    t0, t1, l0, l1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1

    # 3) veta do stredu medzi „poukážka“ a riadok polí
    dno = spodok_poukazky(rgb, zona[0])
    vyska = t1 - t0
    novy = int(round((dno + RIADOK[0]) / 2 - vyska / 2))
    out = cisty_rgb.copy()
    a = alfa[t0:t1, l0:l1, None]
    out[novy:novy + vyska, l0:l1] = out[novy:novy + vyska, l0:l1] * (1 - a) + farba * a

    # 4) pole „PRE:“ -> „RITUÁL:“: popis preč, okienko sa skráti zľava, nový popis písmom ako originál
    m_pre = text_v_zone(rgb, RIADOK[0], RIADOK[1], 80, 152, prah=110)
    px = np.where(m_pre.any(0))[0]
    pre_l, pre_r = px.min(), px.max() + 1
    py = np.where(m_pre.any(1))[0]
    cap0, cap1 = py.min(), py.max() + 1
    out_bgr = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    out_bgr, _ = vymaz(out_bgr, m_pre, polomer=4, rozsir=2)
    out = cv2.cvtColor(out_bgr, cv2.COLOR_BGR2RGB).astype(np.float32)

    # okienko: krémová plocha v riadku polí
    krem = (I[..., 0] > 215) & (I[..., 1] > 195) & (I[..., 2] > 165)
    riadok = krem[RIADOK[0]:RIADOK[1], pre_r:pre_r + 300]
    stlpce = np.where(riadok.sum(0) > 10)[0]
    box_l = pre_r + stlpce.min()
    box_r = pre_r + stlpce[np.where(np.diff(stlpce) > 1)[0][0]] + 1 if (np.diff(stlpce) > 1).any() else pre_r + stlpce.max() + 1
    riadky = np.where(krem[:, box_l + 5])[0]
    riadky = riadky[(riadky >= RIADOK[0] - 5) & (riadky < RIADOK[1] + 5)]
    box_t, box_b = riadky.min(), riadky.max() + 1
    medzera = box_l - pre_r

    pismo = ImageFont.truetype(PISMO, 22)
    bb = pismo.getbbox(POPIS)
    sirka = bb[2] - bb[0]
    novy_box_l = pre_l + sirka + medzera
    # časť okienka vľavo prekryť mramorom z pásu priamo nad ním; plná váha v celom okienku aj s jeho
    # tieňom (3 px), mäkký prechod len v mramore okolo
    t0, t1 = box_t - 8, box_b + 8
    l0, l1 = box_l - 8, novy_box_l
    posun = (t1 - t0) + 2
    zaplata = out[t0 - posun:t1 - posun, l0:l1].copy()
    ciel = out[t0:t1, l0:l1]
    hh, ww = ciel.shape[:2]
    vaha = np.zeros((hh, ww), np.float32)
    vaha[box_t - 3 - t0:box_b + 3 - t0, box_l - 3 - l0:] = 1
    vaha = np.maximum(vaha, cv2.GaussianBlur(vaha, (0, 0), 2.0))[..., None]
    out[t0:t1, l0:l1] = ciel * (1 - vaha) + zaplata * vaha
    # okraj okienka znova čistý (tvrdá hrana ako pri ostatných okienkach)
    out[box_t:box_b, novy_box_l:box_r] = I[box_t:box_b, novy_box_l:box_r]

    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    d.text((pre_l - bb[0], cap0 - pismo.getbbox('R')[1]), POPIS, font=pismo, fill=FARBA_POPISU)
    os.makedirs(CIEL, exist_ok=True)
    cesta = os.path.join(CIEL, f'poukazka-{meno}.png')
    img.save(cesta, optimize=True)
    print(meno, '->', os.path.relpath(cesta, KOREN))
    return cesta


for meno, (subor, zona, veta) in POUKAZKY.items():
    cesta = urob(meno, subor, zona, veta)
    if '--tlac' in sys.argv:
        os.makedirs(os.path.join(CIEL, 'tlac'), exist_ok=True)
        im = Image.open(cesta)
        im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(
            os.path.join(CIEL, 'tlac', f'poukazka-{meno}-2580.png'), dpi=(300, 300), optimize=True)
