#!/usr/bin/env python3
"""Orezy záberov: na fotku záberu (verzia na šírku) nakreslí, čo z nej vidí počítač a čo telefón.
  zelená   = počítač 1440×900, film (rovina 1,24× okno, bod záujmu data-f, film.js layout() 771-786)
  žltá     = výrez na výšku <meno>-m (film.json: left/top/width/height), z ktorého telefón kreslí
  červená  = telefón 390×844, film (rovina 1,24× okno, bod záujmu data-fm vo výreze)
  modrá    = telefón 390×844, pokojná verzia (object-fit cover 100vw × 100lvh, --fmx/--fmy)
python3 -I orezy.py <koreň webu> <výstup.jpg>"""
import sys, os, json, re
from PIL import Image, ImageDraw, ImageFont

root, out = sys.argv[1], sys.argv[2]
FJ = json.load(open(os.path.join(root, 'assets/img/film/film.json')))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
shots = []
for m in re.finditer(r'<div class="film-shot[^"]*"([^>]*)>', html):
    a = dict(re.findall(r'data-([\w-]+)="([^"]*)"', m.group(1)))
    shots.append(a)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
except Exception:
    font = None


def pair(v, d):
    try:
        x, y = [float(t) for t in v.split(',')]
        return x, y
    except Exception:
        return d


def view_rect(pw_img, ph_img, pa, vw_over_vh, f, ov=1.24):
    """výrez okna na rovine fotky (v pixeloch fotky šírky pw_img), ako layout() vo film.js"""
    # rovina v jednotkách výšky okna: vh = 1, vw = aspect
    vw, vh = vw_over_vh, 1.0
    pw = vw * ov
    ph = pw / pa
    if ph < vh * ov:
        ph = vh * ov
        pw = ph * pa
    mx = max(0, (pw - vw) / 2 - vw * (ov - 1) / 2 * 0.5)
    my = max(0, (ph - vh) / 2 - vh * (ov - 1) / 2 * 0.5)
    ex = min(mx, max(-mx, (f[0] - 0.5) * pw))
    ey = min(my, max(-my, (0.5 - f[1]) * ph))
    cx = pw / 2 + ex
    cy = ph / 2 - ey
    s = pw_img / pw
    return ((cx - vw / 2) * s, (cy - vh / 2) * s, (cx + vw / 2) * s, (cy + vh / 2) * s)


tiles = []
for s in shots:
    name = s.get('shot')
    if name not in FJ or name == 'rohozka':
        continue
    j = FJ[name]
    W, H = j['width'], j['height']
    p = os.path.join(root, f'assets/img/film/{name}-1448.webp')
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert('RGB')
    k = im.width / W
    d = ImageDraw.Draw(im)
    pa = W / H
    # počítač 1440×900
    f = pair(s.get('f', ''), (0.5, 0.5))
    r = view_rect(im.width, im.height, pa, 1440 / 900, f)
    d.rectangle(r, outline=(60, 220, 90), width=7)
    m = j.get('m')
    if m:
        L, T = m.get('left', 0) * k, m.get('top', 0) * k
        cw, ch = m['width'] * k, m['height'] * k
        d.rectangle((L, T, L + cw, T + ch), outline=(250, 210, 40), width=7)
        fm = pair(s.get('fm', ''), (0.5, 0.5))
        rr = view_rect(cw, ch, m['width'] / m['height'], 390 / 844, fm)
        d.rectangle((L + rr[0], T + rr[1], L + rr[2], T + rr[3]), outline=(240, 50, 40), width=7)
        # pokojná verzia: cover 390×844 (lvh) z výrezu, object-position --fmx/--fmy (stills.py = data-fm)
        sc = max(390 / m['width'], 844 / m['height'])
        vw_, vh_ = 390 / sc * k, 844 / sc * k
        ox = (cw - vw_) * fm[0]
        oy = (ch - vh_) * fm[1]
        d.rectangle((L + ox, T + oy, L + ox + vw_, T + oy + vh_), outline=(60, 140, 255), width=4)
        vis = (rr[2] - rr[0]) / im.width
    else:
        vis = 0
    d.rectangle((0, 0, im.width, 50), fill=(0, 0, 0))
    d.text((10, 6), f"{name}: telefón film vidí {vis * 100:.0f} % šírky, počítač {(r[2] - r[0]) / im.width * 100:.0f} %", fill=(255, 220, 160), font=font)
    if s.get('video'):
        d.text((10, im.height - 50), 'telefón: namiesto fotky video/sekvencia ' + s['video'].split('/')[-1], fill=(255, 120, 120), font=font)
    tiles.append(im.resize((im.width // 2, im.height // 2), Image.LANCZOS))

cols = 2
tw, th = tiles[0].size
sheet = Image.new('RGB', (cols * (tw + 8), ((len(tiles) + cols - 1) // cols) * (th + 8)), (40, 40, 40))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * (tw + 8), (i // cols) * (th + 8)))
sheet.save(out, quality=86)
print(out, sheet.size, len(tiles))
