# Produktové zábery poukazu: tmavý podklad, mäkké svetlo, tieň, jemné zrno.
import os, sys, math
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageChops

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'fotky'); os.makedirs(OUT, exist_ok=True)
card = lambda n: Image.open(os.path.join(ROOT, 'out', n)).convert('RGB')

def podklad(w, h, svetlo=(0.30, 0.16), sila=1.0):
    """Tmavý zelený podklad s mäkkým svetlom v danom bode."""
    y, x = np.mgrid[0:h, 0:w]
    nx, ny = x / w, y / h
    d = np.sqrt(((nx - svetlo[0]) * 1.15) ** 2 + (ny - svetlo[1]) ** 2)
    g = np.clip(1.0 - d * 1.35, 0, 1) ** 2.1 * sila
    base = np.array([13, 18, 15], float)
    warm = np.array([74, 84, 66], float)
    img = base[None, None, :] + g[..., None] * (warm - base)[None, None, :]
    # jemný spád dole
    img *= (1.0 - 0.35 * (ny ** 1.8))[..., None]
    a = Image.fromarray(np.clip(img, 0, 255).astype('uint8'))
    # zrno
    n = (np.random.default_rng(7).normal(0, 4.2, (h, w, 1)) * np.ones((1, 1, 3))).astype('int16')
    a = Image.fromarray(np.clip(np.asarray(a, dtype='int16') + n, 0, 255).astype('uint8'))
    return a

def polozit(bg, karta, stred, sirka, uhol, tien=(26, 34), rozostrenie=26, tma=0.62):
    """Karta s tieňom na podklad. stred = (x, y) v pixeloch."""
    k = karta.copy()
    k = k.resize((sirka, round(sirka * karta.height / karta.width)), Image.LANCZOS)
    # zaoblenie rohov
    r = round(sirka * 0.012)
    maska = Image.new('L', k.size, 0)
    ImageDraw.Draw(maska).rounded_rectangle([0, 0, k.size[0] - 1, k.size[1] - 1], radius=r, fill=255)
    k.putalpha(maska)
    k = k.rotate(uhol, resample=Image.BICUBIC, expand=True)
    # tieň
    sh = Image.new('L', k.size, 0)
    sh.paste(k.split()[3], (0, 0))
    sh = sh.filter(ImageFilter.GaussianBlur(rozostrenie))
    x0 = stred[0] - k.size[0] // 2
    y0 = stred[1] - k.size[1] // 2
    vrstva = Image.new('L', bg.size, 0)
    vrstva.paste(sh, (x0 + tien[0], y0 + tien[1]))
    tmavy = Image.new('RGB', bg.size, (0, 0, 0))
    bg = Image.composite(Image.blend(bg, tmavy, tma), bg, vrstva.point(lambda v: int(v * 0.95)))
    bg.paste(k, (x0, y0), k)
    return bg

def svetlo_zhora(img, sila=0.30):
    w, h = img.size
    y, x = np.mgrid[0:h, 0:w]
    g = np.clip(1.0 - (np.sqrt(((x / w - 0.34) * 1.1) ** 2 + (y / h - (-0.15)) ** 2)) * 1.5, 0, 1) ** 2
    add = (g * 255 * sila).astype('uint8')
    return ImageChops.add(img, Image.merge('RGB', [Image.fromarray(add)] * 3))

def vinety(img, sila=0.55):
    w, h = img.size
    y, x = np.mgrid[0:h, 0:w]
    d = np.sqrt(((x / w - .5) * 1.05) ** 2 + ((y / h - .45) * 1.0) ** 2)
    m = np.clip(1 - (d - 0.34) * 2.1, 0, 1)
    arr = np.asarray(img, float) * (1 - sila + sila * m)[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))

lice = {v: card('poukaz-%s-lice.png' % v) for v in ['45', '70', '100', '149', '249', 'ritual']}
rub = card('poukaz-rub.png')

# 1 · jedna karta zblízka
bg = podklad(1800, 1350, (0.28, 0.12))
bg = polozit(bg, lice['100'], (900, 690), 1270, -3.2, (30, 40), 30, .64)
vinety(svetlo_zhora(bg, .16), .5).save(os.path.join(OUT, 'foto-1-poukaz.jpg'), quality=93)

# 2 · líce a rub vedľa seba
bg = podklad(1800, 1350, (0.5, 0.1))
bg = polozit(bg, rub, (1140, 700), 1020, 4.5, (28, 36), 28, .6)
bg = polozit(bg, lice['149'], (700, 640), 1020, -4.0, (30, 40), 30, .66)
vinety(svetlo_zhora(bg, .14), .5).save(os.path.join(OUT, 'foto-2-lice-a-rub.jpg'), quality=93)

# 3 · celá sada rozložená ako vejár
bg = podklad(2000, 1300, (0.5, 0.08))
poradie = ['249', '149', '100', '70', '45']
for i, v in enumerate(poradie):
    x = 530 + i * 250
    y = 690 - abs(i - 2) * 22
    bg = polozit(bg, lice[v], (x, y), 720, 8 - i * 4.0, (20, 28), 22, .56)
vinety(svetlo_zhora(bg, .12), .52).save(os.path.join(OUT, 'foto-3-sada.jpg'), quality=93)

# 4 · na výšku pre Instagram
bg = podklad(1080, 1350, (0.3, 0.14))
bg = polozit(bg, lice['249'], (540, 690), 900, -5.0, (22, 30), 26, .64)
vinety(svetlo_zhora(bg, .16), .48).save(os.path.join(OUT, 'foto-4-instagram.jpg'), quality=93)

# 5 · poukaz na rituál
bg = podklad(1800, 1350, (0.7, 0.16))
bg = polozit(bg, lice['ritual'], (880, 700), 1230, 2.6, (28, 38), 30, .62)
vinety(svetlo_zhora(bg, .15), .5).save(os.path.join(OUT, 'foto-5-ritual.jpg'), quality=93)

print('\n'.join(sorted(os.listdir(OUT))))
