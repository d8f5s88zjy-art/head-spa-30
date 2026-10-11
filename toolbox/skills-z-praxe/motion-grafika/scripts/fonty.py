"""Kontrola písma: má súbor (woff2, woff, ttf, otf) všetky slovenské znaky a znaky textu?

Prehliadač (render.mjs) číta woff2 priamo. Nástroje, ktoré chcú TTF alebo OTF (ffmpeg drawtext,
titulky cez libass, After Effects na inom počítači), dostanú prevod cez --ttf do zvoleného
priečinka; prevedený súbor sa overí znova.

  python3 -I fonty.py [--znaky "text"] [--ttf <priečinok>] [--json] subor.woff2 [...]

Bez --znaky kontroluje slovenskú abecedu (malé aj veľké), číslice a bežnú interpunkciu.
Návratový kód 1, ak niektorému súboru chýba znak alebo sa nedá prečítať.
"""
import json
import os
import sys

from fontTools.ttLib import TTFont

SK = 'aáäbcčdďeéfghiíjklĺľmnňoóôpqrŕsštťuúvwxyýzž'
ZAKLAD = SK + SK.upper() + '0123456789' + '.,:;!?()/%&+-\'"„“‚‘’…·€'


def nazov(f):
    try:
        return f['name'].getDebugName(1) + ' ' + (f['name'].getDebugName(2) or '')
    except Exception:  # noqa: BLE001
        return '?'


def over(cesta, znaky):
    try:
        f = TTFont(cesta)
    except Exception as e:  # noqa: BLE001
        return {'subor': cesta, 'chyba': f'nedá sa prečítať ({e})'}
    cmap = f.getBestCmap() or {}
    chybaju = sorted({z for z in znaky if not z.isspace() and ord(z) not in cmap})
    return {
        'subor': cesta,
        'pismo': nazov(f).strip(),
        'vaha': f['OS/2'].usWeightClass if 'OS/2' in f else None,
        'glyfov': len(cmap),
        'chyba_znaky': ''.join(chybaju),
        '_font': f,
    }


def na_ttf(v, priecinok):
    f = v['_font']
    f.flavor = None  # woff2 -> sfnt (TTF s glyf alebo OTF s CFF)
    ext = '.otf' if 'CFF ' in f or 'CFF2' in f else '.ttf'
    ciel = os.path.join(priecinok, os.path.splitext(os.path.basename(v['subor']))[0] + ext)
    f.save(ciel)
    return ciel


def main(argv):
    znaky, ttf, js, subory = None, None, False, []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == '--znaky':
            znaky = argv[i + 1]
            i += 1
        elif a == '--ttf':
            ttf = argv[i + 1]
            i += 1
        elif a == '--json':
            js = True
        elif a in ('-h', '--help'):
            print(__doc__)
            return 0
        else:
            subory.append(a)
        i += 1
    if not subory:
        print(__doc__)
        return 2
    kontrolovane = znaky if znaky is not None else ZAKLAD
    vysledky = []
    for s in subory:
        v = over(s, kontrolovane)
        if ttf and 'chyba' not in v:
            os.makedirs(ttf, exist_ok=True)
            ciel = na_ttf(v, ttf)
            v2 = over(ciel, kontrolovane)
            v['ttf'] = ciel
            v['ttf_chyba_znaky'] = v2.get('chyba_znaky', v2.get('chyba', ''))
        vysledky.append(v)
    zle = any(v.get('chyba') or v.get('chyba_znaky') or v.get('ttf_chyba_znaky') for v in vysledky)
    for v in vysledky:
        v.pop('_font', None)
    if js:
        print(json.dumps(vysledky, ensure_ascii=False))
    else:
        for v in vysledky:
            if v.get('chyba'):
                print(f"{os.path.basename(v['subor'])}: {v['chyba']}")
                continue
            stav = 'všetky znaky' if not v['chyba_znaky'] else 'CHÝBA: ' + v['chyba_znaky']
            riadok = f"{os.path.basename(v['subor'])}: {v['pismo']} (váha {v['vaha']}, {v['glyfov']} znakov) {stav}"
            if v.get('ttf'):
                riadok += f" | TTF {v['ttf']}: " + ('všetky znaky' if not v['ttf_chyba_znaky'] else 'CHÝBA: ' + v['ttf_chyba_znaky'])
            print(riadok)
    return 1 if zle else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
