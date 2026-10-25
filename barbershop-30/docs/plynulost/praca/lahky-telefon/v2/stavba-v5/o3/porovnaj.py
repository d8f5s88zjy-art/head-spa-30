#!/usr/bin/env python3
"""Porovná výstupy beh.mjs (HEAD vs nový) a zatriedi zmeny. python3 -I porovnaj.py head.txt novy.txt"""
import sys, re, collections
def nacitaj(f):
    out = []
    for l in open(f, encoding='utf8'):
        m = re.match(r'^(\w+) \| (.*) → (\w+) ?([^ |]*) ?\| ?(.*)$', l.rstrip('\n'))
        out.append((m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)) if m else (None, l, '', '', ''))
    return out
a, b = nacitaj(sys.argv[1]), nacitaj(sys.argv[2])
assert len(a) == len(b)
kat = collections.defaultdict(list)
for x, y in zip(a, b):
    if x[2:4] == y[2:4] and x[4] == y[4]: kat['bez zmeny'].append(x); continue
    t1, t2 = x[2], y[2]
    i1, i2 = x[3].split(':')[0], y[3].split(':')[0]
    if t1 == 'odpoved' and t2 == 'odpoved':
        k = 'odpoved → odpoved (iná položka)' if i1 != i2 else 'odpoved → odpoved (tá istá položka, iný text)'
    else:
        k = f'{t1} → {t2}'
    kat[k].append((x, y))
for k, v in sorted(kat.items(), key=lambda kv: -len(kv[1])):
    print(f'== {k}: {len(v)}')
    if k != 'bez zmeny' and '-q' not in sys.argv:
        for x, y in v: print(f'   {x[0]} | {x[1]} :: {x[2]} {x[3]} → {y[2]} {y[3]} | {y[4][:60]}')
