"""Názvy a ceny rituálov z cenníka na webe (index.html) do ritualy.json.
Riadkovanie dlhých názvov a mená súborov ostávajú; nový rituál treba do ritualy.json doplniť ručne."""
import html, json, os, re

D = os.path.dirname(os.path.abspath(__file__))
KOREN = os.path.normpath(os.path.join(D, '..', '..', '..'))
s = open(os.path.join(KOREN, 'index.html'), encoding='utf-8').read()
web = {}
for m in re.finditer(r'<article data-min="(\d+)" data-price="(\d+)"[^>]*data-id="([^"]+)"[^>]*>.*?<h3>(.*?)</h3>', s, re.S):
    web[m.group(3)] = {'nazov': html.unescape(m.group(4)).replace('\xa0', ' '), 'cena': int(m.group(2)), 'min': int(m.group(1))}

p = os.path.join(D, 'ritualy.json')
R = json.load(open(p, encoding='utf-8'))
for r in R:
    w = web.get(r['id'])
    if not w:
        raise SystemExit(f"rituál {r['id']} už nie je v cenníku na webe")
    if w['nazov'] != r['nazov']:
        raise SystemExit(f"{r['id']}: názov sa zmenil na „{w['nazov']}“, uprav ručne aj riadky v ritualy.json")
    if w['cena'] != r['cena']:
        print(f"{r['nazov']}: {r['cena']} € → {w['cena']} €")
    r.update(cena=w['cena'], min=w['min'])
for i in sorted(set(web) - {r['id'] for r in R}):
    print('na webe je nový rituál bez poukážky:', web[i]['nazov'])
json.dump(R, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(p, 'a', encoding='utf-8').write('\n')
