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


K = lambda n: Image.open(os.path.join(ROOT, 'out', n + '.png')).convert('RGB')
NAVRHY = ['d1', 'd2', 'd3', 'd4', 'd5']
SVETLO = {'d1': (.28, .12), 'd2': (.62, .1), 'd3': (.34, .1), 'd4': (.5, .1), 'd5': (.3, .12)}

for n in NAVRHY:
    bg = podklad(1800, 1350, SVETLO[n])
    bg = polozit(bg, K(n + '-headspa-rub'), (1180, 720), 980, 4.2, (26, 34), 26, .58)
    bg = polozit(bg, K(n + '-headspa-lice'), (720, 640), 1040, -3.6, (30, 40), 30, .66)
    vinety(svetlo_zhora(bg, .15), .5).save(os.path.join(OUT, 'navrh-%s-headspa.jpg' % n), quality=93)

for n in ['d2', 'd4']:
    bg = podklad(1800, 1350, SVETLO[n])
    bg = polozit(bg, K(n + '-salon30-lice'), (880, 690), 1240, -2.8, (30, 40), 30, .64)
    vinety(svetlo_zhora(bg, .15), .5).save(os.path.join(OUT, 'navrh-%s-salon30.jpg' % n), quality=93)

# na výšku pre Instagram a pre web
for n in ['d2', 'd4']:
    bg = podklad(1080, 1350, (0.34, 0.14))
    bg = polozit(bg, K(n + '-headspa-lice'), (540, 690), 910, -4.4, (22, 30), 26, .64)
    vinety(svetlo_zhora(bg, .16), .48).save(os.path.join(OUT, 'navrh-%s-na-vysku.jpg' % n), quality=93)

print('\n'.join(sorted(os.listdir(OUT))))
