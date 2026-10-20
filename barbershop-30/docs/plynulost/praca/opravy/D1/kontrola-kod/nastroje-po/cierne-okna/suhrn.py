#!/usr/bin/env python3
"""Súhrn všetkých nahrávok (runs/*/ana.json) do tabuľky v markdowne a JSON: python3 suhrn.py > suhrn.md"""
import json, os, glob
here = os.path.dirname(os.path.abspath(__file__))
rows = []
for p in sorted(glob.glob(os.path.join(here, 'runs', '*', 'ana.json'))):
    a = json.load(open(p))
    n = a['nastavenie']
    m = json.load(open(os.path.join(os.path.dirname(p), 'meta.json')))
    ev = [e for e in a['udalosti'] if e['trvanie_ms'] >= a['prah']['min_ms'] and not e['pred_prvym_obrazom']]
    # prvý obraz: čierne okno na vrchu stránky do 1,5 s po prvom vykreslení (úvodný záber ešte nie je)
    first = [e for e in ev if e['scrollY'] < 5 and e['od_ms'] < (a.get('prvy_svetly_snimok_ms') or 0) + 1500]
    run_ev = [e for e in ev if e not in first]
    rows.append({'run': a['run'], 'dev': n['dev'], 'dpr': m.get('dpr') or (3 if n['dev'] == 'phone' else 1), 'net': n['net'], 'cpu': n['cpu'], 'film': n['film'] + ('+rm' if n.get('rm') else '') + ('+saveData' if n.get('savedata') else ''),
                 'cache': n['cache'], 'scen': n['scen'], 'fps': a['fps_nahravky'], 'uvod_ms': sum(e['trvanie_ms'] for e in first), 'okien': len(run_ev), 'max_ms': max([e['trvanie_ms'] for e in run_ev], default=0), 'spolu_ms': sum(e['trvanie_ms'] for e in run_ev),
                 'okna': [(e['od_ms'], e['trvanie_ms'], round(e['max_tmavej_plochy'], 2), round(e['scrollY'])) for e in run_ev],
                 'tmave_zabery_ms': round(sum(x['ms'] for x in a.get('tmave_zabery', []))), 'chyby': len(a.get('chyby', []))})
json.dump(rows, open(os.path.join(here, 'suhrn.json'), 'w'), ensure_ascii=False, indent=1)
print('| nahrávka | zariadenie | sieť | CPU | film | cache | scenár | snímok/s | čierny prvý obraz ms | čiernych okien za behu >150 ms | najdlhšie ms | spolu ms | okná za behu (od ms+trvanie ms, plocha, scrollY) |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for r in rows:
    ok = '; '.join(f"{a}+{b} ({c}, y{d})" for a, b, c, d in r['okna'][:8]) + (' …' if len(r['okna']) > 8 else '')
    print(f"| {r['run']} | {r['dev']} DPR{r['dpr']} | {r['net']} | {r['cpu']}× | {r['film']} | {r['cache']} | {r['scen']} | {r['fps']} | {r['uvod_ms']} | {r['okien']} | {r['max_ms']} | {r['spolu_ms']} | {ok} |")
