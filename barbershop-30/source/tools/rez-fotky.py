#!/usr/bin/env python3
"""Fotky skupín na rezervačnej stránke: vlastné výrezy 16 : 6 z existujúcich fotiek v repozitári (žiadne cudzie),
jednotné doladenie (jas a sýtosť každého výrezu k priemeru sady, najviac ±10 %; jemné doostrenie po zmenšení),
AVIF + WebP + JPEG v šírkach 760 / 1080 / 1600. Spustenie: python3 source/tools/rez-fotky.py . [--nahlad <súbor.jpg>]  (z koreňa barbershop-30; Pillow s AVIF)
Výstup assets/img/rez/rez-<skupina>-<šírka>.<formát>; vypíše namerané hodnoty a použité koeficienty."""
import sys, os
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageStat
ROOT = sys.argv[1]; NAHLAD = sys.argv[sys.argv.index('--nahlad') + 1] if '--nahlad' in sys.argv else None
OUT = os.path.join(ROOT, 'assets', 'img', 'rez'); os.makedirs(OUT, exist_ok=True)
POMER = 16 / 6
# skupina: (zdroj, ohnisko x, ohnisko y, podiel šírky zdroja vo výreze (1 = celá šírka))
SADA = {
  'strih':   ('source/web-povodny/slider/4.jpg',  0.50, 0.50, 1.0),   # nožnice a hrebeň na podložke s logom (fotka starého webu)
  'brada':   ('source/web-povodny/gallery/30.jpg', 0.50, 0.63, 1.0),   # zrolované uteráky na sude, kreslo, buldog (horúci uterák)
  'balicky': ('source/web-povodny/gallery/39.jpg', 0.50, 0.55, 1.0),   # karafa, pomády, štetka (Ultra inclusive: whisky)
  'doplnky': ('source/photos/foto-45.jpg',         0.50, 0.71, 1.0),   # pracovný stôl s pomádami a produktmi pod zrkadlom (bez TV)
}
SIRKY = [760, 1080, 1600]
def vyrez(im, fx, fy, podiel):
    W, H = im.size; w = int(W * podiel); h = int(round(w / POMER))
    if h > H: h = H; w = int(round(h * POMER))
    x = min(max(int(round(W * fx - w / 2)), 0), W - w); y = min(max(int(round(H * fy - h / 2)), 0), H - h)
    return im.crop((x, y, x + w, y + h)), (x, y, w, h)
def stat(im):
    g = im.convert('L'); l = ImageStat.Stat(g).mean[0]
    hsv = im.convert('HSV'); s = ImageStat.Stat(hsv.split()[1]).mean[0]
    return l, s
vyrezy = {}
for k, (src, fx, fy, podiel) in SADA.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(ROOT, src))).convert('RGB')
    c, box = vyrez(im, fx, fy, podiel); vyrezy[k] = c
    print(f'{k}: zdroj {src} {im.size} → výrez {box[2]}×{box[3]} pri x {box[0]} y {box[1]}; jas {stat(c)[0]:.1f}, sýtosť {stat(c)[1]:.1f}')
cielL = sum(stat(c)[0] for c in vyrezy.values()) / len(vyrezy); cielS = sum(stat(c)[1] for c in vyrezy.values()) / len(vyrezy)
print(f'priemer sady: jas {cielL:.1f}, sýtosť {cielS:.1f}')
klip = lambda v: max(0.9, min(1.1, v))
nahlady = []
for k, c in vyrezy.items():
    l, s = stat(c); fj, fs = klip(cielL / l), klip(cielS / s)
    c = ImageEnhance.Brightness(c).enhance(fj); c = ImageEnhance.Color(c).enhance(fs)
    print(f'{k}: koeficient jasu {fj:.3f}, sýtosti {fs:.3f} → jas {stat(c)[0]:.1f}, sýtosť {stat(c)[1]:.1f}')
    for w in SIRKY:
        h = int(round(w / POMER)); r = c.resize((w, h), Image.LANCZOS)
        r = r.filter(ImageFilter.UnsharpMask(radius=1.0, percent=60 if w < 1600 else 45, threshold=3))
        base = os.path.join(OUT, f'rez-{k}-{w}')
        r.save(base + '.avif', quality=55, speed=6); r.save(base + '.webp', quality=78, method=5); r.save(base + '.jpg', quality=82, optimize=True, progressive=True)
        print(f'   {w}: avif {os.path.getsize(base + ".avif") // 1024} kB, webp {os.path.getsize(base + ".webp") // 1024} kB, jpg {os.path.getsize(base + ".jpg") // 1024} kB')
        if w == 760: nahlady.append((k, r))
if NAHLAD:
    sh = Image.new('RGB', (760, (285 + 8) * len(nahlady)), (30, 28, 26)); y = 0
    for k, r in nahlady: sh.paste(r, (0, y)); y += 285 + 8
    sh.save(NAHLAD, quality=85); print('náhľad', NAHLAD)
