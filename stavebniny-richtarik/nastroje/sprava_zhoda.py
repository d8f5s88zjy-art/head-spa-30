#!/usr/bin/env python3
"""Brány správy webu.

  python3 nastroje/sprava_zhoda.py                 Python = PHP: všetky oblasti, typografia na textoch webu a dát,
                                                   šablóny, popisy akcií, záznamy hľadania (potrebuje php v PATH)
  python3 nastroje/sprava_zhoda.py --referencia D  verejné súbory bez značiek oblastí = referenčný výstup v D
                                                   (bez lastmod v sitemap.xml; index.html: karty akcií s typografiou)
Návratový kód 0 = zhoda. build.py volá prvú bránu na konci, ak je php dostupné (inak len upozorní).
"""
import html, json, os, re, shutil, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)


def pripady():
    import texty
    from nastroje import sablona, vykreslenie as V
    import data_sprava
    D = data_sprava.nacitaj(ROOT)
    P = {'typografia': [], 'txt': [], 'sablona': [], 'popis': [], 'hladanie': [], 'json': [], 'quote': []}
    texty_webu = set()
    for kor, dirs, subory in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in ('img', 'pdf', 'subory', 'zdroj', 'nasadenie', '__pycache__', '.git', 'sprava', 'data', 'nastroje', 'asistent')]
        for f in subory:
            if f.endswith('.html'):
                t = open(os.path.join(kor, f), encoding='utf-8').read()
                for c in re.split(r'<script\b.*?</script>|<style\b.*?</style>|<[^>]+>', t, flags=re.S):
                    c = html.unescape(c)
                    if c.strip(): texty_webu.add(c)
    def zber(o):
        if isinstance(o, str): yield o
        elif isinstance(o, list):
            for x in o: yield from zber(x)
        elif isinstance(o, dict):
            for x in o.values(): yield from zber(x)
    data = set(zber([D['akcie'], D['cennik'], D['caste'], D['firma']]))
    navyse = ['CEMENT PORTLAND 42,5 R, VÁPNO A PIESOK', 'Cena 5,- Eur s dph', 'Rozmer 50x25x20 cm, 12m2 a 3m3', 'Super cena!!! Volajte...',
              'Vy aj Vám ponúkame - Vaše', 'TONDACH FIGARO, BOBROVKA', 'dlažba 20 x 10 x 4  ,cena 10.45 €', 'Platí do 31.12.2026 !', '( zátvorka )',
              'mm2 m3 +5 oC 3kg 4ks', 'Porfix alebo PORFIX a YTONG', 'V SUPER CENÁCH aj v super cene']
    for s in sorted(texty_webu) + navyse:
        P['typografia'].append([s, texty._typografia(s)])
    for s in sorted(data) + navyse:
        P['txt'].append([s, V.txt(s)])
    for t, d in json.load(open(os.path.join(ROOT, 'sprava', 'testy', 'sablona-pripady.json'), encoding='utf-8')):
        P['sablona'].append([t, d, sablona.vyplnit(t, d)])
    for a in D['akcie']['akcie']:
        if a['stranka']:
            P['popis'].append([a['seo']['h1'], 'akcia', a['karta'], None, texty.popis('neexistuje.html', a['seo']['h1'], 'akcia', a['karta'])])
            P['popis'].append([a['nazov'], 'akcia', '', None, texty.popis('neexistuje.html', a['nazov'], 'akcia', '')])
    P['popis'].append(['Hutný materiál', 'kategoria', 'Oceľ a siete.', None, texty.popis('x.html', 'Hutný materiál', 'kategoria', 'Oceľ a siete.')])
    for e in json.load(open(os.path.join(ROOT, 'assets', 'index.json'), encoding='utf-8')):
        P['hladanie'].append([e['p'], json.dumps(e, ensure_ascii=False, separators=(',', ':'))])
    for o, k in ([D['firma'], False], [{'a': 'x\n"\\\x01/</'}, True], [[1, None, True, 'ž'], False]):
        P['json'].append([o, json.dumps(o, ensure_ascii=False, separators=(',', ':') if k else None), k])
    from urllib.parse import quote
    for s in ['Akcia Cement 325 R a 425 R', 'a/b ž&?#~_.-', 'Okná a schody Fakro so zľavou 20 %']:
        P['quote'].append([s, quote(s)])
    P['oblasti'] = oblasti_varianty(D)
    P['asistent'] = asistent_varianty(D)
    return P


def asistent_varianty(D):
    """Znalosti a okno asistenta po zmene hodín (R-1): Python aj PHP musia vyrobiť ten istý text z tých istých súborov."""
    import copy
    from nastroje import vykreslenie as V
    X = copy.deepcopy(D); X.pop('verzia', None)
    X['firma']['hodiny'][-1]['do'] = '11:30'
    von = []
    for c in V.ASISTENT_OTAZKY + (V.ASISTENT_ZNALOSTI,) + V.ASISTENT_JS:
        f = os.path.join(ROOT, c)
        if not os.path.exists(f): continue
        t = open(f, encoding='utf-8').read()
        n = V.asistent_znalosti(X, t) if c.endswith('.md') else V.asistent_js(X, t) if c.endswith('.js') else V.asistent_otazky(X, t)
        von.append([c, t, n])
    return [von, X]


def oblasti_varianty(D):
    """Oblasti vykreslené z pozmenených dát, aké vyrobí správa (oznam k hodinám, ceny zadané v správe, nová novinka
    s textom, fotkami a PDF, skrytá novinka, nahratá fotka v galérii, zmenené texty a telefón): [oid, cesta, D, výstup]."""
    import copy, json as _j
    from nastroje import vykreslenie as V
    K = _j.load(open(os.path.join(ROOT, 'sprava', 'kostry', 'konstanty.json'), encoding='utf-8'))
    X = copy.deepcopy(dict(D, k=K)); X.pop('verzia', None)
    X['firma']['vynimky'] = [{'od': '2026-12-31', 'do': '2026-12-31', 'zatvorene': False, 'cas_od': '07:00', 'cas_do': '11:30', 'nazov': 'Silvester'},
                             {'od': '2026-12-24', 'do': '2027-01-01', 'zatvorene': True, 'nazov': ''}]
    a = next(x for x in X['akcie']['akcie'] if x['ceny'])
    a['ceny_zadane'] = '13. 11. 2026'; a['cennik'] = None; a['ceny'][0]['riadky'][0][1] = '4,59 €/vrece'
    f = {'id': 'f1', 'popis': 'Nová fotka „predajne“ & <skúška>', 'velka': 'img/s/2026/11/foto-1a2b3c4d-1200.webp', 'src': 'img/s/2026/11/foto-1a2b3c4d-1200.webp',
         'w': 1200, 'h': 900, 'pos': '', 'webp': [[600, 'img/s/2026/11/foto-1a2b3c4d-600.webp'], [1200, 'img/s/2026/11/foto-1a2b3c4d-1200.webp']], 'avif': [], 'viditelna': True, 'zdroj': 'sprava'}
    X['galeria']['albumy'][0]['fotky'].insert(0, dict(f)); X['galeria']['albumy'][0]['fotky'][3]['viditelna'] = False
    nova = {'id': 'nova-novinka', 'stranka': 'novinky/nova-novinka.html', 'zdroj': 'sprava', 'viditelna': True, 'verzia': 1, 'nazov': 'Nová novinka 2026',
            'popis': 'Krátky popis novej novinky s cenou 4,59 € za vrece.', 'na_uvode': True, 'popis_uvod': None,
            'karta': {'druh': 'foto', 'src': f['src'], 'w': 1200, 'h': 900}, 'hlavicka': 'zahrada',
            'seo': {'h1': 'Nová novinka 2026', 'titulok': 'Nová novinka 2026', 'popis': 'Popis pre Google'},
            'odseky': ['Prvý odsek „s úvodzovkami“ a 25 kg.', 'Druhý odsek.'], 'fotky': [dict(f), dict(f, id='f2', avif=[[600, 'img/s/2026/11/foto-1a2b3c4d-600.avif']])],
            'pdf': [{'subor': 'pdf/s/2026/11/letak-1a2b3c4d.pdf', 'text': 'Leták novinky (PDF, 13. 11. 2026)'}]}
    X['novinky']['novinky'].insert(0, nova); X['novinky']['novinky'][2]['viditelna'] = False
    X['novinky']['kategorie']['katalog/dlazby.html'] = ['nova-novinka'] + X['novinky']['kategorie']['katalog/dlazby.html']
    X['texty']['sluzby'][0] = ['Nový názov služby', 'Nový popis so {telefon} a „úvodzovkami“.']
    X['texty']['onas'] = ['Jeden odsek o nás.']; X['texty']['uvod_lede'] = 'Iná veta na úvode.'
    X['firma']['mobil'] = '0911 222 333'; X['firma']['mobil_tel'] = '+421911222333'
    von = []
    skryta = X['novinky']['novinky'][2]['stranka']
    for oid, c in [('hodiny-pata', 'kontakt.html'), ('hodiny-kontakt', 'kontakt.html'), ('hodiny-uvod', 'index.html'), ('ld-firma', 'kontakt.html'),
                   ('akcia-telo', a['stranka']), ('faq', 'caste-otazky.html'), ('faq-ld', 'caste-otazky.html'), ('novinky-index', 'novinky/index.html'),
                   ('uvod-novinky', 'index.html'), ('novinky-kat', 'katalog/dlazby.html'), ('hlavicka', 'novinky/nova-novinka.html'), ('meta', 'novinky/nova-novinka.html'),
                   ('ld-omrvinky', 'novinky/nova-novinka.html'), ('novinka-doplnok', 'novinky/nova-novinka.html'), ('hlavicka', skryta), ('meta', skryta),
                   ('galeria-predajna', 'galeria/index.html'), ('sluzby-polozky', 'sluzby.html'), ('sluzby-kontakt', 'sluzby.html'),
                   ('uvod-karta', 'index.html'), ('uvod-karta-mini', 'index.html'), ('kontakt-tabula', 'kontakt.html'), ('pata-grafika', 'kontakt.html'), ('pata-grafika', 'katalog/dlazby.html'), ('pata-grafika', '404.html'),
                   ('doprava-polozky', 'doprava.html'), ('onas-text', 'o-nas.html'), ('uvod-lede', 'index.html'), ('sluzby-lede', 'sluzby.html'),
                   # Máriove grafiky s údajom v obrázku: zmenený mobil skryje tabuľu s kontaktom, vizitku, kartu a leták so sortimentom
                   ('galeria-letaky', 'letak.html'), ('galeria-grafika', 'galeria/index.html'), ('sluzby-zlavy', 'sluzby.html')]:
        von.append([oid, c, V.vykresli(oid, c, X)])
    # karty Kontaktu: zmenený mobil (obrázok Zavolajte nám zmizne) a zvlášť zmenený e-mail (zmizne obrázok Napíšte nám)
    von.append(['kontakt-karty', 'kontakt.html', V.vykresli('kontakt-karty', 'kontakt.html', X)])
    E = copy.deepcopy(dict(D, k=K)); E.pop('verzia', None); E['firma']['email'] = 'predajna@stavebniny.example'
    von.append(['kontakt-karty', 'kontakt.html', V.vykresli('kontakt-karty', 'kontakt.html', E), E])
    # zmenené hodiny: obrázok hodín na Kontakte, leták „Prečo nakupovať“ a tabuľa s otváracou dobou zmiznú
    H = copy.deepcopy(dict(D, k=K)); H.pop('verzia', None); H['firma']['hodiny'][-1]['do'] = '11:30'
    for oid, c in [('hodiny-kontakt', 'kontakt.html'), ('galeria-letaky', 'letak.html'), ('galeria-grafika', 'galeria/index.html'), ('kontakt-tabula', 'kontakt.html')]:
        von.append([oid, c, V.vykresli(oid, c, H), H])
    # zmenená ulica: 3D karta na úvode a na Službách ustúpi plochej karte, tabuľa na Kontakte zmizne (pokyny majiteľa 17. 11. 2026)
    U = copy.deepcopy(dict(D, k=K)); U.pop('verzia', None); U['firma']['ulica'] = 'Novozámocká 70'
    for oid, c in [('uvod-karta', 'index.html'), ('uvod-karta-mini', 'index.html'), ('sluzby-zlavy', 'sluzby.html'), ('kontakt-tabula', 'kontakt.html'), ('sluzby-kontakt', 'sluzby.html'), ('pata-grafika', 'katalog/dlazby.html'), ('pata-grafika', 'index.html')]:
        von.append([oid, c, V.vykresli(oid, c, U), U])
    # služby: premenovaná služba bez slova piktogramu je bez obrázka; slovo „výpočet“ v dvoch službách – obrázok len pri prvej
    S = copy.deepcopy(dict(D, k=K)); S.pop('verzia', None)
    S['texty']['sluzby'][1][0] = 'Spotreba materiálu zadarmo'; S['texty']['sluzby'][0][0] = 'Výpočet a doprava'; S['texty']['sluzby'][2][0] = 'Výpočet tepelných strát'
    von.append(['sluzby-polozky', 'sluzby.html', V.vykresli('sluzby-polozky', 'sluzby.html', S), S])
    # zmenená zľava (bez 3,3 %): karta zliav na Službách bez obrázka; skryté všetky letáky: časť Letáky a bannery zmizne celá
    Z = copy.deepcopy(dict(D, k=K)); Z.pop('verzia', None); Z['cennik']['zlava'] = 'Zľava so zákazníckou kartou: 5 % pri platbe v hotovosti, 3 % pri platbe kartou (cenník {datum}).'
    for f in next(a for a in Z['galeria']['albumy'] if a['id'] == 'letaky')['fotky']: f['viditelna'] = False
    for oid, c in [('sluzby-zlavy', 'sluzby.html'), ('galeria-letaky', 'letak.html'), ('sluzby-polozky', 'sluzby.html')]:
        von.append([oid, c, V.vykresli(oid, c, Z), Z])
    # karty akcií (Mário 18. 11. 2026): fotka tovaru (nahlad.foto) aj miniatúra letáku, karta bez stránky s obrázkom aj bez
    A = copy.deepcopy(dict(D, k=K)); A.pop('verzia', None)
    for x in A['akcie']['akcie']:
        if x['id'] == 'pezinska-tehla-termobrik': x['nahlad'] = {'src': 'img/p/1078-400.webp', 'w': 400, 'h': 566}
        if x['id'] == 'dlazby': x['nahlad'] = {'src': 'img/akcie/garaz-karta-300.webp', 'w': 300, 'h': 305, 'foto': True}
        if x['id'] == 'garaze-zahradne-domceky': x['nahlad'] = None
    for oid, c in [('akcie-index', 'akcie/index.html'), ('uvod-akcie', 'index.html')]:
        von.append([oid, c, V.vykresli(oid, c, A), A])
    return [von, X]



def zhoda():
    if not shutil.which('php'):
        print('UPOZORNENIE: php nie je v PATH, brána zhody Python = PHP sa preskočila'); return 0
    P = pripady()
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(P, f, ensure_ascii=False); meno = f.name
    try:
        r = subprocess.run(['php', os.path.join(ROOT, 'sprava', 'testy', 'zhoda.php'), ROOT, meno], capture_output=True, text=True)
    finally:
        os.unlink(meno)
    print('zhoda Python = PHP:', ' · '.join(r.stdout.strip().splitlines()))
    if r.returncode: print(r.stderr[-3000:])
    return r.returncode


def referencia(ref):
    zle = []; n = 0
    for kor, dirs, subory in os.walk(ref):
        for f in subory:
            if not f.endswith(('.html', '.json', '.xml', '.txt', '.js', '.css', '.webmanifest')): continue
            rp = os.path.relpath(os.path.join(kor, f), ref).replace(os.sep, '/')
            if rp.startswith(('zdroj/', 'nasadenie/', 'asistent/testy', 'asistent/nastroje', 'data/', 'sprava/', 'nastroje/')): continue
            a = open(os.path.join(ref, rp), encoding='utf-8').read()
            cesta = os.path.join(ROOT, rp)
            if not os.path.exists(cesta): zle.append(f'{rp}: chýba'); continue
            b = re.sub(r'<!--/?s:[a-z0-9-]+-->', '', open(cesta, encoding='utf-8').read())
            n += 1
            if rp == 'sitemap.xml':
                a, b = (re.sub(r'<lastmod>[^<]*</lastmod>', '', x) for x in (a, b))
            if rp == 'index.html':   # karty akcií na úvode majú typografiu ako stránka Akcie (nezlomiteľné medzery)
                a, b = (html.unescape(x).replace(' ', ' ') for x in (a, b))
            if a != b: zle.append(rp)
    print(f'bez značiek = referencia: {n} súborov, rozdielnych {len(zle)}', zle[:10])
    return 1 if zle else 0


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--referencia': sys.exit(referencia(sys.argv[2]))
    sys.exit(zhoda())
