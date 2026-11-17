"""Načítanie obsahu, ktorý spravuje správa webu (data/*.json), pre build.py.

data/ je jediný zdroj pravdy pre: firmu a otváracie hodiny (firma.json), cenník akcií a letáky na stránke Akcie
(cennik.json), akcie s kartami, cenami, letákmi a väzbami na katalóg (akcie.json), časté otázky (caste.json), novinky
(novinky.json), fotky galérie Predajňa a Areál (galeria.json), vybrané texty Služieb, O nás, Dopravy a úvodu (texty.json)
a revíziu dát (verzia.json). Novinky, galéria a texty sa preniesli z build.py nástrojom nastroje/export_obsah.py. Na hostingu tie isté súbory mení správa (sprava/, kópia v sprava-data/data/); zmeny sa do repozitára
vracajú exportom zo správy a nástrojom nastroje/sprava_import.py (README, časť Správa webu).

Pôvod faktov (pôvodný web zdroj/pages.json, cenník akcií pdf/662.pdf z 28. 1. 2026, údaje majiteľa) je opísaný
v README v častiach Texty a SEO a Akcie; dáta sa sem preniesli jednorazovo nástrojom nastroje/export_dat.py.
Texty v dátach sú bez typografie (nezlomiteľné medzery, pomlčky); doplní ich vykreslenie (nastroje/vykreslenie.py).
"""
import json, os, re

SUBORY = ('firma', 'cennik', 'akcie', 'caste', 'novinky', 'galeria', 'texty', 'verzia')
ID = re.compile(r'^[a-z0-9-]{1,60}$')


class ChybaDat(Exception):
    pass


def nacitaj(koren):
    """{'firma', 'cennik', 'akcie', 'caste', 'verzia'} z <koren>/data/*.json; pri chybe ChybaDat so zrozumiteľnou vetou."""
    D = {}
    for meno in SUBORY:
        cesta = os.path.join(koren, 'data', meno + '.json')
        if not os.path.exists(cesta): raise ChybaDat(f'chýba {os.path.relpath(cesta, koren)} (dáta správy webu, README časť Správa webu)')
        try:
            with open(cesta, encoding='utf-8') as f: D[meno] = json.load(f)
        except ValueError as e:
            raise ChybaDat(f'{os.path.relpath(cesta, koren)} nie je platný JSON: {e}')
    over(D)
    return D


ZNACKY = re.compile(r'[<>{}\\]')                      # tie isté znaky odmieta správa (Kontrola::chybaTextu)
PREMENNE = re.compile(r'\{(hodiny_veta|Hodiny_veta|cennik_datum|datum|telefon)\}')   # premenné v textoch, ktoré dopĺňa vykreslenie
DATUM = re.compile(r'\d{1,2}\. \d{1,2}\. \d{4}')                 # Kontrola::datum (napr. 28. 1. 2026)


def _texty(o, cesta=''):
    if isinstance(o, str): yield cesta, o
    elif isinstance(o, list):
        for i, x in enumerate(o): yield from _texty(x, f'{cesta}[{i}]')
    elif isinstance(o, dict):
        for k, x in o.items(): yield from _texty(x, f'{cesta}.{k}')


def over_texty(D):
    """Texty z hostingu (import zo správy) nesmú obsahovať značky HTML ani šablón a dátumy musia mať tvar zo správy –
    aj keby niekto zmenil súbory na hostingu mimo správy, do repozitára a build.py sa nič také nedostane."""
    for meno, obsah in D.items():
        if meno == 'verzia': continue
        for cesta, t in _texty(obsah):
            if ZNACKY.search(PREMENNE.sub('', t)): raise ChybaDat(f'data/{meno}.json{cesta}: nepovolené znaky < > {{ }} \\')
            if '\x00' in t or re.search(r'[\x01-\x08\x0b\x0c\x0e-\x1f]', t): raise ChybaDat(f'data/{meno}.json{cesta}: riadiace znaky')
            kluc = cesta.rsplit('.', 1)[-1]
            if kluc.startswith('datum') and t and not DATUM.fullmatch(t): raise ChybaDat(f'data/{meno}.json{cesta}: dátum „{t}“ nemá tvar 28. 1. 2026')


def over(D):
    """Základná kontrola tvaru dát (podrobné kontroly robí správa pred zverejnením)."""
    over_texty(D)
    f = D['firma']
    for k in ('majitel', 'ulica', 'mesto', 'mobil', 'mobil_tel', 'pevna', 'pevna_tel', 'email', 'ico', 'dic', 'mapa', 'kontakt_popis'):
        if not isinstance(f.get(k), str) or not f[k]: raise ChybaDat(f'data/firma.json: chýba {k}')
    if not f.get('hodiny'): raise ChybaDat('data/firma.json: chýbajú otváracie hodiny')
    for s in f['hodiny']:
        d = s.get('dni') or []
        if not d or d != list(range(d[0], d[-1] + 1)) or d[0] < 1 or d[-1] > 7: raise ChybaDat(f'data/firma.json: dni {d} nie sú za sebou')
        for c in (s.get('od'), s.get('do')):
            if not isinstance(c, str) or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', c): raise ChybaDat(f'data/firma.json: čas {c}')
    c = D['cennik']
    if not any(x['id'] == c.get('aktualny') for x in c.get('cenniky', [])): raise ChybaDat('data/cennik.json: aktuálny cenník nie je v zozname')
    ids = set()
    for a in D['akcie'].get('akcie', []):
        if not ID.match(a.get('id', '')) or a['id'] in ids: raise ChybaDat(f'data/akcie.json: zlé alebo dvojité id {a.get("id")}')
        ids.add(a['id'])
        if a.get('stranka') and a['stranka'] != f'akcie/{a["id"]}.html': raise ChybaDat(f'data/akcie.json: stránka akcie {a["id"]}')
        if a.get('stranka') and not a.get('seo'): raise ChybaDat(f'data/akcie.json: akcia {a["id"]} bez SEO')
    if not isinstance(D['verzia'].get('revizia'), int): raise ChybaDat('data/verzia.json: revízia')
    for v in f.get('vynimky') or []:
        for k in ('od', 'do'):
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', v.get(k) or ''): raise ChybaDat(f'data/firma.json: oznam k hodinám, dátum {v.get(k)}')
        if v['od'] > v['do']: raise ChybaDat('data/firma.json: oznam k hodinám končí skôr, ako začína')
        if not v.get('zatvorene'):
            for c in (v.get('cas_od'), v.get('cas_do')):
                if not isinstance(c, str) or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', c): raise ChybaDat(f'data/firma.json: oznam k hodinám, čas {c}')
    ids = set()
    for n in D['novinky'].get('novinky', []):
        if not ID.match(n.get('id', '')) or n['id'] in ids: raise ChybaDat(f'data/novinky.json: zlé alebo dvojité id {n.get("id")}')
        ids.add(n['id'])
        if n.get('stranka') != f'novinky/{n["id"]}.html' or not n.get('seo') or not n.get('karta'): raise ChybaDat(f'data/novinky.json: novinka {n["id"]}')
    for kat, zoz in D['novinky'].get('kategorie', {}).items():
        if not re.fullmatch(r'katalog/[a-z0-9-]+\.html', kat) or any(i not in ids for i in zoz): raise ChybaDat(f'data/novinky.json: kategória {kat}')
    for a in D['galeria'].get('albumy', []):
        if a.get('id') not in ('predajna', 'letaky', 'grafika'): raise ChybaDat(f'data/galeria.json: album {a.get("id")}')
        for f in a.get('fotky', []):   # údaje v obrázku (Máriove grafiky): len známe kľúče (vykreslenie.udaje_platia)
            if any(k not in ('hodiny', 'mobil', 'pevna', 'email', 'ulica', 'psc', 'majitel', 'zlava') for k in f.get('plati_pri') or []):
                raise ChybaDat(f'data/galeria.json: fotka {f.get("id")}, plati_pri {f.get("plati_pri")}')
    cesta = re.compile(r'(img|pdf)/[a-z0-9/_-]+\.(webp|avif|pdf)')
    for meno in ('novinky', 'galeria', 'akcie'):
        for c, t in _texty(D[meno]):
            k = c.rsplit('.', 1)[-1].split('[')[0]
            if k in ('src', 'velka', 'subor') or (k in ('webp', 'avif', 'sirky') and t.startswith(('img/', 'pdf/'))):
                if not cesta.fullmatch(t) or '..' in t: raise ChybaDat(f'data/{meno}.json{c}: cesta k súboru „{t}“')
    T = D['texty']
    for k in ('uvod_lede', 'sluzby_uvod'):
        if not isinstance(T.get(k), str) or not T[k]: raise ChybaDat(f'data/texty.json: {k}')
    for k in ('sluzby', 'doprava'):
        if not T.get(k) or any(len(x) != 2 for x in T[k]): raise ChybaDat(f'data/texty.json: {k}')
