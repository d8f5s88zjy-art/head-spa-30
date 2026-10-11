# Tri všeobecné poukážky HEAD SPA 30 z poukážok od salónu: žena, muž, chodidlá (zadanie salónu 11. 10. 2026).
# Z pôvodnej poukážky sa odstráni názov rituálu a dĺžka (mramor sa dopočíta z okolia), veta
# „Darujte chvíľu pokoja.“ sa posunie do uvoľneného miesta (na všetkých troch rovnako) a pole „PRE:“ sa zmení na „RITUÁL:“,
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


TIEN = 13          # tmavý tieň písma siaha asi 13 px (pri písme jas 0 až 0,3, mramor okolo 1 až 1,7)
VETA_Y = 416       # horný okraj vety „Darujte chvíľu pokoja.“ na všetkých troch rovnako (asi v strede)


def kruh(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def vymaz_pismo(rgb, maska_textu, chran, seed):
    """Vymaže písmo aj s jeho tieňom (pás TIEN px okolo písmen); mramor mimo pásu ostane pôvodný aj so
    žilkami. Výplň sú náhodne vybrané skutočné pixely tmavého mramoru z prstenca za tieňom."""
    m = cv2.dilate(maska_textu.astype(np.uint8), kruh(TIEN))
    ch = cv2.dilate(chran.astype(np.uint8), kruh(3)) > 0
    m[ch] = 0
    # prstenec tmavého mramoru za tieňom (bez žiliek a písma)
    dist = cv2.distanceTransform((1 - maska_textu.astype(np.uint8)), cv2.DIST_L2, 5)
    L = jas(rgb)
    prsten = (dist > TIEN + 2) & (dist < TIEN + 30) & (L < 20) & ~ch
    # výplň zo skutočných pixelov tmavého mramoru v prstenci okolo (rovnaký jas, zrno aj farba ako okolie)
    vzorky = rgb[prsten]
    rng = np.random.default_rng(seed)
    mm = m > 0
    out = rgb.copy()
    out[mm] = vzorky[rng.integers(0, len(vzorky), int(mm.sum()))]
    # zrno mramoru nie je bodové: výplň jemne zmäkčiť (len vnútri, okolie ostáva)
    mekke = cv2.GaussianBlur(out, (0, 0), 0.7)
    out[mm] = mekke[mm]
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


def popis_farbou(out, maska_vzoru, I, x, y_cap, pismo, text, n=4):
    """Vykreslí popis tak, aby mal farbu a prechod ako vzorový popis (OD:) po riadkoch. Kreslí sa
    v n-násobnom rozlíšení s tenkým obrysom (písmo salónu má hrubšie vlasové ťahy ako Cormorant) a o pol
    pixelu vyššie, aby sedel na úpätnici OD:."""
    H, W = out.shape[:2]
    velke = ImageFont.truetype(pismo.path, pismo.size * n)
    pl = Image.new('L', (W * n, H * n), 0)
    bb = velke.getbbox(text)
    ImageDraw.Draw(pl).text((x * n - bb[0], y_cap * n - velke.getbbox('R')[1] - n // 2), text, font=velke,
                            fill=255, stroke_width=1, stroke_fill=255)
    a = np.asarray(pl.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    jadro = maska_vzoru & (jas(I) > np.percentile(jas(I)[maska_vzoru], 60))
    riadky = np.where(jadro.any(1))[0]
    farby = {r: I[r][jadro[r]].mean(0) for r in riadky}
    for r in np.where(a.any(1))[0]:
        rr = min(max(r, riadky.min()), riadky.max())
        while rr not in farby:
            rr += 1
        out[r] = out[r] * (1 - a[r][:, None]) + farby[rr][None, :] * a[r][:, None]
    return (bb[2] - bb[0]) / n


def urob(meno, subor, zona, veta):
    rgb = np.asarray(Image.open(os.path.join(SALON, subor)).convert('RGB'))
    I = rgb.astype(np.float32)

    # 1) písmo: názov rituálu a dĺžka, veta, nápis „poukážka“ nad nimi (chránený)
    m_nazov = text_v_zone(rgb, *zona)
    m_veta = text_v_zone(rgb, *veta)
    chran = nad_zonou(rgb, zona[0])

    # 2) veta ako vrstva: krytie z jasu nad tmavým mramorom, farba z jej jadra (je jednofarebná)
    okolie = cv2.dilate(m_veta.astype(np.uint8), kruh(2)) > 0
    jadro = I[m_veta]
    farba = jadro[jadro.mean(1) > np.percentile(jadro.mean(1), 70)].mean(0)
    alfa = np.clip((jas(I) - 1.0) / max(farba.mean() - 1.0, 1.0), 0, 1) * okolie
    ys, xs = np.where(alfa > 0.02)
    t0, t1, l0, l1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1

    # 3) názov aj vetu preč spolu s tieňom, potom veta na nové miesto (rovnaký stĺpec ako u salónu)
    out = vymaz_pismo(rgb, m_nazov | m_veta, chran, seed=1).astype(np.float32)
    dy = VETA_Y - t0
    a = np.zeros(alfa.shape, np.float32)
    a[t0 + dy:t1 + dy, l0:l1] = alfa[t0:t1, l0:l1]
    # tieň ako pri ostatnom písme (tmavý pás okolo písmen)
    tien = cv2.GaussianBlur(cv2.dilate((a > 0.3).astype(np.uint8), kruh(6)).astype(np.float32), (0, 0), 3)
    out = out * (1 - 0.8 * tien[..., None])
    out = out * (1 - a[..., None]) + farba[None, None, :] * a[..., None]

    # 4) pole „PRE:“ -> „RITUÁL:“: popis preč, okienko sa skráti zľava, nový popis písmom ako originál
    m_pre = text_v_zone(rgb, RIADOK[0], RIADOK[1], 80, 152, prah=110)
    px = np.where(m_pre.any(0))[0]
    pre_l, pre_r = px.min(), px.max() + 1
    py = np.where(m_pre.any(1))[0]
    cap0 = py.min()
    m_od = text_v_zone(rgb, RIADOK[0], RIADOK[1], 400, 458, prah=110)
    out_bgr = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    out_bgr, _ = vymaz(out_bgr, m_pre, polomer=4, rozsir=2)
    out = cv2.cvtColor(out_bgr, cv2.COLOR_BGR2RGB).astype(np.float32)

    # okienká: krémové plochy v riadku polí (PRE a OD)
    krem = (I[..., 0] > 215) & (I[..., 1] > 195) & (I[..., 2] > 165)
    def okienko(od_x):
        st = np.where(krem[RIADOK[0]:RIADOK[1], od_x:od_x + 300].sum(0) > 10)[0]
        l = od_x + st.min()
        skok = np.where(np.diff(st) > 1)[0]
        r = od_x + (st[skok[0]] + 1 if len(skok) else st.max() + 1)
        return l, r
    box_l, box_r = okienko(pre_r)
    od_l, _ = okienko(np.where(m_od.any(0))[0].max() + 1)
    riadky = np.where(krem[:, box_l + 5])[0]
    riadky = riadky[(riadky >= RIADOK[0] - 5) & (riadky < RIADOK[1] + 5)]
    box_t, box_b = riadky.min(), riadky.max() + 1
    medzera = box_l - pre_r

    pismo = ImageFont.truetype(PISMO, 22)
    sirka = pismo.getbbox(POPIS)[2] - pismo.getbbox(POPIS)[0]
    novy_box_l = pre_l + sirka + medzera
    # časť okienka vľavo prekryť mramorom z pásu priamo nad ním; plná váha v celom okienku aj s jeho
    # tieňom (3 px), mäkký prechod len v mramore okolo
    t0b, t1b = box_t - 8, box_b + 8
    l0b, l1b = box_l - 8, novy_box_l
    posun = (t1b - t0b) + 2
    zaplata = out[t0b - posun:t1b - posun, l0b:l1b].copy()
    ciel = out[t0b:t1b, l0b:l1b]
    hh, ww = ciel.shape[:2]
    vaha = np.zeros((hh, ww), np.float32)
    vaha[box_t - 3 - t0b:box_b + 3 - t0b, box_l - 3 - l0b:] = 1
    vaha = np.maximum(vaha, cv2.GaussianBlur(vaha, (0, 0), 2.0))[..., None]
    out[t0b:t1b, l0b:l1b] = ciel * (1 - vaha) + zaplata * vaha
    # okienko ostáva pôvodné; nová ľavá hrana dostane rovnaký lem ako hrana okienka OD (2 px vonku, 2 dnu)
    out[box_t:box_b, novy_box_l:box_r] = I[box_t:box_b, novy_box_l:box_r]
    out[box_t - 2:box_b + 2, novy_box_l - 2:novy_box_l + 2] = I[box_t - 2:box_b + 2, od_l - 2:od_l + 2]
    # medzera medzi popisom a okienkom: žiadne svetlé zrnko z prenesenej záplaty
    zx0, zx1 = pre_l + sirka + 1, novy_box_l - 3
    zona_m = np.zeros(out.shape[:2], np.uint8)
    zona_m[box_t:box_b, zx0:zx1] = (out[box_t:box_b, zx0:zx1].mean(2) > 25)
    if zona_m.any():
        o = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
        o = cv2.inpaint(o, cv2.dilate(zona_m, kruh(1)) * 255, 3, cv2.INPAINT_TELEA)
        out = cv2.cvtColor(o, cv2.COLOR_BGR2RGB).astype(np.float32)

    popis_farbou(out, m_od, I, pre_l, cap0, pismo, POPIS)
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
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
