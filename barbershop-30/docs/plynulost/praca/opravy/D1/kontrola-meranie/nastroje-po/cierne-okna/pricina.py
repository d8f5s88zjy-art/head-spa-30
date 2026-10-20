#!/usr/bin/env python3
"""Priradenie príčiny každému čiernemu oknu (> 150 ms) zo stavu stránky v čase okna (log z rec.mjs, ana.json).

Kategórie:
  F-TEX   film beží (world-in), záber na mieste filmu nemá textúru (sťahuje/rozbaľuje/nahráva sa) -> plátno sa
          vymaže na farbu stránky (film.js draw: !A.ready a žiadny držaný záber; skok |T-S|>1,5 zahodí held)
  F-RDY   film beží, cieľový záber pripravený, ale ešte nábeh zo šera (dark, fin 450 ms) alebo prekrytie
  Z-NET   pokojná verzia/záloha: aktuálna záloha (is-shown) ešte nie je stiahnutá (img.complete = 0)
  Z-OFF   pokojná verzia: aktuálna karta nemá zálohu v okolí (is-near 0 -> display:none, nesťahuje sa)
  Z-DEC   pokojná verzia: záloha stiahnutá (complete = 1), ale nevykreslená (odložené dekódovanie pri zobrazení)
  Z-NONE  pokojná verzia: žiadna záloha nie je zobrazená (--so všade 0)
  PRVY    prvý obraz stránky (úvod pred načítaním fotky)
  python3 pricina.py [runs/...]  -> pricina.json + tabuľka
"""
import json, os, sys, glob
here = os.path.dirname(os.path.abspath(__file__))
runs = sys.argv[1:] or sorted(glob.glob(os.path.join(here, 'runs', '*')))
out, agg = [], {}
for r in runs:
    p = os.path.join(r, 'ana.json')
    if not os.path.exists(p):
        continue
    a = json.load(open(p))
    first = a.get('prvy_svetly_snimok_ms') or 0
    for e in a['udalosti']:
        if e['trvanie_ms'] < a['prah']['min_ms']:
            continue
        cls = e.get('cls') or ''
        f = e.get('film') or {}
        st = e.get('zalohy') or []
        film_in = 'world-in' in cls and 'world-off' not in cls
        cat, det = None, ''
        if e['pred_prvym_obrazom'] or (e['scrollY'] < 5 and e['od_ms'] < first + 1500):
            cat = 'PRVY'
        elif film_in and f:
            rd = f.get('ready') or ''
            ci = max(0, min(len(rd) - 1, round(f.get('S') or 0))) if rd else 0
            ch = rd[ci] if rd else '?'
            if ch in '02':
                cat = 'F-TEX'; det = f"záber {f.get('cur')} (index {ci}) {'sa načítava' if ch == '2' else 'nie je ani v rade'}"
            else:
                cat = 'F-RDY'; det = f"záber {f.get('cur')} pripravený, S={f.get('S')} T={f.get('T')}"
        else:
            shown = [x for x in st if x[2] == 1 and x[3] > 0.01]
            if not shown:
                cat = 'Z-NONE'
            else:
                top = shown[-1]
                if top[1] == 0:
                    cat = 'Z-OFF'
                elif top[4] == 0:
                    cat = 'Z-NET'
                else:
                    cat = 'Z-DEC'
                det = f"karta {top[0]} near={top[1]} so={top[3]} stiahnutá={top[4]} css={top[5]}"
        row = {'run': a['run'], 'od_ms': e['od_ms'], 'ms': e['trvanie_ms'], 'plocha': e['max_tmavej_plochy'], 'y': round(e['scrollY']), 'kat': cat, 'detail': det, 'znacky': e['znacky'][-2:]}
        out.append(row)
        if cat != 'PRVY':
            g = agg.setdefault(cat, {'n': 0, 'ms': 0, 'max': 0})
            g['n'] += 1; g['ms'] += e['trvanie_ms']; g['max'] = max(g['max'], e['trvanie_ms'])
json.dump({'okna': out, 'suhrn': agg}, open(os.path.join(here, 'pricina.json'), 'w'), ensure_ascii=False, indent=1)
for x in out:
    print(f"{x['run']:<26} {x['od_ms']:>7} +{x['ms']:>5} ms  {x['plocha']:.2f}  y{x['y']:>6}  {x['kat']:<6} {x['detail']}  {x['znacky']}")
print()
for k, g in sorted(agg.items()):
    print(f"{k:<7} okien {g['n']:>3}  spolu {g['ms']:>6} ms  najdlhšie {g['max']:>5} ms")
