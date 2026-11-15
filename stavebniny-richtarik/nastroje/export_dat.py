#!/usr/bin/env python3
"""Jednorazový prenos obsahu, ktorý spravuje správa webu, z konštánt build.py a texty.py do data/*.json.

Spustenie (raz, v priečinku webu, ešte nad pôvodným build.py s konštantami): python3 nastroje/export_dat.py
Výsledok: data/firma.json, cennik.json, akcie.json, caste.json, verzia.json. Texty sa prenášajú doslova (bez typografie),
typografiu doplní vykreslenie (nastroje/vykreslenie.py, sprava/jadro/Vykreslenie.php) rovnako ako write() v build.py.
Skript sa po prenose nepoužíva; ostáva ako záznam, odkiaľ sa dáta vzali.
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
os.chdir(ROOT)
import build as B, texty

DATA = os.path.join(ROOT, 'data')
os.makedirs(DATA, exist_ok=True)


def zapis(meno, obj):
    with open(os.path.join(DATA, meno), 'w', encoding='utf-8') as f:
        f.write(json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + '\n')


# ---------- firma a otváracie hodiny ----------
firma = {k: v for k, v in B.FIRMA.items()}
firma['kontakt_popis'] = texty.STRANKY['kontakt.html']['d'].replace('pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00', '{hodiny_veta}')
firma['hodiny'] = [{'dni': [1, 2, 3, 4, 5], 'od': '07:00', 'do': '16:00'}, {'dni': [6], 'od': '07:00', 'do': '12:00'}]
zapis('firma.json', firma)

# ---------- cenník akcií ----------
cennik = {'aktualny': '662',
          'cenniky': [{'id': '662', 'pdf': B.CENNIK_PDF, 'datum': '28. 1. 2026', 'strany': 4}],
          'stare_letaky': [{'pdf': f, 'text': t} for f, t in B.AKCIE_LETAKY],
          'zlava': B.ZLAVA_AKCIE.replace('\u00a0', ' ').replace('28. 1. 2026', '{datum}'),
          'akcie_popis': texty.STRANKY['akcie/index.html']['d'].replace('28. 1. 2026', '{datum}'),
          'letak_popis': texty.STRANKY['letak.html']['d'].replace('28. 1. 2026', '{datum}')}
zapis('cennik.json', cennik)

# ---------- akcie ----------
karty = B.AKCIE_KARTY
kat_poradie = {k: i for i, k in enumerate(B.AKCIA_KATALOG)}
akcie = []
na_uvode = 0
for slug, tag, h, p in karty:
    s = slug if '__' in slug else 'akcie__' + slug
    a = {'id': B.nice_slug(slug.split('__')[-1]), 'stitok': tag, 'nazov': h, 'karta': p, 'viditelna': True,
         'zdroj': 'stary-web', 'plati_do': None, 'verzia': 1}
    if s not in B.PAGES or not s.startswith('akcie__'):
        a.update({'stranka': None, 'odkaz': {'stranka': B.PAGES[s], 'text': B.AKCIE_ODKAZ[s]}, 'na_uvode': False,
                  'seo': None, 'hlavicka': None, 'letak': None, 'nahlad': None, 'pdf': [], 'ceny': [], 'cennik': None,
                  'katalog': [], 'katalog_poradie': None})
        akcie.append(a); continue
    path = B.PAGES[s]; k = B.nice_slug(slug)
    pr = B.parser(path); bl = pr.blocks(B.SRC[s]['html'])
    imgs = [x for kind, v in bl if kind == 'images' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['imgs']]
    pdfs = [x for kind, v in bl if kind == 'pdfs' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['pdfs']]
    pdfs = [x for x in pdfs if os.path.basename(x[0]) not in B.PDF_MRTVE]
    pdfs = B.letaky_akcie(pdfs, h)
    letak = None
    if imgs:
        i = imgs[0][0]
        src = pr._src(i)[len(pr.pre):]
        letak = {'src': src, 'w': B.IMG_SIZES.get(i, (0, 0))[0], 'h': B.IMG_SIZES.get(i, (0, 0))[1]}
    big = [i for i, e in B.SRC[s]['imgs'] if i in B.IMG_SIZES and B.IMG_SIZES[i][1] >= 500]
    nahlad = {'src': f'img/p/{big[0]}.webp', 'w': B.IMG_SIZES[big[0]][0], 'h': B.IMG_SIZES[big[0]][1]} if big else None
    pdf = []
    for href, t in pdfs:
        b = os.path.basename(href)
        z = {'subor': href[len(pr.pre):], 'datum': B.PDF_DATUM.get(b.split('.')[0])}
        if not b.endswith('.pdf'): z['text'] = t
        pdf.append(z)
    st = texty.STRANKY[path]
    ceny = [{'nadpis': n, 'riadky': [list(r) for r in rr], 'poznamka': pz} for n, rr, pz in B.CENNIK_AKCIE.get(k, [])]
    a.update({'stranka': path, 'odkaz': None, 'na_uvode': na_uvode < 6,
              'seo': {'h1': st['h1'], 'titulok': st['t'], 'popis': st['d']},
              'hlavicka': B.HLAVICKA_FOTO.get(path), 'letak': letak, 'nahlad': nahlad, 'pdf': pdf,
              'ceny': ceny, 'cennik': '662' if ceny else None,
              'katalog': B.AKCIA_KATALOG.get(k, []), 'katalog_poradie': kat_poradie.get(k)})
    na_uvode += 1
    akcie.append(a)
zapis('akcie.json', {'akcie': akcie})

# ---------- časté otázky ----------
qa = B.caste_otazky()
caste = []
for i, t, q, a in qa:
    a2 = a.replace('pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00', '{hodiny_veta}')
    a2 = a2.replace('Pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00', '{Hodiny_veta}')
    a2 = a2.replace('28. 1. 2026', '{cennik_datum}')
    o = {'id': i, 'tema': t, 'otazka': q, 'odpoved': a2}
    if i == 'cena-cement':
        o['vazba'] = {'akcia': 'cement-325-r', 'ceny': ['4,42 €/vrece', '5,18 €/vrece'],
                      'nahrada': 'Aktuálnu cenu cementu nájdete na stránke akcie Cement 325 R a 425 R. Platnosť vám potvrdíme na 0905 622 223.'}
    caste.append(o)
zapis('caste.json', {'temy': [list(x) for x in B.CASTE_TEMY], 'otazky': caste})

zapis('verzia.json', {'schema': 1, 'revizia': 1})
print('data/: firma, cennik, akcie (%d), caste (%d), verzia' % (len(akcie), len(caste)))
