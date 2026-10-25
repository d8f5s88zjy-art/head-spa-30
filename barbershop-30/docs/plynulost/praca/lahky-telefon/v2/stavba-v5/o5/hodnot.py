"""Hodnotenie slepých sád podľa NOVÉHO PRINCÍPU (oprava 5).
  python3 -I hodnot.py vysledky-*.jsonl
Kategórie (legitímna otázka = očakávaná položka, nie odovzdanie/bez-ceny):
  OK          priama odpoveď správnou položkou (alebo odovzdanie, ak je odovzdanie prijateľné)
  OK-VOLBA    „Myslíš toto?“ (aj odovzdanie s voľbou), správna položka medzi prvými dvomi voľbami (P2)
  ODOVZDANIE  fallback/nevieme bez správnej voľby (cieľ ≤ 10 % legitímnych)
  VOLBA-MIMO  voľby bez správnej položky medzi prvými dvomi (ráta sa k odovzdaniu bez správnej voľby)
  CHYBA       holá cena alebo trvanie inej položky (cieľ 0)
  ODCHYLKA    priama odpoveď inou položkou bez ceny a trvania
Nelegitímna otázka (odovzdanie, bez-ceny): OK pri nevieme/fallback/zdvorilosti/voľbe, CHYBA pri cene inej položky."""
import json, re, sys, collections
NELEG = {'odovzdanie', 'bez-ceny'}
def cena(r): return r['typ'] == 'odpoved' and bool(re.search(r'€|\d+\s*(min|perc|хв|хвилин|минут|мин)', r.get('text', ''), re.I))
def okset(r):
    p = r.get('prijatelne') or []
    if isinstance(p, str): p = [x for x in p.split(',') if x]
    return {r['ocakavane']} | set(p)
def zarad(r):
    e, ok, t, i = r['ocakavane'], okset(r), r['typ'], r['id']
    if i == 'trvanie' and r.get('sluzba'): i = 'trvanie' if 'trvanie' in ok else r['sluzba']
    if e in NELEG:
        if t in ('nevieme', 'fallback', 'zdvorilost', 'vyber'): return 'OK'
        if i in ok or not cena(r): return 'OK' if (i in ok or e == 'bez-ceny') else 'ODCHYLKA'
        return 'CHYBA'
    if t == 'odpoved': return 'OK' if i in ok else ('CHYBA' if cena(r) else 'ODCHYLKA')
    if t == 'vyber': return 'OK-VOLBA' if set(r['kand'][:2]) & ok else 'VOLBA-MIMO'
    return 'OK' if 'odovzdanie' in ok else 'ODOVZDANIE'
tot = collections.Counter(); leg = collections.Counter()
for f in sys.argv[1:]:
    rows = [json.loads(l) for l in open(f)]
    c = collections.Counter(); cl = collections.Counter()
    for r in rows:
        k = zarad(r); c[k] += 1
        if r['ocakavane'] not in NELEG: cl[k] += 1
        if k not in ('OK', 'OK-VOLBA'): print(' ', k, '|', r['jazyk'], '|', r['otazka'], '| oc=', r['ocakavane'], r.get('prijatelne', ''), '| ->', r['typ'], r['id'], r.get('sluzba', ''), r.get('kand', ''), '|', r.get('text', '')[:60])
    n = sum(cl.values()); bez = cl['ODOVZDANIE'] + cl['VOLBA-MIMO']
    print(f'{f}: {len(rows)} otázok {dict(c)} | legitímne {n}: {dict(cl)} | odovzdanie bez správnej voľby {bez} ({100*bez/max(n,1):.1f} %)')
    tot.update(c); leg.update(cl)
n = sum(leg.values()); bez = leg['ODOVZDANIE'] + leg['VOLBA-MIMO']
print(f'SPOLU {sum(tot.values())} otázok, CHYBA {tot["CHYBA"]}, ODCHYLKA {tot["ODCHYLKA"]} | legitímne {n}: OK {leg["OK"]}, OK-VOLBA {leg["OK-VOLBA"]}, ODOVZDANIE {leg["ODOVZDANIE"]}, VOLBA-MIMO {leg["VOLBA-MIMO"]} | odovzdanie bez správnej voľby {bez} ({100*bez/max(n,1):.1f} %)')
