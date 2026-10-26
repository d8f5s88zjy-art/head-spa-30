#!/usr/bin/env python3
"""A2 – súhrn nálezov zo všetkých analyza.json (stránka × šírka): zoskupí rovnaké nálezy naprieč šírkami.

  python3 -I a2-suhrn.py <kolo-dir> [--typ=kontrast,zakryte,...] [--min=1]
Vypíše: typ | kľúč | stránky:šírky (kroky) | príklad; a tabuľku chýb konzoly, pretečenia a systémových písiem.
"""
import json
import os
import sys
from collections import defaultdict

root = sys.argv[1]
typy = None
for a in sys.argv[2:]:
    if a.startswith('--typ='):
        typy = set(a[6:].split(','))
grp = defaultdict(list)
chyby = defaultdict(list)
pisma = defaultdict(set)
tma = []
for dp, dn, fn in os.walk(os.path.join(root, 'snimky')):
    if 'analyza.json' not in fn:
        continue
    a = json.load(open(os.path.join(dp, 'analyza.json')))
    tag = f"{a['stranka']}:{a['vp']}"
    for c in a['chyby']:
        chyby[c].append(tag)
    for f in a['pisma_systemove']:
        pisma[f"{f['fam'].split(',')[0]} {f['w']} {f['st']} → {', '.join(sorted(set(p.split(' ×')[0] for p in f['pouzite'])))}"].add(a['stranka'])
    for n in a['nalezy']:
        if typy and n['typ'] not in typy:
            continue
        key = n['kluc'] if n['typ'] != 'tma' else 'čierne/prázdne pole'
        grp[(n['typ'], key)].append((tag, n['kroky'], n['info']))
    for i, pole, tm in a['tma']:
        if pole >= 0.45:
            tma.append((tag, i, pole, tm))
for (t, k), v in sorted(grp.items(), key=lambda x: (x[0][0], -len(x[1]))):
    vps = ', '.join(f"{tag}{'' if len(kr) > 6 else str(kr)}" for tag, kr, _ in v[:40])
    ex = {kk: vv for kk, vv in v[0][2].items() if kk not in ('krok',)}
    print(f"{t} | {k[:90]} | {len(v)}× | {vps[:900]}\n      príklad: {str(ex)[:300]}")
print('\n== chyby konzoly / zlyhané požiadavky')
for c, tags in chyby.items():
    print(f"  {c[:200]} | {len(tags)}× | {', '.join(tags[:12])}")
print('\n== systémové písmo namiesto webového (CDP)')
for k, v in pisma.items():
    print(f"  {k[:160]} | {sorted(v)}")
print('\n== snímky s čiernym/prázdnym poľom ≥ 45 % okna (stránka:šírka krok pole tmavé)')
for x in sorted(tma):
    print(f"  {x[0]} krok {x[1]}: pole {round(x[2] * 100)} %, tmavé body {round(x[3] * 100)} %")
