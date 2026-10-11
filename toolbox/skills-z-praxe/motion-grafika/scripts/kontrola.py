"""Kontrola vyrenderovanej grafiky: zachovala sa alfa v .mov a .webm, nie je na okrajoch lem, ide pohyb plynulo?

Volá ju render.mjs; dá sa spustiť aj ručne. Potrebuje len Pillow.

  python3 -I kontrola.py --snimky <priečinok s f00000.png ...> --fps 30 --ref <snímka.png>
         --ramec x0,y0,x1,y1 --par mov:<na_bielej.png>:<na_ciernej.png> [--par webm:...]

Alfa: z tej istej snímky položenej na bielu (W) a na čiernu (B) sa dá alfa spätne vypočítať,
a = 255 - (W - B). Porovná sa s alfou pôvodnej PNG snímky (ref). Lem: pôvodná snímka sa zloží
na bielu a čiernu v Pillow (rovná alfa) a porovná so zložením z videa; tmavší okraj na bielej je
tmavý lem, svetlejší okraj na čiernej svetlý lem. Plynulosť: priemerný rozdiel susedných snímok
(zložených na sivú, zmenšených na štvrtinu); osamelý veľký skok znamená, že niečo naskočí bez nástupu.
Výstup je JSON: riadky (zhrnutie), varovania, data.
"""
import glob
import json
import os
import statistics
import sys

from PIL import Image, ImageChops, ImageStat

PRAH_ALFA = 32      # chyba alfy nad touto hodnotou (z 255) sa ráta ako zlá
PRAH_LEM = 24       # stmavenie okraja na bielej (z 255) nad touto hodnotou je lem
PODIEL_LEM = 0.02   # nad 2 % okrajových bodov s lemom = varovanie


def hist_nad(img, prah, maska=None):
    h = img.histogram(mask=maska)
    return sum(h[prah + 1:]), sum(h)


def alfa_a_lem(meno, ref, w, b, ramec):
    ref = ref.crop(ramec)
    w = w.convert('RGB').crop(ramec)
    b = b.convert('RGB').crop(ramec)
    a_ref = ref.getchannel('A')
    # alfa spätne z dvoch podkladov
    a_est = ImageChops.invert(ImageChops.subtract(w, b).convert('L'))
    chyba = ImageChops.difference(a_est, a_ref)
    mae = ImageStat.Stat(chyba).mean[0]
    zle, spolu = hist_nad(chyba, PRAH_ALFA)
    # okraje: body s čiastočnou alfou
    okraj = a_ref.point(lambda v: 255 if 0 < v < 255 else 0)
    biela = Image.new('RGBA', ref.size, (255, 255, 255, 255))
    cierna = Image.new('RGBA', ref.size, (0, 0, 0, 255))
    ref_w = Image.alpha_composite(biela, ref).convert('L')
    ref_b = Image.alpha_composite(cierna, ref).convert('L')
    tmavsie = ImageChops.subtract(ref_w, w.convert('L'))
    svetlejsie = ImageChops.subtract(b.convert('L'), ref_b)
    lem_t, n_okraj = hist_nad(tmavsie, PRAH_LEM, okraj)
    lem_s, _ = hist_nad(svetlejsie, PRAH_LEM, okraj)
    rozdiel = ImageStat.Stat(ImageChops.difference(ref_w, w.convert('L'))).mean[0]
    return {
        'meno': meno, 'alfa_mae': round(mae, 2), 'alfa_zle_podiel': round(zle / max(1, spolu), 5),
        'okrajovych_bodov': n_okraj, 'tmavy_lem_podiel': round(lem_t / max(1, n_okraj), 4),
        'svetly_lem_podiel': round(lem_s / max(1, n_okraj), 4), 'rozdiel_na_bielej': round(rozdiel, 2),
    }


def plynulost(priecinok, fps):
    subory = sorted(glob.glob(os.path.join(priecinok, 'f[0-9][0-9][0-9][0-9][0-9].png')))
    rozdiely, pred = [], None
    alfa_prva = alfa_posledna = None
    for i, s in enumerate(subory):
        im = Image.open(s).convert('RGBA')
        if i == 0:
            alfa_prva = im.getchannel('A').getbbox()
        if i == len(subory) - 1:
            alfa_posledna = im.getchannel('A').getbbox()
        mala = im.reduce(4)
        siva = Image.alpha_composite(Image.new('RGBA', mala.size, (128, 128, 128, 255)), mala).convert('L')
        if pred is not None:
            rozdiely.append(ImageStat.Stat(ImageChops.difference(siva, pred)).mean[0])
        pred = siva
    pohyb = [d for d in rozdiely if d > 0.02]
    med = statistics.median(pohyb) if pohyb else 0
    skoky = []
    for i, d in enumerate(rozdiely):
        okolie = [x for x in rozdiely[max(0, i - 3):i] + rozdiely[i + 1:i + 4]]
        sused = max(okolie) if okolie else 0
        # osamelý skok: veľký rozdiel, susedné prechody pokojné
        if d > 1.5 and d > 3 * max(sused, med * 0.5, 0.05):
            skoky.append({'cas': round((i + 1) / fps, 3), 'rozdiel': round(d, 2), 'susedia_max': round(sused, 2)})
    return {
        'snimok': len(subory), 'prechodov_s_pohybom': len(pohyb), 'median_pohybu': round(med, 3),
        'max_rozdiel': round(max(rozdiely), 2) if rozdiely else 0,
        'max_cas': round((rozdiely.index(max(rozdiely)) + 1) / fps, 3) if rozdiely else 0,
        'skoky': skoky, 'prva_prazdna': alfa_prva is None, 'posledna_prazdna': alfa_posledna is None,
    }


def main(argv):
    args = {'par': []}
    i = 0
    while i < len(argv):
        k = argv[i].lstrip('-')
        v = argv[i + 1] if i + 1 < len(argv) else ''
        if k == 'par':
            args['par'].append(v)
        elif k in ('h', 'help'):
            print(__doc__)
            return 0
        else:
            args[k] = v
        i += 2
    fps = float(args.get('fps', 30))
    riadky, varovania, data = [], [], {}
    if args.get('ref') and args['par']:
        ref = Image.open(args['ref']).convert('RGBA')
        ramec = tuple(int(x) for x in args.get('ramec', f'0,0,{ref.width},{ref.height}').split(','))
        data['alfa'] = []
        for p in args['par']:
            meno, w, b = p.split(':', 2)
            r = alfa_a_lem(meno, ref, Image.open(w), Image.open(b), ramec)
            data['alfa'].append(r)
            riadky.append(f"{meno}: alfa sa líši o {r['alfa_mae']} z 255 v priemere ({r['alfa_zle_podiel'] * 100:.2f} % bodov nad {PRAH_ALFA}), "
                          f"tmavý lem {r['tmavy_lem_podiel'] * 100:.2f} %, svetlý lem {r['svetly_lem_podiel'] * 100:.2f} % "
                          f"z {r['okrajovych_bodov']} bodov s čiastočnou alfou, rozdiel na bielej {r['rozdiel_na_bielej']}")
            if r['alfa_mae'] > 3 or r['alfa_zle_podiel'] > 0.005:
                varovania.append(f"{meno}: alfa sa nezachovala (priemerná chyba {r['alfa_mae']}); pri .webm dekóduj cez -c:v libvpx-vp9")
            if r['tmavy_lem_podiel'] > PODIEL_LEM:
                varovania.append(f"{meno}: tmavý lem na {r['tmavy_lem_podiel'] * 100:.1f} % bodov s čiastočnou alfou (skontroluj detail na bielej)")
            if r['svetly_lem_podiel'] > PODIEL_LEM:
                varovania.append(f"{meno}: svetlý lem na {r['svetly_lem_podiel'] * 100:.1f} % bodov s čiastočnou alfou (skontroluj detail na čiernej)")
    if args.get('snimky'):
        p = plynulost(args['snimky'], fps)
        data['plynulost'] = p
        riadky.append(f"plynulosť: pohyb v {p['prechodov_s_pohybom']} z {p['snimok'] - 1} prechodov snímok, medián {p['median_pohybu']}, "
                      f"najväčší rozdiel {p['max_rozdiel']} v {p['max_cas']} s, osamelé skoky: {len(p['skoky'])}")
        riadky.append(f"prvá snímka {'priehľadná' if p['prva_prazdna'] else 'NIE JE priehľadná'}, "
                      f"posledná {'priehľadná' if p['posledna_prazdna'] else 'nie je priehľadná (drží sa pri dlhšom zábere)'}")
        for s in p['skoky']:
            varovania.append(f"skok v {s['cas']} s (rozdiel {s['rozdiel']}, okolie najviac {s['susedia_max']}): vrstva naskočí bez nástupu?")
    print(json.dumps({'riadky': riadky, 'varovania': varovania, 'data': data}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
