# Kontrola merania D1: čierne okná pred/po (ana.json z rec.mjs + ana.py auditu) – rovnaké pravidlá ako suhrn.py auditu:
# okno > 150 ms a >= 20 % plochy obrazu; „prvý obraz“ = okno na vrchu do 1,5 s po prvom svetlom snímku.
#   python3 -I suhrn-cierne.py
import json, glob, os, re, statistics as st
K = os.path.dirname(os.path.abspath(__file__))
def one(p):
    a = json.load(open(p)); m = json.load(open(os.path.join(os.path.dirname(p), 'meta.json')))
    ev = [e for e in a['udalosti'] if e['trvanie_ms'] >= a['prah']['min_ms'] and not e['pred_prvym_obrazom']]
    first = [e for e in ev if e['scrollY'] < 5 and e['od_ms'] < (a.get('prvy_svetly_snimok_ms') or 0) + 1500]
    run = [e for e in ev if e not in first]
    return {'fps': a['fps_nahravky'], 'prvy_svetly': a.get('prvy_svetly_snimok_ms'), 'uvod_ms': sum(e['trvanie_ms'] for e in first), 'okien': len(run),
            'max_ms': max([e['trvanie_ms'] for e in run], default=0), 'spolu_ms': sum(e['trvanie_ms'] for e in run),
            'okna': [(e['od_ms'], e['trvanie_ms'], round(e['max_tmavej_plochy'], 2), round(e['scrollY'])) for e in run], 'chyby': len(a.get('chyby', [])), 'snimok': a['snimok']}
rows = {}
for s in ('pred', 'po'):
    for p in sorted(glob.glob(f'{K}/nastroje-{s}/cierne-okna/runs/*/ana.json')):
        n = os.path.basename(os.path.dirname(p)); mm = re.match(r'(.+)-(pred|po)-(\d+)$', n)
        if not mm: continue
        rows.setdefault(mm.group(1), {}).setdefault(s, []).append((int(mm.group(3)), one(p)))
print('| nahrávka | pred: prvý obraz tma ms | po: prvý obraz tma ms | pred: okien / najdlhšie / spolu ms | po: okien / najdlhšie / spolu ms | pred fps | po fps |')
print('|---|---|---|---|---|---|---|')
for k in sorted(rows):
    r = rows[k]
    def f(s, key): return ', '.join(str(x[1][key]) for x in sorted(r.get(s, [])))
    def g(s): return ' · '.join(f"{x[1]['okien']}/{x[1]['max_ms']}/{x[1]['spolu_ms']}" for x in sorted(r.get(s, [])))
    print(f"| {k} | {f('pred', 'uvod_ms')} | {f('po', 'uvod_ms')} | {g('pred')} | {g('po')} | {f('pred', 'fps')} | {f('po', 'fps')} |")
print()
for k in sorted(rows):
    for s in ('pred', 'po'):
        for i, x in sorted(rows[k].get(s, [])):
            if x['okna'] or x['chyby']: print(f"  {k} {s} {i}: okná (od ms, trvanie ms, plocha, y) {x['okna'][:8]}  chyby {x['chyby']}  prvý svetlý {x['prvy_svetly']} ms")
