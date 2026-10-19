#!/usr/bin/env python3
"""Čítanie textu z obrazu videa, keď titulky chýbajú (Instagram reels, videá bez reči alebo bez prepisu).

Tri režimy (Python 3, Pillow, numpy, ffmpeg v PATH alebo v premennej FFMPEG):

  python3 -I snimky_text.py harok video.mp4 <priečinok> [--fps 4] [--od 0] [--do 12] [--sirka 270]
                                                        [--stlpce 8] [--riadky 6]
      snímky po 1/fps s a hárky s časom v rohu (harok-01.jpg …); na prehľad textu v obraze

  python3 -I snimky_text.py zmeny video.mp4 <priečinok> --pas 800:900 [--pas 1300:1370] [--fps 10]
                                                        [--jas 245] [--prah 0.004] [--od] [--do]
      len snímky, kde sa v páse titulkov zmenil svetlý text (pás v px pôvodného videa, viac pásov
      sa poskladá pod seba); hárky zmeny-01.jpg … a zoznam časov zmeny.txt. Zachytí aj frázy,
      ktoré trvajú len 0,1 s („a“, „v“), čo hárok po 0,25 s prehliadne.

  python3 -I snimky_text.py vyrez video.mp4 <výstup.png> --cas 5.8 --obdlznik 120,600,960,980
                                                        [--mierka 3] [--ostrost 150]
      snímka v presnom čase v plnom rozlíšení, výrez zväčšený LANCZOS a doostrený (UnsharpMask);
      na drobný text rozhrania (adresa, nastavenia, dialóg)

Časy v hárkoch sú od + poradie ÷ fps (presnosť ±1 snímka zdroja). Text, ktorý zo snímky nevieš
prečítať, zapíš ako nečitateľný; nič nedomýšľaj. Skript nič nesťahuje a nič neposiela von.

Návratové kódy: 0 v poriadku, 1 ffmpeg zlyhal alebo nevznikla žiadna snímka, 2 zlé argumenty.
"""
import argparse
import glob
import os
import shutil
import subprocess
import sys
import tempfile

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError as e:  # pragma: no cover
    print(f'chýba knižnica: {e} (treba Pillow a numpy)', file=sys.stderr)
    sys.exit(2)


def ffmpeg_cesta():
    f = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
    if not f:
        print('ffmpeg sa nenašiel (PATH alebo premenná FFMPEG)', file=sys.stderr)
        sys.exit(1)
    return f


def pismo(velkost):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',):
        if os.path.exists(p):
            return ImageFont.truetype(p, velkost)
    try:
        return ImageFont.load_default(size=velkost)
    except TypeError:  # starší Pillow
        return ImageFont.load_default()


def vytiahni(video, priecinok, fps, od, do, sirka):
    """Snímky po 1/fps s do priečinka; vráti zoradený zoznam PNG."""
    os.makedirs(priecinok, exist_ok=True)
    for f in glob.glob(os.path.join(priecinok, 's*.png')):
        os.remove(f)
    cmd = [ffmpeg_cesta(), '-hide_banner', '-v', 'error', '-y']
    if od:
        cmd += ['-ss', f'{od:.3f}']
    cmd += ['-i', video]
    if do is not None:
        cmd += ['-t', f'{max(0.0, do - od):.3f}']
    vf = f'fps={fps}'
    if sirka:
        vf += f',scale={sirka}:-2:flags=lanczos'
    cmd += ['-vf', vf, os.path.join(priecinok, 's%05d.png')]
    r = subprocess.run(cmd, capture_output=True, text=True)
    subory = sorted(glob.glob(os.path.join(priecinok, 's*.png')))
    if r.returncode != 0 or not subory:
        print(f'ffmpeg zlyhal alebo nevznikla snímka: {r.stderr.strip()[-400:]}', file=sys.stderr)
        sys.exit(1)
    return subory


def plna_snimka(video, cas, cesta):
    r = subprocess.run([ffmpeg_cesta(), '-hide_banner', '-v', 'error', '-y', '-ss', f'{cas:.3f}', '-i', video,
                        '-frames:v', '1', cesta], capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(cesta):
        print(f'ffmpeg nevytiahol snímku v {cas} s: {r.stderr.strip()[-400:]}', file=sys.stderr)
        sys.exit(1)
    return Image.open(cesta).convert('RGB')


def stitok(draw, x, y, text, font):
    l, t, r, b = draw.textbbox((0, 0), text, font=font)
    draw.rectangle([x, y, x + (r - l) + 10, y + (b - t) + 8], fill=(0, 0, 0))
    draw.text((x + 5 - l, y + 4 - t), text, fill=(255, 230, 0), font=font)


def uloz_harky(dlazdice, priecinok, predpona, stlpce, riadky):
    """dlazdice = [(obrázok, popis)], všetky rovnakej veľkosti; vráti zoznam hárkov."""
    font = pismo(18)
    w, h = dlazdice[0][0].size
    na_harok = stlpce * riadky
    vystupy = []
    for z in range(0, len(dlazdice), na_harok):
        kus = dlazdice[z:z + na_harok]
        r = (len(kus) + stlpce - 1) // stlpce
        harok = Image.new('RGB', (stlpce * (w + 4), r * (h + 4)), (40, 40, 40))
        d = ImageDraw.Draw(harok)
        for i, (im, popis) in enumerate(kus):
            x, y = (i % stlpce) * (w + 4), (i // stlpce) * (h + 4)
            harok.paste(im, (x, y))
            stitok(d, x + 2, y + 2, popis, font)
        cesta = os.path.join(priecinok, f'{predpona}-{z // na_harok + 1:02d}.jpg')
        harok.save(cesta, quality=88)
        vystupy.append(cesta)
    return vystupy


def rezim_harok(a):
    pr = os.path.join(a.priecinok, 'snimky')
    subory = vytiahni(a.video, pr, a.fps, a.od, a.do, a.sirka)
    dl = [(Image.open(f).convert('RGB'), f'{a.od + i / a.fps:.2f} s') for i, f in enumerate(subory)]
    harky = uloz_harky(dl, a.priecinok, 'harok', a.stlpce, a.riadky)
    print(f'{len(subory)} snímok po {1 / a.fps:.3g} s ({a.od:.2f} až {a.od + (len(subory) - 1) / a.fps:.2f} s), '
          f'{len(harky)} hárkov: {", ".join(os.path.basename(h) for h in harky)}')
    return 0


def pasy_z_argumentov(pasy, vyska):
    vysledok = []
    for p in pasy:
        try:
            y0, y1 = (int(v) for v in p.split(':'))
        except ValueError:
            print(f'--pas {p!r}: čakám y0:y1 v px, napr. 800:900', file=sys.stderr)
            sys.exit(2)
        if not 0 <= y0 < y1 <= vyska:
            print(f'--pas {p}: mimo výšky videa ({vyska} px)', file=sys.stderr)
            sys.exit(2)
        vysledok.append((y0, y1))
    return vysledok


def rezim_zmeny(a):
    with tempfile.TemporaryDirectory() as tmp:
        prva = plna_snimka(a.video, a.od, os.path.join(tmp, 'prva.png'))
    sirka_zdroja, vyska_zdroja = prva.size
    pasy = pasy_z_argumentov(a.pas, vyska_zdroja)
    pr = os.path.join(a.priecinok, 'snimky')
    subory = vytiahni(a.video, pr, a.fps, a.od, a.do, a.sirka)
    k = Image.open(subory[0]).size[0] / sirka_zdroja           # mierka vytiahnutých snímok
    pasy_k = [(round(y0 * k), round(y1 * k)) for y0, y1 in pasy]
    drzane, pred = [], None
    for i, f in enumerate(subory):
        im = Image.open(f).convert('RGB')
        siva = np.asarray(im.convert('L'), dtype=np.uint8)
        maska = np.concatenate([siva[y0:y1] for y0, y1 in pasy_k], axis=0) > a.jas
        if pred is None or np.mean(maska != pred) > a.prah:
            casti = [im.crop((0, y0, im.size[0], y1)) for y0, y1 in pasy_k]
            dl = Image.new('RGB', (im.size[0], sum(c.size[1] for c in casti) + 2 * (len(casti) - 1)), (255, 0, 255))
            y = 0
            for c in casti:
                dl.paste(c, (0, y))
                y += c.size[1] + 2
            drzane.append((dl, f'{a.od + i / a.fps:.2f} s'))
            pred = maska
    with open(os.path.join(a.priecinok, 'zmeny.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(p for _, p in drzane) + '\n')
    stlpce = max(1, min(a.stlpce, 4))
    harky = uloz_harky(drzane, a.priecinok, 'zmeny', stlpce, a.riadky * 3)
    print(f'{len(subory)} snímok po {1 / a.fps:.3g} s, {len(drzane)} zmien textu v {len(pasy)} pásoch '
          f'(jas > {a.jas}, prah {a.prah}); zmeny.txt, {", ".join(os.path.basename(h) for h in harky)}')
    return 0


def rezim_vyrez(a):
    try:
        x0, y0, x1, y1 = (int(v) for v in a.obdlznik.split(','))
    except ValueError:
        print('--obdlznik čaká x0,y0,x1,y1 v px pôvodného videa', file=sys.stderr)
        return 2
    if a.mierka <= 0:
        print('--mierka musí byť kladná', file=sys.stderr)
        return 2
    with tempfile.TemporaryDirectory() as tmp:
        im = plna_snimka(a.video, a.cas, os.path.join(tmp, 's.png'))
    W, H = im.size
    if not (0 <= x0 < x1 <= W and 0 <= y0 < y1 <= H):
        print(f'--obdlznik {a.obdlznik} je mimo snímky {W}×{H}', file=sys.stderr)
        return 2
    c = im.crop((x0, y0, x1, y1))
    c = c.resize((round((x1 - x0) * a.mierka), round((y1 - y0) * a.mierka)), Image.LANCZOS)
    if a.ostrost:
        c = c.filter(ImageFilter.UnsharpMask(radius=2, percent=a.ostrost, threshold=2))
    os.makedirs(os.path.dirname(os.path.abspath(a.vystup)), exist_ok=True)
    c.save(a.vystup)
    print(f'{a.vystup}: snímka {a.cas} s ({W}×{H}), výrez {x1 - x0}×{y1 - y0} px, ×{a.mierka:g} = {c.size[0]}×{c.size[1]}')
    return 0


def main(argv):
    p = argparse.ArgumentParser(description='Čítanie textu z obrazu videa (hárky, zmeny v páse titulkov, výrez).')
    sp = p.add_subparsers(dest='rezim', required=True)
    for meno in ('harok', 'zmeny'):
        q = sp.add_parser(meno)
        q.add_argument('video')
        q.add_argument('priecinok')
        q.add_argument('--fps', type=float, default=4.0 if meno == 'harok' else 10.0)
        q.add_argument('--od', type=float, default=0.0)
        q.add_argument('--do', type=float, default=None)
        q.add_argument('--sirka', type=int, default=270 if meno == 'harok' else 540,
                       help='šírka vytiahnutých snímok v px (0 = pôvodná)')
        q.add_argument('--stlpce', type=int, default=8)
        q.add_argument('--riadky', type=int, default=6)
        if meno == 'zmeny':
            q.add_argument('--pas', action='append', required=True, help='y0:y1 v px pôvodného videa')
            q.add_argument('--jas', type=int, default=245, help='pixel jasnejší ako toto je text (0 až 255)')
            q.add_argument('--prah', type=float, default=0.004, help='podiel zmenených pixelov masky')
    q = sp.add_parser('vyrez')
    q.add_argument('video')
    q.add_argument('vystup')
    q.add_argument('--cas', type=float, required=True)
    q.add_argument('--obdlznik', required=True, help='x0,y0,x1,y1 v px pôvodného videa')
    q.add_argument('--mierka', type=float, default=3.0)
    q.add_argument('--ostrost', type=int, default=150, help='UnsharpMask percent, 0 = bez doostrenia')
    a = p.parse_args(argv)
    if not os.path.isfile(a.video):
        print(f'video {a.video} neexistuje', file=sys.stderr)
        return 2
    if a.rezim in ('harok', 'zmeny'):
        if a.fps <= 0 or a.stlpce < 1 or a.riadky < 1 or a.od < 0 or (a.do is not None and a.do <= a.od):
            print('zlé --fps, --stlpce, --riadky, --od alebo --do', file=sys.stderr)
            return 2
        return rezim_harok(a) if a.rezim == 'harok' else rezim_zmeny(a)
    return rezim_vyrez(a)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
