#!/usr/bin/env python3
"""Jednorazový prenos ďalšieho obsahu, ktorý spravuje správa webu (13. 11. 2026, po kontrole použiteľnosti), z konštánt
build.py a zdroja do data/*.json: novinky (data/novinky.json), fotky galérie Predajňa a Areál (data/galeria.json),
texty Služieb, O nás, Dopravy a úvodu (data/texty.json) a oznamy k otváracím hodinám (firma.json → vynimky, prázdne).

Spustenie raz, v priečinku webu, nad build.py s konštantami: python3 nastroje/export_obsah.py
Texty sa prenášajú doslova (bez typografie); typografiu doplní vykreslenie rovnako ako pri ostatných dátach.
Skript sa po prenose nepoužíva; ostáva ako záznam, odkiaľ sa dáta vzali.
"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
os.chdir(ROOT)
import build as B, texty

DATA = os.path.join(ROOT, 'data')


def zapis(meno, obj):
    with open(os.path.join(DATA, meno), 'w', encoding='utf-8') as f:
        f.write(json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + '\n')


# ---------- novinky ----------
UVOD_POPIS = {   # texty kariet noviniek na úvode (index.html, ručne skrátené) – doslova
    'betonove-vyrobky': 'Šalovacie diely, tvárnice a betónové prvky za akciové ceny.',
    'dekoracne-kamene': 'Biely mramorový okruhliak, čierny Nero Ebono a kamenná kôra vo vreciach po 25 kg.',
    'delap-ohybny-kamenny-obklad': 'Prírodný kameň v ohybných pásoch, 7 tvarov, balenie 4 m², akciová cena 17,80 €/m² s DPH.',
    'ekostyren': 'Plnivo do betónu z polystyrénovej drte na ľahký tepelnoizolačný betón do podláh a striech.',
}
# stránka kategórie katalógu -> novinky v poradí, v akom sú na stránke (build.NOVINKY_KATEGORIE)
kategorie = {f'katalog/{B.nice_slug(kat)}.html': ids for kat, ids in B.NOVINKY_KATEGORIE.items()}
novinky = []
for s in B.children('novinky'):
    p = B.PAGES[s]; nid = p.split('/')[1][:-5]; k = s.split('__')[1]; t = B.nice_title(B.SRC[s]['title'])
    st = texty.stranka(p)
    first = [i for i, e in B.SRC[s]['imgs'] if i in B.IMG_SIZES and B.IMG_SIZES[i][0] >= 200]
    if first:
        w, h = B.obr_rozmer(os.path.join(ROOT, 'img/p', first[0] + '.webp'))
        karta = {'druh': 'foto', 'src': f'img/p/{first[0]}.webp', 'w': w, 'h': h}
    elif k == 'dekoracne-kamene' and B.kamene():
        low = min(float(c.replace(',', '.')) for _, c in B.kamene())
        karta = {'druh': 'cena', 'nad': 'Dekoračné kamene', 'cena': f'od {str(low).replace(".", ",")} €', 'pod': 'za vrece 25 kg s DPH'}
    else:
        karta = {'druh': 'prazdna'}
    novinky.append({'id': nid, 'stranka': p, 'zdroj': 'stary-web', 'viditelna': True, 'verzia': 1, 'nazov': t, 'popis': B.NOVINKY_POPIS.get(k, ''),
                    'na_uvode': nid in UVOD_POPIS, 'popis_uvod': UVOD_POPIS.get(nid), 'karta': karta,
                    'hlavicka': B.HLAVICKA_FOTO.get(p), 'seo': {'h1': st.get('h1') or t, 'titulok': st['t'], 'popis': st['d']},
                    'odseky': [], 'fotky': [], 'pdf': []})
zapis('novinky.json', {'novinky': novinky, 'kategorie': kategorie})

# ---------- galéria: predajňa a areál ----------
def predajna(m):
    sir = [x for x in B.predajna_sirky(m) if x <= 720]
    w, h = B.webp_rozmer(os.path.join(ROOT, f'img/predajna/{m}-{sir[-1]}.webp'))
    return {'id': m, 'popis': B.PREDAJNA_ALT[m], 'velka': f'img/predajna/{m}-1290.webp', 'src': f'img/predajna/{m}-{sir[-1]}.webp', 'w': w, 'h': h,
            'pos': B.PREDAJNA_POS.get(m, '50% 50%'), 'webp': [[x, f'img/predajna/{m}-{x}.webp'] for x in sir],
            'avif': [[x, f'img/predajna/{m}-{x}.avif'] for x in sir], 'viditelna': True, 'zdroj': 'web'}


zapis('galeria.json', {'albumy': [
    {'id': 'predajna', 'nadpis': 'Naša predajňa a sklad', 'fotky': [predajna(m) for m in B.GALERIA_PREDAJNA]}]})
# (album „Materiál v areáli predajne“ – id dvor – je od 17. 11. 2026 preč podľa majiteľa)

# ---------- texty stránok ----------
zapis('texty.json', {
    'uvod_lede': 'Spotrebu spočítame a cenovú ponuku pripravíme zadarmo. Materiál dovezieme vlastnými autami po celom Slovensku, aj autom s mechanickou rukou.',
    'uvod_onas': ['Stavebniny Richtárik založil Zoltán Richtárik v roku 1997. Predávame a sprostredkúvame stavebný materiál, majiteľ aj personál majú dlhoročné skúsenosti v stavebníctve.',
                  'Poradenstvo a cenové ponuky sú u nás zadarmo. Najdôležitejšia je pre nás vaša spokojnosť.'],
    'sluzby_uvod': B.SLUZBY_UVOD,
    'sluzby': [[t, d] for t, d in B.SLUZBY],
    'onas': list(B.ONAS_TEXT),
    'doprava': [['Vlastné autá', 'Na rozvoz tovaru máme auto Avia 3,5 t a nákladné auto 8 t s mechanickou rukou.'],
                ['Po celom Slovensku', 'Dovezieme na stavbu alebo domov, na miesto, ktoré určíte, kdekoľvek na Slovensku.'],
                ['Bez zbytočného prekladania', 'Tovar ide zo skladu priamo k vám. Bez medziskladov a opakovaného prekladania je menšie riziko poškodenia.'],
                ['Cena a termín dovozu', 'Oboje dohodneme na {telefon}, spolu s cenovou ponukou na materiál, ktorá je zadarmo.']]})

# ---------- oznamy k otváracím hodinám ----------
f = json.load(open(os.path.join(DATA, 'firma.json'), encoding='utf-8'))
f.setdefault('vynimky', [])
zapis('firma.json', f)
print('novinky:', len(novinky), '| galéria:', len(B.GALERIA_PREDAJNA), '| texty, vynimky: hotovo')
