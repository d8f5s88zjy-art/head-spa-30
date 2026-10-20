"""Zhoda podkladov (CSV pre Booqme) s cenníkom na webe, bez siete.
Služby: názov, trvanie, cena a obsah (kroky) musia sedieť s kartami <article> a riadkami <li data-booqme>;
krátky popis a popis sa len porovnajú (web môže mať kratší text).
Poukazy: cena typu poukazu musí sedieť s cenou služby na webe.
Spustenie: python3 -I podklad-zhoda.py index.html docs/booqme-sluzby.csv [docs/booqme-poukazy.csv]"""
import csv, html, re, sys

if len(sys.argv) < 3:
    sys.exit(__doc__)
s = open(sys.argv[1], encoding='utf-8').read()
txt = lambda x: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', x)).replace('\xa0', ' ')).strip()
cena = lambda x: float(str(x).replace(',', '.'))

web = {}
for m in re.finditer(r'<article\b([^>]*)>([\s\S]*?)</article>', s):
    a, b = m.group(1), m.group(2)
    if 'data-price="' not in a:
        continue
    pole = lambda c: (re.search(rf'<p class="{c}">([\s\S]*?)</p>', b) or [None, ''])[1]
    ol = re.search(r'<ol>([\s\S]*?)</ol>', b)
    web[txt(re.search(r'<h3>([\s\S]*?)</h3>', b).group(1))] = {
        'min': int(re.search(r'data-min="(\d+)"', a).group(1)), 'cena': cena(re.search(r'data-price="([\d.]+)"', a).group(1)),
        'tag': txt(pole('tag')), 'desc': txt(pole('desc')),
        'kroky': [txt(x) for x in re.findall(r'<li>([\s\S]*?)</li>', ol.group(1))] if ol else None}
for m in re.finditer(r'<li data-booqme="([^"]+)" data-min="(\d+)" data-price="([\d.]+)"', s):
    web[html.unescape(m.group(1))] = {'min': int(m.group(2)), 'cena': cena(m.group(3)), 'bez_poukazu': True}

chyby, pozn = [], []
riadky = list(csv.DictReader(open(sys.argv[2], encoding='utf-8-sig'), delimiter=';'))
for r in riadky:
    n = r['Názov služby'].strip(); w = web.get(n)
    if not w:
        chyby.append(f'{n}: je v podklade, na webe chýba'); continue
    if int(r['Trvanie (min)']) != w['min']: chyby.append(f"{n}: podklad {r['Trvanie (min)']} min, web {w['min']} min")
    if cena(r['Cena (€)']) != w['cena']: chyby.append(f"{n}: podklad {r['Cena (€)']} €, web {w['cena']:g} €")
    if w.get('bez_poukazu'):
        continue
    kroky = [x.strip() for x in (r.get('Obsah rituálu') or '').split('·') if x.strip()]
    if kroky and w['kroky'] is not None and kroky != w['kroky']: chyby.append(f'{n}: obsah (kroky) sa líši od podkladu')
    if r.get('Krátky popis', '').strip() != w['tag']: pozn.append(f"{n}: krátky popis na webe „{w['tag']}“")
    if r.get('Popis do Booqme', '').strip() != w['desc']: pozn.append(f"{n}: popis na webe „{w['desc']}“")
for n in web:
    if n not in {r['Názov služby'].strip() for r in riadky}: chyby.append(f'{n}: je na webe, v podklade chýba')
if len(sys.argv) > 3:
    for r in csv.DictReader(open(sys.argv[3], encoding='utf-8-sig'), delimiter=';'):
        n = r['Typ poukážky v Booqme'].removeprefix('Poukaz: ').strip(); w = web.get(n)
        if not w: chyby.append(f'poukaz {n}: služba na webe chýba')
        elif cena(r['Cena (€)']) != w['cena']: chyby.append(f"poukaz {n}: podklad {r['Cena (€)']} €, web {w['cena']:g} €")

print(f'Web: {len(web)} služieb, podklad: {len(riadky)} riadkov')
for p in pozn: print(' poznámka:', p)
for c in chyby: print(' NESEDÍ:', c)
print('Podklad sedí s webom.' if not chyby else f'Nesedí: {len(chyby)}')
sys.exit(1 if chyby else 0)
